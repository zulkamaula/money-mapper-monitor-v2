import { requireAuth } from '../../utils/auth'
import { sql } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { userId } = requireAuth(event)
  const allocationId = getRouterParam(event, 'id')

  if (!allocationId) {
    throw createError({ status: 400, statusText: 'Allocation ID is required' })
  }

  const db = sql()
  
  // Verify allocation belongs to user's money book
  const allocationCheck = await db`
    SELECT a.id FROM public.allocations a
    JOIN public.money_books mb ON a.money_book_id = mb.id
    WHERE a.id = ${allocationId} AND mb.user_id = ${userId}
  `
  
  if (allocationCheck.length === 0) {
    throw createError({ status: 404, statusText: 'Allocation not found' })
  }

  // Delete allocation items first
  await db`DELETE FROM public.allocation_items WHERE allocation_id = ${allocationId}`
  
  // Update transactions: unlink from allocation (SET NULL due to ON DELETE SET NULL constraint)
  // Note: holding_transactions.linked_allocation_id has FK with ON DELETE SET NULL
  // This will automatically set linked_allocation_id to NULL when allocation is deleted
  
  // Delete allocation (transactions will be unlinked automatically)
  await db`DELETE FROM public.allocations WHERE id = ${allocationId}`
  
  return { success: true }
})
