"""
Restaurant routes: GET /restaurants, POST /restaurants, GET /{id}
"""
from typing import List
from fastapi import APIRouter, HTTPException, Depends, status
from psycopg2.extras import RealDictCursor

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.schemas import (
    RestaurantCreate, RestaurantUpdate, RestaurantResponse, AdminRestaurantCreate
)

router = APIRouter(prefix="/restaurants", tags=["Restaurants"])


@router.get("/", response_model=List[RestaurantResponse])
def list_restaurants(db: RealDictCursor = Depends(get_db)):
    db.execute("SELECT * FROM restaurants WHERE is_active = TRUE ORDER BY rating DESC")
    return [dict(r) for r in db.fetchall()]


@router.get("/{restaurant_id}", response_model=RestaurantResponse)
def get_restaurant(restaurant_id: str, db: RealDictCursor = Depends(get_db)):
    db.execute("SELECT * FROM restaurants WHERE id = %s", (restaurant_id,))
    r = db.fetchone()
    if not r:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return dict(r)


@router.post("/", response_model=RestaurantResponse, status_code=status.HTTP_201_CREATED)
def create_restaurant(
    payload: RestaurantCreate,
    current_user: dict = Depends(require_role("restaurant_admin")),
    db: RealDictCursor = Depends(get_db),
):
    db.execute(
        """INSERT INTO restaurants (owner_id, name, cuisine, address, phone, image_url)
           VALUES (%s, %s, %s, %s, %s, %s)
           RETURNING *""",
        (str(current_user["id"]), payload.name, payload.cuisine,
         payload.address, payload.phone, payload.image_url),
    )
    return dict(db.fetchone())


@router.post("/admin-create", response_model=RestaurantResponse, status_code=status.HTTP_201_CREATED)
def admin_create_restaurant(
    payload: AdminRestaurantCreate,
    current_user: dict = Depends(require_role("superadmin")),
    db: RealDictCursor = Depends(get_db),
):
    # Check if the target user is a restaurant_admin
    db.execute("SELECT role FROM users WHERE id = %s", (payload.owner_id,))
    target_user = db.fetchone()
    if not target_user or target_user["role"] != "restaurant_admin":
        raise HTTPException(status_code=400, detail="Owner must be a restaurant_admin")

    db.execute(
        """INSERT INTO restaurants (owner_id, name, cuisine, address, phone, image_url)
           VALUES (%s, %s, %s, %s, %s, %s)
           RETURNING *""",
        (payload.owner_id, payload.name, payload.cuisine,
         payload.address, payload.phone, payload.image_url),
    )
    return dict(db.fetchone())


@router.patch("/{restaurant_id}", response_model=RestaurantResponse)
def update_restaurant(
    restaurant_id: str,
    payload: RestaurantUpdate,
    current_user: dict = Depends(require_role("restaurant_admin")),
    db: RealDictCursor = Depends(get_db),
):
    db.execute("SELECT * FROM restaurants WHERE id = %s AND owner_id = %s",
               (restaurant_id, str(current_user["id"])))
    if not db.fetchone():
        raise HTTPException(status_code=404, detail="Restaurant not found or not yours")

    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clause = ", ".join(f"{k} = %s" for k in updates)
    values = list(updates.values()) + [restaurant_id]
    db.execute(
        f"UPDATE restaurants SET {set_clause} WHERE id = %s RETURNING *", values
    )
    return dict(db.fetchone())


@router.get("/my/restaurants", response_model=List[RestaurantResponse])
def my_restaurants(
    current_user: dict = Depends(require_role("restaurant_admin")),
    db: RealDictCursor = Depends(get_db),
):
    db.execute("SELECT * FROM restaurants WHERE owner_id = %s", (str(current_user["id"]),))
    return [dict(r) for r in db.fetchall()]
