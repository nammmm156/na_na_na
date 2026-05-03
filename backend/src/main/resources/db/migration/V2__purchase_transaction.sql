CREATE TABLE IF NOT EXISTS purchase_transaction (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT,
    product_name VARCHAR(255),
    category VARCHAR(255),
    username VARCHAR(255),
    quantity INTEGER,
    unit_price NUMERIC(38, 2),
    line_total NUMERIC(38, 2),
    purchased_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_purchase_tx_purchased_at ON purchase_transaction(purchased_at);
CREATE INDEX IF NOT EXISTS idx_purchase_tx_category ON purchase_transaction(category);
CREATE INDEX IF NOT EXISTS idx_purchase_tx_username ON purchase_transaction(username);
