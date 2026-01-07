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

// Expandable cards state
const expandedCards = ref<Record<string, boolean>>({})

function toggleCard(holdingId: string) {
  expandedCards.value[holdingId] = !expandedCards.value[holdingId]
}

// Auto-expand all cards initially
watch(() => holdings.value, (newHoldings) => {
  if (newHoldings && newHoldings.length > 0) {
    newHoldings.forEach(h => {
      if (expandedCards.value[h.id] === undefined) {
        expandedCards.value[h.id] = true
      }
    })
  }
}, { immediate: true })

function handlePurchasePriceInput(index: number, event: Event) {
  const input = event.target as HTMLInputElement
  const item = simulationData.value[index]
  if (!item) return
  
  const parsed = parseNumberInput(input.value)
  item.purchasePrice = parsed
  item.purchasePriceDisplay = parsed > 0 ? formatNumberInput(parsed) : ''
  calculateValues(index)
}

function handleCurrentPriceInput(index: number, event: Event) {
  const input = event.target as HTMLInputElement
  const item = simulationData.value[index]
  if (!item) return
  
  const parsed = parseNumberInput(input.value)
  item.currentPrice = parsed
  item.currentPriceDisplay = parsed > 0 ? formatNumberInput(parsed) : ''
  calculateValues(index)
}

function calculateValues(index: number) {
  const data = simulationData.value[index]
  if (!data) return
  
  const quantity = data.holding.quantity || 0
  const initialInvestment = Number(data.holding.initial_investment) || 0
  
  // Calculate current value: quantity × current price
  data.calculatedCurrentValue = quantity * data.currentPrice
  
  // Calculate profit: current value - initial investment
  data.profit = data.calculatedCurrentValue - initialInvestment
  
  // Calculate profit percentage
  if (initialInvestment > 0) {
    data.profitPercentage = (data.profit / initialInvestment) * 100
  } else {
    data.profitPercentage = 0
  }
}

const totalInitialInvestment = computed(() => {
  return holdings.value.reduce((sum, h) => sum + (Number(h.initial_investment) || 0), 0)
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
  gold: 'mdi-gold',
  stock: 'mdi-chart-line',
  etf: 'mdi-chart-multiple',
  mutual_fund: 'mdi-chart-box',
  bond: 'mdi-bank',
  crypto: 'mdi-currency-btc',
  other: 'mdi-package-variant'
}

function getAssetIcon(type: string) {
  return assetTypeIcons[type] || 'mdi-package-variant'
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
        <VAlert type="info" variant="tonal" border="start" class="mb-6">
          <template #text>
            <div class="text-caption">
              Enter purchase price and current market price for each holding. Profit/loss calculations are not saved to the database.
            </div>
          </template>
        </VAlert>

        <!-- Holdings List -->
        <div v-if="holdings.length === 0" class="text-center py-8">
          <VIcon icon="mdi-inbox" size="64" color="grey" />
          <p class="text-body-1 text-medium-emphasis mt-4">No holdings to simulate</p>
        </div>

        <div v-else class="holdings-list">
          <VCard 
            v-for="(data, index) in simulationData" 
            :key="data.holding.id"
            elevation="2"
            class="mb-4"
          >
            <!-- Holding Header (Clickable) -->
            <VCardTitle class="pa-4 cursor-pointer" @click="toggleCard(data.holding.id)">
              <div class="d-flex align-center">
                <VIcon :icon="getAssetIcon((data.holding as any).asset_type)" size="large" color="primary" class="mr-3" />
                <div class="flex-grow-1">
                  <div class="text-subtitle-1 font-weight-semibold">{{ data.holding.instrument_name }}</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ data.holding.platform }} • {{ data.holding.quantity }} {{ (data.holding as any).asset_type === 'gold' ? 'gram' : 'lot' }}
                  </div>
                  <div v-if="data.holding.purchase_date" class="text-caption text-medium-emphasis">
                    <VIcon icon="mdi-calendar" size="x-small" class="mr-1" />
                    Purchased: {{ new Date(data.holding.purchase_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) }}
                  </div>
                </div>
                <VChip 
                  v-if="data.profit !== 0"
                  :color="getProfitColor(data.profit)" 
                  size="small" 
                  variant="flat"
                  class="mr-2"
                >
                  {{ data.profit >= 0 ? '+' : '' }}{{ data.profitPercentage.toFixed(2) }}%
                </VChip>
                <VIcon :icon="expandedCards[data.holding.id] ? 'mdi-chevron-up' : 'mdi-chevron-down'" size="20" />
              </div>
            </VCardTitle>

            <!-- Expandable Content -->
            <Transition name="expand">
              <VCardText v-show="expandedCards[data.holding.id]" class="pa-4 pt-0">

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
                    placeholder="e.g., 1000000"
                    inputmode="numeric"
                    @input="handlePurchasePriceInput(index, $event)"
                  >
                    <template #prepend-inner>
                      <span class="text-caption text-medium-emphasis">Rp</span>
                    </template>
                    <template #append-inner>
                      <VMenu location="top" :close-on-content-click="false">
                        <template #activator="{ props }">
                          <VIcon icon="mdi-help-circle-outline" size="small" v-bind="props" color="grey" />
                        </template>
                        <VCard max-width="300" class="pa-3">
                          <div class="text-caption">
                            <div class="font-weight-semibold mb-1">Purchase Price per Unit</div>
                            <div class="text-medium-emphasis">Enter the price per unit when you first purchased this asset. This helps calculate your profit/loss.</div>
                            <div class="mt-2 text-medium-emphasis">Example: If you bought gold at Rp 1,000,000/gram, enter 1000000</div>
                          </div>
                        </VCard>
                      </VMenu>
                    </template>
                  </VTextField>
                </VCol>
                <VCol cols="12" sm="6">
                  <VTextField
                    :model-value="data.currentPriceDisplay"
                    label="Current Market Price (per unit)"
                    variant="outlined"
                    density="compact"
                    placeholder="e.g., 1200000"
                    inputmode="numeric"
                    @input="handleCurrentPriceInput(index, $event)"
                  >
                    <template #prepend-inner>
                      <span class="text-caption text-medium-emphasis">Rp</span>
                    </template>
                    <template #append-inner>
                      <VMenu location="top" :close-on-content-click="false">
                        <template #activator="{ props }">
                          <VIcon icon="mdi-help-circle-outline" size="small" v-bind="props" color="grey" />
                        </template>
                        <VCard max-width="300" class="pa-3">
                          <div class="text-caption">
                            <div class="font-weight-semibold mb-1">Current Market Price per Unit</div>
                            <div class="text-medium-emphasis">Enter the current market price per unit. The system will calculate your total current value and profit.</div>
                            <div class="mt-2 text-medium-emphasis">Example: If gold is now Rp 1,200,000/gram, enter 1200000</div>
                          </div>
                        </VCard>
                      </VMenu>
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
              </VCardText>
            </Transition>
          </VCard>
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
                    {{ totalCurrentValue > 0 ? formatCurrency(totalCurrentValue) : '-' }}
                  </div>
                </div>
              </VCol>
              <VCol cols="12" md="4">
                <div class="summary-item">
                  <div class="text-caption text-medium-emphasis mb-1">Total Profit/Loss</div>
                  <div v-if="totalCurrentValue > 0" class="text-h6 font-weight-bold" :class="`text-${profitColor}`">
                    {{ totalProfit >= 0 ? '+' : '' }}{{ formatCurrency(totalProfit) }}
                  </div>
                  <div v-else class="text-h6 font-weight-bold text-medium-emphasis">-</div>
                  <VChip 
                    v-if="totalCurrentValue > 0"
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
.cursor-pointer {
  cursor: pointer;
  user-select: none;
}

/* Expand transition */
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
  max-height: 800px;
  opacity: 1;
}
</style>

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
