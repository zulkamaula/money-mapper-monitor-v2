import type { Pocket } from '~/types/models'

export const usePockets = () => {
  const { selectedBook } = useMoneyBooks()
  
  // Global state - shared across components
  const pockets = useState<Pocket[]>('pockets', () => [])
  const loading = useState<boolean>('pockets-loading', () => false)
  
  // Simple per-book cache
  const cache = useState<Map<string, Pocket[]>>('pockets-cache', () => new Map())
  
  // AbortController for request cancellation
  let abortController: AbortController | null = null

  // Load pockets for current selected book
  async function loadPockets() {
    if (!selectedBook.value) {
      pockets.value = []
      return
    }

    const bookId = selectedBook.value.id
    
    // Check cache first
    const cached = cache.value.get(bookId)
    if (cached) {
      pockets.value = cached
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
      const data = await $fetch<Pocket[]>(`/api/pockets?money_book_id=${bookId}`, {
        signal: currentController.signal
      })
      
      // Only update if this controller wasn't aborted
      if (abortController === currentController) {
        pockets.value = data
        cache.value.set(bookId, data)
      }
    } catch (error: any) {
      // Silently ignore abort errors (expected during fast switching)
      if (error.name === 'AbortError' || error.cause?.name === 'AbortError') {
        return
      }
      console.error('Failed to load pockets:', error)
      throw error
    } finally {
      if (abortController === currentController) {
        loading.value = false
        abortController = null
      }
    }
  }

  // Create pocket
  async function createPocket(name: string, percentage: number) {
    if (!selectedBook.value) return null

    try {
      const newPocket = await $fetch<Pocket>('/api/pockets', {
        method: 'POST',
        body: {
          money_book_id: selectedBook.value.id,
          name,
          percentage,
          order_index: pockets.value.length
        }
      })

      pockets.value.push(newPocket)
      
      // Update cache
      if (selectedBook.value) {
        cache.value.set(selectedBook.value.id, [...pockets.value])
      }
      
      return newPocket
    } catch (error) {
      console.error('Failed to create pocket:', error)
      throw error
    }
  }

  // Update pocket
  async function updatePocket(pocketId: string, name: string, percentage: number) {
    try {
      const updatedPocket = await $fetch<Pocket>(`/api/pockets/${pocketId}`, {
        method: 'PATCH',
        body: { name, percentage }
      })

      const index = pockets.value.findIndex(p => p.id === pocketId)
      if (index !== -1) {
        pockets.value[index] = updatedPocket
      }
      
      // Update cache
      if (selectedBook.value) {
        cache.value.set(selectedBook.value.id, [...pockets.value])
      }
      
      return updatedPocket
    } catch (error) {
      console.error('Failed to update pocket:', error)
      throw error
    }
  }

  // Delete pocket
  async function deletePocket(pocketId: string) {
    try {
      await $fetch(`/api/pockets/${pocketId}`, {
        method: 'DELETE' as any
      })

      pockets.value = pockets.value.filter(p => p.id !== pocketId)
      
      // Update cache
      if (selectedBook.value) {
        cache.value.set(selectedBook.value.id, [...pockets.value])
      }
      
      return true
    } catch (error) {
      console.error('Failed to delete pocket:', error)
      throw error
    }
  }

  return {
    pockets,
    loading,
    loadPockets,
    createPocket,
    updatePocket,
    deletePocket
  }
}
