export interface MoneyBook {
  id: string
  user_id: string
  name: string
  order_index: number
  created_at: string
  updated_at?: string
}

export interface Pocket {
  id: string
  money_book_id: string
  name: string
  percentage: number
  order_index: number
  created_at?: string
  updated_at?: string
}

export interface AllocationItem {
  id: string
  allocation_id: string
  pocket_id: string
  pocket_name: string
  pocket_percentage: number
  amount: number
  created_at?: string
}

export interface Allocation {
  id: string
  money_book_id: string
  source_amount: number
  date: string
  notes?: string | null
  created_at: string
  allocation_items?: AllocationItem[]
  transaction_count?: number
  total_allocated?: number
}

export interface InvestmentPortfolio {
  id: string
  money_book_id: string
  name: string
  created_at: string
  updated_at?: string
}

export interface Asset {
  id: string
  portfolio_id: string
  type: 'gold' | 'stock_etf' | 'stock_etf' | 'mutual_fund' | 'bond' | 'crypto' | 'other'
  name: string
  created_at: string
}

export interface Holding {
  id: string
  asset_id: string
  asset_type?: string
  asset_name?: string
  platform: string
  instrument_name: string
  total_investment: number
  total_quantity: number
  transaction_count: number
  last_updated: string
  created_at: string
}

export interface HoldingTransaction {
  id: string
  holding_id: string
  transaction_type: 'buy' | 'sell' | 'dividend' | 'fee' | 'adjustment'
  amount: number
  quantity: number
  average_price?: number
  purchase_date?: string
  notes?: string
  linked_allocation_id?: string
  created_at: string
  pocket_sources?: Array<{
    pocket_id: string
    pocket_name: string
    pocket_amount: number
    percentage: number
  }>
}

export interface HoldingBudgetSource {
  id: string
  holding_id: string
  pocket_id: string
  pocket_name: string
  accumulated_percentage: number
  accumulated_amount: number
  transaction_count: number
  last_updated: string
}
