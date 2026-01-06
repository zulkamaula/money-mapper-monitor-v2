// server/api/money-books.post.ts
import { requireAuth } from '../utils/auth';
import { sql } from '../utils/db';

export default defineEventHandler(async (event) => {
  const { userId } = requireAuth(event);
  const body = await readBody<{ name: string; hasInvestmentPortfolio?: boolean }>(event);
  const name = String(body?.name || '').trim();
  const hasInvestmentPortfolio = Boolean(body?.hasInvestmentPortfolio);
  if (!name) throw createError({ status: 400, statusText: 'Name required' });

  const db = sql();
  
  // Shift existing books' order_index by 1 to make room at position 0
  await db`
    UPDATE public.money_books
    SET order_index = order_index + 1
    WHERE user_id = ${userId}
  `;
  
  // Insert new book at position 0 (top)
  const rows = await db`
    INSERT INTO public.money_books (id, user_id, name, has_investment_portfolio, order_index)
    VALUES (uuid_generate_v4()::TEXT, ${userId}, ${name}, ${hasInvestmentPortfolio}, 0)
    RETURNING id, name, has_investment_portfolio, order_index, created_at
  `;
  return rows[0];
});