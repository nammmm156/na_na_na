CREATE TABLE IF NOT EXISTS customer_orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users (id),
    status VARCHAR(32) NOT NULL,
    payment_method VARCHAR(64),
    payment_link_id VARCHAR(255),
    payos_order_code BIGINT UNIQUE,
    payos_checkout_url VARCHAR(4096),
    total_amount BIGINT NOT NULL,
    subtotal_amount BIGINT NOT NULL,
    discount_amount BIGINT NOT NULL DEFAULT 0,
    voucher_code VARCHAR(64),
    ship_full_name VARCHAR(255),
    ship_phone VARCHAR(64),
    ship_address_line VARCHAR(512),
    ship_city VARCHAR(128),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customer_orders_user ON customer_orders (user_id);
CREATE INDEX IF NOT EXISTS idx_customer_orders_status ON customer_orders (status);

CREATE TABLE IF NOT EXISTS order_line_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES customer_orders (id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES product (id),
    product_name VARCHAR(512),
    unit_price NUMERIC(38, 2),
    quantity INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_line_items_order ON order_line_items (order_id);
