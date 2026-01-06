<script setup lang="ts">
import { formatCurrency } from '~/utils/format'
import type { Holding } from '~/types/models'

const { holdings, loading, holdingsByAsset, handleDeleteHolding, currentValue } = useInvestments()

const showHoldingDialog = ref(false)
const editingHolding = ref<Holding | undefined>(undefined)
const isExpanded = ref(false)

function openCreateDialog() {
  editingHolding.value = undefined
  showHoldingDialog.value = true
}

function openEditDialog(holding: Holding) {
  editingHolding.value = holding
  showHoldingDialog.value = true
}

function handleDialogSave() {
  // Dialog will close automatically, just refresh if needed
}

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

// Initialize all groups as expanded on mount
onMounted(() => {
  Object.keys(holdingsByAsset.value).forEach(key => {
    expandedGroups.value[key] = true
  })
})

// Watch for new asset types and expand them by default
watch(() => holdingsByAsset.value, (newVal) => {
  Object.keys(newVal).forEach(key => {
    if (expandedGroups.value[key] === undefined) {
      expandedGroups.value[key] = true
    }
  })
}, { deep: true })

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

const expandedGroups = ref<Record<string, boolean>>({})

function toggleGroup(assetType: string) {
  expandedGroups.value[assetType] = !expandedGroups.value[assetType]
}

function calculateProfit(holding: Holding) {
  return holding.current_value - holding.initial_investment
}

function calculateProfitPercentage(holding: Holding) {
  if (holding.initial_investment === 0) return 0
  const profit = calculateProfit(holding)
  return (profit / holding.initial_investment) * 100
}

function getProfitColor(holding: Holding) {
  return calculateProfit(holding) >= 0 ? 'success' : 'error'
}
</script>

<template>
  <div>
    <!-- Holdings Section -->
    <VCard elevation="0" variant="flat" class="bg-surface rounded-lg border-primary border-opacity-10">
      <VCardTitle class="pa-5 cursor-pointer user-select-none d-md-cursor-default" @click="toggleExpand">
        <div class="d-flex align-center justify-space-between w-100 ga-3">
          <div class="flex-grow-1">
            <div class="d-flex align-center text-wrap text-body-1 text-sm-h6 text-primary">
              <VIcon icon="mdi-briefcase" class="mr-2" color="primary" />
              Investment Holdings
            </div>
            <!-- Mobile: Stats below title -->
            <div class="d-md-none mt-1 d-flex align-center ga-2">
              <VChip size="small" color="primary" variant="tonal">
                {{ holdings.length }}
              </VChip>
              <span class="text-caption">{{ formatCurrency(currentValue) }}</span>
            </div>
          </div>
          <!-- Desktop: Stats on right -->
          <div class="d-none d-md-flex align-center ga-2">
            <VChip size="small" color="primary" variant="tonal">
              {{ holdings.length }}
            </VChip>
            <span class="text-body-2">{{ formatCurrency(currentValue) }}</span>
          </div>
          <!-- Mobile: Toggle button -->
          <VBtn class="d-md-none" :icon="isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'" size="small"
            variant="text" />
        </div>
      </VCardTitle>

      <VDivider />

      <!-- Shared Content: Desktop always visible, Mobile collapsible -->
      <Transition name="expand">
        <VCardText v-show="isExpanded" class="px-6 pb-6 pt-0 holdings-content">
          <!-- Add New Button - Sticky -->
          <div v-if="holdings.length > 0" class="sticky-top bg-surface pa-4 mx-n6">
            <VBtn color="primary" variant="flat" rounded="pill" block class="text-none" @click="openCreateDialog">
              <VIcon icon="mdi-plus" start />
              Add New Holding
            </VBtn>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="py-4">
            <VSkeletonLoader type="list-item" v-for="i in 3" :key="i" class="mb-3" />
          </div>

          <!-- Empty State -->
          <div v-else-if="holdings.length === 0" class="text-center py-12">
            <VIcon icon="mdi-briefcase-off-outline" size="48" color="grey-lighten-1" class="mb-4" />
            <p class="text-h6 text-medium-emphasis mb-2">No Holdings Yet</p>
            <p class="text-caption text-medium-emphasis mb-4">
              Start tracking your investments by adding your first holding
            </p>
            <VBtn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog" class="text-none" rounded="pill"
              size="small">
              Add First Holding
            </VBtn>
          </div>

          <!-- Holdings List -->
          <div v-else>
            <VCard v-for="(group, assetType) in holdingsByAsset" :key="assetType" class="mb-4 group-card" elevation="0">
              <!-- Asset Group Header - Clickable -->
              <VCardTitle class="pa-4 cursor-pointer user-select-none group-header" @click="toggleGroup(assetType)">
                <div class="d-flex align-center w-100">
                  <VIcon :icon="getAssetIcon(assetType)" size="20" color="primary" class="mr-2" />
                  <span class="text-subtitle-1 font-weight-bold">{{ group.name }}</span>
                  <VChip size="x-small" class="ml-2" color="primary" variant="tonal">
                    {{ group.holdings.length }}
                  </VChip>
                  <VSpacer />
                  <VIcon :icon="expandedGroups[assetType] ? 'mdi-chevron-up' : 'mdi-chevron-down'" size="20" />
                </div>
              </VCardTitle>

              <!-- Holdings in this group - Expandable -->
              <Transition name="expand">
                <VCardText v-show="expandedGroups[assetType]" class="pa-3 pt-0">
                  <VRow class="mt-2">
                    <VCol v-for="holding in group.holdings" :key="holding.id" cols="12" lg="6">
                      <VCard variant="outlined" color="primary" rounded="xl">
                        <VCardText class="pa-4 bg-white">
                          <!-- Platform & Actions -->
                          <div class="d-flex align-center justify-space-between mb-2">
                            <VChip size="small" color="primary" variant="tonal">
                              {{ holding.platform }}
                            </VChip>
                            <VMenu>
                              <template v-slot:activator="{ props }">
                                <VBtn icon="mdi-dots-vertical" size="x-small" variant="text" v-bind="props" />
                              </template>
                              <VList density="compact">
                                <VListItem @click="openEditDialog(holding)">
                                  <VListItemTitle>Update Value</VListItemTitle>
                                </VListItem>
                                <VDivider />
                                <VListItem @click="handleDeleteHolding(holding)">
                                  <VListItemTitle class="text-error font-weight-medium">
                                    Delete
                                  </VListItemTitle>
                                </VListItem>
                              </VList>
                            </VMenu>
                          </div>

                          <!-- Instrument Name -->
                          <div class="d-flex justify-space-between">
                            <h3 class="text-subtitle-2 font-weight-bold mb-3">
                              {{ holding.instrument_name }}
                            </h3>
                            <VChip 
                              size="x-small" 
                              :color="calculateProfit(holding) >= 0 ? 'success' : 'error'" 
                              variant="flat"
                            >
                              {{ calculateProfit(holding) >= 0 ? '+' : '' }}{{ calculateProfitPercentage(holding).toFixed(2) }}%
                            </VChip>
                          </div>

                          <!-- Values -->
                          <div class="d-flex flex-wrap ga-3 mb-3">
                            <div class="flex-grow-1">
                              <div class="text-caption text-medium-emphasis mb-1">Initial</div>
                              <div class="text-body-2 font-weight-medium">
                                {{ formatCurrency(holding.initial_investment) }}
                              </div>
                            </div>
                            <div class="flex-grow-1">
                              <div class="text-caption text-medium-emphasis mb-1">Current</div>
                              <div class="text-body-2 font-weight-bold">
                                {{ formatCurrency(holding.current_value) }}
                              </div>
                            </div>
                          </div>

                          <!-- Profit/Loss -->
                          <VAlert :color="getProfitColor(holding)" size="small" variant="tonal">
                            <div class="d-flex justify-space-between flex-wrap align-center">
                              <VIcon :icon="calculateProfit(holding) >= 0 ? 'mdi-trending-up' : 'mdi-trending-down'"
                                size="small" />
                              <span class="d-inline-block mx-1">
                                {{ formatCurrency(calculateProfit(holding)) }}
                              </span>
                            </div>
                          </VAlert>

                          <!-- Optional Info -->
                          <div v-if="holding.quantity || holding.notes" class="mt-3 pt-3 border-t border-opacity-10">
                            <p v-if="holding.quantity" class="text-caption text-medium-emphasis">
                              Qty: {{ holding.quantity }}
                            </p>
                            <p v-if="holding.notes" class="text-caption text-medium-emphasis mt-1">
                              {{ holding.notes }}
                            </p>
                          </div>
                        </VCardText>
                      </VCard>
                    </VCol>
                  </VRow>
                </VCardText>
              </Transition>
            </VCard>
          </div>
        </VCardText>
      </Transition>
    </VCard>

    <!-- Holding Dialog -->
    <HoldingDialog v-model="showHoldingDialog" :holding="editingHolding" @save="handleDialogSave" />
  </div>
</template>

<style scoped>
/* Group card styling - match allocation cards */
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

/* Scrollbar styling */
.holdings-content::-webkit-scrollbar {
  width: 6px;
}

.holdings-content::-webkit-scrollbar-track {
  background: rgba(15, 118, 110, 0.05);
  border-radius: 3px;
}

.holdings-content::-webkit-scrollbar-thumb {
  background: rgba(15, 118, 110, 0.2);
  border-radius: 3px;
}

.holdings-content::-webkit-scrollbar-thumb:hover {
  background: rgba(15, 118, 110, 0.3);
}

/* Content height and scroll behavior */
.holdings-content {
  overflow-y: auto;
  max-height: 400px;
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
  max-height: 600px;
  opacity: 1;
}

/* Desktop: disable mobile toggle */
@media (min-width: 960px) {
  .holdings-content {
    display: block !important;
    opacity: 1 !important;
  }
}
</style>
