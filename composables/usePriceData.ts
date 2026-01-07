// Price Data Fetching with Caching & Error Handling
// Handles free API tier limitations with smart caching

interface PriceCache {
  price: number
  timestamp: number
  source: 'api' | 'cache'
}

const CACHE_DURATION = 15 * 60 * 1000 // 15 minutes in milliseconds
const priceCache = new Map<string, PriceCache>()

export const usePriceData = () => {
  const { error: showError, success: showSuccess } = useNotification()
  const loading = ref(false)

  /**
   * Check if cached price is still valid
   */
  function isCacheValid(cacheKey: string): boolean {
    const cached = priceCache.get(cacheKey)
    if (!cached) return false
    
    const age = Date.now() - cached.timestamp
    return age < CACHE_DURATION
  }

  /**
   * Get cached price if available and valid
   */
  function getCachedPrice(cacheKey: string): number | null {
    if (isCacheValid(cacheKey)) {
      const cached = priceCache.get(cacheKey)!
      console.log(`[PriceCache] Using cached price for ${cacheKey}:`, cached.price)
      return cached.price
    }
    return null
  }

  /**
   * Store price in cache
   */
  function setCachedPrice(cacheKey: string, price: number, source: 'api' | 'cache' = 'api') {
    priceCache.set(cacheKey, {
      price,
      timestamp: Date.now(),
      source
    })
  }

  /**
   * Fetch USD to IDR exchange rate
   * Free tier: exchangerate-api.com - 1500 calls/month
   */
  async function fetchExchangeRate(): Promise<number> {
    const cacheKey = 'usd-idr-rate'
    
    // Try cache first
    const cachedRate = getCachedPrice(cacheKey)
    if (cachedRate !== null) {
      return cachedRate
    }

    try {
      const response = await $fetch<any>(
        'https://api.exchangerate-api.com/v4/latest/USD'
      )
      
      const rate = response.rates.IDR
      if (!rate) {
        throw new Error('IDR rate not available')
      }
      
      setCachedPrice(cacheKey, rate, 'api')
      return rate
      
    } catch (err) {
      console.error('[Exchange Rate API Error]:', err)
      // Fallback to approximate rate if API fails
      return 15800
    }
  }

  /**
   * Fetch gold price (IDR per gram)
   * Free: Yahoo Finance (unlimited) + exchangerate-api.com (1500 calls/month)
   */
  async function fetchGoldPrice(): Promise<number | null> {
    const cacheKey = 'gold-idr'
    
    // Try cache first
    const cachedPrice = getCachedPrice(cacheKey)
    if (cachedPrice !== null) {
      showSuccess('Using cached gold price (updated < 15 min ago)')
      return cachedPrice
    }

    loading.value = true
    try {
      // Fetch gold price in USD per ounce from Yahoo Finance
      // GC=F = Gold Futures
      const goldResponse = await $fetch<any>(
        'https://query1.finance.yahoo.com/v8/finance/chart/GC=F'
      )
      
      const pricePerOunce = goldResponse.chart.result[0].meta.regularMarketPrice
      
      if (!pricePerOunce) {
        throw new Error('Gold price not available')
      }
      
      // Fetch USD to IDR exchange rate
      const usdToIdr = await fetchExchangeRate()
      
      // Convert: USD/ounce → USD/gram → IDR/gram
      // 1 troy ounce = 31.1035 grams
      const pricePerGramUSD = pricePerOunce / 31.1035
      const pricePerGramIDR = Math.round(pricePerGramUSD * usdToIdr)
      
      setCachedPrice(cacheKey, pricePerGramIDR, 'api')
      showSuccess('Latest gold price fetched successfully!')
      return pricePerGramIDR
      
    } catch (err: any) {
      console.error('[Gold Price Fetch Error]:', err)
      showError('Failed to fetch gold price. Please enter manually or try again later.')
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch stock price from IDX (Indonesian stocks)
   * Free tier: Yahoo Finance - unlimited but unofficial
   */
  async function fetchStockPrice(symbol: string): Promise<number | null> {
    const cacheKey = `stock-${symbol}`
    
    // Try cache first
    const cachedPrice = getCachedPrice(cacheKey)
    if (cachedPrice !== null) {
      showSuccess(`Using cached price for ${symbol}`)
      return cachedPrice
    }

    loading.value = true
    try {
      // Add .JK suffix for Indonesian stocks
      const yahooSymbol = symbol.includes('.') ? symbol : `${symbol}.JK`
      
      const response = await $fetch<any>(
        `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`
      )
      
      const price = response.chart.result[0].meta.regularMarketPrice
      
      if (!price) {
        throw new Error('Price data not available')
      }
      
      setCachedPrice(cacheKey, price, 'api')
      showSuccess(`Latest price for ${symbol} fetched!`)
      return price
      
    } catch (err) {
      console.error('[Stock API Error]:', err)
      showError(`Failed to fetch ${symbol} price. Please enter manually.`)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch cryptocurrency price in IDR
   * Free tier: CoinGecko - 10-50 calls/minute
   */
  async function fetchCryptoPrice(coinId: string): Promise<number | null> {
    const cacheKey = `crypto-${coinId}`
    
    // Try cache first
    const cachedPrice = getCachedPrice(cacheKey)
    if (cachedPrice !== null) {
      showSuccess(`Using cached price for ${coinId}`)
      return cachedPrice
    }

    loading.value = true
    try {
      const response = await $fetch<any>(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=idr`
      )
      
      const price = response[coinId]?.idr
      
      if (!price) {
        throw new Error('Price data not available')
      }
      
      setCachedPrice(cacheKey, price, 'api')
      showSuccess(`Latest ${coinId} price fetched!`)
      return price
      
    } catch (err: any) {
      console.error('[Crypto API Error]:', err)
      
      if (err.statusCode === 429) {
        showError('CoinGecko rate limit reached. Please wait 1 minute and try again.')
      } else {
        showError(`Failed to fetch ${coinId} price. Please enter manually.`)
      }
      
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Clear all cached prices (useful for manual refresh)
   */
  function clearCache() {
    priceCache.clear()
    showSuccess('Price cache cleared')
  }

  /**
   * Get cache info for debugging
   */
  function getCacheInfo() {
    const info: any[] = []
    priceCache.forEach((value, key) => {
      const age = Math.floor((Date.now() - value.timestamp) / 1000 / 60) // minutes
      info.push({
        asset: key,
        price: value.price,
        ageMinutes: age,
        source: value.source
      })
    })
    return info
  }

  return {
    loading: readonly(loading),
    fetchGoldPrice,
    fetchStockPrice,
    fetchCryptoPrice,
    clearCache,
    getCacheInfo
  }
}
