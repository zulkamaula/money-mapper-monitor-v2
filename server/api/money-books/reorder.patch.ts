// server/api/money-books/reorder.patch.ts
import { requireAuth } from '../../utils/auth';
import { sql } from '../../utils/db';

export default defineEventHandler(async (event) => {
  const { userId } = requireAuth(event);
  const body = await readBody<{ bookIds: string[] }>(event);
  
  if (!Array.isArray(body.bookIds) || body.bookIds.length === 0) {
    throw createError({ status: 400, statusText: 'bookIds array required' });
  }

  const db = sql();
  
  // Verify all books belong to the user
  const userBooks = await db`
    SELECT id 
    FROM public.money_books 
    WHERE user_id = ${userId}
  `;
  
  const userBookIds = new Set(userBooks.map(b => b.id));
  const allValid = body.bookIds.every(id => userBookIds.has(id));
  
  if (!allValid) {
    throw createError({ status: 403, statusText: 'Forbidden: Invalid book IDs' });
  }

  // Batch update order_index for each book
  // Use transaction for consistency
  for (let i = 0; i < body.bookIds.length; i++) {
    await db`
      UPDATE public.money_books
      SET order_index = ${i}
      WHERE id = ${body.bookIds[i]} AND user_id = ${userId}
    `;
  }

  return { success: true, message: 'Order updated successfully' };
});
