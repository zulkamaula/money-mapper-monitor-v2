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

  // Get allocations with their items
  const allocations = await db`
    SELECT 
      a.id, 
      a.money_book_id, 
      a.source_amount, 
      a.date, 
      a.notes, 
      a.created_at,
      json_agg(
        json_build_object(
          'id', ai.id,
          'allocation_id', ai.allocation_id,
          'pocket_id', ai.pocket_id,
          'pocket_name', ai.pocket_name,
          'pocket_percentage', ai.pocket_percentage,
          'amount', ai.amount,
          'created_at', ai.created_at
        ) ORDER BY ai.created_at
      ) as allocation_items
    FROM public.allocations a
    LEFT JOIN public.allocation_items ai ON ai.allocation_id = a.id
    WHERE a.money_book_id = ${moneyBookId}
    GROUP BY a.id, a.money_book_id, a.source_amount, a.date, a.notes, a.created_at
    ORDER BY a.date DESC, a.created_at DESC
  `
  
  return allocations
})
