# 🚀 Database Migration Guide

## Overview
Panduan untuk migrate database dengan menambahkan fitur Investment Tracking.

---

## 📋 Prerequisites

1. **Akses Neon SQL Editor**
   - Login ke: https://console.neon.tech
   - Pilih database project Anda
   - Buka "SQL Editor" tab

2. **Connection String**
   - Pastikan `NEON_DATABASE_URL` sudah di `.env`
   - Format: `postgresql://user:password@host.neon.tech/database?sslmode=require`

---

## 🆕 For New Database (Fresh Install)

Jika ini adalah database **baru** (belum ada data):

### Step 1: Run Core Schema
```sql
-- Paste seluruh isi file: server/db/schema.sql
-- File ini membuat tables: users, money_books, pockets, allocations
```

### Step 2: Run Investment Schema
```sql
-- Paste seluruh isi file: server/db/investment-schema.sql
-- File ini membuat tables: investment_portfolios, assets, holdings
```

✅ **Selesai!** Database siap digunakan.

---

## 🔄 For Existing Database (Upgrade)

Jika database **sudah ada** (sudah ada data pockets/allocations):

### Step 1: Verify Existing Tables
```sql
-- Check apakah tables sudah ada
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Expected output** (minimum):
- allocations
- money_books
- pockets
- users

### Step 2: Run Investment Schema
```sql
-- Paste seluruh isi file: server/db/investment-schema.sql
-- File ini HANYA membuat investment-related tables
```

**Ini akan create:**
- `investment_portfolios` table
- `assets` table
- `holdings` table

### Step 3: Add purchase_date Column
```sql
-- Paste seluruh isi file: server/db/migrations/add_purchase_date_to_holdings.sql
-- Atau copy-paste command ini:

ALTER TABLE public.holdings 
ADD COLUMN IF NOT EXISTS purchase_date DATE;

COMMENT ON COLUMN public.holdings.purchase_date 
IS 'Date when the investment was purchased, used for historical tracking';

-- Optional: Set default untuk existing records (jika sudah ada data)
UPDATE public.holdings 
SET purchase_date = created_at::DATE 
WHERE purchase_date IS NULL;
```

✅ **Selesai!** Database sudah ter-upgrade.

---

## ✅ Verification

### Check Tables Created
```sql
-- Pastikan tables investment sudah ada
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('investment_portfolios', 'assets', 'holdings')
ORDER BY table_name;
```

**Expected output:**
```
table_name
-------------------
assets
holdings
investment_portfolios
```

### Check purchase_date Column
```sql
-- Pastikan kolom purchase_date ada di holdings
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'holdings' 
  AND column_name = 'purchase_date';
```

**Expected output:**
```
column_name    | data_type
---------------|----------
purchase_date  | date
```

---

## 🎯 Quick Commands (Copy-Paste Ready)

### New Database - All in One
```sql
-- Copy seluruh isi dari kedua file ini secara berurutan:
-- 1. server/db/schema.sql
-- 2. server/db/investment-schema.sql
```

### Existing Database - Investment Only
```sql
-- Copy seluruh isi dari file ini:
-- server/db/investment-schema.sql

-- Lalu tambahkan purchase_date:
ALTER TABLE public.holdings ADD COLUMN IF NOT EXISTS purchase_date DATE;
```

---

## ⚠️ Common Issues

### Issue 1: "relation already exists"
**Cause:** Table sudah ada dari previous migration.

**Solution:**
```sql
-- Check table yang sudah ada
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Skip CREATE TABLE untuk table yang sudah ada
-- Atau gunakan DROP TABLE terlebih dahulu (HATI-HATI! Data akan hilang)
```

### Issue 2: "permission denied"
**Cause:** User database tidak punya permission untuk CREATE TABLE.

**Solution:**
- Gunakan owner/admin user
- Atau grant permission:
```sql
GRANT ALL PRIVILEGES ON SCHEMA public TO your_user;
```

### Issue 3: "column already exists"
**Cause:** Migration sudah pernah dijalankan.

**Solution:**
- Ini normal jika menggunakan `IF NOT EXISTS`
- Command akan di-skip otomatis
- Tidak ada masalah

---

## 📝 Rollback (Jika Ada Masalah)

### Remove Investment Tables
```sql
-- HATI-HATI! Ini akan delete semua investment data!
DROP TABLE IF EXISTS public.holdings CASCADE;
DROP TABLE IF EXISTS public.assets CASCADE;
DROP TABLE IF EXISTS public.investment_portfolios CASCADE;
```

### Remove purchase_date Column
```sql
-- Jika perlu rollback kolom purchase_date saja
ALTER TABLE public.holdings DROP COLUMN IF EXISTS purchase_date;
```

---

## 🔐 Security Notes

**Schema files (.sql) are SAFE to commit to git** karena:
- ✅ Hanya berisi struktur database (CREATE TABLE)
- ✅ Tidak ada credentials/passwords
- ✅ Tidak ada data sensitif user
- ✅ Hanya query definitions dan indexes

**Files yang TIDAK BOLEH di-commit:**
- ❌ `.env` (contains database URL & API keys)
- ❌ Backup files dengan actual data
- ❌ SQL dumps dengan user data

---

## 📞 Need Help?

Jika ada error saat migration:
1. Copy error message lengkap
2. Check di Neon dashboard → Logs
3. Verify connection string di `.env`
4. Pastikan database tidak sedang maintenance

---

**Happy migrating!** 🚀
