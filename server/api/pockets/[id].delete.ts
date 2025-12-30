import { requireAuth } from '../../utils/auth'
import { sql } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { userId } = requireAuth(event)
  const pocketId = getRouterParam(event, 'id')

  if (!pocketId) {
    throw createError({ status: 400, statusText: 'Pocket ID is required' })
  }

  const db = sql()
  
  // Verify pocket belongs to user's money book
  const pocketCheck = await db`
    SELECT p.id FROM public.pockets p
    JOIN public.money_books mb ON p.money_book_id = mb.id
    WHERE p.id = ${pocketId} AND mb.user_id = ${userId}
  `
  
  if (pocketCheck.length === 0) {
    throw createError({ status: 404, statusText: 'Pocket not found' })
  }

  await db`DELETE FROM public.pockets WHERE id = ${pocketId}`
  
  return { success: true }
})
