import { requireAuth } from '../../utils/auth'
import { sql } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { userId } = requireAuth(event)
  const holdingId = getRouterParam(event, 'id')
  const body = await readBody<{ 
    total_investment?: number
    total_quantity?: number
    platform?: string
    instrument_name?: string
  }>(event)

  const { total_investment, total_quantity, platform, instrument_name } = body

  if (!holdingId) {
    throw createError({ status: 400, statusText: 'Missing required fields' })
  }

  if (total_investment !== undefined && total_investment < 0) {
    throw createError({ status: 400, statusText: 'Total investment must be positive' })
  }

  if (total_quantity !== undefined && total_quantity <= 0) {
    throw createError({ status: 400, statusText: 'Total quantity must be greater than 0' })
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

  // Update holding (manual adjustments only - prefer creating transactions for normal flow)
  const updated = await db`
    UPDATE public.holdings
    SET 
      total_investment = COALESCE(${total_investment !== undefined ? total_investment : null}, total_investment),
      total_quantity = COALESCE(${total_quantity !== undefined ? total_quantity : null}, total_quantity),
      platform = COALESCE(${platform !== undefined ? platform : null}, platform),
      instrument_name = COALESCE(${instrument_name !== undefined ? instrument_name : null}, instrument_name),
      last_updated = NOW()
    WHERE id = ${holdingId}
    RETURNING id, asset_id, platform, instrument_name,
              total_investment, total_quantity, transaction_count,
              last_updated, created_at
  `
  
  if (!updated[0]) {
    throw createError({ status: 500, statusText: 'Failed to update holding' })
  }
  
  return updated[0]
})
