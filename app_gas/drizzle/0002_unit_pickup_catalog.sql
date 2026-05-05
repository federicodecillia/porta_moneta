-- unit on products (Feature 1)
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit text;

-- pickup end time on order_cycles (Feature 6)
ALTER TABLE order_cycles ADD COLUMN IF NOT EXISTS pickup_end_time text;

-- supplier product catalog (Feature 2)
CREATE TABLE IF NOT EXISTS supplier_products (
  catalog_product_id text PRIMARY KEY,
  supplier_id        text NOT NULL REFERENCES suppliers(supplier_id),
  name               text NOT NULL,
  variant            text,
  format             text,
  unit               text,
  unit_price         numeric(10, 2) NOT NULL,
  notes              text,
  category           text,
  active             boolean NOT NULL DEFAULT true,
  created_at         timestamp with time zone NOT NULL,
  archived_at        timestamp with time zone
);
CREATE INDEX IF NOT EXISTS supplier_products_supplier_id_idx ON supplier_products(supplier_id);
