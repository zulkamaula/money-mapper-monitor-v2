import { requireAuth } from '../utils/auth'
import { sql } from '../utils/db'

export default defineEventHandler(async (event) => {
  const { userId } = requireAuth(event)
  const body = await readBody<{ 
    money_book_id: string
    asset_type: 'gold' | 'stock' | 'etf' | 'mutual_fund' | 'bond' | 'crypto' | 'other'
    asset_name: string
    platform: string
    instrument_name: string
    initial_investment: number
    current_value: number
    quantity?: number
    average_price?: number
    purchase_date?: string
    notes?: string
    linked_allocation_id?: string
  }>(event)

  const { 
    money_book_id, 
    asset_type, 
    asset_name,
    platform, 
    instrument_name, 
    initial_investment, 
    current_value,
    quantity,
    average_price,
    purchase_date,
    notes,
    linked_allocation_id
  } = body

  if (!money_book_id || !asset_type || !asset_name || !platform || !instrument_name || 
      initial_investment === undefined || current_value === undefined) {
    throw createError({ status: 400, statusText: 'Missing required fields' })
  }

  if (initial_investment < 0 || current_value < 0) {
    throw createError({ status: 400, statusText: 'Investment amounts must be positive' })
  }

  const db = sql()
  
  // Verify money book belongs to user
  const bookCheck = await db`
    SELECT id FROM public.money_books 
    WHERE id = ${money_book_id} AND user_id = ${userId}
  `
  
  if (bookCheck.length === 0) {
    throw createError({ status: 404, statusText: 'Money book not found' })
  }

  // Get or create portfolio
  let portfolio = await db`
    SELECT id FROM public.investment_portfolios
    WHERE money_book_id = ${money_book_id}
  `
  
  if (portfolio.length === 0) {
    const bookResult = await db`
      SELECT name FROM public.money_books WHERE id = ${money_book_id}
    `
    
    const book = bookResult[0]
    if (!book) {
      throw createError({ status: 404, statusText: 'Money book not found' })
    }
    
    portfolio = await db`
      INSERT INTO public.investment_portfolios (id, money_book_id, name)
      VALUES (uuid_generate_v4()::TEXT, ${money_book_id}, ${book.name + ' Portfolio'})
      RETURNING id
    `
  }
  
  const portfolioId = portfolio[0]?.id
  if (!portfolioId) {
    throw createError({ status: 500, statusText: 'Failed to create portfolio' })
  }

  // Get or create asset
  let asset = await db`
    SELECT id FROM public.assets
    WHERE portfolio_id = ${portfolioId} 
    AND type = ${asset_type}
    AND name = ${asset_name}
  `
  
  if (asset.length === 0) {
    asset = await db`
      INSERT INTO public.assets (id, portfolio_id, type, name)
      VALUES (uuid_generate_v4()::TEXT, ${portfolioId}, ${asset_type}, ${asset_name})
      RETURNING id
    `
  }
  
  const assetId = asset[0]?.id
  if (!assetId) {
    throw createError({ status: 500, statusText: 'Failed to create asset' })
  }

  // Create holding with asset info
  const holding = await db`
    INSERT INTO public.holdings (
      id, asset_id, platform, instrument_name, 
      initial_investment, current_value, quantity, average_price, 
      purchase_date, notes, linked_allocation_id
    )
    VALUES (
      uuid_generate_v4()::TEXT, ${assetId}, ${platform}, ${instrument_name},
      ${initial_investment}, ${current_value}, ${quantity || null}, ${average_price || null},
      ${purchase_date || null}, ${notes || null}, ${linked_allocation_id || null}
    )
    RETURNING id, asset_id, platform, instrument_name, 
              initial_investment, current_value, quantity, average_price,
              purchase_date, notes, linked_allocation_id, last_updated, created_at
  `
  
  // Return holding with asset info for proper frontend grouping
  return {
    ...holding[0],
    asset_type,
    asset_name
  }
})
