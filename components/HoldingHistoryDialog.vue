<script setup lang="ts">
import { formatCurrency, formatDate, formatPercentage } from '~/utils/format'
import type { Holding, HoldingTransaction } from '~/types/models'

const props = defineProps<{
  modelValue: boolean
  holding?: Holding
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { fetchTransactions } = useInvestments()
const { navigateToAllocation } = useAllocationNavigation()

const transactions = ref<HoldingTransaction[]>([])
const loading = ref(false)
const summary = ref({ 
  total_count: 0, 
  total_allocated: 0,
  total_quantity: 0,
  pocket_sources: [] as Array<{ pocket_name: string, pocket_amount: number, percentage: number }>
})

const dialogValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Load transactions when dialog opens
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen && props.holding) {
    await loadTransactions()
  }
})

async function loadTransactions() {
  if (!props.holding) return
  
  loading.value = true
  try {
    const response = await fetchTransactions(props.holding.id)
    transactions.value = response.transactions || []
    summary.value = {
      total_count: response.summary?.total_count || 0,
      total_allocated: response.summary?.total_allocated || 0,
      total_quantity: response.summary?.total_quantity || 0,
      pocket_sources: response.summary?.pocket_sources || []
    }
  } catch (error) {
    console.error('Failed to load transactions:', error)
    transactions.value = []
    summary.value = { total_count: 0, total_allocated: 0, total_quantity: 0, pocket_sources: [] }
  } finally {
    loading.value = false
  }
}

function handleAllocationClick(allocationId: string) {
  navigateToAllocation(allocationId)
  dialogValue.value = false
}

function getTransactionIcon(type: string) {
  const icons: Record<string, string> = {
    buy: 'mdi-cart-plus',
    sell: 'mdi-cart-minus',
    dividend: 'mdi-cash-multiple',
    fee: 'mdi-cash-remove',
    adjustment: 'mdi-pencil'
  }
  return icons[type] || 'mdi-swap-horizontal'
}

function getTransactionColor(type: string) {
  const colors: Record<string, string> = {
    buy: 'success',
    sell: 'error',
    dividend: 'info',
    fee: 'warning',
    adjustment: 'grey'
  }
  return colors[type] || 'grey'
}
</script>

<template>
  <VDialog
    v-model="dialogValue"
    max-width="800"
    scrollable
  >
    <VCard>
      <VCardTitle class="pa-5 bg-primary text-white">
        <div class="d-flex align-center justify-space-between w-100">
          <div>
            <div class="text-h6">Transaction History</div>
            <div v-if="holding" class="text-caption mt-1 text-white text-opacity-80">
              {{ holding.instrument_name }} @ {{ holding.platform }}
            </div>
          </div>
          <VBtn icon="mdi-close" variant="text" @click="dialogValue = false" />
        </div>
      </VCardTitle>

      <VDivider />

      <!-- Summary Card -->
      <div v-if="!loading && (transactions?.length || 0) > 0" class="px-4 py-2">
        <VCard variant="tonal" color="primary">
          <VCardText class="pa-4">
            <VRow dense>
              <VCol cols="12" md="4">
                <div class="text-caption text-medium-emphasis">Total Transactions</div>
                <div class="text-h6">{{ summary.total_count }}</div>
              </VCol>
              <VCol cols="12" md="4">
                <div class="text-caption text-medium-emphasis">Total Invested</div>
                <div class="text-h6">{{ formatCurrency(summary.total_allocated) }}</div>
              </VCol>
              <VCol cols="12" md="4">
                <div class="text-caption text-medium-emphasis">Total Quantity</div>
                <div class="text-h6">{{ summary.total_quantity }} {{ holding?.asset_type === 'gold' ? 'gr' : 'units' }}</div>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </div>

      <!-- Funding Sources Card -->
      <div v-if="!loading && summary.pocket_sources && summary.pocket_sources.length > 0" class="px-4 pt-0 pb-2">
        <VCard variant="outlined" color="grey-lighten-2">
          <VCardText class="pa-3 d-flex align-stretch ga-2">
            <div class="text-caption text-medium-emphasis">Funding Sources:</div>
            <div class="d-flex ga-2 overflow-x-auto align-center">
              <VChip
                v-for="pocket in summary.pocket_sources"
                :key="pocket.pocket_name"
                size="x-small"
                color="primary"
                variant="tonal"
                class="flex-shrink-0"
              >
                {{ pocket.pocket_name }}: {{ formatPercentage(pocket.percentage) }}
              </VChip>
            </div>
          </VCardText>
        </VCard>
      </div>

      <VCardText class="pa-0" style="max-height: 500px;">
        <!-- Loading State -->
        <div v-if="loading" class="pa-6">
          <VSkeletonLoader type="list-item-avatar" v-for="i in 3" :key="i" class="mb-3" />
        </div>

        <!-- Empty State -->
        <div v-else-if="(transactions?.length || 0) === 0" class="text-center py-12">
          <VIcon icon="mdi-history" size="48" color="grey-lighten-1" class="mb-4" />
          <p class="text-h6 text-medium-emphasis">No Transactions</p>
          <p class="text-caption text-medium-emphasis">Transaction history will appear here</p>
        </div>

        <!-- Transaction Timeline -->
        <VList v-else lines="three" class="pa-0">
          <template v-for="(transaction, index) in transactions" :key="transaction.id">
            <VListItem class="py-4 px-6">
              <template #prepend>
                <VAvatar :color="getTransactionColor(transaction.transaction_type)" variant="tonal">
                  <VIcon :icon="getTransactionIcon(transaction.transaction_type)" />
                </VAvatar>
              </template>

              <VListItemTitle class="font-weight-semibold">
                <div class="d-flex align-center ga-2 text-capitalize">
                  <span class="text-primary">{{ transaction.transaction_type }}</span>
                  <VChip size="x-small" color="primary" variant="outlined">
                    {{ formatDate(transaction.purchase_date || transaction.created_at) }}
                  </VChip>
                </div>
              </VListItemTitle>

              <VListItemSubtitle>
                <div class="d-flex flex-column ga-1 mt-1">
                  <div class="d-flex align-center ga-2">
                    <VIcon icon="mdi-scale-balance" size="x-small" />
                    <span>{{ formatCurrency(transaction.amount) }}<template v-if="transaction.quantity"> • {{ transaction.quantity }} {{ holding?.asset_type === 'gold' ? 'gr' : 'units' }}</template></span>
                  </div>
                  <div v-if="transaction.average_price" class="d-flex align-center ga-2">
                    <VIcon icon="mdi-approximately-equal" size="x-small" />
                    <span>{{ formatCurrency(transaction.average_price) }}/{{ holding?.asset_type === 'gold' ? 'gr' : 'unit' }}</span>
                  </div>
                  <!-- Pocket Sources -->
                  <div v-if="transaction.pocket_sources && transaction.pocket_sources.length > 0" class="d-flex align-center ga-1 mt-1 flex-wrap">
                    <VIcon icon="mdi-wallet-outline" size="x-small" />
                    <VChip
                      v-for="source in transaction.pocket_sources"
                      :key="source.pocket_id"
                      size="x-small"
                      color="primary"
                      variant="tonal"
                    >
                      {{ source.pocket_name }}: {{ formatPercentage(source.percentage) }}
                    </VChip>
                  </div>
                </div>
              </VListItemSubtitle>

              <template #append>
                <div class="d-flex flex-column align-end ga-2">
                  <!-- Allocation Link -->
                  <VBtn
                    v-if="transaction.linked_allocation_id"
                    size="x-small"
                    variant="flat"
                    color="primary"
                    rounded="pill"
                    prepend-icon="mdi-link-variant"
                    @click="handleAllocationClick(transaction.linked_allocation_id)"
                  >
                    Allocation
                  </VBtn>
                  
                  <!-- Notes Badge -->
                  <VMenu v-if="transaction.notes" location="start">
                    <template #activator="{ props }">
                      <VIcon
                        v-bind="props"
                        icon="mdi-note-text"
                        size="small"
                        color="grey"
                      />
                    </template>
                    <VCard max-width="300">
                      <VCardText class="text-caption">
                        {{ transaction.notes }}
                      </VCardText>
                    </VCard>
                  </VMenu>
                </div>
              </template>
            </VListItem>

            <VDivider v-if="index < transactions.length - 1" />
          </template>
        </VList>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4">
        <VSpacer />
        <VBtn variant="text" @click="dialogValue = false">
          Close
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
