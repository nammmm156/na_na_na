-- Per-size stock for shoes (EU sizes)
CREATE TABLE IF NOT EXISTS product_size_stock (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES product(id) ON DELETE CASCADE,
    shoe_size INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT uk_product_size_stock_product_size UNIQUE (product_id, shoe_size)
);

CREATE INDEX IF NOT EXISTS idx_product_size_stock_product_id ON product_size_stock(product_id);
CREATE INDEX IF NOT EXISTS idx_product_size_stock_size ON product_size_stock(shoe_size);

-- Add shoe size to order line items
ALTER TABLE order_line_items
    ADD COLUMN IF NOT EXISTS shoe_size INTEGER;

-- Vouchers (admin-managed)
CREATE TABLE IF NOT EXISTS vouchers (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    kind VARCHAR(16) NOT NULL, -- PERCENT or FIXED
    value INTEGER NOT NULL,
    min_subtotal BIGINT NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vouchers_active ON vouchers(active);

-- Backfill per-size stock from legacy product.stock_quantity (assign into size 39).
INSERT INTO product_size_stock (product_id, shoe_size, quantity)
SELECT p.id, 39, COALESCE(p.stock_quantity, 0)
FROM product p
WHERE NOT EXISTS (
    SELECT 1 FROM product_size_stock s WHERE s.product_id = p.id
);

