-- Investment Portfolio Tracking Schema (Allocation-Based)
-- Created: Jan 6, 2026
-- Updated: Jan 7, 2026
-- Purpose: Track investment holdings created from budget allocations
-- Workflow: Allocations → Holdings → Simulate (temporary calculation)

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

-- Holdings (per platform/instrument) - Allocation-based tracking
CREATE TABLE holdings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  platform VARCHAR(255) NOT NULL,
  instrument_name VARCHAR(255) NOT NULL,
  initial_investment DECIMAL(15,2) NOT NULL CHECK (initial_investment >= 0),
  quantity DECIMAL(15,4) NOT NULL CHECK (quantity > 0),
  purchase_date DATE,
  notes TEXT,
  linked_allocation_id TEXT REFERENCES allocations(id) ON DELETE SET NULL,
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_portfolios_book ON investment_portfolios(money_book_id);
CREATE INDEX idx_assets_portfolio ON assets(portfolio_id);
CREATE INDEX idx_assets_type ON assets(type);
CREATE INDEX idx_holdings_asset ON holdings(asset_id);
CREATE INDEX idx_holdings_allocation ON holdings(linked_allocation_id);
CREATE INDEX idx_holdings_platform ON holdings(platform);

-- Comments for documentation
COMMENT ON TABLE investment_portfolios IS 'Investment portfolios - one per money book, contains all investment holdings';
COMMENT ON TABLE assets IS 'Asset type categories (gold, stocks, bonds, etc.) within portfolios';
COMMENT ON TABLE holdings IS 'Investment holdings created from budget allocations - tracks what you own and how much invested';
COMMENT ON COLUMN holdings.initial_investment IS 'Amount invested from allocation (Rupiah)';
COMMENT ON COLUMN holdings.quantity IS 'Amount owned - user input at creation (gram/shares/lots). Used with prices in Simulate to calculate value';
COMMENT ON COLUMN holdings.purchase_date IS 'Date when the investment was purchased';
COMMENT ON COLUMN holdings.linked_allocation_id IS 'Required link to budget allocation that funded this investment (allocation-first workflow)';
COMMENT ON COLUMN holdings.notes IS 'Optional notes about the investment';

-- IMPORTANT: Price data (average_price, current_price) and current_value are NOT stored
-- Use Simulate feature to input prices and calculate profit/loss on-demand

-- Example queries:
-- Get total invested per book:
-- SELECT 
--   p.name,
--   SUM(h.initial_investment) as total_invested,
--   COUNT(h.id) as holding_count
-- FROM holdings h
-- JOIN assets a ON h.asset_id = a.id
-- JOIN investment_portfolios p ON a.portfolio_id = p.id
-- WHERE p.money_book_id = '{book_id}'
-- GROUP BY p.name;

-- Get holdings by asset type:
-- SELECT 
--   a.type,
--   a.name,
--   h.instrument_name,
--   h.platform,
--   h.initial_investment,
--   h.purchase_date
-- FROM holdings h
-- JOIN assets a ON h.asset_id = a.id
-- JOIN investment_portfolios p ON a.portfolio_id = p.id
-- WHERE p.money_book_id = '{book_id}'
-- ORDER BY a.type, h.created_at DESC;

-- Get holdings linked to specific allocation:
-- SELECT 
--   h.*,
--   a.type as asset_type,
--   a.name as asset_name
-- FROM holdings h
-- JOIN assets a ON h.asset_id = a.id
-- WHERE h.linked_allocation_id = '{allocation_id}'
-- ORDER BY h.created_at DESC;
