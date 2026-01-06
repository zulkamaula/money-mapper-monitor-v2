import { requireAuth } from '../../utils/auth'
import { sql } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { userId } = requireAuth(event)
  const holdingId = getRouterParam(event, 'id')
  const body = await readBody<{ 
    current_value: number
    quantity?: number
    average_price?: number
    notes?: string
  }>(event)

  const { current_value, quantity, average_price, notes } = body

  if (!holdingId || current_value === undefined) {
    throw createError({ status: 400, statusText: 'Missing required fields' })
  }

  if (current_value < 0) {
    throw createError({ status: 400, statusText: 'Current value must be positive' })
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

  const updated = await db`
    UPDATE public.holdings
    SET 
      current_value = ${current_value},
      quantity = ${quantity !== undefined ? quantity : null},
      average_price = ${average_price !== undefined ? average_price : null},
      notes = ${notes !== undefined ? notes : null},
      last_updated = NOW()
    WHERE id = ${holdingId}
    RETURNING id, asset_id, platform, instrument_name,
              initial_investment, current_value, quantity, average_price,
              notes, linked_allocation_id, last_updated, created_at
  `
  
  return updated[0]
})
