-- Migration: Simplify Holdings Schema for Allocation-Based Workflow
-- Date: Jan 7, 2026
-- Purpose: Remove price/value columns (simulate-only), keep quantity, remove has_investment flag

-- BACKUP RECOMMENDED before running this migration!
-- This is a BREAKING change that will remove data from removed columns

BEGIN;

-- 1. Remove price and value columns from holdings table
-- quantity is KEPT (tracks what you own)
-- average_price and current_value are removed (simulate inputs only)
ALTER TABLE holdings 
  DROP COLUMN IF EXISTS average_price,
  DROP COLUMN IF EXISTS current_value;

-- If quantity doesn't exist yet (fresh install), keep this commented
-- If upgrading, quantity column should already exist from previous schema

-- 2. Remove has_investment_portfolio flag from money_books
-- All books can now have investment holdings via allocations
ALTER TABLE money_books
  DROP COLUMN IF EXISTS has_investment_portfolio;

-- 3. Make linked_allocation_id more explicit (optional: uncomment if you want to enforce)
-- ALTER TABLE holdings 
--   ALTER COLUMN linked_allocation_id SET NOT NULL;
-- Note: Keeping it nullable for backward compatibility with existing standalone holdings

COMMIT;

-- Verification queries after migration:
-- Check holdings table structure:
-- \d holdings

-- Check money_books table structure:
-- \d money_books

-- Verify no data loss in essential columns:
-- SELECT COUNT(*) FROM holdings;
-- SELECT id, instrument_name, initial_investment, linked_allocation_id FROM holdings LIMIT 5;
