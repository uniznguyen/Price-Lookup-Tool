# Store procedure
```
EXEC dbo.p21_quick_price
        @customer_id = @customer_id,
        @company_id = 'VALIN',
        @inv_mast_uid = @inv_mast_uid,
        @customer_part_no = '',
        @oe_sales_unit_size = 1,
        @oe_qty_ordered = 1,
        @source_location_id = @location_id,
        @oe_pricing_unit_size = 1;
```

# MSSQL server:
  server: svr_sql_lstnr.valin.com
  database: CommerceCenter

# Query to get item_id and inv_mast_uid:
  SELECT inv_mast_uid, item_id
  FROM p21_view_inv_mast inv_mast
  WHERE item_id IN (@item_id)

# Query to get customer_name:
  SELECT customer_name, customer_id
  FROM p21_view_customer
  WHERE customer_id = @customer_id;

# Query to get price_page
  SELECT price_page.price_page_uid
, price_page.description
, price_page.contract_number
, price_page.effective_date
, price_page.expiration_date
,price_page_ud.price_page_category
  FROM p21_view_price_page price_page
  LEFT JOIN p21_view_price_page_ud price_page_ud
   ON price_page.price_page_uid = price_page_ud.price_page_uid
  WHERE price_page.price_page_uid IN (@price_page_uid)
