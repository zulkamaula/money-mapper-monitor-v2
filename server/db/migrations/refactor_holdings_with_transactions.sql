-- Migration: Refactor Holdings with Transaction History & Budget Source Tracking
-- Date: Jan 10, 2026
-- Purpose: Enable merged holdings by instrument+platform with full transaction history
-- 
-- Changes:
-- 1. Create holding_transactions table (transaction history/logs)
-- 2. Create holding_budget_sources table (aggregated pocket breakdown)
-- 3. Migrate existing holdings data to transactions
-- 4. Modify holdings table to aggregated structure
-- 5. Add UNIQUE constraint to prevent duplicate holdings
--
-- ⚠️ BACKUP RECOMMENDED before running this migration!

BEGIN;

-- ============================================================================
-- STEP 1: Create holding_transactions table
-- ============================================================================
-- This table stores individual buy/sell transactions for each holding
-- Preserves all historical data including notes, dates, and allocation links

CREATE TABLE IF NOT EXISTS holding_transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  holding_id TEXT NOT NULL,
  transaction_type VARCHAR(20) NOT NULL DEFAULT 'buy',
  amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
  quantity DECIMAL(15,4) CHECK (quantity > 0),
  average_price DECIMAL(20,2),
  purchase_date DATE,
  notes TEXT,
  linked_allocation_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT holding_transactions_type_check 
    CHECK (transaction_type IN ('buy', 'sell', 'dividend', 'fee', 'adjustment'))
);

-- Foreign key constraints
ALTER TABLE holding_transactions
  ADD CONSTRAINT holding_transactions_holding_id_fkey 
  FOREIGN KEY (holding_id) REFERENCES holdings(id) ON DELETE CASCADE;

ALTER TABLE holding_transactions
  ADD CONSTRAINT holding_transactions_allocation_id_fkey 
  FOREIGN KEY (linked_allocation_id) REFERENCES allocations(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX idx_transactions_holding ON holding_transactions(holding_id, created_at DESC);
CREATE INDEX idx_transactions_allocation ON holding_transactions(linked_allocation_id);
CREATE INDEX idx_transactions_date ON holding_transactions(purchase_date);

COMMENT ON TABLE holding_transactions IS 'Transaction history for holdings - tracks all buy/sell/dividend events';
COMMENT ON COLUMN holding_transactions.transaction_type IS 'Type: buy, sell, dividend, fee, adjustment';
COMMENT ON COLUMN holding_transactions.amount IS 'Transaction amount in Rupiah';
COMMENT ON COLUMN holding_transactions.quantity IS 'Quantity bought/sold (gram/shares/lots)';
COMMENT ON COLUMN holding_transactions.average_price IS 'Price per unit at transaction time (snapshot)';
COMMENT ON COLUMN holding_transactions.linked_allocation_id IS 'Source budget allocation for this transaction';

-- ============================================================================
-- STEP 2: Create holding_budget_sources table
-- ============================================================================
-- This table aggregates pocket breakdown for each holding
-- Shows accumulated budget sources across all transactions

CREATE TABLE IF NOT EXISTS holding_budget_sources (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  holding_id TEXT NOT NULL,
  pocket_id TEXT NOT NULL,
  pocket_name VARCHAR(255) NOT NULL,
  accumulated_percentage DECIMAL(5,2) NOT NULL CHECK (accumulated_percentage >= 0),
  accumulated_amount DECIMAL(15,2) NOT NULL CHECK (accumulated_amount >= 0),
  transaction_count INTEGER DEFAULT 1,
  last_updated TIMESTAMP DEFAULT NOW(),
  
  -- Unique per holding + pocket
  CONSTRAINT unique_holding_pocket UNIQUE(holding_id, pocket_id)
);

-- Foreign key constraints
ALTER TABLE holding_budget_sources
  ADD CONSTRAINT holding_budget_sources_holding_id_fkey 
  FOREIGN KEY (holding_id) REFERENCES holdings(id) ON DELETE CASCADE;

-- Note: pocket_id is NOT a foreign key because pocket might be deleted
-- We preserve snapshot data for historical accuracy

-- Indexes for performance
CREATE INDEX idx_budget_sources_holding ON holding_budget_sources(holding_id);
CREATE INDEX idx_budget_sources_pocket ON holding_budget_sources(pocket_id);

COMMENT ON TABLE holding_budget_sources IS 'Aggregated budget source breakdown per holding - shows which pockets funded each holding';
COMMENT ON COLUMN holding_budget_sources.accumulated_percentage IS 'Total percentage from this pocket across all transactions';
COMMENT ON COLUMN holding_budget_sources.accumulated_amount IS 'Total Rupiah amount from this pocket';
COMMENT ON COLUMN holding_budget_sources.transaction_count IS 'Number of transactions from this pocket';

-- ============================================================================
-- STEP 3: Migrate existing holdings to transactions
-- ============================================================================
-- Convert current holdings into transaction records
-- This preserves all existing data before we modify holdings table

INSERT INTO holding_transactions (
  holding_id,
  transaction_type,
  amount,
  quantity,
  average_price,
  purchase_date,
  notes,
  linked_allocation_id,
  created_at
)
SELECT 
  id as holding_id,
  'buy' as transaction_type,
  initial_investment as amount,
  COALESCE(quantity, 0) as quantity,
  average_price,
  purchase_date,
  notes,
  linked_allocation_id,
  created_at
FROM holdings
WHERE NOT EXISTS (
  SELECT 1 FROM holding_transactions ht WHERE ht.holding_id = holdings.id
);

-- ============================================================================
-- STEP 4: Populate holding_budget_sources from allocation_items
-- ============================================================================
-- Aggregate pocket data from allocation_items for each holding's linked allocation

INSERT INTO holding_budget_sources (
  holding_id,
  pocket_id,
  pocket_name,
  accumulated_percentage,
  accumulated_amount,
  transaction_count
)
SELECT 
  h.id as holding_id,
  ai.pocket_id,
  ai.pocket_name,
  SUM(ai.pocket_percentage) as accumulated_percentage,
  SUM(ai.amount) as accumulated_amount,
  COUNT(*) as transaction_count
FROM holdings h
INNER JOIN allocations a ON h.linked_allocation_id = a.id
INNER JOIN allocation_items ai ON ai.allocation_id = a.id
WHERE h.linked_allocation_id IS NOT NULL
GROUP BY h.id, ai.pocket_id, ai.pocket_name
ON CONFLICT (holding_id, pocket_id) 
DO UPDATE SET
  accumulated_percentage = holding_budget_sources.accumulated_percentage + EXCLUDED.accumulated_percentage,
  accumulated_amount = holding_budget_sources.accumulated_amount + EXCLUDED.accumulated_amount,
  transaction_count = holding_budget_sources.transaction_count + EXCLUDED.transaction_count,
  last_updated = NOW();

-- ============================================================================
-- STEP 5: Modify holdings table to aggregated structure
-- ============================================================================

-- Rename columns to reflect aggregated nature
ALTER TABLE holdings 
  RENAME COLUMN initial_investment TO total_investment;

ALTER TABLE holdings
  RENAME COLUMN quantity TO total_quantity;

-- Remove per-transaction fields (moved to holding_transactions)
ALTER TABLE holdings
  DROP COLUMN IF EXISTS notes,
  DROP COLUMN IF EXISTS linked_allocation_id,
  DROP COLUMN IF EXISTS purchase_date,
  DROP COLUMN IF EXISTS average_price;

-- Add transaction count for quick reference
ALTER TABLE holdings
  ADD COLUMN IF NOT EXISTS transaction_count INTEGER DEFAULT 0;

-- Update transaction count
UPDATE holdings
SET transaction_count = (
  SELECT COUNT(*) 
  FROM holding_transactions 
  WHERE holding_transactions.holding_id = holdings.id
);

-- Update comments
COMMENT ON TABLE holdings IS 'Aggregated investment holdings - one row per unique instrument+platform combination';
COMMENT ON COLUMN holdings.total_investment IS 'Total accumulated investment amount (Rupiah) across all transactions';
COMMENT ON COLUMN holdings.total_quantity IS 'Total accumulated quantity (gram/shares/lots) across all transactions';
COMMENT ON COLUMN holdings.transaction_count IS 'Number of buy/sell transactions for this holding';

-- ============================================================================
-- STEP 6: Add UNIQUE constraint to prevent duplicate holdings
-- ============================================================================
-- This ensures one holding per instrument+platform+asset combination

-- First, handle potential duplicates by merging them
-- Find and merge duplicate holdings (same asset_id, platform, instrument_name)
WITH duplicates AS (
  SELECT 
    asset_id,
    platform,
    instrument_name,
    MIN(id) as keep_id,
    ARRAY_AGG(id ORDER BY created_at) as all_ids
  FROM holdings
  GROUP BY asset_id, platform, instrument_name
  HAVING COUNT(*) > 1
)
UPDATE holding_transactions ht
SET holding_id = d.keep_id
FROM duplicates d
WHERE ht.holding_id = ANY(d.all_ids)
  AND ht.holding_id != d.keep_id;

-- Update budget sources for merged holdings
WITH duplicates AS (
  SELECT 
    asset_id,
    platform,
    instrument_name,
    MIN(id) as keep_id,
    ARRAY_AGG(id ORDER BY created_at) as all_ids
  FROM holdings
  GROUP BY asset_id, platform, instrument_name
  HAVING COUNT(*) > 1
)
UPDATE holding_budget_sources hbs
SET holding_id = d.keep_id
FROM duplicates d
WHERE hbs.holding_id = ANY(d.all_ids)
  AND hbs.holding_id != d.keep_id
ON CONFLICT (holding_id, pocket_id) 
DO UPDATE SET
  accumulated_percentage = holding_budget_sources.accumulated_percentage + EXCLUDED.accumulated_percentage,
  accumulated_amount = holding_budget_sources.accumulated_amount + EXCLUDED.accumulated_amount,
  transaction_count = holding_budget_sources.transaction_count + EXCLUDED.transaction_count;

-- Recalculate totals for merged holdings
WITH aggregated AS (
  SELECT 
    holding_id,
    SUM(amount) as total_investment,
    SUM(quantity) as total_quantity,
    COUNT(*) as transaction_count
  FROM holding_transactions
  GROUP BY holding_id
)
UPDATE holdings h
SET 
  total_investment = a.total_investment,
  total_quantity = a.total_quantity,
  transaction_count = a.transaction_count
FROM aggregated a
WHERE h.id = a.holding_id;

-- Delete duplicate holdings (transactions already moved to keep_id)
WITH duplicates AS (
  SELECT 
    asset_id,
    platform,
    instrument_name,
    MIN(id) as keep_id,
    ARRAY_AGG(id ORDER BY created_at) as all_ids
  FROM holdings
  GROUP BY asset_id, platform, instrument_name
  HAVING COUNT(*) > 1
)
DELETE FROM holdings
WHERE id IN (
  SELECT UNNEST(all_ids) 
  FROM duplicates
) AND id NOT IN (
  SELECT keep_id FROM duplicates
);

-- Now add the UNIQUE constraint
ALTER TABLE holdings
  ADD CONSTRAINT unique_holding_instrument_platform 
  UNIQUE(asset_id, platform, instrument_name);

COMMENT ON CONSTRAINT unique_holding_instrument_platform ON holdings 
  IS 'Ensures only one holding per unique instrument+platform+asset combination';

COMMIT;

-- ============================================================================
-- Verification Queries (Run after migration)
-- ============================================================================

-- Check new tables created
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
--   AND table_name IN ('holding_transactions', 'holding_budget_sources')
-- ORDER BY table_name;

-- Verify transaction migration
-- SELECT 
--   h.instrument_name,
--   h.platform,
--   h.total_investment,
--   h.transaction_count,
--   COUNT(ht.id) as actual_transactions
-- FROM holdings h
-- LEFT JOIN holding_transactions ht ON ht.holding_id = h.id
-- GROUP BY h.id, h.instrument_name, h.platform, h.total_investment, h.transaction_count
-- ORDER BY h.instrument_name;

-- Verify budget sources
-- SELECT 
--   h.instrument_name,
--   h.platform,
--   hbs.pocket_name,
--   hbs.accumulated_amount,
--   hbs.accumulated_percentage,
--   hbs.transaction_count
-- FROM holding_budget_sources hbs
-- JOIN holdings h ON h.id = hbs.holding_id
-- ORDER BY h.instrument_name, hbs.accumulated_amount DESC;

-- Check for any remaining duplicates (should be 0)
-- SELECT asset_id, platform, instrument_name, COUNT(*) 
-- FROM holdings 
-- GROUP BY asset_id, platform, instrument_name 
-- HAVING COUNT(*) > 1;
