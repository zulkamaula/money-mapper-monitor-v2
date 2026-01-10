-- Investment Portfolio Tracking Schema (Allocation-Based)
-- Created: Jan 6, 2026
-- Updated: Jan 10, 2026
-- Purpose: Track investment holdings created from budget allocations with transaction history
-- Workflow: Allocations → Holdings (merged) → Transactions (history) → Simulate (calculation)
-- 
-- ⚠️ SCHEMA REFACTORED: Holdings now aggregated, use holding_transactions for history

-- Portfolio table (one per MoneyBook)
CREATE TABLE investment_portfolios (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  money_book_id TEXT NOT NULL REFERENCES money_books(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Asset categories (Emas, Saham ETF, RDPU, etc.)
CREATE TABLE assets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  portfolio_id TEXT NOT NULL REFERENCES investment_portfolios(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('gold', 'stock_etf', 'mutual_fund', 'bond', 'crypto', 'other')),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Holdings (aggregated per unique instrument+platform) - Merged tracking
-- ⚠️ UPDATED: Now stores aggregated totals, per-transaction data moved to holding_transactions
CREATE TABLE holdings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  platform VARCHAR(255) NOT NULL,
  instrument_name VARCHAR(255) NOT NULL,
  total_investment DECIMAL(15,2) NOT NULL CHECK (total_investment >= 0),
  total_quantity DECIMAL(15,4) NOT NULL CHECK (total_quantity > 0),
  transaction_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_holding_instrument_platform UNIQUE(asset_id, platform, instrument_name)
);

-- Transaction History - Tracks all buy/sell/dividend events
CREATE TABLE holding_transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  holding_id TEXT NOT NULL REFERENCES holdings(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL DEFAULT 'buy',
  amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
  quantity DECIMAL(15,4) CHECK (quantity > 0),
  average_price DECIMAL(20,2),
  purchase_date DATE,
  notes TEXT,
  linked_allocation_id TEXT REFERENCES allocations(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT holding_transactions_type_check 
    CHECK (transaction_type IN ('buy', 'sell', 'dividend', 'fee', 'adjustment'))
);

-- Budget Source Aggregation - Shows accumulated pocket breakdown per holding
CREATE TABLE holding_budget_sources (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  holding_id TEXT NOT NULL REFERENCES holdings(id) ON DELETE CASCADE,
  pocket_id TEXT NOT NULL,
  pocket_name VARCHAR(255) NOT NULL,
  accumulated_percentage DECIMAL(5,2) NOT NULL CHECK (accumulated_percentage >= 0),
  accumulated_amount DECIMAL(15,2) NOT NULL CHECK (accumulated_amount >= 0),
  transaction_count INTEGER DEFAULT 1,
  last_updated TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_holding_pocket UNIQUE(holding_id, pocket_id)
);

-- Indexes for performance
CREATE INDEX idx_portfolios_book ON investment_portfolios(money_book_id);
CREATE INDEX idx_assets_portfolio ON assets(portfolio_id);
CREATE INDEX idx_assets_type ON assets(type);
CREATE INDEX idx_holdings_asset ON holdings(asset_id);
CREATE INDEX idx_holdings_platform ON holdings(platform);

-- Transaction indexes
CREATE INDEX idx_transactions_holding ON holding_transactions(holding_id, created_at DESC);
CREATE INDEX idx_transactions_allocation ON holding_transactions(linked_allocation_id);
CREATE INDEX idx_transactions_date ON holding_transactions(purchase_date);

-- Budget source indexes
CREATE INDEX idx_budget_sources_holding ON holding_budget_sources(holding_id);
CREATE INDEX idx_budget_sources_pocket ON holding_budget_sources(pocket_id);

-- Comments for documentation
COMMENT ON TABLE investment_portfolios IS 'Investment portfolios - one per money book, contains all investment holdings';
COMMENT ON TABLE assets IS 'Asset type categories (gold, stocks, bonds, etc.) within portfolios';
COMMENT ON TABLE holdings IS 'Aggregated investment holdings - one row per unique instrument+platform combination';
COMMENT ON COLUMN holdings.total_investment IS 'Total accumulated investment amount (Rupiah) across all transactions';
COMMENT ON COLUMN holdings.total_quantity IS 'Total accumulated quantity (gram/shares/lots) across all transactions';
COMMENT ON COLUMN holdings.transaction_count IS 'Number of buy/sell transactions for this holding';

COMMENT ON TABLE holding_transactions IS 'Transaction history for holdings - tracks all buy/sell/dividend events';
COMMENT ON COLUMN holding_transactions.transaction_type IS 'Type: buy, sell, dividend, fee, adjustment';
COMMENT ON COLUMN holding_transactions.amount IS 'Transaction amount in Rupiah';
COMMENT ON COLUMN holding_transactions.quantity IS 'Quantity bought/sold (gram/shares/lots)';
COMMENT ON COLUMN holding_transactions.average_price IS 'Price per unit at transaction time (snapshot)';
COMMENT ON COLUMN holding_transactions.linked_allocation_id IS 'Source budget allocation for this transaction';

COMMENT ON TABLE holding_budget_sources IS 'Aggregated budget source breakdown per holding - shows which pockets funded each holding';
COMMENT ON COLUMN holding_budget_sources.accumulated_percentage IS 'Total percentage from this pocket across all transactions';
COMMENT ON COLUMN holding_budget_sources.accumulated_amount IS 'Total Rupiah amount from this pocket';
COMMENT ON COLUMN holding_budget_sources.transaction_count IS 'Number of transactions from this pocket';

-- IMPORTANT: Price data (average_price in transactions) is snapshot only
-- Current prices entered in Simulate feature to calculate profit/loss on-demand

-- Example queries:
-- Get total invested per book:
-- SELECT 
--   p.name,
--   SUM(h.total_investment) as total_invested,
--   COUNT(h.id) as holding_count,
--   SUM(h.transaction_count) as total_transactions
-- FROM holdings h
-- JOIN assets a ON h.asset_id = a.id
-- JOIN investment_portfolios p ON a.portfolio_id = p.id
-- WHERE p.money_book_id = '{book_id}'
-- GROUP BY p.name;

-- Get holdings with transaction count by asset type:
-- SELECT 
--   a.type,
--   a.name,
--   h.instrument_name,
--   h.platform,
--   h.total_investment,
--   h.total_quantity,
--   h.transaction_count
-- FROM holdings h
-- JOIN assets a ON h.asset_id = a.id
-- JOIN investment_portfolios p ON a.portfolio_id = p.id
-- WHERE p.money_book_id = '{book_id}'
-- ORDER BY a.type, h.total_investment DESC;

-- Get transaction history for a holding:
-- SELECT 
--   ht.purchase_date,
--   ht.transaction_type,
--   ht.amount,
--   ht.quantity,
--   ht.average_price,
--   ht.notes,
--   a.source_amount as allocation_amount
-- FROM holding_transactions ht
-- LEFT JOIN allocations a ON ht.linked_allocation_id = a.id
-- WHERE ht.holding_id = '{holding_id}'
-- ORDER BY ht.purchase_date DESC, ht.created_at DESC;

-- Get budget source breakdown for a holding:
-- SELECT 
--   hbs.pocket_name,
--   hbs.accumulated_amount,
--   hbs.accumulated_percentage,
--   hbs.transaction_count
-- FROM holding_budget_sources hbs
-- WHERE hbs.holding_id = '{holding_id}'
-- ORDER BY hbs.accumulated_amount DESC;
