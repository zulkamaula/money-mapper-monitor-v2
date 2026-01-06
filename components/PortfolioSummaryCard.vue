<script setup lang="ts">
import { formatCurrency } from '~/utils/format'

const { totalInvested, currentValue, totalProfit, profitPercentage, loading, assetAllocationData } = useInvestments()

const profitColor = computed(() => {
  return totalProfit.value >= 0 ? 'success' : 'error'
})

const profitIcon = computed(() => {
  return totalProfit.value >= 0 ? 'mdi-trending-up' : 'mdi-trending-down'
})
</script>

<template>
  <VCard class="summary-card" elevation="0">
    <VCardText class="pa-5">
      <div class="d-flex align-center justify-space-between mb-4">
        <div class="d-flex align-center">
          <VIcon icon="mdi-chart-line" size="24" color="primary" class="mr-2" />
          <span class="text-h6 font-weight-bold text-primary">Portfolio Summary</span>
        </div>
        <VChip v-if="!loading" :color="profitColor" variant="flat" size="small">
          <VIcon :icon="profitIcon" start size="16" />
          {{ profitPercentage.toFixed(2) }}%
        </VChip>
      </div>

      <VDivider class="mb-4" />

      <VRow class="ga-4">
        <!-- Total Invested -->
        <VCol cols="12" sm="4">
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
        <VCol cols="12" sm="4">
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
        <VCol cols="12" sm="4">
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
  </VCard>
</template>

<style scoped>
.summary-card {
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.03) 0%, rgba(8, 145, 178, 0.03) 100%);
  border: 1px solid rgba(15, 118, 110, 0.1);
  border-radius: 16px;
}

.metric-card {
  padding: 12px;
  background: white;
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
</style>
