<script setup lang="ts">
import { ref, watch } from 'vue'
import { useUser, useAuth } from '@clerk/vue'
import type { MoneyBook, Pocket, Allocation } from '~/types/models'

definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

const { user } = useUser()
const { getToken } = useAuth()

// State
const moneyBooks = ref<MoneyBook[]>([])
const selectedBook = ref<MoneyBook | null>(null)
const pockets = ref<Pocket[]>([])
const allocations = ref<Allocation[]>([])

// Loading states
const loading = ref(false)
const loadingPockets = ref(false)
const loadingAllocations = ref(false)
const creatingBook = ref(false)

// Dialog state
const showAllocationDialog = ref(false)

// Use modular notification system
const { success: showSuccess, error: showError } = useNotification()

// Watch for user authentication - reactive approach
watch(
  () => user.value,
  (newUser) => {
    if (newUser) {
      console.log('User authenticated, loading dashboard')
      initDashboard()
    }
  },
  { immediate: true }
)

// Functions
async function initDashboard() {
  if (!user.value) {
    console.warn('No authenticated user found')
    return
  }

  console.log('Loading dashboard for user')
  loading.value = true
  try {
    await loadMoneyBooks()
  } catch (error) {
    console.error('Failed to load dashboard:', error)
  } finally {
    loading.value = false
  }
}

async function loadMoneyBooks() {
  if (!user.value) return

  try {
    const token = await getToken.value()
    if (!token) return

    const books = await $fetch<MoneyBook[]>('/api/money-books', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    moneyBooks.value = books
    console.log('Loaded money books:', books.length)

    if (books.length > 0 && !selectedBook.value) {
      const firstBook = books[0]
      if (firstBook) {
        await selectBook(firstBook)
      }
    }
  } catch (error) {
    console.error('Error loading money books:', error)
  }
}

async function selectBook(book: MoneyBook) {
  if (selectedBook.value?.id === book.id) return
  selectedBook.value = book
  await Promise.all([loadPockets(), loadAllocations()])
}

async function loadPockets() {
  if (!selectedBook.value) return
  loadingPockets.value = true
  try {
    const token = await getToken.value()
    if (!token) return

    const data = await $fetch<Pocket[]>(`/api/pockets?money_book_id=${selectedBook.value.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    pockets.value = data
  } catch (error) {
    console.error('Failed to load pockets:', error)
  } finally {
    loadingPockets.value = false
  }
}

async function loadAllocations() {
  if (!selectedBook.value) return
  loadingAllocations.value = true
  try {
    const token = await getToken.value()
    if (!token) return

    const data = await $fetch<Allocation[]>(`/api/allocations?money_book_id=${selectedBook.value.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    allocations.value = data
  } catch (error) {
    console.error('Failed to load allocations:', error)
  } finally {
    loadingAllocations.value = false
  }
}

// Money Book Handlers
async function handleCreateBook(name: string) {
  creatingBook.value = true
  try {
    const token = await getToken.value()
    if (!token) return

    const newBook = await $fetch<MoneyBook>('/api/money-books', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: { name }
    })

    moneyBooks.value.unshift(newBook)
    await selectBook(newBook)
    showSuccess(`"${newBook.name}" created successfully`)
  } catch (error) {
    console.error('Failed to create book:', error)
    showError('Failed to create money book')
  } finally {
    creatingBook.value = false
  }
}

async function handleUpdateBook(book: MoneyBook, name: string) {
  try {
    const token = await getToken.value()
    if (!token) return

    const updatedBook = await $fetch<MoneyBook>(`/api/money-books/${book.id}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` },
      body: { name }
    })

    const index = moneyBooks.value.findIndex(b => b.id === book.id)
    if (index !== -1) {
      moneyBooks.value[index] = updatedBook
      if (selectedBook.value?.id === book.id) {
        selectedBook.value = updatedBook
      }
    }
    showSuccess(`"${updatedBook.name}" updated successfully`)
  } catch (error) {
    console.error('Failed to update book:', error)
    showError('Failed to update money book')
  }
}

async function handleReorderBooks(reorderedBooks: MoneyBook[]) {
  try {
    const token = await getToken.value()
    if (!token) return

    // Update local state immediately for smooth UX
    moneyBooks.value = reorderedBooks

    // Send new order to server
    const bookIds = reorderedBooks.map(b => b.id)
    await $fetch('/api/money-books/reorder', {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` },
      body: { bookIds }
    })

    showSuccess('Book order updated successfully')
  } catch (error) {
    console.error('Failed to reorder books:', error)
    showError('Failed to reorder books')
    // Reload books to restore correct order
    await loadMoneyBooks()
  }
}

async function handleDeleteBook(book: MoneyBook) {
  const { showDialog } = useConfirmDialog()
  
  const confirmed = await showDialog({
    title: 'Delete Money Book?',
    message: `Are you sure you want to delete "${book.name}"? This will also permanently delete all pockets and allocations inside it.`,
    icon: 'mdi-delete-alert',
    iconColor: 'error',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    confirmColor: 'error'
  })
  
  if (!confirmed) return

  try {
    const token = await getToken.value()
    if (!token) return

    await $fetch(`/api/money-books/${book.id}`, {
      method: 'DELETE' as any,
      headers: { 'Authorization': `Bearer ${token}` }
    })

    moneyBooks.value = moneyBooks.value.filter(b => b.id !== book.id)
    
    if (selectedBook.value?.id === book.id) {
      selectedBook.value = moneyBooks.value[0] || null
      if (selectedBook.value) {
        await Promise.all([loadPockets(), loadAllocations()])
      } else {
        pockets.value = []
        allocations.value = []
      }
    }
    showSuccess(`"${book.name}" deleted successfully`)
  } catch (error) {
    console.error('Failed to delete book:', error)
    showError('Failed to delete money book')
  }
}

// Pocket Handlers
async function handleCreatePocket(pocketData: { name: string; percentage: number }) {
  if (!selectedBook.value) return

  try {
    const token = await getToken.value()
    if (!token) return

    const newPocket = await $fetch<Pocket>('/api/pockets', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: {
        money_book_id: selectedBook.value.id,
        name: pocketData.name,
        percentage: pocketData.percentage,
        order_index: pockets.value.length
      }
    })

    pockets.value.push(newPocket)
    showSuccess(`"${newPocket.name}" created successfully`)
  } catch (error) {
    console.error('Failed to create pocket:', error)
    showError('Failed to create pocket')
  }
}

async function handleUpdatePocket(pocket: Pocket) {
  try {
    const token = await getToken.value()
    if (!token) return

    const updatedPocket = await $fetch<Pocket>(`/api/pockets/${pocket.id}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` },
      body: {
        name: pocket.name,
        percentage: pocket.percentage
      }
    })

    const index = pockets.value.findIndex(p => p.id === pocket.id)
    if (index !== -1) {
      pockets.value[index] = updatedPocket
    }
    showSuccess(`"${updatedPocket.name}" updated successfully`)
  } catch (error) {
    console.error('Failed to update pocket:', error)
    showError('Failed to update pocket')
  }
}

async function handleDeletePocket(pocketId: string) {
  const pocket = pockets.value.find(p => p.id === pocketId)
  if (!pocket) return
  
  const { showDialog } = useConfirmDialog()
  const confirmed = await showDialog({
    title: 'Delete Pocket?',
    message: `Are you sure you want to delete "${pocket.name}"?`,
    icon: 'mdi-delete-alert',
    iconColor: 'error',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    confirmColor: 'error'
  })
  
  if (!confirmed) return

  try {
    const token = await getToken.value()
    if (!token) return

    await $fetch(`/api/pockets/${pocketId}`, {
      method: 'DELETE' as any,
      headers: { 'Authorization': `Bearer ${token}` }
    })

    pockets.value = pockets.value.filter(p => p.id !== pocketId)
    showSuccess(`"${pocket.name}" deleted successfully`)
  } catch (error) {
    console.error('Failed to delete pocket:', error)
    showError('Failed to delete pocket')
  }
}

// Allocation Handlers
function openAllocationDialog() {
  showAllocationDialog.value = true
}

async function handleCreateAllocation(data: { sourceAmount: number; date: string; notes: string }) {
  if (!selectedBook.value) return

  try {
    const token = await getToken.value()
    if (!token) return

    const newAllocation = await $fetch<Allocation>('/api/allocations', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: {
        money_book_id: selectedBook.value.id,
        source_amount: data.sourceAmount,
        date: data.date,
        notes: data.notes,
        pockets: pockets.value.map(p => ({
          id: p.id,
          name: p.name,
          percentage: p.percentage
        }))
      }
    })

    allocations.value.unshift(newAllocation)
    showAllocationDialog.value = false
    showSuccess('Allocation created successfully')
  } catch (error) {
    console.error('Failed to create allocation:', error)
    showError('Failed to create allocation')
  }
}

async function handleDeleteAllocation(id: string) {
  const { showDialog } = useConfirmDialog()
  const confirmed = await showDialog({
    title: 'Delete Allocation?',
    message: 'Are you sure you want to delete this allocation? This action cannot be undone.',
    icon: 'mdi-delete-alert',
    iconColor: 'error',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    confirmColor: 'error'
  })
  
  if (!confirmed) return

  try {
    const token = await getToken.value()
    if (!token) return

    await $fetch(`/api/allocations/${id}`, {
      method: 'DELETE' as any,
      headers: { 'Authorization': `Bearer ${token}` }
    })

    allocations.value = allocations.value.filter(a => a.id !== id)
    showSuccess('Allocation deleted successfully')
  } catch (error) {
    console.error('Failed to delete allocation:', error)
    showError('Failed to delete allocation')
  }
}
</script>

<template>
  <div class="dashboard-main">
    <VContainer fluid class="dashboard-container px-6">
      <!-- Money Book Selector (Lazy loaded) -->
      <VRow class="mb-6" justify="center">
        <VCol cols="12">
          <LazyMoneyBookSelector
            :books="moneyBooks"
            :selected-book="selectedBook"
            :loading="loading"
            :creating-book="creatingBook"
            @select="selectBook"
            @create="handleCreateBook"
            @update="handleUpdateBook"
            @delete="handleDeleteBook"
            @reorder="handleReorderBooks"
          />
        </VCol>
      </VRow>

      <!-- Bottom Row: Pockets + Allocations -->
      <VRow v-if="selectedBook" class="dashboard-content-row">
        <!-- Pockets Manager (Left, Lazy loaded) -->
        <VCol cols="12" sm="12" md="4" class="dashboard-col">
          <LazyPocketsManager
            :pockets="pockets"
            :loading="loadingPockets"
            @create="handleCreatePocket"
            @update="handleUpdatePocket"
            @delete="handleDeletePocket"
          />
        </VCol>

        <!-- Allocations History (Right, Lazy loaded) -->
        <VCol cols="12" sm="12" md="8" class="dashboard-col">
          <LazyAllocationsHistory
            :allocations="allocations"
            :pockets="pockets"
            :loading="loadingAllocations"
            @create="openAllocationDialog"
            @delete="handleDeleteAllocation"
          />
        </VCol>
      </VRow>
    </VContainer>

    <!-- Allocation Dialog (Lazy loaded) -->
    <LazyAllocationDialog
      v-model="showAllocationDialog"
      :pockets="pockets"
      @save="handleCreateAllocation"
    />

    <!-- Modular Components -->
    <AppNotification />
    <ConfirmDialog />
  </div>
</template>

<style scoped>
.dashboard-main {
  background: linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 25%, #80deea 75%, #4dd0e1 100%);
  min-height: 100%;
  padding-top: 30px;
  padding-bottom: 40px;
  overflow-x: hidden;
}

.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
}

.glass-card {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(15, 118, 110, 0.1);
}

/* Hide number input spinners */
:deep(input[type="number"]) {
  -moz-appearance: textfield;
  appearance: textfield;
}

:deep(input[type="number"]::-webkit-outer-spin-button),
:deep(input[type="number"]::-webkit-inner-spin-button) {
  -webkit-appearance: none;
  margin: 0;
}

/* Responsive */
/* Extra small screens - flex column with optimized spacing */
@media (max-width: 599px) {
  .dashboard-main {
    padding-top: 16px;
    padding-bottom: 70px;
  }

  .dashboard-container {
    padding-left: 16px !important;
    padding-right: 16px !important;
  }

  .dashboard-content-row {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .dashboard-col {
    padding-top: 0 !important;
    padding-bottom: 0 !important;
  }
}

/* Small to medium screens */
@media (min-width: 600px) and (max-width: 959px) {
  .dashboard-main {
    padding-top: 20px;
    padding-bottom: 70px;
  }

  .dashboard-content-row {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
}

/* Medium screens and up - default grid layout */
@media (min-width: 960px) {
  .dashboard-content-row {
    display: flex;
    flex-direction: row;
  }
}
</style>
