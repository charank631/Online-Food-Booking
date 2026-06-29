# Database Design (PostgreSQL)

## Tables & Relationships

### `users`
Core identity table.
- `id` (UUID, PK)
- `email` (VARCHAR, UNIQUE)
- `password_hash` (VARCHAR)
- `role` (ENUM: `customer`, `restaurant_admin`, `delivery_agent`)

### `restaurants`
- `id` (UUID, PK)
- `owner_id` (UUID, FK -> `users.id`)
- `name`, `cuisine`, `rating`

### `menu_items`
- `id` (UUID, PK)
- `restaurant_id` (UUID, FK -> `restaurants.id` ON DELETE CASCADE)
- `price`, `is_veg`, `category`

### `orders`
- `id` (UUID, PK)
- `customer_id` (UUID, FK -> `users.id`)
- `restaurant_id` (UUID, FK -> `restaurants.id`)
- `status` (ENUM: `PLACED`, `CONFIRMED`, `PREPARING`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`)
- `total_amount`

### `order_items`
Snapshot of menu items at the time of order.
- `id` (UUID, PK)
- `order_id` (UUID, FK -> `orders.id` ON DELETE CASCADE)
- `menu_item_id` (UUID, FK -> `menu_items.id`)
- `quantity`, `unit_price`, `subtotal`

### `payments`
- `id` (UUID, PK)
- `order_id` (UUID, FK -> `orders.id`, UNIQUE)
- `method` (ENUM: `CARD`, `UPI`, `CASH`, `WALLET`)
- `status` (ENUM: `PENDING`, `PAID`, `FAILED`, `REFUNDED`)
- `transaction_id`

## Indexing Strategy
- `idx_orders_customer` ON `orders(customer_id)` (Fast customer history)
- `idx_orders_restaurant` ON `orders(restaurant_id)` (Fast admin dashboard)
- `idx_orders_status` ON `orders(status)` (Fast active order filtering)
