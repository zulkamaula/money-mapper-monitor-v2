/**
 * Extract alias/ticker from instrument name
 * Examples:
 * - "BBCA - Bank Central Asia" → "BBCA"
 * - "Gold Antam" → "Antam"
 * - "SPY - SPDR S&P 500 ETF Trust" → "SPY"
 * - "Bitcoin (BTC)" → "BTC"
 */
export function extractInstrumentAlias(instrumentName: string): string {
  if (!instrumentName) return ''
  
  // Pattern 1: "TICKER - Description" → extract TICKER
  if (instrumentName.includes(' - ')) {
    const parts = instrumentName.split(' - ')
    return parts[0]?.trim() || instrumentName
  }
  
  // Pattern 2: "Name (TICKER)" → extract TICKER
  const tickerMatch = instrumentName.match(/\(([^)]+)\)/)
  if (tickerMatch && tickerMatch[1]) {
    return tickerMatch[1].trim()
  }
  
  // Pattern 3: "Gold/Emas Alias" → extract Alias (last word)
  if (instrumentName.toLowerCase().startsWith('gold ') || instrumentName.toLowerCase().startsWith('emas ')) {
    const parts = instrumentName.split(' ')
    const lastPart = parts[parts.length - 1]
    return lastPart?.trim() || instrumentName
  }
  
  // Default: return first word or full name if short
  const parts = instrumentName.split(' ')
  const firstWord = parts[0]?.trim() || instrumentName
  return instrumentName.length <= 10 ? instrumentName : firstWord
}
