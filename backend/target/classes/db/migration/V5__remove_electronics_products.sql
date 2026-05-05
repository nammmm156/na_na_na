-- Remove legacy "electronics" sample products from earlier template
DELETE FROM product
WHERE category IN ('Headphones', 'Laptop', 'Camera', 'Smartwatch', 'Backpack')
   OR name IN (
      'Sony WH-1000XM5',
      'MacBook Air M2',
      'Canon EOS R50',
      'Apple Watch Series 9',
      'NOMATIC Backpack',
      'AirPods Pro (2nd Gen)',
      'Dell XPS 13 Plus',
      'Fujifilm X-T30 II'
   );

