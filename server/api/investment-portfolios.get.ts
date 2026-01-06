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

  // Get or create portfolio for this money book
  let portfolio = await db`
    SELECT id, money_book_id, name, created_at, updated_at
    FROM public.investment_portfolios
    WHERE money_book_id = ${moneyBookId}
  `
  
  // Auto-create portfolio if doesn't exist (when book has investment enabled)
  if (portfolio.length === 0) {
    const bookResult = await db`
      SELECT name FROM public.money_books WHERE id = ${moneyBookId}
    `
    
    const book = bookResult[0]
    if (book) {
      portfolio = await db`
        INSERT INTO public.investment_portfolios (id, money_book_id, name)
        VALUES (uuid_generate_v4()::TEXT, ${moneyBookId}, ${book.name + ' Portfolio'})
        RETURNING id, money_book_id, name, created_at, updated_at
      `
    }
  }
  
  return portfolio[0]
})
