<script setup lang="ts">
import { formatNumberInput, parseNumberInput, formatCurrency } from '~/utils/format'
import type { Holding } from '~/types/models'

const props = defineProps<{
  modelValue: boolean
  holding?: Holding
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': []
}>()

const { createHolding, updateHolding } = useInvestments()
const { allocations } = useAllocations()
const { success: showSuccess, error: showError } = useNotification()

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEditMode = computed(() => !!props.holding)

const form = ref({
  asset_type: 'gold' as 'gold' | 'stock_etf' | 'mutual_fund' | 'bond' | 'crypto' | 'other',
  asset_name: '',
  platform: '',
  instrument_name: '',
  initial_investment: 0,
  current_value: 0,
  quantity: undefined as number | undefined,
  average_price: undefined as number | undefined,
  notes: '',
  linked_allocation_id: undefined as string | undefined
})

const assetTypes = [
  { value: 'gold', label: '🥇 Emas' },
  { value: 'stock_etf', label: '📈 Saham ETF' },
  { value: 'mutual_fund', label: '💰 Reksadana' },
  { value: 'bond', label: '📊 Obligasi' },
  { value: 'crypto', label: '₿ Crypto' },
  { value: 'other', label: '📦 Lainnya' }
]

const initialDisplay = ref('')
const currentDisplay = ref('')
const submitting = ref(false)

function handleInitialInput(event: Event) {
  const input = event.target as HTMLInputElement
  const parsed = parseNumberInput(input.value)
  form.value.initial_investment = parsed
  initialDisplay.value = parsed > 0 ? formatNumberInput(parsed) : ''
}

function handleCurrentInput(event: Event) {
  const input = event.target as HTMLInputElement
  const parsed = parseNumberInput(input.value)
  form.value.current_value = parsed
  currentDisplay.value = parsed > 0 ? formatNumberInput(parsed) : ''
}

const allocationItems = computed(() => [
  { value: undefined, title: 'None (No Link)' },
  ...allocations.value.map(alloc => ({
    value: alloc.id,
    title: `${new Date(alloc.created_at).toLocaleDateString()} - ${formatCurrency(alloc.source_amount)}`
  }))
])

function resetForm() {
  form.value = {
    asset_type: 'gold',
    asset_name: '',
    platform: '',
    instrument_name: '',
    initial_investment: 0,
    current_value: 0,
    quantity: undefined,
    average_price: undefined,
    notes: '',
    linked_allocation_id: undefined
  }
  initialDisplay.value = ''
  currentDisplay.value = ''
  submitting.value = false
}

async function handleSubmit() {
  if (!form.value.asset_name || !form.value.platform || !form.value.instrument_name ||
      form.value.initial_investment <= 0 || form.value.current_value <= 0) {
    showError('Please fill all required fields')
    return
  }

  submitting.value = true
  try {
    if (isEditMode.value && props.holding) {
      // Update mode - only update mutable fields
      await updateHolding(props.holding.id, {
        current_value: form.value.current_value,
        quantity: form.value.quantity,
        average_price: form.value.average_price,
        notes: form.value.notes
      })
      showSuccess('Holding updated successfully')
    } else {
      // Create mode
      await createHolding(form.value)
      showSuccess('Holding created successfully')
    }
    
    emit('save')
    dialog.value = false
    resetForm()
  } catch (error) {
    // Error already shown in composable
  } finally {
    submitting.value = false
  }
}

watch(() => props.modelValue, (newVal) => {
  if (newVal && props.holding) {
    // Edit mode - populate form
    form.value = {
      asset_type: (props.holding as any).asset_type || 'gold',
      asset_name: (props.holding as any).asset_name || '',
      platform: props.holding.platform,
      instrument_name: props.holding.instrument_name,
      initial_investment: props.holding.initial_investment,
      current_value: props.holding.current_value,
      quantity: props.holding.quantity,
      average_price: props.holding.average_price,
      notes: props.holding.notes || '',
      linked_allocation_id: props.holding.linked_allocation_id || undefined
    }
    initialDisplay.value = formatNumberInput(props.holding.initial_investment)
    currentDisplay.value = formatNumberInput(props.holding.current_value)
  } else if (!newVal) {
    resetForm()
  }
})
</script>

<template>
  <VDialog v-model="dialog" max-width="600" persistent>
    <VCard>
      <VCardTitle class="pa-5 text-subtitle-1 font-weight-semibold text-primary">
        <VIcon icon="mdi-finance" class="mr-2" />
        {{ isEditMode ? 'Update Holding' : 'Add Investment Holding' }}
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-5 overflow-y-auto" style="max-height: 70vh;">
        <VRow class="ga-4">
          <!-- Asset Type (disabled in edit mode) -->
          <VCol cols="12" sm="6">
            <VSelect
              v-model="form.asset_type"
              label="Asset Type"
              :items="assetTypes"
              variant="outlined"
              :disabled="isEditMode || submitting"
            />
          </VCol>

          <!-- Asset Name (disabled in edit mode) -->
          <VCol cols="12" sm="6">
            <VTextField
              v-model="form.asset_name"
              label="Asset Name"
              placeholder="e.g., Emas"
              variant="outlined"
              :disabled="isEditMode || submitting"
            />
          </VCol>

          <!-- Platform (disabled in edit mode) -->
          <VCol cols="12" sm="6">
            <VTextField
              v-model="form.platform"
              label="Platform"
              placeholder="e.g., Bibit, Pluang"
              variant="outlined"
              :disabled="isEditMode || submitting"
            />
          </VCol>

          <!-- Instrument Name (disabled in edit mode) -->
          <VCol cols="12" sm="6">
            <VTextField
              v-model="form.instrument_name"
              label="Instrument"
              placeholder="e.g., Emas Antam"
              variant="outlined"
              :disabled="isEditMode || submitting"
            />
          </VCol>

          <!-- Initial Investment (disabled in edit mode) -->
          <VCol cols="12" sm="6">
            <VTextField
              v-model="initialDisplay"
              label="Initial Investment"
              placeholder="0"
              variant="outlined"
              prefix="Rp"
              inputmode="numeric"
              :disabled="isEditMode || submitting"
              @input="handleInitialInput"
            />
          </VCol>

          <!-- Current Value (always editable) -->
          <VCol cols="12" sm="6">
            <VTextField
              v-model="currentDisplay"
              label="Current Value"
              placeholder="0"
              variant="outlined"
              prefix="Rp"
              inputmode="numeric"
              :disabled="submitting"
              @input="handleCurrentInput"
            />
          </VCol>

          <!-- Quantity (optional) -->
          <VCol cols="12" sm="6">
            <VTextField
              v-model.number="form.quantity"
              label="Quantity (Optional)"
              placeholder="0"
              variant="outlined"
              type="number"
              step="0.0001"
              :disabled="submitting"
            />
          </VCol>

          <!-- Average Price (optional) -->
          <VCol cols="12" sm="6">
            <VTextField
              v-model.number="form.average_price"
              label="Average Price (Optional)"
              placeholder="0"
              variant="outlined"
              type="number"
              prefix="Rp"
              :disabled="submitting"
            />
          </VCol>

          <!-- Linked Allocation -->
          <VCol cols="12">
            <VSelect
              v-model="form.linked_allocation_id"
              label="Link to Budget Allocation (Optional)"
              :items="allocationItems"
              variant="outlined"
              :disabled="submitting"
              clearable
            >
              <template v-slot:prepend-inner>
                <VIcon icon="mdi-link-variant" size="20" />
              </template>
            </VSelect>
          </VCol>

          <!-- Notes -->
          <VCol cols="12">
            <VTextField
              v-model="form.notes"
              label="Notes (Optional)"
              placeholder="Additional notes..."
              variant="outlined"
              :disabled="submitting"
            />
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4 flex-column flex-sm-row">
        <VSpacer />
        <VBtn
          variant="text"
          color="grey"
          @click="dialog = false"
          :disabled="submitting"
          class="text-none"
        >
          Cancel
        </VBtn>
        <VBtn
          color="primary"
          variant="flat"
          @click="handleSubmit"
          :loading="submitting"
          :disabled="submitting"
          class="text-none px-5"
        >
          {{ isEditMode ? 'Update' : 'Add Holding' }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
