# API Error Handling Strategy for Investment Price Fetching

## Problem
Free tier APIs have limited calls:
- **Yahoo Finance**: Unlimited but unofficial (may break)
- **ExchangeRate-API**: 1500 calls/month (enough with caching!)
- **CoinGecko**: 10-50 calls/minute

## Solution: Smart Caching + Graceful Degradation

---

## 1. **Caching Strategy** 💾

### Implementation
```ts
// Cache price for 15 minutes
const CACHE_DURATION = 15 * 60 * 1000 // 15 minutes
```

### Benefits
- Reduces API calls by 90%+
- If user updates multiple holdings, same price is reused
- Cache survives within same session

### Example
```
User fetches gold price at 10:00 AM → API called, price cached
User updates holding at 10:05 AM → Cache used, no API call
User updates holding at 10:20 AM → Cache expired, API called again
```

---

## 2. **Error Handling Levels** ⚠️

### Level 1: Rate Limit (429)
```ts
if (err.statusCode === 429) {
  showError('API limit reached. Try again in 1 hour.')
  // Suggest manual input
}
```
**User Action**: Enter price manually

### Level 2: Invalid API Key (401)
```ts
if (err.statusCode === 401) {
  showError('API key expired. Please enter price manually.')
}
```
**User Action**: Enter price manually

### Level 3: Network Error
```ts
showError('Network error. Check connection or enter manually.')
```
**User Action**: Retry or manual input

---

## 3. **User Experience Flow** 🎯

### Successful API Call
```
User clicks 🔄 button
  ↓
Loading spinner shows
  ↓
API returns price: Rp 1.200.000
  ↓
✅ Success toast: "Latest gold price fetched!"
  ↓
Price auto-fills input field
  ↓
Quantity & Current Value auto-calculate
```

### Failed API Call (Rate Limited)
```
User clicks 🔄 button
  ↓
Loading spinner shows
  ↓
API returns 429 (rate limit)
  ↓
❌ Error toast: "API limit reached. Please enter price manually."
  ↓
Input field remains empty/editable
  ↓
User types price manually: 1200000
  ↓
Quantity & Current Value auto-calculate
```

### Using Cached Price
```
User clicks 🔄 button
  ↓
Check cache (< 15 min old)
  ↓
Cache found: Rp 1.200.000
  ↓
ℹ️ Info toast: "Using cached price (updated 5 min ago)"
  ↓
Price auto-fills from cache (NO API CALL!)
  ↓
Quantity & Current Value auto-calculate
```

---

## 4. **Implementation in HoldingDialog** 📝

### Add Fetch Price Handler
```ts
// In HoldingDialog.vue
const { fetchGoldPrice, fetchStockPrice, fetchCryptoPrice, loading: priceLoading } = usePriceData()

async function handleFetchPrice() {
  let price: number | null = null
  
  switch (form.value.asset_type) {
    case 'gold':
      price = await fetchGoldPrice()
      break
    case 'stock':
    case 'etf':
      // Need instrument name to fetch stock price
      if (!form.value.instrument_name) {
        showError('Please enter instrument name first (e.g., BBCA)')
        return
      }
      price = await fetchStockPrice(form.value.instrument_name)
      break
    case 'crypto':
      // Need coin ID (e.g., 'bitcoin', 'ethereum')
      price = await fetchCryptoPrice('bitcoin') // Default or from instrument
      break
    default:
      showError('Price fetching not available for this asset type')
      return
  }
  
  if (price !== null) {
    form.value.average_price = price
    averagePriceDisplay.value = formatNumberInput(price)
  }
}
```

### Update Fetch Button
```vue
<VBtn
  icon="mdi-refresh"
  @click="handleFetchPrice"
  :loading="priceLoading"
  :disabled="submitting || !form.asset_type"
  title="Fetch Latest Price"
/>
```

---

## 5. **Monthly API Call Estimation** 📊

### Scenario: Active User
- **Daily updates**: 5 holdings/day (gold + stocks)
- **Cache hit rate**: 85% (15 min cache)
- **Gold API calls**: 5 × 0.15 = 0.75/day
- **Exchange rate calls**: 0.75/day (shared for all gold requests)
- **Monthly total**: ~45 calls (gold + rate)

### Result
✅ **Well within all free tier limits!**
- Yahoo Finance: Unlimited ✅
- ExchangeRate: 45/1500 calls ✅

### Scenario: Heavy User
- **Daily updates**: 20 holdings/day
- **Cache hit rate**: 80%
- **Monthly total**: ~120 calls

### Result
✅ **Still well within limits!**

---

## 6. **Fallback Options** 🔄

### If API Limit Exhausted
1. **Manual Input** (always available)
   ```
   User enters price manually: 1200000
   ✅ Works perfectly, auto-calc still functions
   ```

2. **Use Last Known Price**
   ```ts
   // If holding already has average_price
   if (isEditMode && form.value.average_price) {
     averagePriceDisplay.value = formatNumberInput(form.value.average_price)
   }
   ```

3. **Community Price Data** (future)
   - Store recent prices in database
   - Use avg price from last 24h
   - No external API needed

---

## 7. **API Configuration** 🔐

### No API Keys Needed! 🎉
```env
# All APIs used are completely free and don't require API keys:
# ✅ Yahoo Finance - unlimited calls
# ✅ ExchangeRate-API - 1500 calls/month
# ✅ CoinGecko - 10-50 calls/minute
```

### How It Works
```ts
// Gold price: Yahoo Finance (free!)
const goldResponse = await $fetch(
  'https://query1.finance.yahoo.com/v8/finance/chart/GC=F'
)

// USD to IDR: ExchangeRate-API (free!)
const rateResponse = await $fetch(
  'https://api.exchangerate-api.com/v4/latest/USD'
)

// Convert: USD/ounce → IDR/gram
const priceIDR = (goldUSD / 31.1035) * usdToIdr
```

---

## 8. **Cache Management** 🗑️

### Auto-Clear on Logout
```ts
// In auth middleware
watch(user, (newUser) => {
  if (!newUser) {
    clearCache() // Clear price cache on logout
  }
})
```

### Manual Clear (for debugging)
```ts
// Add to settings/debug menu
<VBtn @click="clearCache">
  Clear Price Cache
</VBtn>
```

---

## 9. **Monitoring & Alerts** 📈

### Log API Calls
```ts
console.log('[API Call]', {
  asset: 'gold',
  source: 'api',
  timestamp: new Date().toISOString(),
  callsThisMonth: getCachedCallCount()
})
```

### Show Cache Info (Dev Mode)
```ts
const cacheInfo = getCacheInfo()
// [
//   { asset: 'gold-idr', price: 1200000, ageMinutes: 5, source: 'api' },
//   { asset: 'stock-BBCA', price: 10500, ageMinutes: 2, source: 'api' }
// ]
```

---

## 10. **Best Practices** ✅

### DO
✅ Cache aggressively (15+ minutes)
✅ Show clear error messages
✅ Always allow manual input
✅ Use toast notifications for feedback
✅ Handle network errors gracefully

### DON'T
❌ Make API calls without caching
❌ Auto-retry on rate limit (wastes quota)
❌ Hide errors from user
❌ Make fetch mandatory (always optional)
❌ Call API on every input change

---

## Summary

**Strategy**: Cache First + Graceful Degradation

1. **Cache** reduces API calls by 80-90%
2. **Manual input** always works as fallback
3. **Clear errors** guide user to manual entry
4. **15-minute cache** balances freshness vs. quota

**Result**: Reliable system that works even when APIs fail! 🎯
