import type { Pocket } from '~/types/models'

export const usePockets = () => {
  const { getToken } = useAuth()
  const { selectedBook } = useMoneyBooks()
  
  // Global state - shared across components
  const pockets = useState<Pocket[]>('pockets', () => [])
  const loading = useState<boolean>('pockets-loading', () => false)

  // Load pockets for current selected book
  async function loadPockets() {
    if (!selectedBook.value) {
      pockets.value = []
      return
    }

    loading.value = true
    try {
      const token = await getToken.value()
      if (!token) return

      const data = await $fetch<Pocket[]>(`/api/pockets?money_book_id=${selectedBook.value.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      pockets.value = data
    } catch (error) {
      console.error('Failed to load pockets:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Create pocket
  async function createPocket(name: string, percentage: number) {
    if (!selectedBook.value) return null

    try {
      const token = await getToken.value()
      if (!token) return null

      const newPocket = await $fetch<Pocket>('/api/pockets', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: {
          money_book_id: selectedBook.value.id,
          name,
          percentage,
          order_index: pockets.value.length
        }
      })

      pockets.value.push(newPocket)
      return newPocket
    } catch (error) {
      console.error('Failed to create pocket:', error)
      throw error
    }
  }

  // Update pocket
  async function updatePocket(pocketId: string, name: string, percentage: number) {
    try {
      const token = await getToken.value()
      if (!token) return null

      const updatedPocket = await $fetch<Pocket>(`/api/pockets/${pocketId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: { name, percentage }
      })

      const index = pockets.value.findIndex(p => p.id === pocketId)
      if (index !== -1) {
        pockets.value[index] = updatedPocket
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
      const token = await getToken.value()
      if (!token) return false

      await $fetch(`/api/pockets/${pocketId}`, {
        method: 'DELETE' as any,
        headers: { 'Authorization': `Bearer ${token}` }
      })

      pockets.value = pockets.value.filter(p => p.id !== pocketId)
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
