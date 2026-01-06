import { requireAuth } from '../../utils/auth'
import { sql } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { userId } = requireAuth(event)
  const bookId = getRouterParam(event, 'id')

  if (!bookId) {
    throw createError({ status: 400, statusText: 'Book ID required' })
  }

  const db = sql()

  // Verify ownership
  const book = await db`
    SELECT id FROM public.money_books
    WHERE id = ${bookId} AND user_id = ${userId}
  `

  if (book.length === 0) {
    throw createError({ status: 404, statusText: 'Money book not found' })
  }

  // Delete cascade: allocations -> allocation_items, pockets, money_book
  // First delete allocation items
  await db`
    DELETE FROM public.allocation_items 
    WHERE allocation_id IN (
      SELECT id FROM public.allocations WHERE money_book_id = ${bookId}
    )
  `

  // Delete allocations
  await db`DELETE FROM public.allocations WHERE money_book_id = ${bookId}`

  // Delete pockets
  await db`DELETE FROM public.pockets WHERE money_book_id = ${bookId}`

  // Finally delete the money book
  await db`DELETE FROM public.money_books WHERE id = ${bookId}`

  return { success: true }
})
