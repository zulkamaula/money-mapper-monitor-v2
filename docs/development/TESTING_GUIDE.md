# Testing Guide

**Last Updated:** January 30, 2026

---

## 🧪 Manual Testing Checklist

### Number Formatting
```typescript
// Test in browser console:
parseNumberInput("3000200.00")    // → 3000200 ✅
parseNumberInput("3.000.200,00")  // → 3000200 ✅
parseNumberInput("Rp 3.000.200")  // → 3000200 ✅
```

### Critical Flows

**1. Allocation → Holdings**
- Create allocation (5.000.000)
- Add holding linked to allocation (2.000.000)
- Verify: Remaining = 3.000.000, count badge shows "1"

**2. Cache Invalidation**
- Create allocation → verify shows in list
- Create linked holding → verify `transaction_count` updates

**3. Book Switching**
- Switch books rapidly (3x)
- Verify: No duplicate API calls, no console errors

---

## ✅ Pre-Deployment

- [ ] Copy-paste amounts (no trailing zeros)
- [ ] Number inputs accept both formats
- [ ] Allocation ↔ Holding link bidirectional
- [ ] No duplicate API calls
- [ ] Cache invalidates properly
- [ ] No console errors

---

## 🐛 Known Issues & Fixes

### Copy-Paste Trailing Zeros (Fixed: Jan 30, 2026)

**Problem:** Copying allocation amounts before refresh included `.00` → `300020000`

**Root Cause:** PostgreSQL returns `"3000200.00"`. `parseNumberInput()` removed all periods without checking decimals.

**Solution:** Handle both formats (comma & period decimals):
```typescript
// Remove decimal part BEFORE removing thousand separators
const lastCommaIndex = cleaned.lastIndexOf(',')
const lastPeriodIndex = cleaned.lastIndexOf('.')

if (lastCommaIndex !== -1) {
  cleaned = cleaned.substring(0, lastCommaIndex)
} else if (lastPeriodIndex !== -1 && cleaned.length - lastPeriodIndex <= 3) {
  cleaned = cleaned.substring(0, lastPeriodIndex)
}
```

**Files:** `utils/format.ts`, `components/AllocationsHistory.vue`

**Prevention:**
- Handle both decimal formats
- Process decimals before thousand separators
- Test with DB-returned values

---

## �️ Testing Tools

- **Network Tab:** Check duplicate requests, slow responses
- **Vue DevTools:** Verify reactive updates, no memory leaks
- **Console:** Test parsing functions, check cache state

---

**References:**
- [API Patterns](./API_PATTERNS.md)
- [UI Conventions](./UI_CONVENTIONS.md)
