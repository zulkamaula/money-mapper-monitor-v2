# 🔄 Holdings Refactoring - Execution Guide

**Date:** January 10, 2026  
**Purpose:** Migrate holdings to aggregated structure with transaction history  
**Status:** Ready to execute

---

## 📋 Overview

This migration refactors the holdings system to support:
- ✅ **Merged holdings** - One card per instrument+platform (not per transaction)
- ✅ **Transaction history** - Full audit trail of all buy/sell events
- ✅ **Budget source tracking** - See which pockets funded each holding
- ✅ **Better UX** - Matches real investment apps (Bibit, Pluang, etc.)

---

## 🎯 What Will Change

### **Before Migration:**
```
Emas Antam @ Tokopedia (Card 1)
- Investment: Rp 10.000.000
- From: Alokasi Jan 2026

Emas Antam @ Tokopedia (Card 2)
- Investment: Rp 5.000.000
- From: Alokasi Jan 2026
```

### **After Migration:**
```
Emas Antam @ Tokopedia (1 Card - Merged)
- Total Investment: Rp 15.000.000
- Total Quantity: 15 gram
- Transactions: 2 entries
- Budget Sources:
  • Tabungan: 60% (Rp 9.000.000)
  • Darurat: 40% (Rp 6.000.000)
```

---

## ⚠️ Prerequisites

### 1. **Backup Database** (CRITICAL)
```bash
# Option A: Neon Dashboard Backup
1. Go to: https://console.neon.tech
2. Select your database project
3. Navigate to: Settings → Backups
4. Click "Create Backup"
5. Wait for confirmation

# Option B: Manual Export via psql
psql $NEON_DATABASE_URL -c "COPY (SELECT * FROM holdings) TO STDOUT WITH CSV HEADER" > holdings_backup_$(date +%Y%m%d).csv
psql $NEON_DATABASE_URL -c "COPY (SELECT * FROM allocation_items) TO STDOUT WITH CSV HEADER" > allocation_items_backup_$(date +%Y%m%d).csv
```

### 2. **Verify Current State**
Run these queries in Neon SQL Editor to document current state:

```sql
-- Check holdings count BEFORE migration
SELECT COUNT(*) as total_holdings FROM holdings;

-- Check for duplicate instruments (will be merged)
SELECT 
  asset_id, 
  platform, 
  instrument_name, 
  COUNT(*) as duplicate_count
FROM holdings
GROUP BY asset_id, platform, instrument_name
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Total investment amount BEFORE (for verification)
SELECT SUM(initial_investment) as total_before FROM holdings;
```

**Save these results!** We'll compare after migration.

### 3. **Check Dependencies**
Ensure no active processes are modifying holdings:
- Close all dashboard tabs
- Stop any running dev servers temporarily
- Ensure no users are currently creating holdings

---

## 🚀 Migration Steps

### **Step 1: Review Migration File**

**File:** `server/db/migrations/refactor_holdings_with_transactions.sql`

Open and review the migration. Key actions:
1. Creates `holding_transactions` table
2. Creates `holding_budget_sources` table
3. Migrates existing holdings → transactions
4. Populates budget sources from allocations
5. Merges duplicate holdings
6. Adds UNIQUE constraint

### **Step 2: Execute Migration**

**Method A: Neon SQL Editor** (Recommended)

1. Open: https://console.neon.tech → Your Project → SQL Editor
2. Copy entire contents of `server/db/migrations/refactor_holdings_with_transactions.sql`
3. Paste into SQL Editor
4. Click **"Run"** button
5. Wait for completion (should take 5-30 seconds)
6. Check for any errors in output

**Method B: psql CLI**

```bash
# Set your database URL
export NEON_DATABASE_URL="postgresql://user:pass@host.neon.tech/db?sslmode=require"

# Run migration
psql $NEON_DATABASE_URL -f server/db/migrations/refactor_holdings_with_transactions.sql

# Check for errors
echo $?  # Should output 0 (success)
```

### **Step 3: Verify Migration Success**

Run these verification queries:

```sql
-- 1. Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('holding_transactions', 'holding_budget_sources')
ORDER BY table_name;
-- Expected: 2 rows

-- 2. Check holdings table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'holdings' 
  AND column_name IN ('total_investment', 'total_quantity', 'transaction_count')
ORDER BY column_name;
-- Expected: 3 rows

-- 3. Verify no duplicates (UNIQUE constraint working)
SELECT asset_id, platform, instrument_name, COUNT(*) 
FROM holdings 
GROUP BY asset_id, platform, instrument_name 
HAVING COUNT(*) > 1;
-- Expected: 0 rows (no duplicates)

-- 4. Verify transactions created
SELECT 
  h.instrument_name,
  h.platform,
  h.total_investment,
  h.transaction_count,
  COUNT(ht.id) as actual_transaction_count
FROM holdings h
LEFT JOIN holding_transactions ht ON ht.holding_id = h.id
GROUP BY h.id, h.instrument_name, h.platform, h.total_investment, h.transaction_count
HAVING h.transaction_count != COUNT(ht.id);
-- Expected: 0 rows (counts match)

-- 5. Verify total investment unchanged
SELECT SUM(total_investment) as total_after FROM holdings;
-- Compare with total_before from Step 2 Prerequisites
-- Should be equal or very close (within rounding)

-- 6. Check budget sources populated
SELECT COUNT(*) FROM holding_budget_sources;
-- Expected: > 0 (at least some budget sources)

-- 7. Sample verification - view a merged holding
SELECT 
  h.instrument_name,
  h.platform,
  h.total_investment,
  h.transaction_count,
  json_agg(json_build_object(
    'date', ht.purchase_date,
    'amount', ht.amount,
    'quantity', ht.quantity
  ) ORDER BY ht.purchase_date) as transactions
FROM holdings h
LEFT JOIN holding_transactions ht ON ht.holding_id = h.id
GROUP BY h.id, h.instrument_name, h.platform, h.total_investment, h.transaction_count
LIMIT 1;
-- Expected: JSON object showing merged transactions
```

---

## ✅ Success Criteria

Migration is successful if:

1. ✅ `holding_transactions` table exists with data
2. ✅ `holding_budget_sources` table exists with data
3. ✅ Holdings table has new columns: `total_investment`, `total_quantity`, `transaction_count`
4. ✅ Holdings table does NOT have old columns: `notes`, `linked_allocation_id`, `purchase_date`, `average_price`
5. ✅ No duplicate holdings exist (UNIQUE constraint enforced)
6. ✅ Total investment amount matches before/after
7. ✅ All holdings have matching transaction count
8. ✅ No migration errors in SQL output

---

## 🐛 Troubleshooting

### **Error: "column already exists"**
**Cause:** Migration was partially run before  
**Solution:**
```sql
-- Check what exists
SELECT column_name FROM information_schema.columns WHERE table_name = 'holdings';

-- If needed, skip to COMMIT line or rollback
ROLLBACK;
```

### **Error: "duplicate key value violates unique constraint"**
**Cause:** Duplicate holdings couldn't be merged automatically  
**Solution:**
```sql
-- Find problematic duplicates
SELECT asset_id, platform, instrument_name, COUNT(*) 
FROM holdings 
GROUP BY asset_id, platform, instrument_name 
HAVING COUNT(*) > 1;

-- Manual merge (replace IDs with actual values)
-- This is handled by migration, but if it fails, contact developer
```

### **Error: "foreign key violation"**
**Cause:** Referenced tables don't exist  
**Solution:** Ensure core schema is up to date:
```sql
-- Check if allocations table exists
SELECT table_name FROM information_schema.tables WHERE table_name = 'allocations';
```

### **Migration seems stuck (>1 minute)**
**Action:**
1. Check Neon dashboard for active queries
2. If stuck, cancel and review migration log
3. May need to run in smaller chunks

---

## 🔄 Rollback Plan (If Needed)

If migration fails or causes issues:

### **Option 1: Restore from Backup**
```bash
# Neon Dashboard
1. Go to: Settings → Backups
2. Select backup from before migration
3. Click "Restore"
4. Confirm restoration

# Note: This will lose any data created AFTER backup
```

### **Option 2: Manual Rollback**
```sql
BEGIN;

-- Drop new tables
DROP TABLE IF EXISTS holding_transactions CASCADE;
DROP TABLE IF EXISTS holding_budget_sources CASCADE;

-- Restore old column names (if migration reached this point)
ALTER TABLE holdings 
  RENAME COLUMN total_investment TO initial_investment;
  
ALTER TABLE holdings
  RENAME COLUMN total_quantity TO quantity;

-- Remove UNIQUE constraint
ALTER TABLE holdings
  DROP CONSTRAINT IF EXISTS unique_holding_instrument_platform;

-- Add back removed columns (with NULL values)
ALTER TABLE holdings
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS linked_allocation_id TEXT,
  ADD COLUMN IF NOT EXISTS purchase_date DATE,
  ADD COLUMN IF NOT EXISTS average_price NUMERIC(20,2);

-- Remove transaction_count
ALTER TABLE holdings
  DROP COLUMN IF EXISTS transaction_count;

COMMIT;

-- Then restore data from CSV backup
-- COPY holdings(id, asset_id, platform, ...) FROM '/path/to/backup.csv' WITH CSV HEADER;
```

---

## 📊 Post-Migration Checklist

After successful migration:

- [ ] Run all verification queries → all pass
- [ ] Document holdings count (before vs after)
- [ ] Note any merged holdings for reference
- [ ] Update `.env` if needed (no changes expected)
- [ ] Restart dev server: `pnpm dev`
- [ ] Test in browser:
  - [ ] Dashboard loads without errors
  - [ ] Holdings display correctly
  - [ ] Total invested amount matches
  - [ ] No console errors

---

## 🔜 Next Steps

After migration completes successfully:

### **Phase 2 (Part 2): Backend API Updates**
Update API endpoints to work with new schema:
1. `server/api/holdings.post.ts` - Create transactions & merge
2. `server/api/holdings.get.ts` - Return aggregated data
3. ✅ **IMPORTANT:** Follow patterns in `API_PATTERNS.md` to prevent N+1 queries

### **Phase 2 (Part 3): Frontend Updates**
Update components to display merged holdings:
1. `components/InvestmentPortfolio.vue` - Show merged cards
2. `components/HoldingDialog.vue` - Create transactions
3. Create `components/HoldingHistoryDialog.vue` - Timeline view
4. ✅ **IMPORTANT:** Use composable patterns from `API_PATTERNS.md`

**Estimated timeline:** 2-3 days for full implementation

### **📖 Required Reading**
Before implementing Phase 2, review:
- **[API Patterns](../development/API_PATTERNS.md)** - Backend aggregation patterns, composable conventions, watcher strategies
- Prevents common pitfalls: N+1 queries, duplicate watchers, memory leaks

---

## 📞 Support

If you encounter issues during migration:

1. **Check verification queries** - identify specific problem
2. **Review migration log** - look for SQL errors
3. **Backup exists?** - can restore if needed
4. **Document error** - save error message + query that failed

---

## 📝 Migration Log Template

Use this to document your migration:

```
Migration Date: _______________
Start Time: _______________
End Time: _______________

Pre-Migration State:
- Holdings count: _______________
- Duplicate holdings: _______________
- Total investment: Rp _______________

Migration Results:
□ holding_transactions created
□ holding_budget_sources created
□ Holdings table modified
□ Data migrated successfully
□ UNIQUE constraint added
□ No errors

Post-Migration State:
- Holdings count: _______________
- Transactions count: _______________
- Budget sources count: _______________
- Total investment: Rp _______________

Verification Status:
□ All verification queries passed
□ No duplicates found
□ Transaction counts match
□ Total investment matches
□ Browser test passed

Notes:
_________________________________
_________________________________
_________________________________
```

---

**Ready to proceed?** Follow steps in order and document results! 🚀
