<script setup lang="ts">
import { formatNumberInput, parseNumberInput, formatCurrency } from '~/utils/format'
import type { Holding } from '~/types/models'
import { assetTypes, commonPlatforms, instrumentOptionsByAssetType } from '~/constants/investmentOptions'

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

// Dynamic instrument options based on selected asset type
const instrumentOptions = computed(() => {
  return instrumentOptionsByAssetType[form.value.asset_type] || []
})

const initialDisplay = ref('')
const currentDisplay = ref('')
const averagePriceDisplay = ref('')
const submitting = ref(false)
const currentStep = ref(1)

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

function handleAveragePriceInput(event: Event) {
  const input = event.target as HTMLInputElement
  const parsed = parseNumberInput(input.value)
  form.value.average_price = parsed > 0 ? parsed : undefined
  averagePriceDisplay.value = parsed > 0 ? formatNumberInput(parsed) : ''
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
  averagePriceDisplay.value = ''
  submitting.value = false
  currentStep.value = 1
}

function nextStep() {
  if (currentStep.value < 3) {
    currentStep.value++
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const canProceedStep1 = computed(() => {
  if (isEditMode.value) return true
  return form.value.asset_type && form.value.asset_name && form.value.platform && form.value.instrument_name
})

const canProceedStep2 = computed(() => {
  return form.value.initial_investment > 0 && form.value.current_value > 0
})

// Auto-scroll stepper header on mobile
watch(currentStep, (newStep) => {
  nextTick(() => {
    const header = document.querySelector('.stepper-header-scroll')
    if (header && window.innerWidth < 600) {
      const activeItem = header.querySelector('.v-stepper-item--selected')
      if (activeItem) {
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  })
})

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
    averagePriceDisplay.value = props.holding.average_price ? formatNumberInput(props.holding.average_price) : ''
  } else if (!newVal) {
    resetForm()
  }
})
</script>

<template>
  <VDialog v-model="dialog" max-width="800" persistent>
    <VCard>
      <VCardTitle class="pa-5 text-subtitle-1 font-weight-semibold text-primary">
        <VIcon icon="mdi-finance" class="mr-2" />
        {{ isEditMode ? 'Update Holding' : 'Add Investment Holding' }}
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-5 overflow-y-auto" style="max-height: 70vh;">
        <VStepper v-model="currentStep" flat>
          <VStepperHeader class="border rounded-pill mx-auto mx-sm-15 mb-15 stepper-header-scroll">
            <VStepperItem
              title="Asset Info"
              :complete="currentStep > 1"
              :value="1"
              color="primary"
            >
              <template v-slot:icon>
                <VIcon>mdi-information</VIcon>
              </template>
            </VStepperItem>

            <VDivider />

            <VStepperItem
              title="Financial Values"
              :complete="currentStep > 2"
              :value="2"
              color="primary"
            >
              <template v-slot:icon>
                <VIcon>mdi-currency-usd</VIcon>
              </template>
            </VStepperItem>

            <VDivider />

            <VStepperItem
              title="Additional Info"
              :complete="currentStep > 3"
              :value="3"
              color="primary"
            >
              <template v-slot:icon>
                <VIcon>mdi-note-text</VIcon>
              </template>
            </VStepperItem>
          </VStepperHeader>

          <VContainer fluid class="px-0">
            <!-- Stepper Content -->
            <VStepperWindow class="ma-0 pt-2">
            <!-- Step 1: Asset Information -->
            <VStepperWindowItem :value="1">
              <VRow>
                <!-- Asset Type (disabled in edit mode) -->
                <VCol cols="12" md="6">
                  <VSelect
                    v-model="form.asset_type"
                    label="Asset Type"
                    :items="assetTypes"
                    item-value="value"
                    item-title="title"
                    variant="outlined"
                    :disabled="isEditMode || submitting"
                  >
                    <template v-slot:selection="{ item }">
                      <div class="d-flex align-center">
                        <VIcon :icon="item.raw.icon" size="20" class="mr-2" />
                        {{ item.raw.title }}
                      </div>
                    </template>
                    <template v-slot:item="{ props, item }">
                      <VListItem v-bind="props">
                        <template v-slot:prepend>
                          <VIcon :icon="item.raw.icon" size="20" />
                        </template>
                      </VListItem>
                    </template>
                  </VSelect>
                </VCol>

                <!-- Asset Name (disabled in edit mode) -->
                <VCol cols="12" md="6">
                  <VTextField
                    v-model="form.asset_name"
                    label="Asset Name"
                    placeholder="e.g., Emas"
                    variant="outlined"
                    :disabled="isEditMode || submitting"
                  />
                </VCol>

                <!-- Platform (disabled in edit mode) -->
                <VCol cols="12" md="6">
                  <VCombobox
                    v-model="form.platform"
                    label="Platform"
                    :items="commonPlatforms"
                    placeholder="Select or type platform name"
                    variant="outlined"
                    :disabled="isEditMode || submitting"
                    clearable
                  >
                    <template v-slot:prepend-inner>
                      <VIcon icon="mdi-store" size="20" />
                    </template>
                  </VCombobox>
                </VCol>

                <!-- Instrument Name (disabled in edit mode) -->
                <VCol cols="12" md="6">
                  <VCombobox
                    v-model="form.instrument_name"
                    label="Instrument Name"
                    :items="instrumentOptions"
                    placeholder="Select or type instrument name"
                    hint="Select from recommendations or type your own"
                    persistent-hint
                    variant="outlined"
                    :disabled="isEditMode || submitting"
                    clearable
                  >
                    <template v-slot:prepend-inner>
                      <VIcon icon="mdi-certificate" size="20" />
                    </template>
                  </VCombobox>
                </VCol>
              </VRow>
            </VStepperWindowItem>

            <!-- Step 2: Financial Values -->
            <VStepperWindowItem :value="2">
              <VRow>
                <!-- Initial Investment (disabled in edit mode) -->
                <VCol cols="12" md="6">
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
                <VCol cols="12" md="6">
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
                <VCol cols="12" md="6">
                  <VTextField
                    v-model.number="form.quantity"
                    :label="form.asset_type === 'gold' ? 'Quantity (gram)' : 'Quantity (Optional)'"
                    placeholder="0"
                    variant="outlined"
                    type="number"
                    step="0.0001"
                    :disabled="submitting"
                    :suffix="form.asset_type === 'gold' ? 'gram' : undefined"
                  />
                </VCol>

                <!-- Average Price (optional) -->
                <VCol cols="12" md="6">
                  <VTextField
                    v-model="averagePriceDisplay"
                    label="Average Price per Unit (Optional)"
                    placeholder="0"
                    variant="outlined"
                    prefix="Rp"
                    inputmode="numeric"
                    :disabled="submitting"
                    @input="handleAveragePriceInput"
                    hint="Price per unit (e.g., per share, per gram, per BTC)"
                    persistent-hint
                  />
                </VCol>
              </VRow>
            </VStepperWindowItem>

            <!-- Step 3: Additional Information -->
            <VStepperWindowItem :value="3">
              <VRow>
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
            </VStepperWindowItem>
          </VStepperWindow>
          </VContainer>
        </VStepper>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4 flex-column flex-sm-row gap-2">
        <VBtn
          variant="text"
          color="grey"
          @click="dialog = false"
          :disabled="submitting"
          class="text-none"
        >
          Cancel
        </VBtn>
        <VSpacer />
        <div class="w-100 w-sm-auto d-flex ga-0 ga-sm-4 justify-space-between">
          <VBtn
            v-if="currentStep > 1"
            variant="text"
            @click="prevStep"
            :disabled="submitting"
            class="text-none"
          >
            Back
          </VBtn>
          <VBtn
            v-if="currentStep < 3"
            color="primary"
            variant="flat"
            @click="nextStep"
            :disabled="(currentStep === 1 && !canProceedStep1) || (currentStep === 2 && !canProceedStep2) || submitting"
            class="text-none"
          >
            Next
          </VBtn>
          <VBtn
            v-else
            color="primary"
            variant="flat"
            @click="handleSubmit"
            :loading="submitting"
            :disabled="submitting"
            class="text-none px-5"
          >
            {{ isEditMode ? 'Update' : 'Add Holding' }}
          </VBtn>
        </div>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.stepper-header-scroll {
  overflow-x: auto;
  scroll-behavior: smooth;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

.stepper-header-scroll::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

/* Auto scroll on mobile when step changes */
@media (max-width: 599px) {
  .stepper-header-scroll {
    scroll-snap-type: x mandatory;
  }
  
  .stepper-header-scroll :deep(.v-stepper-item) {
    scroll-snap-align: center;
  }
}
</style>
