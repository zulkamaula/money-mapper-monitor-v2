import type { Allocation } from '~/types/models'

export const useAllocations = () => {
  const { selectedBook } = useMoneyBooks()
  const { pockets } = usePockets()
  
  // Global state - shared across components
  const allocations = useState<Allocation[]>('allocations', () => [])
  const loading = useState<boolean>('allocations-loading', () => false)
  
  // Simple per-book cache
  const cache = useState<Map<string, Allocation[]>>('allocations-cache', () => new Map())
  
  // AbortController for request cancellation
  let abortController: AbortController | null = null

  // Load allocations for current selected book
  async function loadAllocations() {
    if (!selectedBook.value) {
      allocations.value = []
      return
    }

    const bookId = selectedBook.value.id
    
    // Check cache first
    const cached = cache.value.get(bookId)
    if (cached) {
      allocations.value = cached
      return
    }

    // Cancel previous request if still pending
    if (abortController) {
      abortController.abort()
    }
    
    // Create new controller for this request
    const currentController = new AbortController()
    abortController = currentController

    loading.value = true
    try {
      const data = await $fetch<Allocation[]>(`/api/allocations?money_book_id=${bookId}`, {
        signal: currentController.signal
      })
      
      // Only update if this controller wasn't aborted
      if (abortController === currentController) {
        allocations.value = data
        cache.value.set(bookId, data)
      }
    } catch (error: any) {
      // Silently ignore abort errors (expected during fast switching)
      if (error.name === 'AbortError' || error.cause?.name === 'AbortError') {
        return
      }
      console.error('Failed to load allocations:', error)
      throw error
    } finally {
      if (abortController === currentController) {
        loading.value = false
        abortController = null
      }
    }
  }

  // Create allocation
  async function createAllocation(sourceAmount: number, date: string, notes: string) {
    if (!selectedBook.value) return null

    try {
      const newAllocation = await $fetch<Allocation>('/api/allocations', {
        method: 'POST',
        body: {
          money_book_id: selectedBook.value.id,
          source_amount: sourceAmount,
          date,
          notes,
          pockets: pockets.value.map(p => ({
            id: p.id,
            name: p.name,
            percentage: p.percentage
          }))
        }
      })

      allocations.value.unshift(newAllocation)
      
      // Update cache
      if (selectedBook.value) {
        cache.value.set(selectedBook.value.id, [...allocations.value])
      }
      
      return newAllocation
    } catch (error) {
      console.error('Failed to create allocation:', error)
      throw error
    }
  }

  // Delete allocation
  async function deleteAllocation(allocationId: string) {
    try {
      await $fetch(`/api/allocations/${allocationId}`, {
        method: 'DELETE' as any
      })

      allocations.value = allocations.value.filter(a => a.id !== allocationId)
      
      // Update cache
      if (selectedBook.value) {
        cache.value.set(selectedBook.value.id, [...allocations.value])
      }
      
      // Note: Component should handle cross-concern updates (holdings refresh)
      // Composables should focus on single responsibility
      
      return true
    } catch (error) {
      console.error('Failed to delete allocation:', error)
      throw error
    }
  }

  return {
    allocations,
    loading,
    loadAllocations,
    createAllocation,
    deleteAllocation
  }
}
