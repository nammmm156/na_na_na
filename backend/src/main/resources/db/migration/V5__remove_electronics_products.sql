-- Remove legacy "electronics" sample products from earlier template.
-- Must delete from child tables first (order_line_items has no ON DELETE CASCADE).

DELETE FROM order_line_items
WHERE product_id IN (
    SELECT id FROM product
    WHERE category IN ('Headphones', 'Laptop', 'Camera', 'Smartwatch', 'Backpack')
       OR name IN (
          'Sony WH-1000XM5', 'MacBook Air M2', 'Canon EOS R50',
          'Apple Watch Series 9', 'NOMATIC Backpack',
          'AirPods Pro (2nd Gen)', 'Dell XPS 13 Plus', 'Fujifilm X-T30 II'
       )
);

DELETE FROM product
WHERE category IN ('Headphones', 'Laptop', 'Camera', 'Smartwatch', 'Backpack')
   OR name IN (
      'Sony WH-1000XM5', 'MacBook Air M2', 'Canon EOS R50',
      'Apple Watch Series 9', 'NOMATIC Backpack',
      'AirPods Pro (2nd Gen)', 'Dell XPS 13 Plus', 'Fujifilm X-T30 II'
   );

