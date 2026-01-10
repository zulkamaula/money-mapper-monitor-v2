import { requireAuth } from '../utils/auth'
import { sql } from '../utils/db'

export default defineEventHandler(async (event) => {
  const { userId } = requireAuth(event)
  const body = await readBody<{ 
    money_book_id: string
    asset_type: 'gold' | 'stock' | 'etf' | 'mutual_fund' | 'bond' | 'crypto' | 'other'
    asset_name: string
    platform: string
    instrument_name: string
    amount: number // transaction amount (was: initial_investment)
    quantity: number // transaction quantity
    average_price?: number // optional snapshot price
    purchase_date?: string
    notes?: string
    linked_allocation_id?: string
  }>(event)

  const { 
    money_book_id, 
    asset_type, 
    asset_name,
    platform, 
    instrument_name, 
    amount,
    quantity,
    average_price,
    purchase_date,
    notes,
    linked_allocation_id
  } = body

  if (!money_book_id || !asset_type || !asset_name || !platform || !instrument_name || 
      amount === undefined || quantity === undefined) {
    throw createError({ status: 400, statusText: 'Missing required fields' })
  }

  if (amount < 0) {
    throw createError({ status: 400, statusText: 'Investment amount must be positive' })
  }

  if (quantity <= 0) {
    throw createError({ status: 400, statusText: 'Quantity must be greater than 0' })
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

  // Get or create portfolio
  let portfolio = await db`
    SELECT id FROM public.investment_portfolios
    WHERE money_book_id = ${money_book_id}
  `
  
  if (portfolio.length === 0) {
    const bookResult = await db`
      SELECT name FROM public.money_books WHERE id = ${money_book_id}
    `
    
    const book = bookResult[0]
    if (!book) {
      throw createError({ status: 404, statusText: 'Money book not found' })
    }
    
    portfolio = await db`
      INSERT INTO public.investment_portfolios (id, money_book_id, name)
      VALUES (uuid_generate_v4()::TEXT, ${money_book_id}, ${book.name + ' Portfolio'})
      RETURNING id
    `
  }
  
  const portfolioId = portfolio[0]?.id
  if (!portfolioId) {
    throw createError({ status: 500, statusText: 'Failed to create portfolio' })
  }

  // Get or create asset
  let asset = await db`
    SELECT id FROM public.assets
    WHERE portfolio_id = ${portfolioId} 
    AND type = ${asset_type}
    AND name = ${asset_name}
  `
  
  if (asset.length === 0) {
    asset = await db`
      INSERT INTO public.assets (id, portfolio_id, type, name)
      VALUES (uuid_generate_v4()::TEXT, ${portfolioId}, ${asset_type}, ${asset_name})
      RETURNING id
    `
  }
  
  const assetId = asset[0]?.id
  if (!assetId) {
    throw createError({ status: 500, statusText: 'Failed to create asset' })
  }

  // Check if holding already exists (same instrument + platform)
  const existingHolding = await db`
    SELECT id, total_investment, total_quantity, transaction_count
    FROM public.holdings
    WHERE asset_id = ${assetId} 
      AND platform = ${platform}
      AND instrument_name = ${instrument_name}
  `
  
  let holdingId: string
  let isNewHolding = false
  
  if (existingHolding.length > 0 && existingHolding[0]) {
    // Holding exists → Update totals
    holdingId = existingHolding[0].id
    
    await db`
      UPDATE public.holdings
      SET 
        total_investment = total_investment + ${amount},
        total_quantity = total_quantity + ${quantity},
        transaction_count = transaction_count + 1,
        last_updated = NOW()
      WHERE id = ${holdingId}
    `
  } else {
    // New holding → Create with initial values
    isNewHolding = true
    const newHolding = await db`
      INSERT INTO public.holdings (
        id, asset_id, platform, instrument_name, 
        total_investment, total_quantity, transaction_count
      )
      VALUES (
        uuid_generate_v4()::TEXT, ${assetId}, ${platform}, ${instrument_name},
        ${amount}, ${quantity}, 1
      )
      RETURNING id
    `
    if (!newHolding[0]?.id) {
      throw createError({ status: 500, statusText: 'Failed to create holding' })
    }
    holdingId = newHolding[0].id
  }

  // Create transaction record
  const transaction = await db`
    INSERT INTO public.holding_transactions (
      id, holding_id, transaction_type, amount, quantity,
      average_price, purchase_date, notes, linked_allocation_id
    )
    VALUES (
      uuid_generate_v4()::TEXT, ${holdingId}, 'buy', ${amount}, ${quantity},
      ${average_price || null}, ${purchase_date || null}, 
      ${notes || null}, ${linked_allocation_id || null}
    )
    RETURNING id, created_at
  `

  // Update budget sources if linked to allocation
  if (linked_allocation_id) {
    // Get allocation items (pocket breakdown)
    const allocationItems = await db`
      SELECT pocket_id, pocket_name, pocket_percentage, amount as pocket_amount
      FROM public.allocation_items
      WHERE allocation_id = ${linked_allocation_id}
    `
    
    // Batch upsert budget sources (more efficient than loop)
    if (allocationItems.length > 0) {
      const values = allocationItems.map(item => 
        `(uuid_generate_v4()::TEXT, '${holdingId}', '${item.pocket_id}', '${item.pocket_name}', ${item.pocket_percentage}, ${item.pocket_amount}, 1)`
      ).join(',')
      
      await db.unsafe(`
        INSERT INTO public.holding_budget_sources (
          id, holding_id, pocket_id, pocket_name,
          accumulated_percentage, accumulated_amount, transaction_count
        )
        VALUES ${values}
        ON CONFLICT (holding_id, pocket_id)
        DO UPDATE SET
          accumulated_percentage = holding_budget_sources.accumulated_percentage + EXCLUDED.accumulated_percentage,
          accumulated_amount = holding_budget_sources.accumulated_amount + EXCLUDED.accumulated_amount,
          transaction_count = holding_budget_sources.transaction_count + 1,
          last_updated = NOW()
      `)
    }
  }

  // Return updated holding with asset info
  const updatedHolding = await db`
    SELECT 
      h.id, h.asset_id, h.platform, h.instrument_name,
      h.total_investment, h.total_quantity, h.transaction_count,
      h.last_updated, h.created_at
    FROM public.holdings h
    WHERE h.id = ${holdingId}
  `
  
  if (!updatedHolding[0] || !transaction[0]) {
    throw createError({ status: 500, statusText: 'Failed to create/update holding' })
  }
  
  return {
    ...updatedHolding[0],
    asset_type,
    asset_name,
    transaction_id: transaction[0].id,
    is_merged: !isNewHolding // true if this was added to existing holding
  }
})
