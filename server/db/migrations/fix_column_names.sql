-- Fix Migration: Rename Holdings Columns
-- Date: Jan 10, 2026
-- Purpose: Fix column renames that didn't execute in previous migration
--
-- This script checks current column names and renames them properly

BEGIN;

-- ============================================================================
-- DIAGNOSTIC: Check current column names
-- ============================================================================
-- Run this first to see what columns exist:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'holdings' 
-- ORDER BY ordinal_position;

-- ============================================================================
-- FIX: Rename columns if they still have old names
-- ============================================================================

-- Check and rename initial_investment → total_investment
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'holdings' AND column_name = 'initial_investment'
    ) THEN
        ALTER TABLE holdings RENAME COLUMN initial_investment TO total_investment;
        RAISE NOTICE 'Renamed initial_investment to total_investment';
    ELSE
        RAISE NOTICE 'Column initial_investment does not exist, skipping rename';
    END IF;
END $$;

-- Check and rename quantity → total_quantity
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'holdings' AND column_name = 'quantity'
    ) THEN
        ALTER TABLE holdings RENAME COLUMN quantity TO total_quantity;
        RAISE NOTICE 'Renamed quantity to total_quantity';
    ELSE
        RAISE NOTICE 'Column quantity does not exist, skipping rename';
    END IF;
END $$;

-- Add transaction_count if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'holdings' AND column_name = 'transaction_count'
    ) THEN
        ALTER TABLE holdings ADD COLUMN transaction_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added transaction_count column';
    ELSE
        RAISE NOTICE 'Column transaction_count already exists';
    END IF;
END $$;

-- Drop old per-transaction columns if they still exist
DO $$ 
BEGIN
    -- Drop notes
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'holdings' AND column_name = 'notes'
    ) THEN
        ALTER TABLE holdings DROP COLUMN notes;
        RAISE NOTICE 'Dropped notes column';
    END IF;
    
    -- Drop linked_allocation_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'holdings' AND column_name = 'linked_allocation_id'
    ) THEN
        ALTER TABLE holdings DROP COLUMN linked_allocation_id;
        RAISE NOTICE 'Dropped linked_allocation_id column';
    END IF;
    
    -- Drop purchase_date
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'holdings' AND column_name = 'purchase_date'
    ) THEN
        ALTER TABLE holdings DROP COLUMN purchase_date;
        RAISE NOTICE 'Dropped purchase_date column';
    END IF;
    
    -- Drop average_price
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'holdings' AND column_name = 'average_price'
    ) THEN
        ALTER TABLE holdings DROP COLUMN average_price;
        RAISE NOTICE 'Dropped average_price column';
    END IF;
END $$;

-- ============================================================================
-- VERIFY: Check final column structure
-- ============================================================================

-- Show final columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'holdings' 
ORDER BY ordinal_position;

COMMIT;

-- Expected columns after fix:
-- - id
-- - asset_id
-- - platform
-- - instrument_name
-- - total_investment (was: initial_investment)
-- - total_quantity (was: quantity)
-- - transaction_count (NEW)
-- - last_updated
-- - created_at
