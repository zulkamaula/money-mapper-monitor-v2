import { requireAuth } from '../../utils/auth'
import { sql } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { userId } = requireAuth(event)
  const pocketId = getRouterParam(event, 'id')
  const body = await readBody<{ 
    name?: string
    percentage?: number
    order_index?: number
  }>(event)

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

  // Validate percentage if provided
  if (body.percentage !== undefined && (body.percentage < 0 || body.percentage > 100)) {
    throw createError({ status: 400, statusText: 'Percentage must be between 0 and 100' })
  }

  // Simple approach: handle all update combinations
  let rows
  if (body.name !== undefined && body.percentage !== undefined && body.order_index !== undefined) {
    rows = await db`
      UPDATE public.pockets 
      SET name = ${body.name}, percentage = ${body.percentage}, order_index = ${body.order_index}, updated_at = NOW()
      WHERE id = ${pocketId}
      RETURNING id, money_book_id, name, percentage, order_index, created_at, updated_at
    `
  } else if (body.name !== undefined && body.percentage !== undefined) {
    rows = await db`
      UPDATE public.pockets 
      SET name = ${body.name}, percentage = ${body.percentage}, updated_at = NOW()
      WHERE id = ${pocketId}
      RETURNING id, money_book_id, name, percentage, order_index, created_at, updated_at
    `
  } else if (body.name !== undefined) {
    rows = await db`
      UPDATE public.pockets 
      SET name = ${body.name}, updated_at = NOW()
      WHERE id = ${pocketId}
      RETURNING id, money_book_id, name, percentage, order_index, created_at, updated_at
    `
  } else if (body.percentage !== undefined) {
    rows = await db`
      UPDATE public.pockets 
      SET percentage = ${body.percentage}, updated_at = NOW()
      WHERE id = ${pocketId}
      RETURNING id, money_book_id, name, percentage, order_index, created_at, updated_at
    `
  } else if (body.order_index !== undefined) {
    rows = await db`
      UPDATE public.pockets 
      SET order_index = ${body.order_index}, updated_at = NOW()
      WHERE id = ${pocketId}
      RETURNING id, money_book_id, name, percentage, order_index, created_at, updated_at
    `
  } else {
    throw createError({ status: 400, statusText: 'No fields to update' })
  }
  
  return rows[0]
})
