export interface MoneyBook {
  id: string
  user_id: string
  name: string
  has_investment_portfolio: boolean
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
  platform: string
  instrument_name: string
  initial_investment: number
  current_value: number
  quantity?: number
  average_price?: number
  notes?: string
  linked_allocation_id?: string
  last_updated: string
  created_at: string
}
