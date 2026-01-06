import { requireAuth } from '../utils/auth'
import { sql } from '../utils/db'

export default defineEventHandler(async (event) => {
  const { userId } = requireAuth(event)
  const query = getQuery(event)
  const moneyBookId = query.money_book_id as string

  if (!moneyBookId) {
    throw createError({ status: 400, statusText: 'money_book_id is required' })
  }

  const db = sql()
  
  // Verify money book belongs to user
  const bookCheck = await db`
    SELECT id FROM public.money_books 
    WHERE id = ${moneyBookId} AND user_id = ${userId}
  `
  
  if (bookCheck.length === 0) {
    throw createError({ status: 404, statusText: 'Money book not found' })
  }

  // Get all holdings with asset info
  const holdings = await db`
    SELECT 
      h.id,
      h.asset_id,
      a.type as asset_type,
      a.name as asset_name,
      h.platform,
      h.instrument_name,
      h.initial_investment,
      h.current_value,
      h.quantity,
      h.average_price,
      h.notes,
      h.linked_allocation_id,
      h.last_updated,
      h.created_at
    FROM public.holdings h
    JOIN public.assets a ON h.asset_id = a.id
    JOIN public.investment_portfolios p ON a.portfolio_id = p.id
    WHERE p.money_book_id = ${moneyBookId}
    ORDER BY a.type, h.platform, h.created_at DESC
  `
  
  return holdings
})
