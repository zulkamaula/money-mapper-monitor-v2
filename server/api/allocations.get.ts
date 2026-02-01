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

  // Get allocations with their items and transaction totals in single query
  // ✅ Pattern: Aggregate related data to prevent N+1 queries
  // Instead of 1 + N API calls, this returns everything in ONE query
  // See docs/development/API_PATTERNS.md "Pattern 1: Aggregate Data in Single Query"
  const allocations = await db`
    SELECT 
      a.id, 
      a.money_book_id, 
      a.source_amount, 
      a.date, 
      a.notes, 
      a.created_at,
      json_agg(
        DISTINCT jsonb_build_object(
          'id', ai.id,
          'allocation_id', ai.allocation_id,
          'pocket_id', ai.pocket_id,
          'pocket_name', ai.pocket_name,
          'pocket_percentage', ai.pocket_percentage,
          'amount', ai.amount,
          'created_at', ai.created_at
        ) ORDER BY jsonb_build_object(
          'id', ai.id,
          'allocation_id', ai.allocation_id,
          'pocket_id', ai.pocket_id,
          'pocket_name', ai.pocket_name,
          'pocket_percentage', ai.pocket_percentage,
          'amount', ai.amount,
          'created_at', ai.created_at
        )
      ) FILTER (WHERE ai.id IS NOT NULL) as allocation_items,
      COALESCE(ht_summary.transaction_count, 0)::int as transaction_count,
      COALESCE(ht_summary.total_allocated, 0)::numeric as total_allocated
    FROM public.allocations a
    LEFT JOIN public.allocation_items ai ON ai.allocation_id = a.id
    LEFT JOIN (
      SELECT 
        linked_allocation_id as allocation_id,
        COUNT(*)::int as transaction_count,
        COALESCE(SUM(amount), 0)::numeric as total_allocated
      FROM public.holding_transactions
      WHERE linked_allocation_id IS NOT NULL
      GROUP BY linked_allocation_id
    ) ht_summary ON ht_summary.allocation_id = a.id
    WHERE a.money_book_id = ${moneyBookId}
    GROUP BY a.id, a.money_book_id, a.source_amount, a.date, a.notes, a.created_at, ht_summary.transaction_count, ht_summary.total_allocated
    ORDER BY a.date DESC, a.created_at DESC
  `
  
  return allocations
})
