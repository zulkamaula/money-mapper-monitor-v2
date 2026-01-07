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

// Dynamic instrument options based on selected asset type
const instrumentOptions = computed(() => {
  return instrumentOptionsByAssetType[form.value.asset_type] || []
})

// Clear instrument name when asset type changes
watch(() => form.value.asset_type, () => {
  if (!isEditMode.value) {
    form.value.instrument_name = null
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

// Auto-calculate Current Value when Quantity or Average Price changes
watch([() => form.value.quantity, () => form.value.average_price], ([qty, avgPrice]) => {
  if (qty && qty > 0 && avgPrice && avgPrice > 0) {
    const calculatedValue = qty * avgPrice
    form.value.current_value = calculatedValue
    currentDisplay.value = formatNumberInput(calculatedValue)
  }
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
  return form.value.asset_type && form.value.platform && form.value.instrument_name
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
      const currentValueNum = Number(props.holding.current_value) || 0
      const quantityNum = props.holding.quantity ? Number(props.holding.quantity) : undefined
      const avgPrice = props.holding.average_price ? Number(props.holding.average_price) : undefined
      
      form.value = {
        asset_type: (props.holding as any).asset_type || 'gold',
        asset_name: (props.holding as any).asset_name || '',
        platform: props.holding.platform,
        instrument_name: props.holding.instrument_name,
        initial_investment: initialInvestment,
        current_value: currentValueNum,
        quantity: quantityNum,
        average_price: avgPrice,
        purchase_date: props.holding.purchase_date || new Date().toISOString().split('T')[0],
        notes: props.holding.notes || '',
        linked_allocation_id: props.holding.linked_allocation_id || undefined
      }
      initialDisplay.value = formatNumberInput(initialInvestment)
      currentDisplay.value = formatNumberInput(currentValueNum)
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

                <!-- Row 2: Average Price | Sync Button -->
                <VCol cols="12" md="6" class="mb-5">
                  <VTextField
                    v-model="averagePriceDisplay"
                    label="Average Price"
                    placeholder="0"
                    variant="outlined"
                    prefix="Rp"
                    inputmode="numeric"
                    :disabled="submitting"
                    @input="handleAveragePriceInput"
                    hide-details
                  >
                    <template v-slot:append-inner>
                      <VMenu location="top" :close-on-content-click="false">
                        <template v-slot:activator="{ props }">
                          <VIcon v-bind="props" icon="mdi-help-circle-outline" size="small" class="text-medium-emphasis cursor-pointer" />
                        </template>
                        <VCard class="pa-3" style="max-width: 280px;">
                          <div class="text-caption font-weight-bold mb-1">Price per unit at time of purchase</div>
                          <div class="text-caption">
                            <strong>Manual or Fetch:</strong><br>
                            Click sync button to fetch latest price from API<br>
                            Or enter manually<br><br>
                            <strong>Examples:</strong><br>
                            • Emas: Rp 1.000.000/gram<br>
                            • Saham: Rp 10.000/share
                          </div>
                        </VCard>
                      </VMenu>
                    </template>
                  </VTextField>
                </VCol>

                <VCol cols="12" md="6" class="d-flex align-center mb-5">
                  <VBtn
                    size="large"
                    variant="tonal"
                    color="primary"
                    :disabled="submitting"
                    prepend-icon="mdi-sync-circle"
                    class="mt-0 text-none h-100"
                    block
                  >
                    Get Sync Price
                  </VBtn>
                </VCol>

                <!-- Row 3: Quantity | Current Value -->
                <VCol cols="12" md="6">
                  <VTextField
                    :model-value="form.quantity || 0"
                    :label="form.asset_type === 'gold' ? 'Quantity (gram)' : 'Quantity'"
                    placeholder="Auto-calculated"
                    variant="outlined"
                    inputmode="numeric"
                    :suffix="form.asset_type === 'gold' ? 'gram' : ''"
                    readonly
                    bg-color="grey-lighten-4"
                  >
                    <template v-slot:append-inner>
                      <VMenu location="top" :close-on-content-click="false">
                        <template v-slot:activator="{ props }">
                          <VIcon v-bind="props" icon="mdi-help-circle-outline" size="small" class="text-medium-emphasis cursor-pointer" />
                        </template>
                        <VCard class="pa-3" style="max-width: 280px;">
                          <div class="text-caption font-weight-bold mb-1">Auto-calculated from formula</div>
                          <div class="text-caption">
                            <strong>Formula:</strong><br>
                            Quantity = Initial Investment ÷ Average Price<br><br>
                            <strong>Example:</strong><br>
                            • Rp 500.000 ÷ Rp 1.000.000 = 0.5 gram<br>
                            • Rp 1.000.000 ÷ Rp 10.000 = 100 shares
                          </div>
                        </VCard>
                      </VMenu>
                    </template>
                  </VTextField>
                </VCol>

                <VCol cols="12" md="6">
                  <VTextField
                    v-model="currentDisplay"
                    label="Current Value"
                    placeholder="Auto-calculated"
                    variant="outlined"
                    prefix="Rp"
                    inputmode="numeric"
                    readonly
                    bg-color="grey-lighten-4"
                  >
                    <template v-slot:append-inner>
                      <VMenu location="top" :close-on-content-click="false">
                        <template v-slot:activator="{ props }">
                          <VIcon v-bind="props" icon="mdi-help-circle-outline" size="small" class="text-medium-emphasis cursor-pointer" />
                        </template>
                        <VCard class="pa-3" style="max-width: 300px;">
                          <div class="text-caption font-weight-bold mb-1">Auto-calculated from formula</div>
                          <div class="text-caption">
                            <strong>Formula:</strong><br>
                            Current Value = Quantity × Average Price<br><br>
                            <strong>Example:</strong><br>
                            • 0.5 gram × Rp 1.200.000 = Rp 600.000<br>
                            • 100 shares × Rp 10.500 = Rp 1.050.000
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
