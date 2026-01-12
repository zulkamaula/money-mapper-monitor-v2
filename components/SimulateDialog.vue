<script setup lang="ts">
import { formatCurrency, formatNumberInput, parseNumberInput } from '~/utils/format'
import type { Holding } from '~/types/models'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { holdings } = useInvestments()

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
  simulationData.value = holdings.value.map(holding => {
    // Calculate average price from total_investment / total_quantity
    const avgPrice = holding.total_quantity > 0 
      ? Number(holding.total_investment) / holding.total_quantity 
      : 0
    return {
      holding,
      purchasePrice: avgPrice,
      purchasePriceDisplay: avgPrice > 0 ? formatNumberInput(avgPrice) : '',
      currentPrice: 0,
      currentPriceDisplay: '',
      calculatedCurrentValue: 0,
      profit: 0,
      profitPercentage: 0
    }
  })
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
  
  const quantity = data.holding.total_quantity || 0
  const initialInvestment = Number(data.holding.total_investment) || 0
  
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
  return holdings.value.reduce((sum, h) => sum + (Number(h.total_investment) || 0), 0)
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

const showSummary = ref(false)

function toggleSummary() {
  showSummary.value = !showSummary.value
}

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
  showSummary.value = false
}

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    initializeSimulation()
  }
})
</script>

<template>
  <VDialog v-model="dialog" max-width="900" persistent scrollable fullscreen transition="dialog-bottom-transition" :class="{ 'dialog-mobile': $vuetify.display.mobile }">
    <VCard>
      <VCardTitle class="pa-4 pa-sm-5 bg-primary d-flex align-center text-white">
        <VIcon icon="mdi-calculator" class="mr-2" />
        <span class="text-h6">Simulate Net Wealth</span>
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-4 pa-sm-6">
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

        <template v-else>
          <VCard 
            v-for="(data, index) in simulationData" 
            :key="data.holding.id"
            class="group-card mb-4"
          >
            <!-- Holding Header (Clickable) -->
            <VCardTitle class="pa-3 pa-sm-4 cursor-pointer group-header" @click="toggleCard(data.holding.id)">
              <div class="d-flex align-center flex-wrap flex-sm-nowrap ga-2">
                <VIcon :icon="getAssetIcon(data.holding.asset_type || 'other')" size="large" color="primary" class="mr-2" />
                <div class="flex-grow-1">
                  <div class="text-subtitle-2 text-sm-subtitle-1 font-weight-semibold">{{ data.holding.instrument_name }}</div>
                  <div class="text-caption text-medium-emphasis d-flex flex-wrap align-center ga-1">
                    <span>{{ data.holding.platform }}</span>
                    <span>•</span>
                    <span class="d-inline-flex align-center">
                      {{ formatCurrency(data.holding.total_investment) }}
                      <VIcon icon="mdi-approximately-equal" size="x-small" class="mx-1" />
                      {{ data.holding.total_quantity }} {{ data.holding.asset_type === 'gold' ? 'gr' : 'units' }}
                    </span>
                  </div>
                </div>
                <VChip 
                  v-if="data.profit !== 0"
                  :color="getProfitColor(data.profit)" 
                  size="small" 
                  variant="flat"
                  class="mr-1"
                >
                  {{ data.profit >= 0 ? '+' : '' }}{{ data.profitPercentage.toFixed(2) }}%
                </VChip>
                <VIcon :icon="expandedCards[data.holding.id] ? 'mdi-chevron-up' : 'mdi-chevron-down'" size="20" />
              </div>
            </VCardTitle>

            <!-- Expandable Content -->
            <Transition name="expand">
              <VCardText v-show="expandedCards[data.holding.id]" class="pa-3 pa-sm-4">
                <!-- Current Value & Profit Display -->
              <VAlert 
                v-if="data.purchasePrice > 0 && data.currentPrice > 0"
                :color="getProfitColor(data.profit)" 
                variant="tonal" 
                density="compact"
                class="mb-3"
              >
                <div class="d-flex flex-column gap-2">
                  <div class="d-flex justify-space-between align-center">
                    <span class="text-caption font-weight-medium">
                      <VIcon icon="mdi-chart-line" size="small" class="mr-1" />
                      Current Value
                    </span>
                    <span class="text-body-2 font-weight-bold">
                      {{ formatCurrency(data.calculatedCurrentValue) }}
                    </span>
                  </div>
                  <VDivider />
                  <div class="d-flex justify-space-between align-center">
                    <span class="text-caption font-weight-medium">
                      <VIcon :icon="data.profit >= 0 ? 'mdi-trending-up' : 'mdi-trending-down'" size="small" class="mr-1" />
                      Profit/Loss
                    </span>
                    <span class="text-body-2 font-weight-bold">
                      {{ data.profit >= 0 ? '+' : '' }}{{ formatCurrency(data.profit) }}
                    </span>
                  </div>
                </div>
              </VAlert>

              <!-- Price Inputs -->
              <VRow class="mt-2" dense>
                <VCol cols="12" sm="6">
                  <VTextField
                    :model-value="data.purchasePriceDisplay"
                    label="Purchase Price (per unit)"
                    variant="outlined"
                    density="compact"
                    placeholder="e.g., 1000000"
                    inputmode="numeric"
                    readonly
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
                            <div class="text-medium-emphasis">Price per unit when you first purchased this asset. This helps calculate your profit/loss.</div>
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
              </VCardText>
            </Transition>
          </VCard>
        </template>

        <!-- Toggle Summary Button -->
        <div v-if="holdings.length > 0 && totalCurrentValue > 0" class="mt-4 mt-sm-6 text-center">
          <VBtn
            :color="showSummary ? 'grey' : 'primary'"
            :variant="showSummary ? 'text' : 'flat'"
            :prepend-icon="showSummary ? 'mdi-chevron-up' : 'mdi-chart-line-variant'"
            @click="toggleSummary"
          >
            {{ showSummary ? 'Hide Summary & Chart' : 'Show Summary & Chart' }}
          </VBtn>
        </div>

        <!-- Summary Section -->
        <Transition name="expand">
        <VCard v-show="showSummary && holdings.length > 0 && totalCurrentValue > 0" elevation="2" elevation-sm="4" rounded="lg" class="mt-3 mt-sm-4 bg-primary-lighten-5">
          <VCardTitle class="pa-3 pa-sm-4 text-primary d-flex align-center">
            <VIcon icon="mdi-chart-box" class="mr-2" />
            <span class="text-subtitle-1 text-sm-h6">Summary</span>
          </VCardTitle>
          <VDivider />
          <VCardText class="pa-3 pa-sm-4">
            <VRow dense>
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
                    <div class="d-flex justify-space-between">
                        <div class="text-caption text-medium-emphasis mb-1">Total Profit/Loss</div>
                        <VChip 
                            v-if="totalCurrentValue > 0"
                            :color="profitColor" 
                            size="x-small" 
                            variant="flat"
                            class="mt-1"
                        >
                            <VIcon :icon="totalProfit >= 0 ? 'mdi-trending-up' : 'mdi-trending-down'" start size="small" />
                            {{ totalProfit >= 0 ? '+' : '' }}{{ totalProfitPercentage.toFixed(2) }}%
                        </VChip>
                    </div>
                  <div v-if="totalCurrentValue > 0" class="text-h6 font-weight-bold" :class="`text-${profitColor}`">
                    {{ totalProfit >= 0 ? '+' : '' }}{{ formatCurrency(totalProfit) }}
                  </div>
                  <div v-else class="text-h6 font-weight-bold text-medium-emphasis">-</div>
                </div>
              </VCol>
            </VRow>

            <!-- Comparison Chart (always visible when Summary is shown) -->
            <VCard elevation="0" class="mt-3 mt-sm-4">
              <VCardText class="pa-2 pa-sm-4">
                <ComparisonChart
                  :initial-investment="totalInitialInvestment"
                  :current-value="totalCurrentValue"
                />
              </VCardText>
            </VCard>
          </VCardText>
        </VCard>
        </Transition>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4">
        <VSpacer />
        <VBtn 
          color="primary" 
          variant="flat" 
          @click="handleClose"
        >
          Close
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

/* Group card styling - match InvestmentPortfolio */
.group-card {
  background: rgba(15, 118, 110, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(15, 118, 110, 0.1);
  transition: all 0.2s;
}

.group-header {
  background: transparent;
  transition: all 0.2s;
}

.group-card:hover .group-header {
  background: rgba(15, 118, 110, 0.03);
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
