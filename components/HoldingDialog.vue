<script setup lang="ts">
import { formatNumberInput, parseNumberInput, formatCurrency, formatQuantity, formatDateInput } from '~/utils/format'
import type { Holding, Allocation } from '~/types/models'
import { assetTypes, commonPlatforms, instrumentOptionsByAssetType } from '~/constants/investmentOptions'

const props = defineProps<{
  modelValue: boolean
  holding?: Holding
  allocationContext?: Allocation | null
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
  asset_type: null as string | 'gold' | 'stock' | 'etf' | 'mutual_fund' | 'bond' | 'crypto' | 'other' | null | any,
  asset_name: '',
  platform: null as string | null,
  instrument_name: null as string | null,
  initial_investment: 0,
  average_price: undefined as number | undefined,
  quantity: 0,
  purchase_date: formatDateInput(null),
  notes: '',
  linked_allocation_id: undefined as string | undefined
})

// Grouped instrument options (all instruments organized by asset type)
const groupedInstrumentOptions = computed(() => {
  const items: any[] = []
  
  assetTypes.forEach((type, index) => {
    const instruments = instrumentOptionsByAssetType[type.value] || []
    if (instruments.length > 0) {
      // Add divider before each group (except first)
      if (index > 0) {
        items.push({ type: 'divider' })
      }
      
      // Add subheader with icon
      items.push({
        type: 'subheader',
        title: type.title, // "Emas", "Saham", etc.
        icon: type.icon,
        assetType: type.value
      })
      
      // Add instrument items
      instruments.forEach(instrument => {
        items.push({
          title: instrument,
          value: instrument,
          group: type.title,
          assetType: type.value,
          icon: type.icon
        })
      })
    }
  })
  
  return items
})

// Auto-derive asset type and asset name from selected instrument
watch(() => form.value.instrument_name, (newInstrument) => {
  if (newInstrument && !isEditMode.value) {
    // Find the selected instrument in grouped options (skip subheaders and dividers)
    const selected = groupedInstrumentOptions.value.find(
      item => item.type !== 'subheader' && item.type !== 'divider' && item.value === newInstrument
    )
    
    if (selected) {
      // Auto-set asset type and asset name
      form.value.asset_type = selected.assetType
      form.value.asset_name = selected.group
    }
  }
})

// Quantity is auto-calculated from initial_investment / average_price
const initialDisplay = ref('')
const averagePriceDisplay = ref('')
const submitting = ref(false)
const currentStep = ref(1)

// Auto-calculated quantity (readonly)
const calculatedQuantity = computed(() => {
  if (form.value.average_price && form.value.average_price > 0) {
    return form.value.initial_investment / form.value.average_price
  }
  return 0
})

function handleInitialInput(event: Event) {
  const input = event.target as HTMLInputElement
  const parsed = parseNumberInput(input.value)
  form.value.initial_investment = parsed
  initialDisplay.value = parsed > 0 ? formatNumberInput(parsed) : ''
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
    asset_type: null,
    asset_name: '',
    platform: null,
    instrument_name: null,
    initial_investment: 0,
    average_price: undefined,
    quantity: 0,
    purchase_date: formatDateInput(null),
    notes: '',
    linked_allocation_id: undefined
  }
  initialDisplay.value = ''
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
  return form.value.platform && form.value.instrument_name
})

const isFromAllocation = computed(() => !!props.allocationContext)

const canProceedStep2 = computed(() => {
  return form.value.initial_investment > 0 && form.value.average_price && form.value.average_price > 0
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
  // Validate required fields
  if (!form.value.asset_type) {
    showError('Please select an asset type')
    return
  }
  
  if (!form.value.platform || !form.value.instrument_name ||
      form.value.initial_investment <= 0 || !form.value.average_price || form.value.average_price <= 0) {
    showError('Please fill all required fields')
    return
  }
  
  // Auto-fill asset_name from asset_type (for database, but hidden from user)
  const assetTypeObj = assetTypes.find(at => at.value === form.value.asset_type)
  const autoAssetName = assetTypeObj?.title || 'Unknown'
  
  // After validation, we know these values are not null
  const submitData = {
    asset_type: form.value.asset_type as 'gold' | 'stock' | 'etf' | 'mutual_fund' | 'bond' | 'crypto' | 'other',
    asset_name: autoAssetName, // Auto-filled from asset_type
    platform: form.value.platform as string,
    instrument_name: form.value.instrument_name as string,
    initial_investment: form.value.initial_investment,
    average_price: form.value.average_price!, // Required - quantity will be auto-calculated
    purchase_date: form.value.purchase_date,
    notes: form.value.notes,
    linked_allocation_id: form.value.linked_allocation_id
  }

  submitting.value = true
  try {
    if (isEditMode.value && props.holding) {
      // Update mode - update all mutable financial fields
      await updateHolding(props.holding.id, {
        initial_investment: form.value.initial_investment,
        average_price: form.value.average_price!,
        purchase_date: form.value.purchase_date,
        notes: form.value.notes
      })
      showSuccess('Holding updated successfully')
    } else {
      // Create mode - use submitData with finalAssetName
      await createHolding(submitData)
      showSuccess('Holding added successfully')
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
  if (newVal) {
    // Dialog is opening
    if (props.allocationContext) {
      // Creating from allocation - pre-fill allocation data
      form.value.linked_allocation_id = props.allocationContext.id
      form.value.initial_investment = props.allocationContext.source_amount
      form.value.purchase_date = formatDateInput(props.allocationContext.date)
      initialDisplay.value = formatNumberInput(props.allocationContext.source_amount)
      currentStep.value = 1
    } else if (props.holding) {
      // Edit mode - populate form with holding data
      const initialInvestment = Number(props.holding.initial_investment) || 0
      const averagePrice = Number(props.holding.average_price) || 0
      const quantityNum = Number(props.holding.quantity) || 0
      
      form.value = {
        asset_type: (props.holding as any).asset_type || 'gold',
        asset_name: (props.holding as any).asset_name || '',
        platform: props.holding.platform,
        instrument_name: props.holding.instrument_name,
        initial_investment: initialInvestment,
        average_price: averagePrice > 0 ? averagePrice : undefined,
        quantity: quantityNum,
        purchase_date: formatDateInput(props.holding.purchase_date),
        notes: props.holding.notes || '',
        linked_allocation_id: props.holding.linked_allocation_id || undefined
      }
      initialDisplay.value = formatNumberInput(initialInvestment)
      averagePriceDisplay.value = averagePrice > 0 ? formatNumberInput(averagePrice) : ''
    } else {
      // Create mode - reset form to defaults
      resetForm()
    }
  } else {
    // Dialog is closing - reset form to clean state
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
        <VStepper v-model="currentStep" flat :mobile="$vuetify.display.xs">
          <VStepperHeader class="border rounded-pill mx-auto mx-sm-15 mb-sm-15 mb-5 pa-0 stepper-header-scroll">
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
              <VAlert v-if="isEditMode" color="info" variant="tonal" class="mb-4">
                <div class="text-caption">
                  <VIcon icon="mdi-information" size="small" class="mr-1" />
                  Instrument and Platform cannot be changed. Create a new holding if needed.
                </div>
              </VAlert>
              
              <VRow>
                <!-- Instrument (grouped by asset type) -->
                <VCol cols="12" md="6">
                  <VAutocomplete
                    v-model="form.instrument_name"
                    label="Instrument"
                    :items="groupedInstrumentOptions"
                    item-title="title"
                    item-value="value"
                    placeholder="Search or select instrument"
                    hint="Grouped by asset type - type to search"
                    persistent-hint
                    variant="outlined"
                    :disabled="isEditMode || submitting"
                    :readonly="isEditMode"
                    clearable
                  >
                    <template v-slot:prepend-inner>
                      <VIcon icon="mdi-certificate" size="20" />
                    </template>
                    
                    <template v-slot:item="{ props, item }">
                      <VListItem v-bind="props" :title="item.raw.title">
                        <template v-slot:prepend>
                          <VIcon :icon="item.raw.icon" />
                        </template>
                      </VListItem>
                    </template>
                  </VAutocomplete>
                </VCol>

                <!-- Platform -->
                <VCol cols="12" md="6">
                  <VCombobox
                    v-model="form.platform"
                    label="Platform"
                    :items="commonPlatforms"
                    placeholder="Select or type platform name"
                    variant="outlined"
                    :disabled="isEditMode || submitting"
                    :readonly="isEditMode"
                    clearable
                  >
                    <template v-slot:prepend-inner>
                      <VIcon icon="mdi-store" size="20" />
                    </template>
                  </VCombobox>
                </VCol>
              </VRow>
            </VStepperWindowItem>

            <!-- Step 2: Financial Values -->
            <VStepperWindowItem :value="2">
              <VAlert v-if="isEditMode" color="info" variant="tonal" class="mb-4">
                <div class="text-caption">
                  <VIcon icon="mdi-information" size="small" class="mr-1" />
                  You can edit all financial values. Instrument, Platform, and Allocation Link are locked.
                </div>
              </VAlert>
              
              <VRow>
                <!-- Row 1: Initial Investment | Purchase Date -->
                <VCol cols="12" md="6">
                  <VTextField
                    v-model="initialDisplay"
                    label="Initial Investment"
                    placeholder="0"
                    variant="outlined"
                    prefix="Rp"
                    inputmode="numeric"
                    :disabled="submitting"
                    @input="handleInitialInput"
                  >
                    <template v-slot:append-inner>
                      <VMenu location="top" :close-on-content-click="false">
                        <template v-slot:activator="{ props }">
                          <VIcon v-bind="props" icon="mdi-help-circle-outline" size="small" class="text-medium-emphasis cursor-pointer" />
                        </template>
                        <VCard class="pa-3" style="max-width: 300px;">
                          <div class="text-caption font-weight-bold mb-1">Total amount you invested initially</div>
                          <div class="text-caption">
                            <strong>Examples:</strong><br>
                            • Gold: 10 gram × Rp 1.000.000 = Rp 10.000.000<br>
                            • Stock: 100 shares × Rp 10.000 = Rp 1.000.000<br>
                            • ETF: 5 units × Rp 500.000 = Rp 2.500.000
                          </div>
                        </VCard>
                      </VMenu>
                    </template>
                  </VTextField>
                </VCol>

                <VCol cols="12" md="6">
                  <VTextField
                    v-model="form.purchase_date"
                    label="Purchase Date"
                    type="date"
                    variant="outlined"
                    :disabled="submitting"
                  />
                </VCol>

                <!-- Row 2: Average Price (per unit) -->
                <VCol cols="12" md="6">
                  <VTextField
                    v-model="averagePriceDisplay"
                    label="Average Price (per unit)"
                    placeholder="0"
                    variant="outlined"
                    prefix="Rp"
                    inputmode="numeric"
                    :disabled="submitting"
                    @input="handleAveragePriceInput"
                  >
                    <template v-slot:append-inner>
                      <VMenu location="top" :close-on-content-click="false">
                        <template v-slot:activator="{ props }">
                          <VIcon v-bind="props" icon="mdi-help-circle-outline" size="small" class="text-medium-emphasis cursor-pointer" />
                        </template>
                        <VCard class="pa-3" style="max-width: 300px;">
                          <div class="text-caption font-weight-bold mb-1">Price per unit when purchased</div>
                          <div class="text-caption">
                            For gold: price per gram. For stocks: price per share. Quantity will be auto-calculated.
                          </div>
                        </VCard>
                      </VMenu>
                    </template>
                  </VTextField>
                </VCol>

                <!-- Row 3: Quantity (auto-calculated, readonly) -->
                <VCol cols="12" md="6">
                  <VTextField
                    :model-value="formatQuantity(calculatedQuantity)"
                    label="Quantity (auto-calculated)"
                    variant="outlined"
                    readonly
                    bg-color="grey-lighten-4"
                    :suffix="form.asset_type === 'gold' ? 'gram' : 'units'"
                  >
                    <template v-slot:prepend-inner>
                      <VIcon icon="mdi-calculator" size="small" class="text-medium-emphasis" />
                    </template>
                  </VTextField>
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
                    label="Link to Budget Allocation"
                    :items="allocationItems"
                    variant="outlined"
                    :disabled="submitting || isFromAllocation || isEditMode"
                    :readonly="isFromAllocation || isEditMode"
                    clearable
                    :hint="isEditMode ? 'Cannot change allocation link' : (isFromAllocation ? 'Auto-linked from allocation' : 'Optional')"
                    persistent-hint
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

      <VCardActions class="pa-4 flex-column-reverse flex-sm-row ga-2">
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
            variant="text"
            @click="prevStep"
            :disabled="submitting || currentStep === 1"
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
:deep(.v-stepper-header button) {
  padding: 1rem;
}

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
