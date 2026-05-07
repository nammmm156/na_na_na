-- Drop non-shoe / electronics catalog items (broader than V5)
DELETE FROM product
WHERE category IN (
      'Headphones', 'Laptop', 'Camera', 'Smartwatch', 'Backpack',
      'Electronics', 'Tablet', 'Phone', 'Monitor', 'Accessory', 'Accessories'
   )
   OR LOWER(COALESCE(category, '')) LIKE '%laptop%'
   OR LOWER(COALESCE(category, '')) LIKE '%headphone%'
   OR LOWER(COALESCE(category, '')) LIKE '%camera%'
   OR LOWER(COALESCE(category, '')) LIKE '%smartwatch%'
   OR LOWER(COALESCE(category, '')) LIKE '%tablet%'
   OR LOWER(COALESCE(category, '')) LIKE '%điện thoại%'
   OR LOWER(COALESCE(category, '')) LIKE '%dien thoai%'
   OR LOWER(COALESCE(category, '')) LIKE '%tai nghe%'
   OR LOWER(COALESCE(name, '')) IN (
      'sony wh-1000xm5',
      'macbook air m2',
      'canon eos r50',
      'apple watch series 9',
      'nomatic backpack',
      'airpods pro (2nd gen)',
      'dell xps 13 plus',
      'fujifilm x-t30 ii'
   );

-- Only EU 36–42 are sold; remove other size rows and resync totals
DELETE FROM product_size_stock
WHERE shoe_size < 36 OR shoe_size > 42;

UPDATE product p
SET stock_quantity = COALESCE((
    SELECT SUM(s.quantity)
    FROM product_size_stock s
    WHERE s.product_id = p.id
), 0);
