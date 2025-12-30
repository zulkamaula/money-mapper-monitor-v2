import { requireAuth } from '../utils/auth'
import { sql } from '../utils/db'

export default defineEventHandler(async (event) => {
  const { userId } = requireAuth(event)
  const body = await readBody<{ 
    money_book_id: string
    name: string
    percentage: number
    order_index?: number
  }>(event)

  const { money_book_id, name, percentage, order_index = 0 } = body

  if (!money_book_id || !name || percentage === undefined) {
    throw createError({ status: 400, statusText: 'Missing required fields' })
  }

  if (percentage < 0 || percentage > 100) {
    throw createError({ status: 400, statusText: 'Percentage must be between 0 and 100' })
  }

  const db = sql()
  
  // Verify money book belongs to user
  const bookCheck = await db`
    SELECT id FROM public.money_books 
    WHERE id = ${money_book_id} AND user_id = ${userId}
  `
  
  if (bookCheck.length === 0) {
    throw createError({ status: 404, statusText: 'Money book not found' })
  }

  const rows = await db`
    INSERT INTO public.pockets (id, money_book_id, name, percentage, order_index)
    VALUES (uuid_generate_v4()::TEXT, ${money_book_id}, ${name}, ${percentage}, ${order_index})
    RETURNING id, money_book_id, name, percentage, order_index, created_at, updated_at
  `
  
  return rows[0]
})
