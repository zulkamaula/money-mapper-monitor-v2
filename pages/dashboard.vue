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
    console.log('Book created:', newBook.name)
  } catch (error) {
    console.error('Failed to create book:', error)
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
    console.log('Book updated:', updatedBook.name)
  } catch (error) {
    console.error('Failed to update book:', error)
  }
}

async function handleDeleteBook(book: MoneyBook) {
  if (!confirm(`Delete "${book.name}"? This will also delete all pockets and allocations.`)) return

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
    console.log('Book deleted:', book.name)
  } catch (error) {
    console.error('Failed to delete book:', error)
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
    console.log('Pocket created:', newPocket.name)
  } catch (error) {
    console.error('Failed to create pocket:', error)
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
    console.log('Pocket updated:', updatedPocket.name)
  } catch (error) {
    console.error('Failed to update pocket:', error)
  }
}

async function handleDeletePocket(pocketId: string) {
  const pocket = pockets.value.find(p => p.id === pocketId)
  if (!pocket) return
  if (!confirm(`Delete pocket "${pocket.name}"?`)) return

  try {
    const token = await getToken.value()
    if (!token) return

    await $fetch(`/api/pockets/${pocketId}`, {
      method: 'DELETE' as any,
      headers: { 'Authorization': `Bearer ${token}` }
    })

    pockets.value = pockets.value.filter(p => p.id !== pocketId)
    console.log('Pocket deleted:', pocket.name)
  } catch (error) {
    console.error('Failed to delete pocket:', error)
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
    console.log('Allocation created:', newAllocation.id)
  } catch (error) {
    console.error('Failed to create allocation:', error)
  }
}

async function handleDeleteAllocation(id: string) {
  if (!confirm('Delete this allocation?')) return

  try {
    const token = await getToken.value()
    if (!token) return

    await $fetch(`/api/allocations/${id}`, {
      method: 'DELETE' as any,
      headers: { 'Authorization': `Bearer ${token}` }
    })

    allocations.value = allocations.value.filter(a => a.id !== id)
    console.log('Allocation deleted')
  } catch (error) {
    console.error('Failed to delete allocation:', error)
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
