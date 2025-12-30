<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Allocation, Pocket } from '~/types/models'
import { formatPercentage, formatCurrency, formatDate } from '~/utils/format'

interface Props {
  allocations: Allocation[]
  pockets: Pocket[]
  loading?: boolean
}

interface Emits {
  (e: 'create'): void
  (e: 'delete', id: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const expandedAllocation = ref<string | null>(null)
const copiedAmount = ref<string | null>(null)
const isExpanded = ref(true)

function toggleCardExpand() {
  isExpanded.value = !isExpanded.value
}

const recentAllocations = computed(() => {
  return props.allocations.slice(0, 10)
})

function toggleExpand(id: string) {
  expandedAllocation.value = expandedAllocation.value === id ? null : id
}

async function copyAmount(amount: number, itemId: string) {
  try {
    await navigator.clipboard.writeText(amount.toString())
    copiedAmount.value = itemId
    setTimeout(() => {
      copiedAmount.value = null
    }, 2000)
  } catch (error) {
    console.error('Failed to copy:', error)
  }
}

function handleCreate() {
  emit('create')
}

function handleDelete(id: string) {
  emit('delete', id)
}
</script>

<template>
  <VCard class="allocations-card" elevation="0">
    <VCardTitle class="card-header pa-5" @click="toggleCardExpand">
      <div class="header-content">
        <div class="title-section">
          <div class="d-flex align-center text-wrap">
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
          <VBtn v-if="pockets.length > 0" color="primary" variant="flat" rounded="pill" block class="mb-4 text-none"
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
              <div class="allocation-header" @click="toggleExpand(allocation.id)">
                <div>
                  <div class="allocation-amount">{{ formatCurrency(allocation.source_amount) }}</div>
                  <div class="allocation-date">{{ formatDate(allocation.date) }}</div>
                </div>
                <VIcon :icon="expandedAllocation === allocation.id ? 'mdi-chevron-up' : 'mdi-chevron-down'" />
              </div>

              <!-- Expanded Details -->
              <Transition name="expand">
                <div v-if="expandedAllocation === allocation.id" class="allocation-details">
                  <VDivider class="my-3" />
                  <div class="details-list">
                    <div v-for="item in allocation.allocation_items" :key="item.id" class="detail-item">
                      <div class="detail-info">
                        <div class="detail-percentage rounded-pill">{{ formatPercentage(item.pocket_percentage) }}
                        </div>
                        <div class="detail-name text-wrap w-100 w-sm-auto">{{ item.pocket_name }}</div>
                      </div>
                      <div class="detail-amount-group">
                        <div class="detail-amount">{{ formatCurrency(item.amount) }}</div>
                        <VBtn :icon="copiedAmount === item.id ? 'mdi-check' : 'mdi-content-copy'" size="x-small"
                          variant="text" :color="copiedAmount === item.id ? 'success' : 'grey'"
                          @click="copyAmount(item.amount, item.id)" />
                      </div>
                    </div>
                  </div>
                  <div v-if="allocation.notes" class="notes-section">
                    <VIcon icon="mdi-note-text" size="small" class="mr-2" color="primary" />
                    <span class="notes-text">{{ allocation.notes }}</span>
                  </div>

                  <!-- Delete Button -->
                  <div class="delete-section mt-3">
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

.allocations-content {
  overflow-y: auto;
  flex: 1;
  position: relative;
}

.add-button-sticky {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  padding-bottom: 8px;
  margin: -24px -24px 8px -24px;
  padding: 16px 24px 8px 24px;
}

/* Mobile: Collapsible content with max-height and smaller text */
@media (max-width: 959px) {
  .allocations-content {
    transition: all 0.3s ease;
    max-height: 400px;
    font-size: 0.875rem;
  }

  .allocation-item {
    padding: 12px !important;
  }

  .allocation-amount {
    font-size: 1rem;
  }

  .detail-name {
    font-size: 0.875rem;
  }

  .detail-amount {
    font-size: 0.875rem;
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

.allocation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.allocation-amount {
  font-size: 1rem;
  font-weight: 700;
  color: rgba(15, 118, 110, 0.9);
  margin-bottom: 4px;
}

.allocation-date {
  font-size: 0.7rem;
  color: rgba(0, 0, 0, 0.5);
}

.allocation-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.allocation-details {
  overflow: hidden;
}

.details-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 5px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
}

.detail-info {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-name {
  font-weight: 600;
  color: rgba(15, 118, 110, 0.9);
}

.detail-percentage {
  font-size: 12px;
  padding: 2px 8px;
  background: rgba(15, 118, 110, 0.1);
  color: rgba(15, 118, 110, 0.9);
}

.detail-amount-group {
  display: flex;
  align-items: center;
  justify-content: end;
  flex-grow: 1;
  gap: 8px;
}

.detail-amount {
  font-weight: 700;
  color: rgba(15, 118, 110, 0.9);
}

.notes-section {
  margin-top: 12px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  display: flex;
  align-items: flex-start;
  gap: 4px;
}

.notes-text {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.7);
  line-height: 1.4;
}

.delete-section {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
  border-top: 1px dashed rgba(15, 118, 110, 0.2);
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
  font-weight: 500;
}

.subtitle-stats-desktop {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.6);
  font-weight: 500;
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
