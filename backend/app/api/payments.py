"""
Mock payment processing — simulates payment gateway.
"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, status
from psycopg2.extras import RealDictCursor

from app.core.database import get_db
from app.core.security import require_role
from app.models.schemas import PaymentInitRequest, PaymentResponse

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/initiate", response_model=PaymentResponse)
def initiate_payment(
    payload: PaymentInitRequest,
    current_user: dict = Depends(require_role("customer")),
    db: RealDictCursor = Depends(get_db),
):
    """Simulate a payment gateway call — always succeeds in mock mode."""
    db.execute("SELECT * FROM payments WHERE order_id = %s", (payload.order_id,))
    payment = db.fetchone()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found")
    if payment["status"] == "PAID":
        raise HTTPException(status_code=400, detail="Already paid")

    txn_id = f"TXN-{uuid.uuid4().hex[:10].upper()}"
    paid_at = datetime.now(timezone.utc)

    db.execute(
        """UPDATE payments
              SET status = 'PAID',
                  method = %s,
                  transaction_id = %s,
                  paid_at = %s
            WHERE order_id = %s
           RETURNING *""",
        (payload.method.value, txn_id, paid_at, payload.order_id),
    )
    return dict(db.fetchone())


@router.get("/{order_id}", response_model=PaymentResponse)
def get_payment(
    order_id: str,
    current_user: dict = Depends(require_role("customer", "restaurant_admin")),
    db: RealDictCursor = Depends(get_db),
):
    db.execute("SELECT * FROM payments WHERE order_id = %s", (order_id,))
    payment = db.fetchone()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return dict(payment)
