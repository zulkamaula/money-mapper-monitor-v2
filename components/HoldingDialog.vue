<script setup lang="ts">
import { formatNumberInput, parseNumberInput, formatCurrency, formatQuantity } from '~/utils/format'
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
  asset_type: null as string | 'gold' | 'stock' | 'etf' | 'mutual_fund' | 'bond' | 'crypto' | 'other' | null | any,
  asset_name: '',
  platform: null as string | null,
  instrument_name: null as string | null,
  initial_investment: 0,
  current_value: 0,
  quantity: undefined as number | undefined,
  average_price: undefined as number | undefined,
  purchase_date: new Date().toISOString().split('T')[0],
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

// Auto-calculate Quantity when Initial Investment or Average Price changes
watch([() => form.value.initial_investment, () => form.value.average_price], ([initial, avgPrice]) => {
  if (initial > 0 && avgPrice && avgPrice > 0) {
    form.value.quantity = initial / avgPrice
  } else {
    form.value.quantity = undefined
  }
})

// Note: Current Value removed from form - it's same as Initial Investment at purchase time
// Current Value should be updated later when viewing holdings, not at creation

const initialDisplay = ref('')
const averagePriceDisplay = ref('')
const submitting = ref(false)
const currentStep = ref(1)

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
    current_value: 0,
    quantity: undefined,
    average_price: undefined,
    purchase_date: new Date().toISOString().split('T')[0],
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
  return form.value.asset_type && form.value.platform && form.value.instrument_name
})

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
      form.value.initial_investment <= 0 || form.value.current_value <= 0) {
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
    current_value: form.value.current_value,
    quantity: form.value.quantity,
    average_price: form.value.average_price,
    notes: form.value.notes,
    linked_allocation_id: form.value.linked_allocation_id
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
    if (props.holding) {
      // Edit mode - populate form with holding data
      // Parse all number values explicitly to prevent string concatenation
      const initialInvestment = Number(props.holding.initial_investment) || 0
      const quantityNum = props.holding.quantity ? Number(props.holding.quantity) : undefined
      const avgPrice = props.holding.average_price ? Number(props.holding.average_price) : undefined
      
      form.value = {
        asset_type: (props.holding as any).asset_type || 'gold',
        asset_name: (props.holding as any).asset_name || '',
        platform: props.holding.platform,
        instrument_name: props.holding.instrument_name,
        initial_investment: initialInvestment,
        current_value: initialInvestment, // Same as initial at purchase time
        quantity: quantityNum,
        average_price: avgPrice,
        purchase_date: props.holding.purchase_date || new Date().toISOString().split('T')[0],
        notes: props.holding.notes || '',
        linked_allocation_id: props.holding.linked_allocation_id || undefined
      }
      initialDisplay.value = formatNumberInput(initialInvestment)
      averagePriceDisplay.value = avgPrice ? formatNumberInput(avgPrice) : ''
    } else {
      // Create mode - reset form to defaults
      resetForm()
    }
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
                            • Emas: 10 gram × Rp 1.000.000 = Rp 10.000.000<br>
                            • Saham: 100 shares × Rp 10.000 = Rp 1.000.000<br>
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

                <!-- Row 2: Average Price with inline sync button -->
                <VCol cols="12" md="6">
                  <VTextField
                    v-model="averagePriceDisplay"
                    label="Average Price"
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
                        <VCard class="pa-3" style="max-width: 340px;">
                          <div class="text-caption font-weight-bold mb-1">Price per unit at purchase</div>
                          <div class="text-caption">
                            <strong>Input Format (IDR):</strong><br>
                            • Use dots for thousands: 2.400.000 = 2.4M<br>
                            • No comma for decimals in input<br><br>
                            <strong>For Non-IDR Currency (USD, etc):</strong><br>
                            Convert to IDR first using current exchange rate<br>
                            Example: US Stock $50/share × 15.800 = Rp 790.000<br><br>
                            <strong>Current Market Reference (Jan 2026):</strong><br>
                            • Gold: ~Rp 2.516.000/gram<br>
                            • Stock IDX (BBCA): ~Rp 10.000/share<br>
                            • Stock US (AAPL): ~$200 = Rp 3.160.000/share
                          </div>
                        </VCard>
                      </VMenu>
                    </template>
                  </VTextField>
                </VCol>

                <!-- Row 3: Quantity (auto-calculated) -->
                <VCol cols="12" md="6">
                  <VTextField
                    :model-value="formatQuantity(form.quantity)"
                    :label="form.asset_type === 'gold' ? 'Quantity (gram)' : 'Quantity (lot)'"
                    placeholder="Auto-calculated from Initial ÷ Average Price"
                    variant="outlined"
                    inputmode="numeric"
                    :suffix="form.asset_type === 'gold' ? 'gram' : 'lot'"
                    readonly
                    :disabled="submitting"
                    base-color="primary"
                  >
                    <template v-slot:append-inner>
                      <VMenu location="top" :close-on-content-click="false">
                        <template v-slot:activator="{ props }">
                          <VIcon v-bind="props" icon="mdi-help-circle-outline" size="small" class="text-medium-emphasis cursor-pointer" />
                        </template>
                        <VCard class="pa-3" style="max-width: 360px;">
                          <div class="text-caption font-weight-bold mb-1">Auto-calculated quantity</div>
                          <div class="text-caption">
                            <strong>Formula:</strong> Initial Investment ÷ Average Price<br><br>
                            <strong>Note on Format:</strong><br>
                            • Comma (,) = decimal separator<br>
                            • Dot (.) = thousand separator<br>
                            • No trailing zeros shown<br><br>
                            <strong>Stock/ETF Lot Info:</strong><br>
                            1 lot typically = 100 shares (IDX)<br>
                            US stocks usually fractional shares allowed<br><br>
                            <strong>Examples:</strong><br>
                            • Gold: Rp 1.258.000 ÷ Rp 2.516.000/g = <strong>0,5 gram</strong><br>
                            • Stock: Rp 1.000.000 ÷ Rp 10.000/share = <strong>100 lot</strong><br>
                            • Partial: Rp 500.000 ÷ Rp 10.000/share = <strong>50 lot</strong>
                          </div>
                        </VCard>
                      </VMenu>
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
