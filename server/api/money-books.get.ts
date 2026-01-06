// server/api/money-books.get.ts
import { requireAuth } from '../utils/auth';
import { sql } from '../utils/db';

export default defineEventHandler(async (event) => {
  const { userId } = requireAuth(event);
  const db = sql();
  const rows = await db`
    SELECT id, name, has_investment_portfolio, order_index, created_at
    FROM public.money_books
    WHERE user_id = ${userId}
    ORDER BY order_index ASC
  `;
  return rows;
});
