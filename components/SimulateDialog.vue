<script setup lang="ts">
import { formatCurrency, formatNumberInput, parseNumberInput } from '~/utils/format'
import type { Holding } from '~/types/models'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { holdings, loading, saveSimulationResult } = useInvestments()

const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

interface SimulationData {
  holding: Holding
  purchasePrice: number
  purchasePriceDisplay: string
  currentPrice: number
  currentPriceDisplay: string
  calculatedCurrentValue: number
  profit: number
  profitPercentage: number
}

const simulationData = ref<SimulationData[]>([])

function initializeSimulation() {
  simulationData.value = holdings.value.map(holding => ({
    holding,
    purchasePrice: 0,
    purchasePriceDisplay: '',
    currentPrice: 0,
    currentPriceDisplay: '',
    calculatedCurrentValue: 0,
    profit: 0,
    profitPercentage: 0
  }))
}

function handlePurchasePriceInput(index: number, event: Event) {
  const input = (event.target as HTMLInputElement).value
  const item = simulationData.value[index]
  if (!item) return
  
  item.purchasePriceDisplay = input
  item.purchasePrice = parseNumberInput(input)
  calculateValues(index)
}

function handleCurrentPriceInput(index: number, event: Event) {
  const input = (event.target as HTMLInputElement).value
  const item = simulationData.value[index]
  if (!item) return
  
  item.currentPriceDisplay = input
  item.currentPrice = parseNumberInput(input)
  calculateValues(index)
}

function calculateValues(index: number) {
  const data = simulationData.value[index]
  if (!data) return
  
  const quantity = data.holding.quantity || 0
  
  // Calculate current value: quantity × current price
  data.calculatedCurrentValue = quantity * data.currentPrice
  
  // Calculate profit: current value - initial investment
  data.profit = data.calculatedCurrentValue - data.holding.initial_investment
  
  // Calculate profit percentage
  if (data.holding.initial_investment > 0) {
    data.profitPercentage = (data.profit / data.holding.initial_investment) * 100
  } else {
    data.profitPercentage = 0
  }
}

const totalInitialInvestment = computed(() => {
  return holdings.value.reduce((sum, h) => sum + h.initial_investment, 0)
})

const totalCurrentValue = computed(() => {
  return simulationData.value.reduce((sum, data) => sum + data.calculatedCurrentValue, 0)
})

const totalProfit = computed(() => {
  return totalCurrentValue.value - totalInitialInvestment.value
})

const totalProfitPercentage = computed(() => {
  if (totalInitialInvestment.value === 0) return 0
  return (totalProfit.value / totalInitialInvestment.value) * 100
})

const profitColor = computed(() => {
  return totalProfit.value >= 0 ? 'success' : 'error'
})

const assetTypeIcons: Record<string, string> = {
  gold: '🪙',
  stock: '📈',
  etf: '📊',
  mutual_fund: '💰',
  bond: '📜',
  crypto: '₿',
  other: '📦'
}

function getAssetIcon(type: string) {
  return assetTypeIcons[type] || '📦'
}

function getProfitColor(profit: number) {
  return profit >= 0 ? 'success' : 'error'
}

function handleClose() {
  dialog.value = false
}

function handleSaveAndClose() {
  // Save simulation result to composable state
  saveSimulationResult({
    totalInitial: totalInitialInvestment.value,
    totalCurrent: totalCurrentValue.value,
    totalProfit: totalProfit.value,
    profitPercentage: totalProfitPercentage.value
  })
  dialog.value = false
}

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    initializeSimulation()
  }
})
</script>

<template>
  <VDialog v-model="dialog" max-width="900" persistent scrollable>
    <VCard>
      <VCardTitle class="pa-5 bg-primary">
        <div class="d-flex align-center text-white">
          <VIcon icon="mdi-calculator" class="mr-2" />
          <span class="text-h6">Simulate Net Wealth</span>
        </div>
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-6">
        <VAlert color="info" variant="tonal" class="mb-6">
          <div class="text-caption">
            <VIcon icon="mdi-information" size="small" class="mr-1" />
            Masukkan harga beli dan harga sekarang untuk setiap holding. Kalkulasi profit/loss tidak akan disimpan ke database.
          </div>
        </VAlert>

        <!-- Holdings List -->
        <div v-if="holdings.length === 0" class="text-center py-8">
          <VIcon icon="mdi-inbox" size="64" color="grey" />
          <p class="text-body-1 text-medium-emphasis mt-4">No holdings to simulate</p>
        </div>

        <div v-else class="holdings-list">
          <div 
            v-for="(data, index) in simulationData" 
            :key="data.holding.id"
            class="holding-card mb-4"
          >
            <VCard elevation="2" class="pa-4">
              <!-- Holding Header -->
              <div class="d-flex align-center mb-3">
                <span class="text-h6 mr-2">{{ getAssetIcon((data.holding as any).asset_type) }}</span>
                <div class="flex-grow-1">
                  <div class="text-subtitle-1 font-weight-semibold">{{ data.holding.instrument_name }}</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ data.holding.platform }} • {{ data.holding.quantity }} {{ (data.holding as any).asset_type === 'gold' ? 'gram' : 'lot' }}
                  </div>
                </div>
                <VChip 
                  v-if="data.profit !== 0"
                  :color="getProfitColor(data.profit)" 
                  size="small" 
                  variant="flat"
                >
                  {{ data.profit >= 0 ? '+' : '' }}{{ data.profitPercentage.toFixed(2) }}%
                </VChip>
              </div>

              <!-- Investment Info -->
              <VRow class="mb-3">
                <VCol cols="12" sm="6">
                  <div class="text-caption text-medium-emphasis">Initial Investment</div>
                  <div class="text-body-2 font-weight-medium">
                    {{ formatCurrency(data.holding.initial_investment) }}
                  </div>
                </VCol>
                <VCol cols="12" sm="6">
                  <div class="text-caption text-medium-emphasis">Current Value (Calculated)</div>
                  <div class="text-body-2 font-weight-bold" :class="`text-${getProfitColor(data.profit)}`">
                    {{ formatCurrency(data.calculatedCurrentValue) }}
                  </div>
                </VCol>
              </VRow>

              <!-- Price Inputs -->
              <VRow>
                <VCol cols="12" sm="6">
                  <VTextField
                    :model-value="data.purchasePriceDisplay"
                    label="Purchase Price (per unit)"
                    variant="outlined"
                    density="compact"
                    placeholder="0"
                    @input="handlePurchasePriceInput(index, $event)"
                  >
                    <template #prepend-inner>
                      <span class="text-caption text-medium-emphasis">Rp</span>
                    </template>
                  </VTextField>
                </VCol>
                <VCol cols="12" sm="6">
                  <VTextField
                    :model-value="data.currentPriceDisplay"
                    label="Current Market Price (per unit)"
                    variant="outlined"
                    density="compact"
                    placeholder="0"
                    @input="handleCurrentPriceInput(index, $event)"
                  >
                    <template #prepend-inner>
                      <span class="text-caption text-medium-emphasis">Rp</span>
                    </template>
                  </VTextField>
                </VCol>
              </VRow>

              <!-- Profit Display -->
              <VAlert 
                v-if="data.purchasePrice > 0 && data.currentPrice > 0"
                :color="getProfitColor(data.profit)" 
                variant="tonal" 
                density="compact"
                class="mt-3"
              >
                <div class="d-flex justify-space-between align-center">
                  <span class="text-caption font-weight-medium">
                    <VIcon :icon="data.profit >= 0 ? 'mdi-trending-up' : 'mdi-trending-down'" size="small" class="mr-1" />
                    Profit/Loss
                  </span>
                  <span class="text-body-2 font-weight-bold">
                    {{ formatCurrency(data.profit) }}
                  </span>
                </div>
              </VAlert>
            </VCard>
          </div>
        </div>

        <!-- Summary Section -->
        <VCard v-if="holdings.length > 0" elevation="4" class="mt-6 bg-primary-lighten-5">
          <VCardTitle class="pa-4 text-primary">
            <VIcon icon="mdi-chart-box" class="mr-2" />
            Summary
          </VCardTitle>
          <VDivider />
          <VCardText class="pa-4">
            <VRow>
              <VCol cols="12" md="4">
                <div class="summary-item">
                  <div class="text-caption text-medium-emphasis mb-1">Total Initial Investment</div>
                  <div class="text-h6 font-weight-bold text-primary">
                    {{ formatCurrency(totalInitialInvestment) }}
                  </div>
                </div>
              </VCol>
              <VCol cols="12" md="4">
                <div class="summary-item">
                  <div class="text-caption text-medium-emphasis mb-1">Total Current Value</div>
                  <div class="text-h6 font-weight-bold">
                    {{ formatCurrency(totalCurrentValue) }}
                  </div>
                </div>
              </VCol>
              <VCol cols="12" md="4">
                <div class="summary-item">
                  <div class="text-caption text-medium-emphasis mb-1">Total Profit/Loss</div>
                  <div class="text-h6 font-weight-bold" :class="`text-${profitColor}`">
                    {{ totalProfit >= 0 ? '+' : '' }}{{ formatCurrency(totalProfit) }}
                  </div>
                  <VChip 
                    :color="profitColor" 
                    size="small" 
                    variant="flat"
                    class="mt-1"
                  >
                    <VIcon :icon="totalProfit >= 0 ? 'mdi-trending-up' : 'mdi-trending-down'" start size="small" />
                    {{ totalProfit >= 0 ? '+' : '' }}{{ totalProfitPercentage.toFixed(2) }}%
                  </VChip>
                </div>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4">
        <VSpacer />
        <VBtn color="grey" variant="text" @click="handleClose">
          Close
        </VBtn>
        <VBtn 
          v-if="totalCurrentValue > 0"
          color="primary" 
          variant="flat" 
          @click="handleSaveAndClose"
        >
          Save & View Chart
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.holdings-list {
  max-height: 500px;
  overflow-y: auto;
}

.holding-card {
  transition: all 0.2s ease;
}

.summary-item {
  padding: 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  border: 1px solid rgba(15, 118, 110, 0.1);
}
</style>
