<script setup lang="ts">
import { formatCurrency } from '~/utils/format'
import { extractInstrumentAlias } from '~/utils/instrumentAlias'
import type { Holding } from '~/types/models'

const { holdings, loading, holdingsByAsset, handleDeleteHolding } = useInvestments()
const { navigateToAllocation } = useAllocationNavigation()

const showHoldingDialog = ref(false)
const editingHolding = ref<Holding | undefined>(undefined)
const isExpanded = ref(false)
const expandedNotes = ref<Record<string, boolean>>({})

function toggleNote(holdingId: string) {
  expandedNotes.value[holdingId] = !expandedNotes.value[holdingId]
}

function openEditDialog(holding: Holding) {
  editingHolding.value = holding
  showHoldingDialog.value = true
}

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

// Watch for new asset types and expand only newly added ones
watch(() => holdingsByAsset.value, (newVal, oldVal) => {
  const newKeys = Object.keys(newVal)
  const oldKeys = oldVal ? Object.keys(oldVal) : []
  
  // Only expand newly added asset types
  newKeys.forEach(key => {
    if (!oldKeys.includes(key) && expandedGroups.value[key] === undefined) {
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

// Note: Profit calculations moved to Simulate dialog (Phase 3)
// Holdings only show initial_investment for now
</script>

<template>
  <div>
    <!-- Holdings Section -->
    <VCard elevation="0" variant="flat" class="bg-surface border-primary border-opacity-10" :class="{ 'disabled-card': !loading && holdings.length === 0 }" style="border-radius: 16px;">
      <VCardTitle class="pa-5 cursor-pointer user-select-none d-md-cursor-default" @click="toggleExpand">
        <div class="d-flex align-center justify-space-between w-100 ga-3">
          <div class="flex-grow-1">
            <div class="d-flex align-center text-wrap text-body-1 text-sm-h6 text-primary">
              <VIcon icon="mdi-briefcase" class="mr-2" color="primary" />
              Investment Holdings
            </div>
            <!-- Mobile: Holdings count -->
            <div class="subtitle-stats d-md-none mt-1">
              {{ holdings.length }} {{ holdings.length === 1 ? 'holding' : 'holdings' }}
            </div>
          </div>
          <!-- Desktop: Holdings count -->
          <div class="subtitle-stats-desktop d-none d-md-flex">
            {{ holdings.length }} {{ holdings.length === 1 ? 'holding' : 'holdings' }}
          </div>
          <!-- Mobile: Toggle button -->
          <VBtn class="d-md-none" :icon="isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'" size="small"
            variant="text" />
        </div>
      </VCardTitle>

      <VDivider />

      <!-- Shared Content: Desktop always visible, Mobile collapsible -->
      <Transition name="expand">
        <VCardText v-show="isExpanded" class="pa-6 holdings-content">

          <!-- Note: Profit/Loss will be shown in Simulate dialog (Phase 3) -->
          <VAlert v-if="!loading && holdings.length > 0" color="info" size="small" variant="tonal" class="mb-3">
            <div class="text-caption">
              <VIcon icon="mdi-calculator" size="small" class="mr-1" />
              Use Simulate to calculate profit/loss
            </div>
          </VAlert>

          <!-- Loading State -->
          <div v-if="loading" class="py-4">
            <VSkeletonLoader type="list-item" v-for="i in 3" :key="i" class="mb-3" />
          </div>

          <!-- Empty State -->
          <div v-else-if="holdings.length === 0" class="text-center py-12">
            <VIcon icon="mdi-briefcase-off-outline" size="48" color="grey-lighten-1" class="mb-4" />
            <p class="text-h6 text-medium-emphasis mb-2">No Holdings Yet</p>
            <VAlert type="info" variant="tonal" class="mx-auto" border="start" prominent title="Allocation-first workflow" style="max-width: 500px;">
              <template #text>
                <div class="text-caption text-left">
                  Holdings can only be created from allocation cards
                </div>
              </template>
            </VAlert>
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
                            <VChip size="x-small" color="primary" variant="tonal">
                              {{ extractInstrumentAlias(holding.instrument_name) }}
                            </VChip>
                            <VMenu>
                              <template v-slot:activator="{ props }">
                                <VBtn icon="mdi-dots-vertical" size="x-small" variant="text" v-bind="props" />
                              </template>
                              <VList density="compact">
                                <VListItem @click="openEditDialog(holding)">
                                  <VListItemTitle>Edit</VListItemTitle>
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

                          <!-- Platform -->
                          <div class="d-flex justify-space-between align-center mb-2">
                            <div class="text-body-2 font-weight-semibold text-primary">{{ holding.platform }}</div>
                          </div>

                          <!-- Values -->
                          <!-- Investment Info -->
                          <div class="text-caption text-medium-emphasis mb-1">Invested</div>
                          <div class="text-body-2 font-weight-medium mb-3">
                            {{ formatCurrency(holding.initial_investment) }}
                          </div>

                          <!-- Optional Info -->
                          <div v-if="holding.quantity || holding.notes || holding.linked_allocation_id" class="mt-3 pt-3 border-t border-opacity-10">
                            <div v-if="holding.quantity" class="text-caption text-medium-emphasis">
                              <VIcon :icon="getAssetIcon(holding.asset_type as string)" size="x-small" class="mr-1" />
                              {{ holding.quantity }} {{ holding.asset_type === 'gold' ? 'gram' : 'units' }}
                            </div>
                            <div 
                              v-if="holding.linked_allocation_id" 
                              class="text-caption text-primary my-1 linked-budget-text"
                              @click.stop="navigateToAllocation(holding.linked_allocation_id)"
                            >
                              <VIcon icon="mdi-link-variant" size="x-small" class="mr-1" />
                              Linked to Budget
                            </div>
                            <div v-if="holding.notes" class="mt-1 d-flex flex-column">
                              <div class="d-flex align-baseline font-italic">
                                <VIcon icon="mdi-note-text-outline" size="x-small" class="mr-1 text-medium-emphasis" />
                                <p 
                                  class="text-caption text-medium-emphasis my-0"
                                  :class="{ 'note-collapsed': !expandedNotes[holding.id] }"
                                >
                                  {{ holding.notes }}
                                </p>
                              </div>
                              <span
                                v-if="holding.notes.length > 20 && ($vuetify.display.mdAndUp || $vuetify.display.xs) || holding.notes.length > 19 && $vuetify.display.lg"
                                class="align-self-end text-caption text-none d-inline-block underline text-info w-full"
                                @click.stop="toggleNote(holding.id)"
                              >
                                {{ expandedNotes[holding.id] ? 'Show less' : 'See more' }}
                              </span>
                            </div>
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
    <HoldingDialog v-model="showHoldingDialog" :holding="editingHolding" />
  </div>
</template>

<style scoped>
.subtitle-stats {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
  font-weight: 400;
}

.subtitle-stats-desktop {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.6);
  font-weight: 400;
}

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

/* Disabled card appearance when no holdings */
.disabled-card {
  opacity: 0.5;
  pointer-events: none;
  user-select: none;
}

.linked-budget-text {
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  text-decoration: underline;
  text-decoration-style: dotted;
  text-underline-offset: 2px;
}

.linked-budget-text:hover {
  color: rgb(var(--v-theme-primary)) !important;
  text-decoration-style: solid;
  transform: translateX(2px);
}

.note-collapsed {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90%;
  word-break: break-word;
}
</style>
