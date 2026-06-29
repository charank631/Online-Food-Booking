# API Low-Level Design (LLD) — FoodRush

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       React SPA (:3000)                        │
│  (AuthContext + CartContext + Router + Typed API Client)        │
└─────────────────────┬───────────────────────────────────────────┘
                      │  HTTP / JSON
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend (:8000)                      │
│  ┌─────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │ Routers │→ │ Core Layer   │→ │ psycopg2 Connection Pool │   │
│  │ (api/)  │  │ (security,   │  │ Raw SQL / DDL            │   │
│  │         │  │  config)     │  │                          │   │
│  └─────────┘  └──────────────┘  └────────────┬─────────────┘   │
│                                               │                 │
│  ┌──────────────────────────────────────┐     │                 │
│  │ BackgroundTasks (Order Lifecycle)    │     │                 │
│  │ PLACED→CONFIRMED→PREPARING→         │     │                 │
│  │ OUT_FOR_DELIVERY→DELIVERED          │     │                 │
│  └──────────────────────────────────────┘     │                 │
└───────────────────────────────────────────────┼─────────────────┘
                                                │
                                                ▼
                                   ┌────────────────────┐
                                   │ PostgreSQL (:5432)  │
                                   │ (Docker Container)  │
                                   └────────────────────┘
```

---

## Authentication System — JWT + Role-Based Access

### Security Design (`core/security.py`)
- **Password Hashing**: bcrypt via `passlib.CryptContext`
- **JWT Tokens**: `python-jose` with HS256, 24-hour expiry
- **Role Guard**: `require_role(*roles)` returns a FastAPI dependency that checks `current_user.role` against allowed roles
- **Bearer Auth**: `HTTPBearer` scheme — token passed as `Authorization: Bearer <token>`

### Roles
| Role | Permissions |
|------|------------|
| `customer` | Browse restaurants, place orders, track orders, cancel orders |
| `restaurant_admin` | Create/manage restaurants, add menu items, view dashboard, update order status |
| `delivery_agent` | View assigned orders, update delivery status |

---

## API Endpoints

### 1. Auth (`/api/v1/auth`)

| Method | Path | Auth | Body | Description |
|--------|------|------|------|-------------|
| POST | `/register` | ✗ | `{name, email, password, phone?, role, address?}` | Register user, returns JWT + user profile |
| POST | `/login` | ✗ | `{email, password}` | Authenticate, returns JWT + user profile |
| GET | `/me` | ✔ Bearer | — | Returns current user from JWT subject |

**Response**: `{access_token, token_type: "bearer", user: UserResponse}`

---

### 2. Restaurants (`/api/v1/restaurants`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | ✗ | List all active restaurants (sorted by rating) |
| GET | `/{id}` | ✗ | Get restaurant details |
| POST | `/` | `restaurant_admin` | Create restaurant (linked to current admin) |
| PATCH | `/{id}` | `restaurant_admin` (owner) | Update restaurant fields |
| GET | `/my/restaurants` | `restaurant_admin` | List admin's own restaurants |

---

### 3. Menu (`/api/v1/restaurants/{id}/menu`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/restaurants/{id}/menu` | ✗ | Get menu items (ordered by category, name) |
| POST | `/restaurants/{id}/menu` | `restaurant_admin` (owner) | Add menu item |
| PATCH | `/menu/{item_id}` | `restaurant_admin` (owner) | Update menu item |
| DELETE | `/menu/{item_id}` | `restaurant_admin` (owner) | Delete menu item |

---

### 4. Orders (`/api/v1/orders`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | `customer` | Place order → triggers BackgroundTask lifecycle |
| GET | `/` | ✔ Any role | List orders (filtered by role — customers see theirs, admins see their restaurants') |
| GET | `/{id}` | ✔ Any role | Get order with items + payment |
| PATCH | `/{id}/status` | `restaurant_admin`, `delivery_agent` | Manual status override |
| PATCH | `/{id}/assign` | `restaurant_admin` | Assign delivery agent to order |
| DELETE | `/{id}/cancel` | `customer` | Cancel order (only if PLACED or CONFIRMED) → refunds payment |

**Order Placement Flow**:
1. Validate restaurant is active
2. Validate each menu item exists, is available, belongs to restaurant
3. Calculate total from `price × quantity`
4. INSERT `orders` row (status = PLACED)
5. INSERT `order_items` rows (price snapshot)
6. INSERT `payments` row (status = PENDING)
7. **`BackgroundTasks.add_task(_process_order_lifecycle, order_id)`**

---

### 5. Payments (`/api/v1/payments`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/initiate` | `customer` | Mock payment: PENDING → PAID with generated transaction ID |
| GET | `/{order_id}` | `customer`, `restaurant_admin` | Get payment status |

---

### 6. Dashboard (`/api/v1/dashboard`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/stats` | `restaurant_admin` | Aggregate stats: revenue, pending/delivered counts, customer count, recent 10 orders |

---

## Async Order Processing Workflow

```
           BackgroundTasks._process_order_lifecycle(order_id)
           ────────────────────────────────────────────────
                         (runs in thread pool)

    PLACED ──(3s)──→ CONFIRMED ──(5s)──→ PREPARING
       │                  │
       │           Payment → PAID
       │           (TXN-XXXXXXXXXX)
       │
    PREPARING ──(4s)──→ OUT_FOR_DELIVERY ──(2s)──→ DELIVERED

    Total lifecycle: ~14 seconds
    Each transition: logged to order_processing.log
    Cancelled check: skips transitions if status = CANCELLED
```

**Logged to**: `logs/order_processing.log`

```
2026-06-27 12:00:03  INFO  [ORDER abc12345] → CONFIRMED | Restaurant confirmed the order
2026-06-27 12:00:08  INFO  [ORDER abc12345] → PREPARING | Kitchen started preparing
2026-06-27 12:00:12  INFO  [ORDER abc12345] → OUT_FOR_DELIVERY | Delivery agent picked up
2026-06-27 12:00:14  INFO  [ORDER abc12345] → DELIVERED | Order delivered to customer
```

---

## Error Handling

| Status | Usage |
|--------|-------|
| 400 | Validation error, empty update, cancel not allowed |
| 401 | Missing/invalid JWT token |
| 403 | Role not authorized |
| 404 | Resource not found |
| 422 | Pydantic validation failure |

---

## Frontend Pages & Data Flow

| Page | Route | API Calls | Features |
|------|-------|-----------|----------|
| Home | `/` | `GET /restaurants` | Search, filter, animated cards, hero |
| Menu | `/restaurants/:id` | `GET /restaurants/:id`, `GET /restaurants/:id/menu` | Category tabs, veg indicator, add to cart |
| Cart | `/cart` | `POST /orders` | Quantity controls, address, payment method, order summary |
| Orders | `/orders` | `GET /orders` | Status badges, payment info, track links |
| Track | `/track/:id` | `GET /orders/:id` (polling 2.5s) | Live animated timeline, payment status |
| Dashboard | `/dashboard` | `GET /dashboard/stats`, `PATCH /orders/:id/status` | Revenue cards, orders table with inline status update |
