import { requireAuth } from '../../../utils/auth'
import { sql } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const { userId } = requireAuth(event)
  const transactionId = getRouterParam(event, 'id')

  if (!transactionId) {
    throw createError({ status: 400, statusText: 'Missing transaction ID' })
  }

  const db = sql()

  // Verify transaction belongs to user's money book
  const ownerCheck = await db`
    SELECT ht.id, ht.holding_id
    FROM public.holding_transactions ht
    JOIN public.holdings h ON ht.holding_id = h.id
    JOIN public.assets a ON h.asset_id = a.id
    JOIN public.investment_portfolios p ON a.portfolio_id = p.id
    JOIN public.money_books mb ON p.money_book_id = mb.id
    WHERE ht.id = ${transactionId} AND mb.user_id = ${userId}
  `

  if (ownerCheck.length === 0 || !ownerCheck[0]) {
    throw createError({ status: 404, statusText: 'Transaction not found' })
  }

  const holdingId = ownerCheck[0].holding_id as string

  // Delete transaction
  await db`
    DELETE FROM public.holding_transactions
    WHERE id = ${transactionId}
  `

  // Recalculate holding aggregates
  const aggregates = await db`
    SELECT 
      COUNT(*) as transaction_count,
      COALESCE(SUM(amount), 0) as total_investment,
      COALESCE(SUM(quantity), 0) as total_quantity
    FROM public.holding_transactions
    WHERE holding_id = ${holdingId}
  `

  if (!aggregates[0]) {
    throw createError({ status: 500, statusText: 'Failed to recalculate aggregates' })
  }

  const count = Number(aggregates[0].transaction_count)

  if (count === 0) {
    // No more transactions - delete the holding
    await db`
      DELETE FROM public.holdings
      WHERE id = ${holdingId}
    `
  } else {
    // Update holding aggregates
    await db`
      UPDATE public.holdings
      SET 
        transaction_count = ${count},
        total_investment = ${aggregates[0].total_investment || 0},
        total_quantity = ${aggregates[0].total_quantity || 0},
        last_updated = NOW()
      WHERE id = ${holdingId}
    `
  }

  return { success: true }
})
