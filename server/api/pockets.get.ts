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

  const rows = await db`
    SELECT id, money_book_id, name, percentage, order_index, created_at, updated_at
    FROM public.pockets
    WHERE money_book_id = ${moneyBookId}
    ORDER BY order_index ASC
  `
  
  return rows
})
