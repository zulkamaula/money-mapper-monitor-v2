-- Investment Portfolio Tracking Schema
-- Created: Jan 6, 2026
-- Purpose: Track investment holdings across multiple platforms and asset types

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

-- Holdings (per platform/instrument)
CREATE TABLE holdings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  platform VARCHAR(255) NOT NULL,
  instrument_name VARCHAR(255) NOT NULL,
  initial_investment DECIMAL(15,2) NOT NULL CHECK (initial_investment >= 0),
  current_value DECIMAL(15,2) NOT NULL CHECK (current_value >= 0),
  quantity DECIMAL(15,4),
  average_price DECIMAL(15,2),
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
COMMENT ON TABLE investment_portfolios IS 'Investment portfolios linked to money books with investment tracking enabled';
COMMENT ON TABLE assets IS 'Asset type categories (gold, stocks, bonds, etc.) within portfolios';
COMMENT ON TABLE holdings IS 'Individual investment holdings per platform and instrument';
COMMENT ON COLUMN holdings.purchase_date IS 'Date when the investment was purchased, used for historical tracking';
COMMENT ON COLUMN holdings.linked_allocation_id IS 'Optional link to budget allocation that funded this investment';

-- Example queries:
-- Get portfolio summary:
-- SELECT 
--   SUM(initial_investment) as total_invested,
--   SUM(current_value) as current_value,
--   SUM(current_value - initial_investment) as total_profit
-- FROM holdings h
-- JOIN assets a ON h.asset_id = a.id
-- JOIN investment_portfolios p ON a.portfolio_id = p.id
-- WHERE p.money_book_id = '{book_id}';

-- Get holdings by asset type:
-- SELECT 
--   a.type,
--   a.name,
--   SUM(h.current_value) as total_value
-- FROM holdings h
-- JOIN assets a ON h.asset_id = a.id
-- JOIN investment_portfolios p ON a.portfolio_id = p.id
-- WHERE p.money_book_id = '{book_id}'
-- GROUP BY a.type, a.name
-- ORDER BY total_value DESC;
