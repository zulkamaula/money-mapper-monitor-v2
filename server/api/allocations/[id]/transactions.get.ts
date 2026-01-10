import { requireAuth } from '../../../utils/auth'
import { sql } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const { userId } = requireAuth(event)
  const allocationId = getRouterParam(event, 'id')

  if (!allocationId) {
    throw createError({ status: 400, statusText: 'Missing allocation ID' })
  }

  const db = sql()
  
  // Verify allocation belongs to user's money book
  const ownerCheck = await db`
    SELECT a.id
    FROM public.allocations a
    JOIN public.money_books mb ON a.money_book_id = mb.id
    WHERE a.id = ${allocationId} AND mb.user_id = ${userId}
  `
  
  if (ownerCheck.length === 0) {
    throw createError({ status: 404, statusText: 'Allocation not found' })
  }

  // Get all transactions linked to this allocation
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
      ht.created_at,
      h.platform,
      h.instrument_name,
      a.type as asset_type,
      a.name as asset_name
    FROM public.holding_transactions ht
    JOIN public.holdings h ON ht.holding_id = h.id
    JOIN public.assets a ON h.asset_id = a.id
    WHERE ht.linked_allocation_id = ${allocationId}
    ORDER BY ht.purchase_date DESC NULLS LAST, ht.created_at DESC
  `
  
  // Calculate total allocated amount
  const totalAllocated = transactions.reduce((sum, t) => {
    return sum + Number(t.amount)
  }, 0)
  
  return {
    transactions,
    summary: {
      total_count: transactions.length,
      total_allocated: totalAllocated
    }
  }
})
