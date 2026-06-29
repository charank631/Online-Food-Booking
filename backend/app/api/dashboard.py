"""
Admin dashboard — stats + recent orders.
"""
from fastapi import APIRouter, Depends
from psycopg2.extras import RealDictCursor

from app.core.database import get_db
from app.core.security import require_role
from app.models.schemas import DashboardStats

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    current_user: dict = Depends(require_role("restaurant_admin", "superadmin")),
    db: RealDictCursor = Depends(get_db),
):
    role = current_user["role"]
    owner_id = str(current_user["id"])
    
    if role == "superadmin":
        db.execute(
            """SELECT
                   COUNT(*)                                    AS total_orders,
                   COALESCE(SUM(total_amount), 0)             AS total_revenue,
                   COUNT(*) FILTER (WHERE status NOT IN ('DELIVERED','CANCELLED')) AS pending_orders,
                   COUNT(*) FILTER (WHERE status = 'DELIVERED')                   AS delivered_orders
               FROM orders"""
        )
        stats = dict(db.fetchone())
        
        db.execute("SELECT COUNT(*) AS total_customers FROM users WHERE role = 'customer'")
        stats["total_customers"] = db.fetchone()["total_customers"]
        
        db.execute(
            """SELECT * FROM orders
               ORDER BY created_at DESC LIMIT 10"""
        )
    else:
        db.execute(
            """SELECT
                   COUNT(*)                                    AS total_orders,
                   COALESCE(SUM(o.total_amount), 0)           AS total_revenue,
                   COUNT(*) FILTER (WHERE o.status NOT IN ('DELIVERED','CANCELLED')) AS pending_orders,
                   COUNT(*) FILTER (WHERE o.status = 'DELIVERED')                   AS delivered_orders
               FROM orders o
               JOIN restaurants r ON r.id = o.restaurant_id
               WHERE r.owner_id = %s""",
            (owner_id,),
        )
        stats = dict(db.fetchone())
    
        db.execute("SELECT COUNT(*) AS total_customers FROM users WHERE role = 'customer'")
        stats["total_customers"] = db.fetchone()["total_customers"]
    
        db.execute(
            """SELECT o.* FROM orders o
               JOIN restaurants r ON r.id = o.restaurant_id
               WHERE r.owner_id = %s
               ORDER BY o.created_at DESC LIMIT 10""",
            (owner_id,),
        )

    recent = [dict(row) for row in db.fetchall()]

    from app.api.orders import _build_order
    stats["recent_orders"] = [_build_order(o, db) for o in recent]

    return DashboardStats(**stats)

    return DashboardStats(**stats)
