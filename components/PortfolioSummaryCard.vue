<script setup lang="ts">
import { formatCurrency } from '~/utils/format'

const { totalInvested, loading, assetAllocationData, holdings } = useInvestments()

const isExpanded = ref(false)
const showSimulateDialog = ref(false)

// Get most recent last_updated from holdings
const lastUpdatedTime = computed(() => {
  if (!holdings.value || holdings.value.length === 0) return null
  
  const timestamps = holdings.value
    .map(h => h.last_updated)
    .filter(Boolean)
    .map(t => new Date(t).getTime())
  
  if (timestamps.length === 0) return null
  
  const mostRecent = Math.max(...timestamps)
  return new Date(mostRecent)
})

// Format timestamp
function formatLastUpdate() {
  if (!lastUpdatedTime.value) return 'Never'
  
  return lastUpdatedTime.value.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

function openSimulateDialog() {
  showSimulateDialog.value = true
}

</script>

<template>
  <VCard class="summary-card bg-surface" elevation="0" variant="flat">
    <VCardTitle class="card-header pa-5">
      <div class="header-content">
        <div class="title-section">
          <div class="d-flex align-center text-body-1 text-sm-h6 text-primary">
            <VIcon icon="mdi-chart-line" class="mr-2" color="primary" />
            Portfolio Summary
          </div>
        </div>
        <!-- Expand/Collapse button (both mobile and desktop) -->
        <VBtn 
          :icon="isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'" 
          size="small" 
          variant="text"
          @click="toggleExpand"
        />
      </div>
    </VCardTitle>

    <VDivider />

    <!-- Shared Content: Desktop always visible, Mobile collapsible -->
    <Transition name="expand">
      <VCardText v-show="isExpanded" class="px-6 pb-6 pt-5 summary-content">
        <!-- Loading State -->
        <div v-if="loading" class="py-4">
          <VSkeletonLoader type="heading" class="mb-4" />
          <VRow>
            <VCol cols="12" md="4">
              <VSkeletonLoader type="text, text" />
            </VCol>
            <VCol cols="12" md="4">
              <VSkeletonLoader type="text, text" />
            </VCol>
            <VCol cols="12" md="4">
              <VSkeletonLoader type="text, text" />
            </VCol>
          </VRow>
        </div>

        <!-- 2-Column Layout -->
        <VRow v-else>
          <!-- Column 1: Asset Allocation Chart -->
          <VCol cols="12" md="8">
            <div v-if="Object.keys(assetAllocationData).length > 0" class="metric-card">
              <div class="d-flex align-center mb-3">
                <VIcon icon="mdi-chart-donut" size="small" color="primary" class="mr-2" />
                <span class="text-subtitle-2 font-weight-semibold">Asset Allocation</span>
              </div>
              <AssetAllocationChart :data="assetAllocationData" />
            </div>
            <div v-else class="metric-card h-100 d-flex align-center justify-center">
              <div class="text-center">
                <VIcon icon="mdi-chart-donut" size="48" color="grey-lighten-1" class="mb-3" />
                <div class="text-body-2 text-medium-emphasis">No allocation data</div>
              </div>
            </div>
          </VCol>

          <!-- Column 2: Total Invested + Simulate Button (stacked) -->
          <VCol cols="12" md="4">
            <div class="h-100 d-flex flex-column justify-space-between">
              <!-- Row 1: Total Invested Card -->
              <div class="metric-card">
                <div class="d-flex justify-space-between align-center mb-2">
                  <div class="metric-label text-caption text-medium-emphasis">
                    Total Invested
                  </div>
                  <VChip size="x-small" variant="tonal" color="primary" class="text-caption">
                    <VIcon icon="mdi-update" size="x-small" class="mr-1" />
                    {{ formatLastUpdate() }}
                  </VChip>
                </div>
                <div class="metric-value text-h5 font-weight-bold text-primary">
                  {{ loading ? '...' : formatCurrency(totalInvested) }}
                </div>
              </div>

              <!-- Row 2: Simulate Button -->
              <div>
                <VBtn
                v-if="holdings.length > 0"
                color="primary"
                variant="flat"
                block
                size="large"
                prepend-icon="mdi-calculator"
                @click="openSimulateDialog"
                >
                Simulate Net Wealth
                </VBtn>
                <div v-else class="text-center w-100">
                <VIcon icon="mdi-calculator-variant-outline" size="40" color="grey-lighten-1" class="mb-2" />
                <div class="text-caption text-medium-emphasis">Add holdings to simulate</div>
                </div>
              </div>
            </div>
          </VCol>
        </VRow>
      </VCardText>
    </Transition>

    <!-- Simulate Dialog -->
    <SimulateDialog v-model="showSimulateDialog" />
  </VCard>
</template>

<style scoped>
.summary-card {
  border: 1px solid rgba(15, 118, 110, 0.1);
  border-radius: 16px;
}

.metric-card {
  padding: 12px;
  background: rgba(15, 118, 110, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(15, 118, 110, 0.1);
}

.metric-label {
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-value {
  line-height: 1.3;
}

.card-header {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;
}

.card-header:hover {
  background-color: rgba(15, 118, 110, 0.02);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
}

.title-section {
  flex: 1;
  min-width: 0;
}

/* Desktop: always expanded */
@media (min-width: 960px) {
  .summary-content {
    display: block !important;
  }
  .card-header {
    cursor: default;
  }
  .card-header:hover {
    background-color: transparent;
  }
}

/* Transition */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 1000px;
  opacity: 1;
}
</style>
