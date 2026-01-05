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
}
