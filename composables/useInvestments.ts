import type { Holding } from '~/types/models'

export const useInvestments = () => {
  const { success: showSuccess, error: showError } = useNotification()
  const { showDialog } = useConfirmDialog()

  // State
  const holdings = useState<Holding[]>('investment-holdings', () => [])
  const loading = useState('investment-loading', () => false)
  
  // Simulation state (not persisted to database)
  const simulationResult = useState<{
    totalInitial: number
    totalCurrent: number
    totalProfit: number
    profitPercentage: number
    timestamp: number
  } | null>('simulation-result', () => null)

  // Per-book cache for high performance
  const cache = useState<Map<string, Holding[]>>('holdings-cache', () => new Map())

  // AbortController for cancellable requests
  let abortController: AbortController | null = null

  // Computed totals
  const totalInvested = computed(() => {
    if (!holdings.value || holdings.value.length === 0) return 0
    return holdings.value.reduce((sum, h) => {
      const value = Number(h.initial_investment) || 0
      return sum + value
    }, 0)
  })

  // Note: current_value, totalProfit, profitPercentage are now calculated in Simulate dialog
  // Holdings only track initial_investment and quantity

  // Map asset types to display names
  const assetTypeNames: Record<string, string> = {
    gold: 'Emas',
    stock: 'Saham',
    etf: 'ETF',
    mutual_fund: 'Reksadana',
    bond: 'Obligasi',
    crypto: 'Crypto',
    other: 'Lainnya'
  }

  // Group holdings by asset_type
  const holdingsByAsset = computed(() => {
    const grouped: Record<string, { name: string; holdings: Holding[] }> = {}
    
    holdings.value.forEach(holding => {
      const assetType = (holding as any).asset_type
      if (!grouped[assetType]) {
        grouped[assetType] = {
          name: assetTypeNames[assetType] || 'Unknown',
          holdings: []
        }
      }
      grouped[assetType].holdings.push(holding)
    })
    
    return grouped
  })

  // Asset allocation data for chart (based on initial_investment)
  const assetAllocationData = computed(() => {
    const allocation: Record<string, { name: string; value: number }> = {}
    
    holdings.value.forEach(holding => {
      const type = (holding as any).asset_type
      
      if (!allocation[type]) {
        allocation[type] = { 
          name: assetTypeNames[type] || 'Unknown', 
          value: 0 
        }
      }
      // Ensure initial_investment is a number to avoid NaN
      const investment = Number(holding.initial_investment) || 0
      allocation[type].value += investment
    })
    
    return allocation
  })

  // Load portfolio and holdings
  async function loadInvestments(bookId: string) {
    // Check cache first - avoid API call if data exists
    const cached = cache.value.get(bookId)
    if (cached) {
      holdings.value = cached
      return // ✅ High performance: no API call
    }

    // Cancel previous request if exists
    if (abortController) {
      abortController.abort()
    }
    
    const currentController = new AbortController()
    abortController = currentController

    loading.value = true
    try {
      // Load holdings (portfolio table exists but not currently used in UI)
      const holdingsData = await $fetch<Holding[]>(`/api/holdings?money_book_id=${bookId}`, {
        signal: currentController.signal
      })
      
      // Only update if this controller wasn't aborted
      if (abortController === currentController) {
        holdings.value = holdingsData
        cache.value.set(bookId, holdingsData) // ✅ Cache for next switch
      }
    } catch (error: any) {
      if (error.cause?.name === 'AbortError' || error.name === 'AbortError') {
        return
      }
      console.error('Failed to load investments:', error)
      showError('Failed to load investments')
    } finally {
      if (abortController === currentController) {
        abortController = null
        loading.value = false
      }
    }
  }

  // Create new holding
  async function createHolding(data: {
    asset_type: 'gold' | 'stock' | 'etf' | 'mutual_fund' | 'bond' | 'crypto' | 'other'
    asset_name: string
    platform: string
    instrument_name: string
    initial_investment: number
    average_price: number
    purchase_date?: string
    notes?: string
    linked_allocation_id?: string
  }) {
    const { selectedBook } = useMoneyBooks()
    if (!selectedBook.value?.id) {
      showError('No money book selected')
      return
    }

    const bookId = selectedBook.value.id

    try {
      const newHolding = await $fetch<Holding>('/api/holdings', {
        method: 'POST',
        body: {
          money_book_id: bookId,
          ...data
        }
      })

      // Add asset info for display (from API response)
      holdings.value.unshift(newHolding)
      
      // Update cache
      cache.value.set(bookId, [...holdings.value])
      
      return newHolding
    } catch (error) {
      console.error('Failed to create holding:', error)
      showError('Failed to create holding')
      throw error
    }
  }

  // Update holding - update all mutable financial fields
  async function updateHolding(holdingId: string, data: {
    initial_investment?: number
    average_price?: number
    purchase_date?: string
    notes?: string
  }) {
    try {
      const updated = await $fetch<Holding>(`/api/holdings/${holdingId}`, {
        method: 'PATCH',
        body: data
      })

      const index = holdings.value.findIndex(h => h.id === holdingId)
      if (index !== -1) {
        holdings.value[index] = updated
      }
      
      // Update cache
      const { selectedBook } = useMoneyBooks()
      if (selectedBook.value?.id) {
        cache.value.set(selectedBook.value.id, [...holdings.value])
      }

      return updated
    } catch (error) {
      console.error('Failed to update holding:', error)
      showError('Failed to update holding')
      throw error
    }
  }

  // Delete holding
  async function deleteHolding(holdingId: string) {
    try {
      await $fetch(`/api/holdings/${holdingId}`, {
        method: 'DELETE' as any
      })

      holdings.value = holdings.value.filter(h => h.id !== holdingId)
      
      // Update cache
      const { selectedBook } = useMoneyBooks()
      if (selectedBook.value?.id) {
        cache.value.set(selectedBook.value.id, [...holdings.value])
      }
    } catch (error) {
      console.error('Failed to delete holding:', error)
      showError('Failed to delete holding')
      throw error
    }
  }

  // Handle delete with confirmation
  async function handleDeleteHolding(holding: Holding) {
    await showDialog({
      title: 'Delete Investment Holding?',
      message: `Are you sure you want to delete "${holding.instrument_name}" from ${holding.platform}?`,
      icon: 'mdi-delete-alert',
      iconColor: 'error',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmColor: 'error',
      onConfirm: async () => {
        await deleteHolding(holding.id)
        showSuccess('Holding deleted successfully')
      }
    })
  }

  // NOTE: Watcher moved to plugins/investments.client.ts to prevent duplication
  // Each component calling useInvestments() was creating duplicate watchers

  // Save simulation result
  function saveSimulationResult(data: {
    totalInitial: number
    totalCurrent: number
    totalProfit: number
    profitPercentage: number
  }) {
    simulationResult.value = {
      ...data,
      timestamp: Date.now()
    }
  }

  // Clear simulation result
  function clearSimulationResult() {
    simulationResult.value = null
  }

  // Clear cache for a specific book (force fresh fetch)
  function clearCache(bookId: string) {
    cache.value.delete(bookId)
  }

  return {
    // State
    holdings,
    loading,
    simulationResult,

    // Computed
    totalInvested,
    holdingsByAsset,
    assetAllocationData,

    // Methods
    loadInvestments,
    createHolding,
    updateHolding,
    deleteHolding,
    handleDeleteHolding,
    saveSimulationResult,
    clearSimulationResult,
    clearCache
  }
}
