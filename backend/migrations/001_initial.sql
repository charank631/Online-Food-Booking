CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) UNIQUE NOT NULL,
    phone       VARCHAR(15),
    password_hash VARCHAR(255) NOT NULL,
    role        VARCHAR(20)  NOT NULL
                    CHECK (role IN ('customer','restaurant_admin','delivery_agent')),
    address     TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS restaurants (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    name        VARCHAR(150) NOT NULL,
    cuisine     VARCHAR(100) NOT NULL,
    address     TEXT NOT NULL,
    phone       VARCHAR(15),
    image_url   TEXT,
    rating      NUMERIC(2,1) DEFAULT 4.0,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS menu_items (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    name          VARCHAR(150) NOT NULL,
    description   TEXT,
    category      VARCHAR(80) NOT NULL,
    price         NUMERIC(10,2) NOT NULL,
    is_veg        BOOLEAN DEFAULT TRUE,
    is_available  BOOLEAN DEFAULT TRUE,
    image_url     TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id        UUID REFERENCES users(id),
    restaurant_id      UUID REFERENCES restaurants(id),
    delivery_agent_id  UUID REFERENCES users(id),
    status             VARCHAR(30) NOT NULL DEFAULT 'PLACED'
                           CHECK (status IN (
                               'PLACED','CONFIRMED','PREPARING',
                               'OUT_FOR_DELIVERY','DELIVERED','CANCELLED'
                           )),
    total_amount       NUMERIC(10,2) NOT NULL,
    delivery_address   TEXT NOT NULL,
    special_notes      TEXT,
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id     UUID REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id),
    name         VARCHAR(150) NOT NULL,
    quantity     INTEGER NOT NULL CHECK (quantity > 0),
    unit_price   NUMERIC(10,2) NOT NULL,
    subtotal     NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id       UUID REFERENCES orders(id) UNIQUE,
    amount         NUMERIC(10,2) NOT NULL,
    method         VARCHAR(20) NOT NULL DEFAULT 'CARD'
                       CHECK (method IN ('CARD','UPI','CASH','WALLET')),
    status         VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                       CHECK (status IN ('PENDING','PAID','FAILED','REFUNDED')),
    transaction_id VARCHAR(100),
    paid_at        TIMESTAMPTZ,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer   ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
CREATE INDEX IF NOT EXISTS idx_menu_restaurant   ON menu_items(restaurant_id);
