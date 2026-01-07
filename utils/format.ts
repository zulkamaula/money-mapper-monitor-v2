export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format percentage value, removing unnecessary decimal places
 * Examples:
 * - 10 → "10%"
 * - 10.5 → "10.5%"
 * - 10.25 → "10.25%"
 * - 10.00 → "10%"
 * - 10.009 → "10%" (rounds to whole number)
 */
export function formatPercentage(value: number | string): string {
  // Convert to number if string (database might return NUMERIC as string)
  const num = typeof value === 'string' ? parseFloat(value) : value
  
  // Handle invalid values
  if (isNaN(num)) return '0%'
  
  // Round to whole number if very close (handles floating point precision)
  const rounded = Math.round(num)
  if (Math.abs(num - rounded) < 0.01) {
    return `${rounded}%`
  }
  
  // Otherwise, show up to 2 decimals, removing trailing zeros
  const formatted = parseFloat(num.toFixed(2))
  return `${formatted}%`
}

/**
 * Format date with Indonesian locale (e.g., "31 Des 2024")
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(d)
}

/**
 * Convert date to YYYY-MM-DD format for input fields
 * Handles string, Date object, null, or undefined
 * Examples:
 * - "2025-01-15T00:00:00.000Z" → "2025-01-15"
 * - new Date("2025-01-15") → "2025-01-15"
 * - null → today's date
 */
export function formatDateInput(date: string | Date | null | undefined): string {
  if (!date) {
    return new Date().toISOString().split('T')[0]!
  }
  
  const d = typeof date === 'string' ? new Date(date) : date
  
  // Validate date
  if (isNaN(d.getTime())) {
    return new Date().toISOString().split('T')[0]!
  }
  
  return d.toISOString().split('T')[0]!
}

/**
 * Format number input with thousand separators (for display in input fields)
 * Examples:
 * - 1000 → "1.000"
 * - 1000000 → "1.000.000"
 */
export function formatNumberInput(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value.replace(/\./g, '')) : value
  if (isNaN(num)) return ''
  return new Intl.NumberFormat('id-ID').format(num)
}

/**
 * Parse formatted number input back to number
 * Removes thousand separators and converts to number
 * Handles Indonesian format: dots for thousands, comma for decimals
 * Examples:
 * - "1.000" → 1000
 * - "1.000.000" → 1000000
 * - "Rp 3.000.200,00" → 3000200
 */
export function parseNumberInput(value: string): number {
  // Remove currency symbols and whitespace
  let cleaned = value.replace(/Rp/gi, '').trim()

  // Remove decimal part (anything after comma)
  const parts = cleaned.split(',')
  cleaned = parts[0] || ''

  // Remove thousand separators (dots)
  cleaned = cleaned.replace(/\./g, '')

  // Extract only digits
  cleaned = cleaned.replace(/[^\d]/g, '')

  return parseInt(cleaned) || 0
}

/**
 * Format quantity with Indonesian decimal format
 * Uses comma for decimal separator, removes trailing zeros
 * Examples:
 * - 1.0000 → "1"
 * - 0.0500 → "0,05"
 * - 1.2500 → "1,25"
 * - 5000 → "5.000" (thousands use dots)
 */
export function formatQuantity(value: number | undefined): string {
  if (value === undefined || value === null || isNaN(value)) return '0'
  
  // If it's a whole number, use thousand separator format
  if (Number.isInteger(value)) {
    return new Intl.NumberFormat('id-ID').format(value)
  }
  
  // For decimals, use Indonesian format with comma
  // Remove trailing zeros but keep significant decimals
  const str = value.toFixed(4) // Max 4 decimals for precision
  const parts = str.split('.')
  const whole = parts[0] || '0'
  const decimal = parts[1] || ''
  
  // Remove trailing zeros from decimal part
  const trimmedDecimal = decimal.replace(/0+$/, '')
  
  // Format whole number part with thousand separators
  const formattedWhole = new Intl.NumberFormat('id-ID').format(parseInt(whole))
  
  // Return with comma as decimal separator (Indonesian format)
  return trimmedDecimal ? `${formattedWhole},${trimmedDecimal}` : formattedWhole
}
