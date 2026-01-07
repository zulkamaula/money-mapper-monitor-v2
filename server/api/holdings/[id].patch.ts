import { requireAuth } from '../../utils/auth'
import { sql } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { userId } = requireAuth(event)
  const holdingId = getRouterParam(event, 'id')
  const body = await readBody<{ 
    initial_investment?: number
    average_price?: number
    purchase_date?: string
    notes?: string
  }>(event)

  const { initial_investment, average_price, purchase_date, notes } = body

  if (!holdingId) {
    throw createError({ status: 400, statusText: 'Missing required fields' })
  }

  if (initial_investment !== undefined && initial_investment < 0) {
    throw createError({ status: 400, statusText: 'Initial investment must be positive' })
  }

  if (average_price !== undefined && average_price <= 0) {
    throw createError({ status: 400, statusText: 'Average price must be greater than 0' })
  }

  const db = sql()
  
  // Verify holding belongs to user's money book
  const ownerCheck = await db`
    SELECT h.id
    FROM public.holdings h
    JOIN public.assets a ON h.asset_id = a.id
    JOIN public.investment_portfolios p ON a.portfolio_id = p.id
    JOIN public.money_books mb ON p.money_book_id = mb.id
    WHERE h.id = ${holdingId} AND mb.user_id = ${userId}
  `
  
  if (ownerCheck.length === 0) {
    throw createError({ status: 404, statusText: 'Holding not found' })
  }

  // If either initial_investment or average_price is being updated,
  // we need to recalculate quantity
  let quantityUpdate = null
  if (initial_investment !== undefined || average_price !== undefined) {
    // Get current values to calculate new quantity
    const current = await db`
      SELECT initial_investment, average_price FROM public.holdings
      WHERE id = ${holdingId}
    `
    
    if (current.length > 0 && current[0]) {
      const newInitialInvestment = initial_investment !== undefined ? initial_investment : (current[0].initial_investment || 0)
      const newAveragePrice = average_price !== undefined ? average_price : (current[0].average_price || 0)
      
      if (newAveragePrice && newAveragePrice > 0) {
        quantityUpdate = newInitialInvestment / newAveragePrice
      }
    }
  }

  const updated = await db`
    UPDATE public.holdings
    SET 
      initial_investment = COALESCE(${initial_investment !== undefined ? initial_investment : null}, initial_investment),
      average_price = COALESCE(${average_price !== undefined ? average_price : null}, average_price),
      quantity = COALESCE(${quantityUpdate !== null ? quantityUpdate : null}, quantity),
      purchase_date = COALESCE(${purchase_date !== undefined ? purchase_date : null}, purchase_date),
      notes = COALESCE(${notes !== undefined ? notes : null}, notes),
      last_updated = NOW()
    WHERE id = ${holdingId}
    RETURNING id, asset_id, platform, instrument_name,
              initial_investment, average_price, quantity,
              purchase_date, notes, linked_allocation_id, last_updated, created_at
  `
  
  return updated[0]
})
