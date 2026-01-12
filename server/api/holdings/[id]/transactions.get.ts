import { requireAuth } from '../../../utils/auth'
import { sql } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const { userId } = requireAuth(event)
  const holdingId = getRouterParam(event, 'id')

  if (!holdingId) {
    throw createError({ status: 400, statusText: 'Missing holding ID' })
  }

  const db = sql()
  
  // Verify holding belongs to user's money book
  const ownerCheck = await db`
    SELECT h.id
    FROM public.holdings h
    JOIN public.assets a ON h.asset_id = a.id
    JOIN public.investment_portfolios p ON a.portfolio_id = p.id
    JOIN public.money_books mb ON p.money_book_id = mb.id
    WHERE h.id = ${holdingId} AND mb.user_id = ${userId}
  `
  
  if (ownerCheck.length === 0) {
    throw createError({ status: 404, statusText: 'Holding not found' })
  }

  // Get all transactions for this holding with allocation info
  const transactions = await db`
    SELECT 
      ht.id,
      ht.holding_id,
      ht.transaction_type,
      ht.amount,
      ht.quantity,
      ht.average_price,
      ht.purchase_date,
      ht.notes,
      ht.linked_allocation_id,
      ht.created_at,
      a.source_amount as allocation_source_amount,
      a.date as allocation_date,
      a.notes as allocation_notes
    FROM public.holding_transactions ht
    LEFT JOIN public.allocations a ON ht.linked_allocation_id = a.id
    WHERE ht.holding_id = ${holdingId}
    ORDER BY ht.purchase_date DESC NULLS LAST, ht.created_at DESC
  `
  
  // Enrich each transaction with pocket funding breakdown
  const enrichedTransactions = await Promise.all(
    transactions.map(async (transaction) => {
      if (!transaction.linked_allocation_id) {
        return { ...transaction, pocket_sources: [] }
      }
      
      const pocketItems = await db`
        SELECT 
          ai.pocket_id,
          ai.pocket_name,
          ai.pocket_percentage as percentage
        FROM public.allocation_items ai
        WHERE ai.allocation_id = ${transaction.linked_allocation_id}
        ORDER BY ai.pocket_percentage DESC
      `
      
      // Calculate actual pocket amount based on THIS transaction's amount
      const transactionAmount = Number(transaction.amount)
      const pocketSources = pocketItems.map((item: any) => ({
        pocket_id: item.pocket_id,
        pocket_name: item.pocket_name,
        pocket_amount: transactionAmount * (Number(item.percentage) / 100),
        percentage: Number(item.percentage)
      }))
      
      return {
        ...transaction,
        pocket_sources: pocketSources
      }
    })
  )
  
  // Calculate summary with pocket breakdown
  const totalAllocated = transactions.reduce((sum, t) => sum + Number(t.amount || 0), 0)
  const totalQuantity = transactions.reduce((sum, t) => sum + Number(t.quantity || 0), 0)
  
  // Aggregate pocket funding sources
  // Use pocket_name (snapshot) as key, not pocket_id
  // This preserves historical accuracy when pockets are renamed
  const pocketMap = new Map<string, { amount: number }>()
  
  for (const transaction of enrichedTransactions) {
    if (transaction.pocket_sources && transaction.pocket_sources.length > 0) {
      for (const source of transaction.pocket_sources) {
        const existing = pocketMap.get(source.pocket_name)
        if (existing) {
          existing.amount += Number(source.pocket_amount)
        } else {
          pocketMap.set(source.pocket_name, {
            amount: Number(source.pocket_amount)
          })
        }
      }
    }
  }
  
  // Calculate percentages
  const pocketSources = Array.from(pocketMap.entries())
    .map(([name, data]) => ({
      pocket_name: name,
      pocket_amount: data.amount,
      percentage: totalAllocated > 0 ? (data.amount / totalAllocated * 100) : 0
    }))
    .sort((a, b) => b.pocket_amount - a.pocket_amount)
  
  const summary = {
    total_count: transactions.length,
    total_allocated: totalAllocated,
    total_quantity: totalQuantity,
    pocket_sources: pocketSources
  }
  
  return {
    transactions: enrichedTransactions,
    summary
  }
})
