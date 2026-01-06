// Asset Types
export const assetTypes = [
  { value: 'gold', title: 'Emas', icon: 'mdi-gold' },
  { value: 'stock', title: 'Saham', icon: 'mdi-chart-line' },
  { value: 'etf', title: 'ETF', icon: 'mdi-chart-multiple' },
  { value: 'mutual_fund', title: 'Reksadana', icon: 'mdi-chart-box' },
  { value: 'bond', title: 'Obligasi', icon: 'mdi-bank' },
  { value: 'crypto', title: 'Crypto', icon: 'mdi-currency-btc' },
  { value: 'other', title: 'Lainnya', icon: 'mdi-package-variant' }
]

// Common Platforms
export const commonPlatforms = [
  'Bibit',
  'Pluang',
  'Tring! by Pegadaian',
  'Ajaib',
  'Bareksa',
  'Tokocrypto',
  'Indodax',
  'Stockbit',
  'IPOT',
  'Mandiri Sekuritas',
  'BCA Sekuritas'
]

// Instrument Options by Asset Type
export const instrumentOptionsByAssetType: Record<string, string[]> = {
  gold: [
    'Emas Antam',
    'Emas UBS',
    'Emas Pegadaian',
    'Emas Galeri 24'
  ],
  stock: [
    'BBCA - Bank Central Asia',
    'BBRI - Bank Rakyat Indonesia',
    'BMRI - Bank Mandiri',
    'TLKM - Telkom Indonesia',
    'ASII - Astra International',
    'UNVR - Unilever Indonesia',
    'GOTO - GoTo Gojek Tokopedia',
    'BUKA - Bukalapak',
    'AMMN - Amman Mineral',
    'ARTO - Bank Jago'
  ],
  etf: [
    'XIJI - Pinnacle Enhanced Liquid ETF',
    'XIIT - Pinnacle Indonesia IDX30 ETF',
    'R-LQ45X - LQ45 Index ETF',
    'QQQ - Invesco QQQ Trust (Nasdaq-100)',
    'SPY - SPDR S&P 500 ETF Trust',
    'VYM - Vanguard High Dividend Yield ETF',
    'VOO - Vanguard S&P 500 ETF',
    'VTI - Vanguard Total Stock Market ETF'
  ],
  mutual_fund: [
    'RDPU - Mandiri Investa Pasar Uang',
    'RDPU - Bahana Dana Likuid',
    'RDPU - Sucorinvest Money Market Fund',
    'RDS - Sucorinvest Equity Fund',
    'RDS - Mandiri Investa Atraktif',
    'RDS - BNI-AM Inspiring Equity Fund',
    'RDC - Mandiri Investa Balanced',
    'RDC - Sucorinvest Balanced Fund',
    'RDP - Mandiri Investa Pendapatan Berkala',
    'RDP - BNI-AM Dana Fixed Income Fund'
  ],
  bond: [
    'SBN - Surat Berharga Negara',
    'ORI - Obligasi Ritel Indonesia (ORI023, ORI024)',
    'SR - Sukuk Ritel (SR018, SR019)',
    'SBR - Savings Bond Ritel (SBR013, SBR014)',
    'SUKRI - Sukuk Ritel',
    'FR - Fixed Rate Bond',
    'PBS - Sukuk Negara',
    'Corporate Bond - Mandiri',
    'Corporate Bond - BCA',
    'Corporate Bond - Telkom'
  ],
  crypto: [
    'Bitcoin (BTC)',
    'Ethereum (ETH)',
    'Binance Coin (BNB)',
    'Cardano (ADA)',
    'Solana (SOL)',
    'Polkadot (DOT)',
    'Polygon (MATIC)',
    'Chainlink (LINK)',
    'Litecoin (LTC)',
    'Ripple (XRP)'
  ],
  other: []
}
