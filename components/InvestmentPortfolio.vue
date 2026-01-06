<script setup lang="ts">
import { formatCurrency } from '~/utils/format'
import type { Holding } from '~/types/models'

const { holdings, loading, holdingsByAsset, handleDeleteHolding } = useInvestments()

const showHoldingDialog = ref(false)
const editingHolding = ref<Holding | undefined>(undefined)

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

const assetTypeIcons: Record<string, string> = {
  gold: '🥇',
  stock_etf: '📈',
  mutual_fund: '💰',
  bond: '📊',
  crypto: '₿',
  other: '📦'
}

function getAssetIcon(type: string) {
  return assetTypeIcons[type] || '📦'
}

function calculateProfit(holding: Holding) {
  return holding.current_value - holding.initial_investment
}

function calculateProfitPercentage(holding: Holding) {
  if (holding.initial_investment === 0) return 0
  return (calculateProfit(holding) / holding.initial_investment) * 100
}

function getProfitColor(holding: Holding) {
  return calculateProfit(holding) >= 0 ? 'success' : 'error'
}
</script>

<template>
  <div class="investment-portfolio">
    <!-- Portfolio Summary -->
    <PortfolioSummaryCard class="mb-6" />

    <!-- Holdings Section -->
    <VCard elevation="0" class="holdings-card">
      <VCardText class="pa-5">
        <div class="d-flex align-center justify-space-between mb-4">
          <div class="d-flex align-center">
            <VIcon icon="mdi-briefcase" size="24" color="primary" class="mr-2" />
            <span class="text-h6 font-weight-bold text-primary">Investment Holdings</span>
            <VChip v-if="holdings.length > 0" size="small" class="ml-2" color="primary" variant="tonal">
              {{ holdings.length }}
            </VChip>
          </div>
          <VBtn
            color="primary"
            variant="tonal"
            prepend-icon="mdi-plus"
            @click="openCreateDialog"
            class="text-none"
            rounded="lg"
          >
            Add Holding
          </VBtn>
        </div>

        <VDivider class="mb-4" />

        <!-- Loading State -->
        <div v-if="loading" class="text-center py-8">
          <VProgressCircular indeterminate color="primary" size="48" />
          <p class="text-caption text-medium-emphasis mt-3">Loading holdings...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="holdings.length === 0" class="empty-state text-center py-12">
          <VIcon icon="mdi-briefcase-off-outline" size="80" color="grey-lighten-1" class="mb-4" />
          <p class="text-h6 text-medium-emphasis mb-2">No Holdings Yet</p>
          <p class="text-caption text-medium-emphasis mb-4">
            Start tracking your investments by adding your first holding
          </p>
          <VBtn
            color="primary"
            prepend-icon="mdi-plus"
            @click="openCreateDialog"
            class="text-none"
          >
            Add First Holding
          </VBtn>
        </div>

        <!-- Holdings List -->
        <div v-else>
          <div
            v-for="(group, assetType) in holdingsByAsset"
            :key="assetType"
            class="asset-group mb-4"
          >
            <!-- Asset Group Header -->
            <div class="asset-header d-flex align-center mb-3">
              <span class="asset-icon mr-2">{{ getAssetIcon(assetType) }}</span>
              <span class="text-subtitle-1 font-weight-bold">{{ group.name }}</span>
              <VChip size="x-small" class="ml-2" color="primary" variant="tonal">
                {{ group.holdings.length }}
              </VChip>
            </div>

            <!-- Holdings in this group -->
            <VRow class="ga-3">
              <VCol
                v-for="holding in group.holdings"
                :key="holding.id"
                cols="12"
                md="6"
                lg="4"
              >
                <VCard variant="outlined" class="holding-card" hover>
                  <VCardText class="pa-4">
                    <!-- Platform & Actions -->
                    <div class="d-flex align-center justify-space-between mb-2">
                      <VChip size="small" color="primary" variant="tonal">
                        {{ holding.platform }}
                      </VChip>
                      <VMenu>
                        <template v-slot:activator="{ props }">
                          <VBtn
                            icon="mdi-dots-vertical"
                            size="x-small"
                            variant="text"
                            v-bind="props"
                          />
                        </template>
                        <VList density="compact">
                          <VListItem @click="openEditDialog(holding)">
                            <VListItemTitle>Update Value</VListItemTitle>
                          </VListItem>
                          <VDivider />
                          <VListItem @click="handleDeleteHolding(holding)">
                            <template v-slot:prepend>
                              <VIcon icon="mdi-delete" color="error" />
                            </template>
                            <VListItemTitle class="text-error font-weight-medium">
                              Delete
                            </VListItemTitle>
                          </VListItem>
                        </VList>
                      </VMenu>
                    </div>

                    <!-- Instrument Name -->
                    <h3 class="text-subtitle-2 font-weight-bold mb-3">
                      {{ holding.instrument_name }}
                    </h3>

                    <!-- Values -->
                    <div class="values-grid mb-3">
                      <div>
                        <p class="text-caption text-medium-emphasis mb-1">Initial</p>
                        <p class="text-body-2 font-weight-medium">
                          {{ formatCurrency(holding.initial_investment) }}
                        </p>
                      </div>
                      <div>
                        <p class="text-caption text-medium-emphasis mb-1">Current</p>
                        <p class="text-body-2 font-weight-bold">
                          {{ formatCurrency(holding.current_value) }}
                        </p>
                      </div>
                    </div>

                    <!-- Profit/Loss -->
                    <div class="profit-indicator" :class="`bg-${getProfitColor(holding)}`">
                      <VIcon
                        :icon="calculateProfit(holding) >= 0 ? 'mdi-trending-up' : 'mdi-trending-down'"
                        size="14"
                        class="mr-1"
                      />
                      <span class="text-caption font-weight-bold">
                        {{ formatCurrency(calculateProfit(holding)) }}
                        ({{ calculateProfitPercentage(holding).toFixed(2) }}%)
                      </span>
                    </div>

                    <!-- Optional Info -->
                    <div v-if="holding.quantity || holding.notes" class="mt-3 pt-3" style="border-top: 1px dashed rgba(0,0,0,0.1)">
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
          </div>
        </div>
      </VCardText>
    </VCard>

    <!-- Holding Dialog -->
    <HoldingDialog
      v-model="showHoldingDialog"
      :holding="editingHolding"
      @save="handleDialogSave"
    />
  </div>
</template>

<style scoped>
.investment-portfolio {
  width: 100%;
}

.holdings-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  border: 1px solid rgba(15, 118, 110, 0.1);
}

.asset-header {
  padding: 8px 12px;
  background: rgba(15, 118, 110, 0.05);
  border-radius: 8px;
}

.asset-icon {
  font-size: 1.5rem;
}

.holding-card {
  border-radius: 12px;
  border-color: rgba(15, 118, 110, 0.2);
  transition: all 0.3s ease;
}

.holding-card:hover {
  border-color: rgba(15, 118, 110, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(15, 118, 110, 0.15);
}

.values-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.profit-indicator {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 6px;
  color: white;
}

.bg-success {
  background-color: rgb(var(--v-theme-success));
}

.bg-error {
  background-color: rgb(var(--v-theme-error));
}
</style>
