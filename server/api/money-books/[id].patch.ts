import { requireAuth } from '../../utils/auth'
import { sql } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { userId } = requireAuth(event)
  const bookId = getRouterParam(event, 'id')
  const body = await readBody<{ name?: string }>(event)

  if (!bookId) {
    throw createError({ status: 400, statusText: 'Book ID required' })
  }

  const name = String(body?.name || '').trim()
  if (!name) {
    throw createError({ status: 400, statusText: 'Name required' })
  }

  const db = sql()

  // Verify ownership
  const bookCheck = await db`
    SELECT id FROM public.money_books
    WHERE id = ${bookId} AND user_id = ${userId}
  `

  if (bookCheck.length === 0) {
    throw createError({ status: 404, statusText: 'Money book not found' })
  }

  // Update money book
  const rows = await db`
    UPDATE public.money_books
    SET name = ${name}
    WHERE id = ${bookId}
    RETURNING id, name, has_investment_portfolio, created_at, order_index
  `

  return rows[0]
})
