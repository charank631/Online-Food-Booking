"""
Orders — place order, list, get, update status.
Uses FastAPI BackgroundTasks for async order lifecycle simulation.
"""
import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, status
from psycopg2.extras import RealDictCursor

from app.core.database import get_db, get_conn
from app.core.security import get_current_user, require_role
from app.models.schemas import (
    OrderCreate, OrderResponse, OrderStatusUpdate,
    OrderItemResponse, PaymentResponse, AssignAgentRequest,
    OrderStatus, PaymentStatus,
)

router = APIRouter(prefix="/orders", tags=["Orders"])
logger = logging.getLogger(__name__)


# ─── Helper: build full OrderResponse from DB row ─────────────────
def _build_order(order_row: dict, db: RealDictCursor) -> dict:
    order_id = str(order_row["id"])

    db.execute("SELECT * FROM order_items WHERE order_id = %s", (order_id,))
    items = [dict(i) for i in db.fetchall()]

    db.execute("SELECT * FROM payments WHERE order_id = %s", (order_id,))
    payment = db.fetchone()

    return {
        **order_row,
        "items": items,
        "payment": dict(payment) if payment else None,
    }


# ─── Routes ────────────────────────────────────────────────────────
@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def place_order(
    payload: OrderCreate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_role("customer")),
    db: RealDictCursor = Depends(get_db),
):
    # Validate restaurant
    db.execute("SELECT id FROM restaurants WHERE id = %s AND is_active = TRUE",
               (payload.restaurant_id,))
    if not db.fetchone():
        raise HTTPException(status_code=404, detail="Restaurant not found or inactive")

    # Validate items and calculate total
    total = 0.0
    item_details = []
    for req_item in payload.items:
        db.execute(
            "SELECT * FROM menu_items WHERE id = %s AND restaurant_id = %s AND is_available = TRUE",
            (req_item.menu_item_id, payload.restaurant_id),
        )
        menu_item = db.fetchone()
        if not menu_item:
            raise HTTPException(
                status_code=404,
                detail=f"Menu item {req_item.menu_item_id} not found or unavailable",
            )
        subtotal = float(menu_item["price"]) * req_item.quantity
        total += subtotal
        item_details.append((menu_item, req_item.quantity, subtotal))

    # Create order
    db.execute(
        """INSERT INTO orders
           (customer_id, restaurant_id, total_amount, delivery_address, special_notes)
           VALUES (%s, %s, %s, %s, %s)
           RETURNING *""",
        (str(current_user["id"]), payload.restaurant_id,
         round(total, 2), payload.delivery_address, payload.special_notes),
    )
    order = dict(db.fetchone())
    order_id = str(order["id"])

    # Create order items (snapshot prices)
    for menu_item, quantity, subtotal in item_details:
        db.execute(
            """INSERT INTO order_items
               (order_id, menu_item_id, name, quantity, unit_price, subtotal)
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (order_id, str(menu_item["id"]), menu_item["name"],
             quantity, float(menu_item["price"]), round(subtotal, 2)),
        )

    # Create payment record
    db.execute(
        "INSERT INTO payments (order_id, amount, method) VALUES (%s, %s, %s) RETURNING *",
        (order_id, round(total, 2), payload.payment_method.value),
    )

    logger.info(
        f"[ORDER PLACED] id={order_id[:8]} | customer={current_user['name']} "
        f"| total=INR {total:.2f} | restaurant={payload.restaurant_id[:8]}"
    )

    return _build_order(order, db)


@router.get("/", response_model=List[OrderResponse])
def list_orders(
    current_user: dict = Depends(get_current_user),
    db: RealDictCursor = Depends(get_db),
):
    role = current_user["role"]
    if role == "customer":
        db.execute(
            "SELECT * FROM orders WHERE customer_id = %s ORDER BY created_at DESC",
            (str(current_user["id"]),),
        )
    elif role == "restaurant_admin":
        db.execute(
            """SELECT o.* FROM orders o
               JOIN restaurants r ON r.id = o.restaurant_id
               WHERE r.owner_id = %s
               ORDER BY o.created_at DESC""",
            (str(current_user["id"]),),
        )
    elif role == "delivery_agent":
        db.execute(
            """SELECT * FROM orders
               WHERE delivery_agent_id = %s OR (status = 'READY_FOR_PICKUP' AND delivery_agent_id IS NULL)
               ORDER BY created_at DESC""",
            (str(current_user["id"]),),
        )
    elif role == "superadmin":
        db.execute("SELECT * FROM orders ORDER BY created_at DESC")
    else:
        db.execute("SELECT * FROM orders ORDER BY created_at DESC")

    orders = [dict(o) for o in db.fetchall()]
    return [_build_order(o, db) for o in orders]


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: str,
    current_user: dict = Depends(get_current_user),
    db: RealDictCursor = Depends(get_db),
):
    db.execute("SELECT * FROM orders WHERE id = %s", (order_id,))
    order = db.fetchone()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return _build_order(dict(order), db)


@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: str,
    payload: OrderStatusUpdate,
    current_user: dict = Depends(require_role("restaurant_admin", "delivery_agent", "superadmin")),
    db: RealDictCursor = Depends(get_db),
):
    db.execute(
        "UPDATE orders SET status = %s, updated_at = NOW() WHERE id = %s RETURNING *",
        (payload.status.value, order_id),
    )
    order = db.fetchone()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Process payment if status is confirmed
    if payload.status == OrderStatus.CONFIRMED:
        txn_id = f"TXN-{uuid.uuid4().hex[:10].upper()}"
        db.execute(
            "UPDATE payments SET status = 'PAID', transaction_id = %s, paid_at = NOW() WHERE order_id = %s",
            (txn_id, order_id)
        )
        
    logger.info(f"[ORDER STATUS] {order_id[:8]} -> {payload.status.value} by {current_user['name']}")
    return _build_order(dict(order), db)


@router.patch("/{order_id}/accept", response_model=OrderResponse)
def accept_order(
    order_id: str,
    current_user: dict = Depends(require_role("delivery_agent")),
    db: RealDictCursor = Depends(get_db),
):
    db.execute(
        "UPDATE orders SET delivery_agent_id = %s WHERE id = %s AND status = 'READY_FOR_PICKUP' AND delivery_agent_id IS NULL RETURNING *",
        (str(current_user["id"]), order_id),
    )
    order = db.fetchone()
    if not order:
        raise HTTPException(status_code=400, detail="Order is no longer available or doesn't exist")
    return _build_order(dict(order), db)

@router.patch("/{order_id}/revoke", response_model=OrderResponse)
def revoke_order(
    order_id: str,
    current_user: dict = Depends(require_role("delivery_agent")),
    db: RealDictCursor = Depends(get_db),
):
    db.execute(
        "UPDATE orders SET delivery_agent_id = NULL WHERE id = %s AND delivery_agent_id = %s RETURNING *",
        (order_id, str(current_user["id"])),
    )
    order = db.fetchone()
    if not order:
        raise HTTPException(status_code=400, detail="Order not found or not assigned to you")
    return _build_order(dict(order), db)


@router.delete("/{order_id}/cancel", response_model=OrderResponse)
def cancel_order(
    order_id: str,
    current_user: dict = Depends(require_role("customer")),
    db: RealDictCursor = Depends(get_db),
):
    db.execute("SELECT * FROM orders WHERE id = %s AND customer_id = %s",
               (order_id, str(current_user["id"])))
    order = db.fetchone()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["status"] not in ("PLACED", "CONFIRMED"):
        raise HTTPException(status_code=400, detail="Cannot cancel at this stage")

    db.execute(
        "UPDATE orders SET status = 'CANCELLED', updated_at = NOW() WHERE id = %s RETURNING *",
        (order_id,),
    )
    cancelled_order = dict(db.fetchone())
    db.execute(
        "UPDATE payments SET status = 'REFUNDED' WHERE order_id = %s", (order_id,)
    )
    logger.info(f"[ORDER CANCELLED] {order_id[:8]}")
    return _build_order(cancelled_order, db)
