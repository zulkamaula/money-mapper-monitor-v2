// server/api/money-books.post.ts
import { requireAuth } from '../utils/auth';
import { sql } from '../utils/db';

export default defineEventHandler(async (event) => {
  const { userId } = requireAuth(event);
  const body = await readBody<{ name: string }>(event);
  const name = String(body?.name || '').trim();
  if (!name) throw createError({ status: 400, statusText: 'Name required' });

  const db = sql();
  const rows = await db`
    INSERT INTO public.money_books (id, user_id, name)
    VALUES (uuid_generate_v4()::TEXT, ${userId}, ${name})
    RETURNING id, name, created_at
  `;
  return rows[0];
});