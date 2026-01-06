import type { Allocation } from '~/types/models'

export const useAllocations = () => {
  const { getToken } = useAuth()
  const { selectedBook } = useMoneyBooks()
  const { pockets } = usePockets()
  
  // Global state - shared across components
  const allocations = useState<Allocation[]>('allocations', () => [])
  const loading = useState<boolean>('allocations-loading', () => false)

  // Load allocations for current selected book
  async function loadAllocations() {
    if (!selectedBook.value) {
      allocations.value = []
      return
    }

    loading.value = true
    try {
      const token = await getToken.value()
      if (!token) return

      const data = await $fetch<Allocation[]>(`/api/allocations?money_book_id=${selectedBook.value.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      allocations.value = data
    } catch (error) {
      console.error('Failed to load allocations:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Create allocation
  async function createAllocation(sourceAmount: number, date: string, notes: string) {
    if (!selectedBook.value) return null

    try {
      const token = await getToken.value()
      if (!token) return null

      const newAllocation = await $fetch<Allocation>('/api/allocations', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
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
      return newAllocation
    } catch (error) {
      console.error('Failed to create allocation:', error)
      throw error
    }
  }

  // Delete allocation
  async function deleteAllocation(allocationId: string) {
    try {
      const token = await getToken.value()
      if (!token) return false

      await $fetch(`/api/allocations/${allocationId}`, {
        method: 'DELETE' as any,
        headers: { 'Authorization': `Bearer ${token}` }
      })

      allocations.value = allocations.value.filter(a => a.id !== allocationId)
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
