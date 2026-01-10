-- Create Transaction Tables
-- Date: Jan 10, 2026
-- Purpose: Create holding_transactions and holding_budget_sources tables
--
-- These tables should have been created in the first migration but didn't execute

BEGIN;

-- ============================================================================
-- Create holding_transactions table
-- ============================================================================

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
  
  CONSTRAINT holding_transactions_type_check 
    CHECK (transaction_type IN ('buy', 'sell', 'dividend', 'fee', 'adjustment')),
  
  CONSTRAINT holding_transactions_holding_id_fkey 
    FOREIGN KEY (holding_id) REFERENCES holdings(id) ON DELETE CASCADE,
    
  CONSTRAINT holding_transactions_allocation_id_fkey 
    FOREIGN KEY (linked_allocation_id) REFERENCES allocations(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_holding ON holding_transactions(holding_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_allocation ON holding_transactions(linked_allocation_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON holding_transactions(purchase_date);

COMMENT ON TABLE holding_transactions IS 'Transaction history for holdings - tracks all buy/sell/dividend events';
COMMENT ON COLUMN holding_transactions.transaction_type IS 'Type: buy, sell, dividend, fee, adjustment';
COMMENT ON COLUMN holding_transactions.amount IS 'Transaction amount in Rupiah';
COMMENT ON COLUMN holding_transactions.quantity IS 'Quantity bought/sold (gram/shares/lots)';
COMMENT ON COLUMN holding_transactions.average_price IS 'Price per unit at transaction time (snapshot)';
COMMENT ON COLUMN holding_transactions.linked_allocation_id IS 'Source budget allocation for this transaction';

-- ============================================================================
-- Create holding_budget_sources table
-- ============================================================================

CREATE TABLE IF NOT EXISTS holding_budget_sources (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  holding_id TEXT NOT NULL,
  pocket_id TEXT NOT NULL,
  pocket_name VARCHAR(255) NOT NULL,
  accumulated_percentage DECIMAL(5,2) NOT NULL CHECK (accumulated_percentage >= 0),
  accumulated_amount DECIMAL(15,2) NOT NULL CHECK (accumulated_amount >= 0),
  transaction_count INTEGER DEFAULT 1,
  last_updated TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_holding_pocket UNIQUE(holding_id, pocket_id),
  
  CONSTRAINT holding_budget_sources_holding_id_fkey 
    FOREIGN KEY (holding_id) REFERENCES holdings(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_budget_sources_holding ON holding_budget_sources(holding_id);
CREATE INDEX IF NOT EXISTS idx_budget_sources_pocket ON holding_budget_sources(pocket_id);

COMMENT ON TABLE holding_budget_sources IS 'Aggregated budget source breakdown per holding - shows which pockets funded each holding';
COMMENT ON COLUMN holding_budget_sources.accumulated_percentage IS 'Total percentage from this pocket across all transactions';
COMMENT ON COLUMN holding_budget_sources.accumulated_amount IS 'Total Rupiah amount from this pocket';
COMMENT ON COLUMN holding_budget_sources.transaction_count IS 'Number of transactions from this pocket';

-- ============================================================================
-- Add UNIQUE constraint to holdings (if not exists)
-- ============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_holding_instrument_platform'
    ) THEN
        ALTER TABLE holdings
        ADD CONSTRAINT unique_holding_instrument_platform 
        UNIQUE(asset_id, platform, instrument_name);
        
        RAISE NOTICE 'Added UNIQUE constraint on holdings';
    ELSE
        RAISE NOTICE 'UNIQUE constraint already exists';
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- Verification
-- ============================================================================

-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('holding_transactions', 'holding_budget_sources')
ORDER BY table_name;

-- Should return 2 rows:
-- holding_budget_sources
-- holding_transactions
