<script setup lang="ts">
import { formatCurrency } from '~/utils/format'

const { totalInvested, currentValue, totalProfit, profitPercentage, loading, assetAllocationData } = useInvestments()

const isExpanded = ref(false)

const profitColor = computed(() => {
  return totalProfit.value >= 0 ? 'success' : 'error'
})

const profitIcon = computed(() => {
  return totalProfit.value >= 0 ? 'mdi-trending-up' : 'mdi-trending-down'
})

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <VCard class="summary-card bg-surface" elevation="0" variant="flat">
    <VCardTitle class="card-header pa-5" @click="toggleExpand">
      <div class="header-content">
        <div class="title-section">
          <div class="d-flex align-center text-body-1 text-sm-h6">
            <VIcon icon="mdi-chart-line" class="mr-2" color="primary" />
            Portfolio Summary
          </div>
          <!-- Mobile: Stats below title -->
          <div class="subtitle-stats d-md-none mt-1">
            <VChip v-if="!loading" :color="profitColor" variant="flat" size="x-small">
              <VIcon :icon="profitIcon" start size="14" />
              {{ profitPercentage.toFixed(2) }}%
            </VChip>
          </div>
        </div>
        <!-- Desktop: Stats on right -->
        <div class="subtitle-stats-desktop d-none d-md-flex">
          <VChip v-if="!loading" :color="profitColor" variant="flat" size="small">
            <VIcon :icon="profitIcon" start size="16" />
            {{ profitPercentage.toFixed(2) }}%
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

        <VRow v-else>
        <!-- Total Invested -->
        <VCol cols="12" md="4">
          <div class="metric-card">
            <div class="metric-label text-caption text-medium-emphasis mb-1">
              Total Invested
            </div>
            <div class="metric-value text-h6 font-weight-bold text-primary">
              {{ loading ? '...' : formatCurrency(totalInvested) }}
            </div>
          </div>
        </VCol>

        <!-- Current Value -->
        <VCol cols="12" md="4">
          <div class="metric-card">
            <div class="metric-label text-caption text-medium-emphasis mb-1">
              Current Value
            </div>
            <div class="metric-value text-h6 font-weight-bold">
              {{ loading ? '...' : formatCurrency(currentValue) }}
            </div>
          </div>
        </VCol>

        <!-- Profit/Loss -->
        <VCol cols="12" md="4">
          <div class="metric-card">
            <div class="metric-label text-caption text-medium-emphasis mb-1">
              Profit/Loss
            </div>
            <div class="metric-value text-h6 font-weight-bold" :class="`text-${profitColor}`">
              {{ loading ? '...' : formatCurrency(totalProfit) }}
            </div>
          </div>
        </VCol>
        </VRow>

        <!-- Asset Allocation Chart -->
        <VDivider v-if="Object.keys(assetAllocationData).length > 0" class="my-4" />
        
        <div v-if="Object.keys(assetAllocationData).length > 0" class="chart-section">
          <div class="d-flex align-center mb-3">
            <VIcon icon="mdi-chart-donut" size="20" color="primary" class="mr-2" />
            <span class="text-subtitle-2 font-weight-semibold">Asset Allocation</span>
          </div>
          <AssetAllocationChart :data="assetAllocationData" />
        </div>
      </VCardText>
    </Transition>
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

.subtitle-stats {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.6);
  font-weight: 400;
}

.subtitle-stats-desktop {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.6);
  font-weight: 400;
  align-items: center;
  gap: 4px;
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
