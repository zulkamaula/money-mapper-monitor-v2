import { requireAuth } from '../../../utils/auth'
import { sql } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const { userId } = requireAuth(event)
  const holdingId = getRouterParam(event, 'id')

  if (!holdingId) {
    throw createError({ status: 400, statusText: 'Missing holding ID' })
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

  // Get budget source breakdown for this holding
  const budgetSources = await db`
    SELECT 
      hbs.id,
      hbs.holding_id,
      hbs.pocket_id,
      hbs.pocket_name,
      hbs.accumulated_percentage,
      hbs.accumulated_amount,
      hbs.transaction_count,
      hbs.last_updated,
      p.percentage as current_pocket_percentage
    FROM public.holding_budget_sources hbs
    LEFT JOIN public.pockets p ON hbs.pocket_id = p.id
    WHERE hbs.holding_id = ${holdingId}
    ORDER BY hbs.accumulated_amount DESC
  `
  
  return budgetSources
})
