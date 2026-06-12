-- Add shipping mode + shipping total to support proportional shipping split.
-- shipping_mode: 'fixed_per_member' (default, backward compatible) or 'proportional'.
--   fixed_per_member → uses shipping_cost_per_member as flat charge per member.
--   proportional     → uses shipping_total, split across members weighted by their order total.

ALTER TABLE order_cycles
  ADD COLUMN IF NOT EXISTS shipping_mode text NOT NULL DEFAULT 'fixed_per_member';

ALTER TABLE order_cycles
  ADD COLUMN IF NOT EXISTS shipping_total numeric(10, 2);
