import { requireAuth } from '../../../utils/auth'
import { sql } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const { userId } = requireAuth(event)
  const transactionId = getRouterParam(event, 'id')
  const body = await readBody<{
    amount?: number
    quantity?: number
    average_price?: number
    purchase_date?: string
    notes?: string
  }>(event)

  if (!transactionId) {
    throw createError({ status: 400, statusText: 'Missing transaction ID' })
  }

  const { amount, quantity, average_price, purchase_date, notes } = body

  // Validate inputs
  if (amount !== undefined && amount <= 0) {
    throw createError({ status: 400, statusText: 'Amount must be greater than 0' })
  }

  if (quantity !== undefined && quantity <= 0) {
    throw createError({ status: 400, statusText: 'Quantity must be greater than 0' })
  }

  if (average_price !== undefined && average_price <= 0) {
    throw createError({ status: 400, statusText: 'Average price must be greater than 0' })
  }

  const db = sql()

  // Verify transaction belongs to user's money book
  const ownerCheck = await db`
    SELECT ht.id, ht.holding_id, ht.amount as old_amount, ht.quantity as old_quantity
    FROM public.holding_transactions ht
    JOIN public.holdings h ON ht.holding_id = h.id
    JOIN public.assets a ON h.asset_id = a.id
    JOIN public.investment_portfolios p ON a.portfolio_id = p.id
    JOIN public.money_books mb ON p.money_book_id = mb.id
    WHERE ht.id = ${transactionId} AND mb.user_id = ${userId}
  `

  if (ownerCheck.length === 0 || !ownerCheck[0]) {
    throw createError({ status: 404, statusText: 'Transaction not found' })
  }

  const transaction = ownerCheck[0]
  const holdingId = transaction.holding_id as string

  // Update transaction
  const updated = await db`
    UPDATE public.holding_transactions
    SET 
      amount = COALESCE(${amount !== undefined ? amount : null}, amount),
      quantity = COALESCE(${quantity !== undefined ? quantity : null}, quantity),
      average_price = COALESCE(${average_price !== undefined ? average_price : null}, average_price),
      purchase_date = COALESCE(${purchase_date !== undefined ? purchase_date : null}, purchase_date),
      notes = COALESCE(${notes !== undefined ? notes : null}, notes)
    WHERE id = ${transactionId}
    RETURNING *
  `

  if (!updated[0]) {
    throw createError({ status: 500, statusText: 'Failed to update transaction' })
  }

  // Recalculate holding aggregates
  const aggregates = await db`
    SELECT 
      COUNT(*) as transaction_count,
      SUM(amount) as total_investment,
      SUM(quantity) as total_quantity
    FROM public.holding_transactions
    WHERE holding_id = ${holdingId}
  `

  if (aggregates[0]) {
    await db`
      UPDATE public.holdings
      SET 
        transaction_count = ${aggregates[0].transaction_count || 0},
        total_investment = ${aggregates[0].total_investment || 0},
        total_quantity = ${aggregates[0].total_quantity || 0},
        last_updated = NOW()
      WHERE id = ${holdingId}
    `
  }

  return updated[0]
})
