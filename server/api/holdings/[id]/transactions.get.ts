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

  // Get all transactions for this holding with allocation info
  const transactions = await db`
    SELECT 
      ht.id,
      ht.holding_id,
      ht.transaction_type,
      ht.amount,
      ht.quantity,
      ht.average_price,
      ht.purchase_date,
      ht.notes,
      ht.linked_allocation_id,
      ht.created_at,
      a.source_amount as allocation_source_amount,
      a.date as allocation_date,
      a.notes as allocation_notes
    FROM public.holding_transactions ht
    LEFT JOIN public.allocations a ON ht.linked_allocation_id = a.id
    WHERE ht.holding_id = ${holdingId}
    ORDER BY ht.purchase_date DESC NULLS LAST, ht.created_at DESC
  `
  
  return transactions
})
