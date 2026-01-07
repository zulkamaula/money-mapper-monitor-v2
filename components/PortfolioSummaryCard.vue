<script setup lang="ts">
import { formatCurrency } from '~/utils/format'

const { totalInvested, loading, assetAllocationData, holdings, simulationResult, clearSimulationResult } = useInvestments()

const isExpanded = ref(false)
const showSimulateDialog = ref(false)
const showComparisonChart = ref(false)

const hasSimulation = computed(() => !!simulationResult.value)

const profitColor = computed(() => {
  if (!simulationResult.value) return 'primary'
  return simulationResult.value.totalProfit >= 0 ? 'success' : 'error'
})

const profitIcon = computed(() => {
  if (!simulationResult.value) return 'mdi-calculator'
  return simulationResult.value.totalProfit >= 0 ? 'mdi-trending-up' : 'mdi-trending-down'
})

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

function openSimulateDialog() {
  showSimulateDialog.value = true
}

function toggleChart() {
  showComparisonChart.value = !showComparisonChart.value
}

function handleClearSimulation() {
  clearSimulationResult()
  showComparisonChart.value = false
}

// Auto-show comparison chart after simulation
watch(() => simulationResult.value, (newVal) => {
  if (newVal) {
    showComparisonChart.value = true
  }
})
</script>

<template>
  <VCard class="summary-card bg-surface" elevation="0" variant="flat">
    <VCardTitle class="card-header pa-5" @click="toggleExpand">
      <div class="header-content">
        <div class="title-section">
          <div class="d-flex align-center text-body-1 text-sm-h6 text-primary">
            <VIcon icon="mdi-chart-line" class="mr-2" color="primary" />
            Portfolio Summary
          </div>
          <!-- Mobile: Stats below title -->
          <div class="subtitle-stats d-md-none mt-1">
            <VChip v-if="!loading" color="primary" variant="tonal" size="x-small">
              {{ formatCurrency(totalInvested) }}
            </VChip>
          </div>
        </div>
        <!-- Desktop: Stats on right -->
        <div class="subtitle-stats-desktop d-none d-md-flex">
          <VChip v-if="!loading" color="primary" variant="tonal" size="small">
            {{ formatCurrency(totalInvested) }}
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

        <!-- 3-Card Layout: Show when simulation exists -->
        <VRow v-else-if="hasSimulation && simulationResult">
          <!-- Total Invested -->
          <VCol cols="12" md="4">
            <div class="metric-card">
              <div class="metric-label text-caption text-medium-emphasis mb-1">
                Total Invested
              </div>
              <div class="metric-value text-h6 font-weight-bold text-primary">
                {{ formatCurrency(simulationResult.totalInitial) }}
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
                {{ formatCurrency(simulationResult.totalCurrent) }}
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
                {{ simulationResult.totalProfit >= 0 ? '+' : '' }}{{ formatCurrency(simulationResult.totalProfit) }}
              </div>
              <VChip 
                :color="profitColor" 
                size="small" 
                variant="flat"
                class="mt-2"
              >
                <VIcon :icon="profitIcon" start size="small" />
                {{ simulationResult.totalProfit >= 0 ? '+' : '' }}{{ simulationResult.profitPercentage.toFixed(2) }}%
              </VChip>
            </div>
          </VCol>
        </VRow>

        <!-- Single Card: Show when no simulation -->
        <VRow v-else>
          <VCol cols="12">
            <div class="metric-card">
              <div class="metric-label text-caption text-medium-emphasis mb-1">
                Total Invested
              </div>
              <div class="metric-value text-h6 font-weight-bold text-primary">
                {{ loading ? '...' : formatCurrency(totalInvested) }}
              </div>
            </div>
          </VCol>
        </VRow>

        <!-- Simulate Button -->
        <div v-if="holdings.length > 0" class="mt-4">
          <VBtn
            color="primary"
            variant="flat"
            block
            rounded="pill"
            prepend-icon="mdi-calculator"
            @click="openSimulateDialog"
          >
            Simulate Net Wealth
          </VBtn>
        </div>

        <!-- Chart Section -->
        <VDivider v-if="Object.keys(assetAllocationData).length > 0 || hasSimulation" class="my-4" />
        
        <!-- Chart Toggle & Clear (only show when simulation exists) -->
        <div v-if="hasSimulation" class="d-flex justify-space-between align-center mb-3">
          <VBtnToggle
            v-model="showComparisonChart"
            mandatory
            density="compact"
            color="primary"
          >
            <VBtn :value="false" size="small">
              <VIcon icon="mdi-chart-donut" size="small" class="mr-1" />
              Allocation
            </VBtn>
            <VBtn :value="true" size="small">
              <VIcon icon="mdi-chart-line" size="small" class="mr-1" />
              Comparison
            </VBtn>
          </VBtnToggle>
          
          <VBtn
            size="small"
            variant="text"
            color="error"
            @click="handleClearSimulation"
          >
            <VIcon icon="mdi-close" size="small" class="mr-1" />
            Clear
          </VBtn>
        </div>

        <!-- Comparison Chart (show when simulation exists and toggle is on) -->
        <div v-if="hasSimulation && showComparisonChart && simulationResult" class="chart-section">
          <div class="d-flex align-center mb-3">
            <VIcon icon="mdi-chart-line" size="20" color="primary" class="mr-2" />
            <span class="text-subtitle-2 font-weight-semibold">Investment Performance</span>
          </div>
          <ComparisonChart 
            :initial-investment="simulationResult.totalInitial"
            :current-value="simulationResult.totalCurrent"
          />
        </div>

        <!-- Asset Allocation Chart (default, or when toggle is off) -->
        <div v-if="Object.keys(assetAllocationData).length > 0 && (!hasSimulation || !showComparisonChart)" class="chart-section">
          <div class="d-flex align-center mb-3">
            <VIcon icon="mdi-chart-donut" size="20" color="primary" class="mr-2" />
            <span class="text-subtitle-2 font-weight-semibold">Asset Allocation</span>
          </div>
          <AssetAllocationChart :data="assetAllocationData" />
        </div>
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
