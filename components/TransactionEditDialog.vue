<script setup lang="ts">
import { formatNumberInput, parseNumberInput, formatCurrency, formatQuantity, formatDateInput, formatDate } from '~/utils/format'
import type { HoldingTransaction, Holding } from '~/types/models'

const props = defineProps<{
  modelValue: boolean
  transaction?: HoldingTransaction
  holding?: Holding
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': []
}>()

const { updateTransaction } = useInvestments()
const { allocations } = useAllocations()
const { success: showSuccess, error: showError } = useNotification()

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const form = ref({
  amount: 0,
  quantity: 0,
  average_price: 0,
  purchase_date: '',
  notes: ''
})

const submitting = ref(false)
const currentStep = ref(2)

const amountDisplay = ref('')
const averagePriceDisplay = ref('')

const calculatedQuantity = computed(() => {
  if (form.value.average_price && form.value.average_price > 0) {
    return form.value.amount / form.value.average_price
  }
  return 0
})

const allocationItems = computed(() => [
  { value: undefined, title: 'None (No Link)' },
  ...allocations.value.map(alloc => ({
    value: alloc.id,
    title: `${formatDate(alloc.date)} - ${formatCurrency(alloc.source_amount)}`
  }))
])

const allocationHint = computed(() => {
  if (!props.transaction?.linked_allocation_id) {
    return 'This transaction is not linked to any allocation'
  }
  
  const allocation = allocations.value.find(a => a.id === props.transaction?.linked_allocation_id)
  if (allocation?.notes) {
    return `Linked to allocation: ${allocation.notes}`
  }
  
  return 'This transaction is linked to an allocation'
})

function handleAmountInput(event: Event) {
  const input = event.target as HTMLInputElement
  const parsed = parseNumberInput(input.value)
  form.value.amount = parsed
  amountDisplay.value = parsed > 0 ? formatNumberInput(parsed) : ''
}

function handleAveragePriceInput(event: Event) {
  const input = event.target as HTMLInputElement
  const parsed = parseNumberInput(input.value)
  form.value.average_price = parsed > 0 ? parsed : 0
  averagePriceDisplay.value = parsed > 0 ? formatNumberInput(parsed) : ''
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

const canProceedStep2 = computed(() => {
  return form.value.amount > 0 && form.value.average_price > 0
})

async function handleSubmit() {
  if (!props.transaction) {
    showError('Transaction not found')
    return
  }

  if (form.value.amount <= 0 || form.value.average_price <= 0) {
    showError('Please fill all required fields')
    return
  }

  const quantity = form.value.amount / form.value.average_price

  submitting.value = true
  try {
    await updateTransaction(props.transaction.id, {
      amount: form.value.amount,
      quantity: quantity,
      average_price: form.value.average_price,
      purchase_date: form.value.purchase_date || undefined,
      notes: form.value.notes || undefined
    })
    
    showSuccess('Transaction updated successfully')
    emit('saved')
    dialog.value = false
  } catch (error) {
    // Error handled in composable
  } finally {
    submitting.value = false
  }
}

watch(() => props.modelValue, (newVal) => {
  if (newVal && props.transaction) {
    form.value = {
      amount: props.transaction.amount,
      quantity: props.transaction.quantity,
      average_price: props.transaction.average_price || 0,
      purchase_date: formatDateInput(props.transaction.purchase_date),
      notes: props.transaction.notes || ''
    }
    amountDisplay.value = formatNumberInput(props.transaction.amount)
    averagePriceDisplay.value = props.transaction.average_price ? formatNumberInput(props.transaction.average_price) : ''
    currentStep.value = 2
  }
})
</script>

<template>
  <VDialog v-model="dialog" max-width="800" persistent>
    <VCard>
      <VCardTitle class="pa-5 text-subtitle-1 font-weight-semibold text-primary">
        <VIcon icon="mdi-pencil" class="mr-2" />
        Edit Transaction
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
            <VStepperWindow class="ma-0 pt-2">
              <!-- Step 1: Asset Information (Readonly) -->
              <VStepperWindowItem :value="1">
                <VAlert color="info" variant="tonal" class="mb-4">
                  <div class="text-caption">
                    <VIcon icon="mdi-information" size="small" class="mr-1" />
                    Asset information is locked and cannot be changed.
                  </div>
                </VAlert>
                
                <VRow>
                  <VCol cols="12" md="6">
                    <VTextField
                      :model-value="holding?.instrument_name"
                      label="Instrument"
                      prepend-inner-icon="mdi-certificate"
                      variant="outlined"
                      readonly
                      disabled
                    />
                  </VCol>

                  <VCol cols="12" md="6">
                    <VTextField
                      :model-value="holding?.platform"
                      label="Platform"
                      prepend-inner-icon="mdi-domain"
                      variant="outlined"
                      readonly
                      disabled
                    />
                  </VCol>
                </VRow>
              </VStepperWindowItem>

              <!-- Step 2: Financial Values (Editable) -->
              <VStepperWindowItem :value="2">
                <VRow>
                  <!-- Row 1: Investment Amount | Purchase Date -->
                  <VCol cols="12" md="6">
                    <VTextField
                      v-model="amountDisplay"
                      label="Investment Amount"
                      placeholder="0"
                      variant="outlined"
                      prefix="Rp"
                      inputmode="numeric"
                      :disabled="submitting"
                      @input="handleAmountInput"
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
                      persistent-hint
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
                      :hint="calculatedQuantity > 0 ? `Quantity: ${formatQuantity(calculatedQuantity)} ${holding?.asset_type === 'gold' ? 'gr' : 'units'}` : 'Enter price to calculate quantity'"
                      persistent-hint
                      @input="handleAveragePriceInput"
                    >
                      <template v-slot:prepend-inner>
                        <VIcon icon="mdi-calculator" size="small" class="text-medium-emphasis" />
                      </template>
                      <template v-slot:append-inner>
                        <VMenu location="top" :close-on-content-click="false">
                          <template v-slot:activator="{ props }">
                            <VIcon v-bind="props" icon="mdi-help-circle-outline" size="small" class="text-medium-emphasis cursor-pointer" />
                          </template>
                          <VCard class="pa-3" style="max-width: 300px;">
                            <div class="text-caption font-weight-bold mb-1">Price per unit when purchased</div>
                            <div class="text-caption">
                              For gold: price per gram. For stocks: price per share. Quantity will be auto-calculated based on Amount ÷ Price.
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
                      :model-value="transaction?.linked_allocation_id"
                      label="Link to Budget Allocation"
                      :items="allocationItems"
                      variant="outlined"
                      disabled
                      readonly
                      clearable
                      :hint="allocationHint"
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
            prepend-icon="mdi-chevron-left"
          >
            Back
          </VBtn>
          <VBtn
            v-if="currentStep < 3"
            color="primary"
            variant="flat"
            @click="nextStep"
            :disabled="(currentStep === 2 && !canProceedStep2) || submitting"
            class="text-none"
            append-icon="mdi-chevron-right"
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
            Save Changes
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
  overflow-y: hidden;
  scrollbar-width: none;
}

.stepper-header-scroll::-webkit-scrollbar {
  display: none;
}

.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style>
