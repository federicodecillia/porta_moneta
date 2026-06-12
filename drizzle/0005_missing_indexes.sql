-- Indexes that should have been added with the original schema but were missing.
-- products.cycle_id is queried for every cycle render (admin + ordine page).
-- ledger_entries.cycle_id is queried by close-cycle (existingCharge check) and
-- will be heavily used by upcoming analytics/dashboard queries.

CREATE INDEX IF NOT EXISTS products_cycle_id_idx ON products(cycle_id);
CREATE INDEX IF NOT EXISTS ledger_entries_cycle_id_idx ON ledger_entries(cycle_id);
