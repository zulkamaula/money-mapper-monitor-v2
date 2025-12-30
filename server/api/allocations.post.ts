import { requireAuth } from '../utils/auth'
import { sql } from '../utils/db'

interface CreateAllocationInput {
  money_book_id: string
  source_amount: number
  date: string
  notes?: string
  pockets: Array<{
    id: string
    name: string
    percentage: number
  }>
}

function calculateAllocationAmounts(
  sourceAmount: number,
  pockets: Array<{ id: string; percentage: number }>
): Array<{ pocketId: string; amount: number }> {
  const results: Array<{ pocketId: string; amount: number }> = []
  let totalAllocated = 0

  // Calculate floor amounts for each pocket
  for (const pocket of pockets) {
    const exactAmount = (sourceAmount * pocket.percentage) / 100
    const floorAmount = Math.floor(exactAmount)
    results.push({ pocketId: pocket.id, amount: floorAmount })
    totalAllocated += floorAmount
  }

  // Distribute remainder to first pockets
  let remainder = sourceAmount - totalAllocated
  let index = 0
  while (remainder > 0 && index < results.length) {
    const item = results[index]
    if (item) {
      item.amount += 1
    }
    remainder -= 1
    index += 1
  }

  return results
}

export default defineEventHandler(async (event) => {
  const { userId } = requireAuth(event)
  const body = await readBody<CreateAllocationInput>(event)

  const { money_book_id, source_amount, date, notes, pockets } = body

  if (!money_book_id || !source_amount || !date || !pockets || pockets.length === 0) {
    throw createError({ status: 400, statusText: 'Missing required fields' })
  }

  if (source_amount <= 0) {
    throw createError({ status: 400, statusText: 'Source amount must be positive' })
  }

  const db = sql()
  
  // Verify money book belongs to user
  const bookCheck = await db`
    SELECT id FROM public.money_books 
    WHERE id = ${money_book_id} AND user_id = ${userId}
  `
  
  if (bookCheck.length === 0) {
    throw createError({ status: 404, statusText: 'Money book not found' })
  }

  // Calculate amounts
  const calculatedAmounts = calculateAllocationAmounts(source_amount, pockets)

  // Create allocation
  const allocationRows = await db`
    INSERT INTO public.allocations (id, money_book_id, source_amount, date, notes)
    VALUES (uuid_generate_v4()::TEXT, ${money_book_id}, ${source_amount}, ${date}, ${notes || null})
    RETURNING id, money_book_id, source_amount, date, notes, created_at
  `
  
  const allocation = allocationRows[0]
  if (!allocation) {
    throw createError({ status: 500, statusText: 'Failed to create allocation' })
  }

  // Create allocation items
  const itemsToInsert = pockets.map((pocket) => {
    const calculated = calculatedAmounts.find((c) => c.pocketId === pocket.id)
    if (!calculated) {
      throw new Error(`Calculated amount not found for pocket ${pocket.id}`)
    }
    return {
      allocation_id: allocation.id,
      pocket_id: pocket.id,
      pocket_name: pocket.name,
      pocket_percentage: pocket.percentage,
      amount: calculated.amount,
    }
  })

  const allocationItems = []
  for (const item of itemsToInsert) {
    const itemRows = await db`
      INSERT INTO public.allocation_items 
        (id, allocation_id, pocket_id, pocket_name, pocket_percentage, amount)
      VALUES 
        (uuid_generate_v4()::TEXT, ${item.allocation_id}, ${item.pocket_id}, 
         ${item.pocket_name}, ${item.pocket_percentage}, ${item.amount})
      RETURNING id, allocation_id, pocket_id, pocket_name, pocket_percentage, amount, created_at
    `
    allocationItems.push(itemRows[0])
  }

  return {
    ...allocation,
    allocation_items: allocationItems,
  }
})
