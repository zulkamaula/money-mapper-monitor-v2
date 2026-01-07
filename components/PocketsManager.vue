<script setup lang="ts">
import type { Pocket } from '~/types/models'
import { formatPercentage } from '~/utils/format'

// Self-contained - use composables
const { selectedBook } = useMoneyBooks()
const { pockets, loading, loadPockets, createPocket, updatePocket, deletePocket } = usePockets()
const { success: showSuccess, error: showError } = useNotification()
const { showDialog: showConfirmDialog } = useConfirmDialog()

// Initialize on mount
onMounted(async () => {
  if (selectedBook.value) {
    await loadPockets()
  }
})

// Reload when selected book changes
watch(() => selectedBook.value, async (newBook) => {
  if (newBook) {
    await loadPockets()
  }
}, { immediate: true })

const showDialog = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const editingPocketId = ref<string | null>(null)
const pocketData = ref({ name: '', percentage: 0 })
const isExpanded = ref(false)
const submitting = ref(false)

const totalPercentage = computed(() => {
  return pockets.value.reduce((sum, p) => {
    const percentage = typeof p.percentage === 'string' ? parseFloat(p.percentage) : p.percentage
    return sum + percentage
  }, 0)
})

const percentageColor = computed(() => {
  const total = totalPercentage.value
  if (Math.abs(total - 100) < 0.01) return 'success'
  if (total < 100) return 'warning'
  return 'error'
})

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

const canAddPocket = computed(() => {
  // For edit mode, exclude the current pocket's percentage
  const currentTotal = dialogMode.value === 'edit' && editingPocketId.value
    ? (() => {
        const pocket = pockets.value.find(p => p.id === editingPocketId.value)
        const pocketPercentage = pocket ? (typeof pocket.percentage === 'string' ? parseFloat(pocket.percentage) : pocket.percentage) : 0
        return totalPercentage.value - pocketPercentage
      })()
    : totalPercentage.value
  const wouldBeTotal = currentTotal + pocketData.value.percentage
  return wouldBeTotal <= 100.01
})

const remainingPercentage = computed(() => {
  const currentTotal = dialogMode.value === 'edit' && editingPocketId.value
    ? (() => {
        const pocket = pockets.value.find(p => p.id === editingPocketId.value)
        const pocketPercentage = pocket ? (typeof pocket.percentage === 'string' ? parseFloat(pocket.percentage) : pocket.percentage) : 0
        return totalPercentage.value - pocketPercentage
      })()
    : totalPercentage.value
  return 100 - currentTotal - (pocketData.value.percentage || 0)
})

function openDialog() {
  dialogMode.value = 'create'
  editingPocketId.value = null
  pocketData.value = { name: '', percentage: 0 }
  showDialog.value = true
}

function openEditDialog(pocket: Pocket) {
  dialogMode.value = 'edit'
  editingPocketId.value = pocket.id
  pocketData.value = { 
    name: pocket.name, 
    percentage: typeof pocket.percentage === 'string' ? parseFloat(pocket.percentage) : pocket.percentage 
  }
  showDialog.value = true
}

async function handleSubmit() {
  if (!pocketData.value.name.trim() || pocketData.value.percentage <= 0 || !canAddPocket.value) {
    return
  }

  submitting.value = true
  try {
    if (dialogMode.value === 'create') {
      await createPocket(pocketData.value.name, pocketData.value.percentage)
      showSuccess(`"${pocketData.value.name}" created successfully`)
    } else if (editingPocketId.value) {
      await updatePocket(editingPocketId.value, pocketData.value.name, pocketData.value.percentage)
      showSuccess(`"${pocketData.value.name}" updated successfully`)
    }

    showDialog.value = false
    pocketData.value = { name: '', percentage: 0 }
    editingPocketId.value = null
  } catch (error) {
    showError(dialogMode.value === 'create' ? 'Failed to create pocket' : 'Failed to update pocket')
  } finally {
    submitting.value = false
  }
}

async function handleDelete(pocketId: string) {
  const pocket = pockets.value.find(p => p.id === pocketId)
  if (!pocket) return

  await showConfirmDialog({
    title: 'Delete Pocket?',
    message: `Are you sure you want to delete "${pocket.name}"?`,
    icon: 'mdi-delete-alert',
    iconColor: 'error',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    confirmColor: 'error',
    onConfirm: async () => {
      await deletePocket(pocketId)
      showSuccess(`"${pocket.name}" deleted successfully`)
    }
  })
}
</script>

<template>
  <VCard class="pockets-card" elevation="0">
    <VCardTitle class="card-header pa-5" @click="toggleExpand">
      <div class="header-content">
        <div class="title-section">
          <div class="d-flex align-center text-body-1 text-sm-h6 text-primary">
            <VIcon icon="mdi-wallet-outline" class="mr-2" color="primary" />
            Pockets
          </div>
          <!-- Mobile: Stats below title -->
          <div class="subtitle-stats d-md-none mt-1">
            {{ pockets.length }} pockets
            <VChip :color="percentageColor" size="x-small" variant="flat" class="percentage-chip">
              {{ formatPercentage(totalPercentage) }}
            </VChip>
          </div>
        </div>
        <!-- Desktop: Stats on right -->
        <div class="subtitle-stats-desktop d-none d-md-flex">
          {{ pockets.length }} pockets
          <VChip :color="percentageColor" size="x-small" variant="flat" class="percentage-chip ml-2">
            {{ formatPercentage(totalPercentage) }}
          </VChip>
        </div>
        <!-- Mobile: Toggle button -->
        <VBtn class="d-md-none" :icon="isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'" size="small"
          variant="text" />
      </div>
    </VCardTitle>

    <VDivider />

    <!-- Shared Content: Desktop always visible, Mobile collapsible -->
    <Transition name="expand">
      <VCardText v-show="isExpanded" class="px-6 pb-6 pt-0 pockets-content">
        <!-- Add New Button - Sticky -->
        <div class="add-button-sticky" v-if="Number(totalPercentage) !== 100">
          <VBtn v-if="pockets.length > 0" color="primary" variant="flat" rounded="pill" block class="text-none"
            @click="openDialog">
            <VIcon icon="mdi-plus" start />
            Add New Pocket
          </VBtn>
        </div>

        <div v-if="loading" class="py-4">
          <VSkeletonLoader type="list-item" v-for="i in 3" :key="i" class="mb-2" />
        </div>
        <div v-else-if="pockets.length === 0" class="empty-state text-center py-8">
          <VIcon icon="mdi-wallet-outline" size="48" color="grey-lighten-1" class="mb-3" />
          <div class="text-grey-darken-1">
            No pockets yet.
            <VBtn color="primary" variant="flat" rounded="pill" size="small" class="text-none" @click="openDialog">
              Create your first pocket!
            </VBtn>
          </div>
        </div>
        <VList v-else class="pocket-list">
          <VListItem v-for="pocket in pockets" :key="pocket.id" class="pocket-item mb-3">
            <VListItemTitle class="d-flex align-center justify-space-between">
              <div class="pocket-actions">
                <VChip color="primary" size="x-small" variant="flat">
                {{ formatPercentage(pocket.percentage) }}
                </VChip>
                <span class="pocket-name text-wrap w-100 w-sm-auto">{{ pocket.name }}</span>
              </div>
              <VMenu location="bottom end" :offset="[-8, -12]" scroll-strategy="close">
                <template v-slot:activator="{ props }">
                  <VBtn icon="mdi-dots-vertical" size="small" variant="text" v-bind="props" />
                </template>
                <VList density="comfortable" style="min-width: 120px;">
                  <VListItem @click="openEditDialog(pocket)">
                    <VListItemTitle>Edit</VListItemTitle>
                  </VListItem>
                  <VDivider />
                  <VListItem @click="handleDelete(pocket.id)">
                    <VListItemTitle class="text-error font-weight-bold">
                      Delete
                    </VListItemTitle>
                  </VListItem>
                </VList>
              </VMenu>
            </VListItemTitle>
          </VListItem>
        </VList>
      </VCardText>
    </Transition>

    <!-- Pocket Dialog (Create/Edit) -->
    <VDialog v-model="showDialog" max-width="500">
      <VCard>
        <VCardTitle class="pa-5 text-subtitle-1 font-weight-semibold text-primary">
          <VIcon :icon="dialogMode === 'create' ? 'mdi-wallet-plus' : 'mdi-pencil'" class="mr-2" />
          {{ dialogMode === 'create' ? 'Add New Pocket' : 'Edit Pocket' }}
        </VCardTitle>

        <VDivider />

        <VCardText class="pa-5 overflow-auto">
          <VTextField v-model="pocketData.name" label="Pocket Name" variant="outlined" class="mb-4" autofocus />
          <VTextField v-model.number="pocketData.percentage" label="Percentage" type="number" variant="outlined"
            suffix="%" :hint="`Remaining: ${formatPercentage(remainingPercentage)}`" persistent-hint />

          <div v-if="!canAddPocket && pocketData.percentage > 0" class="text-error text-caption mt-2">
            Exceeds limit! Remaining after this: {{ formatPercentage(remainingPercentage) }}
          </div>
        </VCardText>

        <VDivider />

        <VCardActions class="pa-4 flex-column-reverse flex-sm-row ga-2">
          <VSpacer />
          <VBtn color="grey" variant="text" class="text-none" @click="showDialog = false">Cancel</VBtn>
          <VBtn color="primary" variant="flat" class="px-5 text-none" @click="handleSubmit"
            :disabled="!pocketData.name.trim() || pocketData.percentage <= 0 || !canAddPocket || submitting"
            :loading="submitting">
            {{ dialogMode === 'create' ? 'Add Pocket' : 'Save Changes' }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VCard>
</template>

<style scoped>
.pockets-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(15, 118, 110, 0.1);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.card-header {
  user-select: none;
  padding: 20px;
  padding-bottom: 16px;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.title-section {
  flex: 1;
}

.pockets-content {
  flex: 1;
  overflow-y: auto;
  position: relative;
}

.add-button-sticky {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  padding-bottom: 8px;
  margin: -16px -12px 12px -12px;
  padding: 16px 12px 12px 12px;
  border-bottom-left-radius: 35px;
  border-bottom-right-radius: 35px;
}

/* Mobile: Collapsible content with max-height and smaller text */
@media (max-width: 959px) {
  .pockets-content {
    transition: all 0.3s ease;
    max-height: 400px;
    font-size: 0.875rem;
  }

  .pocket-name {
    font-size: 0.875rem;
  }

  .pocket-item {
    padding: 8px 12px !important;
  }
}

/* Desktop: Always show content with fixed height for scrolling */
@media (min-width: 960px) {
  .pockets-content {
    display: block !important;
    opacity: 1 !important;
    max-height: 400px;
  }
}

.pockets-content::-webkit-scrollbar {
  width: 6px;
}

.pockets-content::-webkit-scrollbar-track {
  background: rgba(15, 118, 110, 0.05);
  border-radius: 3px;
}

.pockets-content::-webkit-scrollbar-thumb {
  background: rgba(15, 118, 110, 0.2);
  border-radius: 3px;
}

.pockets-content::-webkit-scrollbar-thumb:hover {
  background: rgba(15, 118, 110, 0.3);
}

.pocket-list {
  background: transparent !important;
  margin-top: 20px;
}

.pocket-item {
  background: rgba(15, 118, 110, 0.05);
  border-radius: 12px !important;
  padding: 12px 16px;
  border: 1px solid rgba(15, 118, 110, 0.1);
  transition: all 0.2s;
}

.pocket-item:hover {
  background: rgba(15, 118, 110, 0.08);
  border-color: rgba(15, 118, 110, 0.2);
}

.pocket-name {
  font-weight: 500;
  line-height: 20px;
  font-size: 0.9rem;
  color: rgba(15, 118, 110, 0.9);
}

.pocket-actions {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 6px;
}

.empty-state {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.subtitle-stats {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
  font-weight: 400;
  display: flex;
  align-items: center;
  gap: 5px;
}

.subtitle-stats-desktop {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.6);
  font-weight: 400;
  display: flex;
  align-items: center;
}

.percentage-chip {
  font-weight: 400;
}

/* Expand Animation */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 1000px;
}
</style>
