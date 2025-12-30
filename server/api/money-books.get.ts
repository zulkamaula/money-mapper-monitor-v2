// server/api/money-books.get.ts
import { requireAuth } from '../utils/auth';
import { sql } from '../utils/db';

export default defineEventHandler(async (event) => {
  const { userId } = requireAuth(event);
  const db = sql();
  const rows = await db`
    SELECT id, name, created_at
    FROM public.money_books
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;
  return rows;
});
