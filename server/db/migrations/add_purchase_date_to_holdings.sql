-- Migration: Add purchase_date column to holdings table
-- Date: 2026-01-07

-- Add purchase_date column (nullable for existing records)
ALTER TABLE public.holdings 
ADD COLUMN IF NOT EXISTS purchase_date DATE;

-- Add comment
COMMENT ON COLUMN public.holdings.purchase_date IS 'Date when the investment was purchased';

-- Optional: Set default to created_at date for existing records
UPDATE public.holdings 
SET purchase_date = created_at::DATE 
WHERE purchase_date IS NULL;
