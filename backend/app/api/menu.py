"""
Menu routes: GET /restaurants/{id}/menu, POST/PATCH/DELETE menu items
"""
from typing import List
from fastapi import APIRouter, HTTPException, Depends, status
from psycopg2.extras import RealDictCursor

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.schemas import MenuItemCreate, MenuItemUpdate, MenuItemResponse

router = APIRouter(tags=["Menu"])


@router.get("/restaurants/{restaurant_id}/menu", response_model=List[MenuItemResponse])
def get_menu(restaurant_id: str, db: RealDictCursor = Depends(get_db)):
    db.execute(
        "SELECT * FROM menu_items WHERE restaurant_id = %s ORDER BY category, name",
        (restaurant_id,),
    )
    return [dict(m) for m in db.fetchall()]


@router.post(
    "/restaurants/{restaurant_id}/menu",
    response_model=MenuItemResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_menu_item(
    restaurant_id: str,
    payload: MenuItemCreate,
    current_user: dict = Depends(require_role("restaurant_admin")),
    db: RealDictCursor = Depends(get_db),
):
    # Verify ownership
    db.execute(
        "SELECT id FROM restaurants WHERE id = %s AND owner_id = %s",
        (restaurant_id, str(current_user["id"])),
    )
    if not db.fetchone():
        raise HTTPException(status_code=403, detail="Not your restaurant")

    db.execute(
        """INSERT INTO menu_items
           (restaurant_id, name, description, category, price, is_veg, is_available, image_url)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
           RETURNING *""",
        (restaurant_id, payload.name, payload.description, payload.category,
         payload.price, payload.is_veg, payload.is_available, payload.image_url),
    )
    return dict(db.fetchone())


@router.patch("/menu/{item_id}", response_model=MenuItemResponse)
def update_menu_item(
    item_id: str,
    payload: MenuItemUpdate,
    current_user: dict = Depends(require_role("restaurant_admin")),
    db: RealDictCursor = Depends(get_db),
):
    db.execute(
        """SELECT mi.* FROM menu_items mi
           JOIN restaurants r ON r.id = mi.restaurant_id
           WHERE mi.id = %s AND r.owner_id = %s""",
        (item_id, str(current_user["id"])),
    )
    if not db.fetchone():
        raise HTTPException(status_code=404, detail="Menu item not found or not yours")

    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clause = ", ".join(f"{k} = %s" for k in updates)
    values = list(updates.values()) + [item_id]
    db.execute(f"UPDATE menu_items SET {set_clause} WHERE id = %s RETURNING *", values)
    return dict(db.fetchone())


@router.delete("/menu/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_menu_item(
    item_id: str,
    current_user: dict = Depends(require_role("restaurant_admin")),
    db: RealDictCursor = Depends(get_db),
):
    db.execute(
        """DELETE FROM menu_items mi USING restaurants r
           WHERE mi.restaurant_id = r.id
             AND mi.id = %s AND r.owner_id = %s""",
        (item_id, str(current_user["id"])),
    )
    if db.rowcount == 0:
        raise HTTPException(status_code=404, detail="Menu item not found or not yours")
