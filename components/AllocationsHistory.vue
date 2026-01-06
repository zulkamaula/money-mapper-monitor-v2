<script setup lang="ts">
import type { Allocation } from '~/types/models'
import { formatPercentage, formatCurrency, formatDate } from '~/utils/format'

// Self-contained - use composables
const { selectedBook } = useMoneyBooks()
const { pockets } = usePockets()
const { allocations, loading, loadAllocations, deleteAllocation } = useAllocations()
const { success: showSuccess, error: showError } = useNotification()
const { showDialog: showConfirmDialog } = useConfirmDialog()

// Initialize on mount
onMounted(async () => {
  if (selectedBook.value) {
    await loadAllocations()
  }
})

// Reload when selected book changes
watch(() => selectedBook.value, async (newBook) => {
  if (newBook) {
    await loadAllocations()
  }
}, { immediate: true })

const expandedAllocation = ref<string | null>(null)
const copiedAmount = ref<string | null>(null)
const isExpanded = ref(true)

function toggleCardExpand() {
  isExpanded.value = !isExpanded.value
}

const recentAllocations = computed(() => {
  return allocations.value.slice(0, 10)
})

function toggleExpand(id: string) {
  expandedAllocation.value = expandedAllocation.value === id ? null : id
}

async function copyAmount(amount: number, itemId: string) {
  try {
    await navigator.clipboard.writeText(amount.toString())
    copiedAmount.value = itemId
    showSuccess(`Copied: ${formatCurrency(amount)}`)
    setTimeout(() => {
      copiedAmount.value = null
    }, 2000)
  } catch (error) {
    console.error('Failed to copy:', error)
    showError('Failed to copy to clipboard')
  }
}

// Emit create event for parent to handle dialog
const emit = defineEmits<{
  (e: 'create'): void
}>()

function handleCreate() {
  emit('create')
}

async function handleDelete(id: string) {
  const allocation = allocations.value.find(a => a.id === id)
  if (!allocation) return

  const confirmed = await showConfirmDialog({
    title: 'Delete Allocation?',
    message: `Are you sure you want to delete this allocation of ${formatCurrency(allocation.source_amount)}?`,
    icon: 'mdi-delete-alert',
    iconColor: 'error',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    confirmColor: 'error'
  })

  if (!confirmed) return

  try {
    await deleteAllocation(id)
    showSuccess('Allocation deleted successfully')
  } catch (error) {
    showError('Failed to delete allocation')
  }
}
</script>

<template>
  <VCard class="allocations-card" elevation="0">
    <VCardTitle class="card-header pa-5" @click="toggleCardExpand">
      <div class="d-flex align-center justify-space-between w-100">
        <div class="flex-grow-1">
          <div class="d-flex align-center text-wrap text-body-1 text-sm-h6">
            <VIcon icon="mdi-chart-arc" class="mr-2" color="success" />
            Recent Allocations
          </div>
          <!-- Mobile: Stats below title -->
          <div class="subtitle-stats d-md-none mt-1">
            {{ allocations.length }} allocations
          </div>
        </div>
        <!-- Desktop: Stats on right -->
        <div class="subtitle-stats-desktop d-none d-md-flex">
          {{ allocations.length }} allocations
        </div>
        <!-- Mobile: Toggle button -->
        <VBtn class="d-md-none" :icon="isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'" size="small"
          variant="text" />
      </div>
    </VCardTitle>

    <VDivider />

    <!-- Shared Content: Desktop always visible, Mobile collapsible -->
    <Transition name="expand-card">
      <VCardText v-show="isExpanded" class="px-6 pb-6 pt-0 allocations-content">
        <!-- Add New Button - Sticky -->
        <div class="add-button-sticky">
          <VBtn v-if="pockets.length > 0" color="primary" variant="flat" rounded="pill" block class="text-none"
            @click="handleCreate">
            <VIcon icon="mdi-plus" start />
            Add New Allocation
          </VBtn>
        </div>

        <div v-if="loading" class="py-4">
          <VSkeletonLoader type="article" v-for="i in 3" :key="i" class="mb-3" />
        </div>
        <div v-else-if="allocations.length === 0" class="empty-state text-center py-8">
          <VIcon icon="mdi-chart-arc" size="48" color="grey-lighten-1" class="mb-3" />
          <div class="text-grey-darken-1">No allocations yet</div>
        </div>

        <VList v-else class="allocation-list">
          <VListItem v-for="allocation in recentAllocations" :key="allocation.id" class="allocation-item mb-3">
            <div class="allocation-card">
              <div class="d-flex justify-space-between align-center cursor-pointer" @click="toggleExpand(allocation.id)">
                <div>
                  <div class="text-body-1 font-weight-semibold text-primary mb-0 mb-sm-1">{{ formatCurrency(allocation.source_amount) }}</div>
                  <div class="text-caption text-medium-emphasis">{{ formatDate(allocation.date) }}</div>
                </div>
                <VIcon :icon="expandedAllocation === allocation.id ? 'mdi-chevron-up' : 'mdi-chevron-down'" />
              </div>

              <!-- Expanded Details -->
              <Transition name="expand">
                <div v-if="expandedAllocation === allocation.id" class="allocation-details">
                  <VDivider class="my-3" />
                  <div class="d-flex flex-column ga-3">
                    <div v-for="item in allocation.allocation_items" :key="item.id" 
                      class="d-flex flex-wrap justify-space-between align-center ga-2 pa-3 bg-white rounded">
                      <div class="d-flex align-baseline ga-1 ga-sm-2">
                        <VChip size="x-small" color="primary" variant="tonal">
                          {{ formatPercentage(item.pocket_percentage) }}
                        </VChip>
                        <div class="text-caption text-sm-body-2 font-weight-medium text-primary text-wrap w-100 w-sm-auto" style="line-height: .9rem;">{{ item.pocket_name }}</div>
                      </div>
                      <div class="d-flex align-center justify-space-between justify-sm-end flex-grow-1 ga-2">
                        <div class="text-body-2 font-weight-semibold text-primary">{{ formatCurrency(item.amount) }}</div>
                        <VBtn :icon="copiedAmount === item.id ? 'mdi-check' : 'mdi-content-copy'" size="x-small"
                          variant="text" :color="copiedAmount === item.id ? 'success' : 'grey'"
                          @click="copyAmount(item.amount, item.id)" />
                      </div>
                    </div>
                  </div>
                  <div v-if="allocation.notes" class="mt-3 pa-3 bg-white rounded d-flex align-start ga-1">
                    <VIcon icon="mdi-note-text" size="small" class="mr-2" color="primary" />
                    <span class="text-caption text-medium-emphasis font-italic">{{ allocation.notes }}</span>
                  </div>

                  <!-- Delete Button -->
                  <div class="d-flex justify-end mt-3 pt-2" style="border-top: 1px dashed rgba(15, 118, 110, 0.2)">
                    <VBtn color="error" variant="tonal" size="small" prepend-icon="mdi-delete" class="text-none"
                      rounded="pill" @click.stop="handleDelete(allocation.id)">
                      Delete Allocation
                    </VBtn>
                  </div>
                </div>
              </Transition>
            </div>
          </VListItem>
        </VList>
      </VCardText>
    </Transition>
  </VCard>
</template>

<style scoped>
.allocations-card {
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
}

.allocations-content {
  overflow-y: auto;
  flex: 1;
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

/* Mobile: Collapsible content with max-height */
@media (max-width: 959px) {
  .allocations-content {
    transition: all 0.3s ease;
    max-height: 400px;
  }

  .allocation-item {
    padding: 12px !important;
  }
}

/* Desktop: Always show content with fixed height for scrolling */
@media (min-width: 960px) {
  .allocations-content {
    display: block !important;
    opacity: 1 !important;
    max-height: 400px;
  }
}

.allocations-content::-webkit-scrollbar {
  width: 6px;
}

.allocations-content::-webkit-scrollbar-track {
  background: rgba(15, 118, 110, 0.05);
  border-radius: 3px;
}

.allocations-content::-webkit-scrollbar-thumb {
  background: rgba(15, 118, 110, 0.2);
  border-radius: 3px;
}

.allocations-content::-webkit-scrollbar-thumb:hover {
  background: rgba(15, 118, 110, 0.3);
}

.allocation-list {
    margin-top: 20px;
  background: transparent !important;
}

.allocation-item {
  padding: 0 !important;
}

.allocation-card {
  background: rgba(15, 118, 110, 0.05);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(15, 118, 110, 0.1);
  transition: all 0.2s;
  width: 100%;
}

.allocation-card:hover {
  background: rgba(15, 118, 110, 0.08);
  border-color: rgba(15, 118, 110, 0.2);
}

.allocation-details {
  overflow: hidden;
}

.empty-state {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.cursor-pointer {
  cursor: pointer;
}

.subtitle-stats {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
  font-weight: 400;
}

.subtitle-stats-desktop {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.6);
  font-weight: 400;
}

/* Card Expand Animation */
.expand-card-enter-active,
.expand-card-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-card-enter-from,
.expand-card-leave-to {
  opacity: 0;
  max-height: 0;
}

.expand-card-enter-to,
.expand-card-leave-from {
  opacity: 1;
  max-height: 1000px;
}

/* Item Expand Animation */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 500px;
}
</style>
