"""
Seed database with sample restaurants, menu items, and demo users.
Runs once on startup — skips if data exists.
"""
import logging
from app.core.database import get_conn
from app.core.security import hash_password

logger = logging.getLogger(__name__)

SEED_SQL = """
-- Demo Users
INSERT INTO users (name, email, phone, password_hash, role, address)
VALUES
  ('Super Admin', 'superadmin@foodrush.com', '9876500000', '{pw_admin}', 'superadmin', 'HQ'),
  ('Spice Chef', 'admin@spicegarden.foodrush.com', '9876500001', '{pw_admin}', 'restaurant_admin', 'No.1 Kitchen Street'),
  ('Pasta Chef', 'admin@pastaparadise.foodrush.com', '9876500002', '{pw_admin}', 'restaurant_admin', 'No.2 Kitchen Street'),
  ('Dragon Chef', 'admin@dragonwok.foodrush.com', '9876500003', '{pw_admin}', 'restaurant_admin', 'No.3 Kitchen Street'),
  ('Burger Chef', 'admin@burgerjunction.foodrush.com', '9876500004', '{pw_admin}', 'restaurant_admin', 'No.4 Kitchen Street'),
  ('Priya Sharma', 'priya@example.com', '9876543210', '{pw_customer}', 'customer', '12, Rose Street, Velachery, Chennai'),
  ('Ravi Kumar', 'ravi@delivery.com', '9876500005', '{pw_delivery}', 'delivery_agent', 'Chennai')
ON CONFLICT (email) DO NOTHING;

-- Restaurants (owned by specific admins)
INSERT INTO restaurants (owner_id, name, cuisine, address, phone, image_url, rating)
SELECT u.id, r.name, r.cuisine, r.address, r.phone, r.image_url, r.rating
FROM (VALUES
  ('admin@spicegarden.foodrush.com', 'Spice Garden',    'Indian',   'Anna Nagar, Chennai',  '044-2345678',
   'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600', 4.5),
  ('admin@pastaparadise.foodrush.com', 'Pasta Paradise',  'Italian',  'Velachery, Chennai',   '044-3456789',
   'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=600',   4.3),
  ('admin@dragonwok.foodrush.com', 'Dragon Wok',      'Chinese',  'T. Nagar, Chennai',    '044-4567890',
   'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600',   4.6),
  ('admin@burgerjunction.foodrush.com', 'Burger Junction', 'American', 'Adyar, Chennai',       '044-5678901',
   'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600',4.2)
) AS r(email, name, cuisine, address, phone, image_url, rating)
JOIN users u ON u.email = r.email
ON CONFLICT DO NOTHING;
"""


def seed_menu_items():
    items = [
        # Spice Garden (Indian)
        ("Butter Chicken",        "Creamy tomato chicken",  "Main Course", 280, False,  "Spice Garden"),
        ("Paneer Tikka Masala",   "Smoky cottage cheese",   "Main Course", 240, True,   "Spice Garden"),
        ("Garlic Naan",           "Freshly baked naan",     "Bread",        60, True,   "Spice Garden"),
        ("Dal Tadka",             "Yellow lentils tempered","Dal",         160, True,   "Spice Garden"),
        ("Mango Lassi",           "Refreshing mango drink", "Drinks",       80, True,   "Spice Garden"),
        # Pasta Paradise (Italian)
        ("Spaghetti Carbonara",   "Classic Roman pasta",    "Pasta",       320, False,  "Pasta Paradise"),
        ("Penne Arrabbiata",      "Spicy tomato penne",     "Pasta",       260, True,   "Pasta Paradise"),
        ("Margherita Pizza",      "Mozzarella & basil",     "Pizza",       380, True,   "Pasta Paradise"),
        ("Caesar Salad",          "Romaine with dressing",  "Salads",      220, False,  "Pasta Paradise"),
        ("Tiramisu",              "Italian coffee dessert", "Desserts",    180, False,  "Pasta Paradise"),
        # Dragon Wok (Chinese)
        ("Kung Pao Chicken",      "Spicy stir-fried",       "Main Course", 290, False,  "Dragon Wok"),
        ("Veg Fried Rice",        "Wok-tossed rice",        "Rice",        200, True,   "Dragon Wok"),
        ("Chicken Dim Sum",       "Steamed dumplings",      "Starters",    240, False,  "Dragon Wok"),
        ("Hakka Noodles",         "Stir-fried noodles",     "Noodles",     220, True,   "Dragon Wok"),
        ("Hot & Sour Soup",       "Tangy spicy soup",       "Soups",       140, True,   "Dragon Wok"),
        # Burger Junction (American)
        ("Classic Beef Burger",   "Juicy beef patty",       "Burgers",     350, False,  "Burger Junction"),
        ("Veggie Burger",         "Plant-based patty",      "Burgers",     280, True,   "Burger Junction"),
        ("Loaded Fries",          "Cheese & jalapeño fries","Sides",       180, True,   "Burger Junction"),
        ("Chocolate Milkshake",   "Rich choco shake",       "Drinks",      150, True,   "Burger Junction"),
        ("Chicken Wings",         "Crispy buffalo wings",   "Starters",    320, False,  "Burger Junction"),
    ]
    return items


def run_seed():
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                # Check if already seeded to prevent wiping out data on every server restart
                cur.execute("SELECT 1 FROM users WHERE email = 'superadmin@foodrush.com'")
                if cur.fetchone():
                    logger.info("[SEED] Data already exists. Skipping seed to preserve orders.")
                    return

                # Wipe old data to ensure fresh slate for the new isolated admin roles
                cur.execute("TRUNCATE users CASCADE")

                # Users + restaurants
                pw_admin    = hash_password("admin123")
                pw_customer = hash_password("customer123")
                pw_delivery = hash_password("delivery123")
                sql = SEED_SQL.format(
                    pw_admin=pw_admin,
                    pw_customer=pw_customer,
                    pw_delivery=pw_delivery,
                )
                cur.execute(sql)

                # Menu items
                items = seed_menu_items()
                for name, desc, cat, price, is_veg, rest_name in items:
                    cur.execute(
                        """INSERT INTO menu_items
                           (restaurant_id, name, description, category, price, is_veg)
                           SELECT r.id, %s, %s, %s, %s, %s
                           FROM restaurants r WHERE r.name = %s""",
                        (name, desc, cat, price, is_veg, rest_name),
                    )

        logger.info("[SEED] [SUCCESS] Sample data seeded successfully")
        logger.info("[SEED] Demo logins:")
        logger.info("[SEED]   superadmin@foodrush.com            / admin123    (superadmin)")
        logger.info("[SEED]   admin@burgerjunction.foodrush.com  / admin123    (restaurant_admin)")
        logger.info("[SEED]   admin@spicegarden.foodrush.com     / admin123    (restaurant_admin)")
        logger.info("[SEED]   priya@example.com                  / customer123 (customer)")
        logger.info("[SEED]   ravi@delivery.com                  / delivery123 (delivery_agent)")

    except Exception as e:
        logger.error(f"[SEED ERROR] {e}")
