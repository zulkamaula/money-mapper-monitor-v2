<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { formatNumberInput, parseNumberInput } from '~/utils/format'
import type { Pocket } from '~/types/models'

// Self-contained - use composables
const { createAllocation } = useAllocations()
const { pockets, loadPockets } = usePockets()
const { success: showSuccess, error: showError } = useNotification()

interface Props {
  modelValue: boolean
}

interface PocketAllocation {
  pocket_id: string
  pocket_name: string
  percentage: number | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const currentStep = ref(1)
const pocketAllocations = ref<PocketAllocation[]>([])

const form = ref({
  sourceAmount: 0,
  date: new Date().toISOString().split('T')[0],
  notes: ''
})

const sourceAmountDisplay = ref('')
const saving = ref(false)

const internalValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const totalPercentage = computed(() => {
  return pocketAllocations.value.reduce((sum, p) => {
    const percentage = p.percentage ?? 0
    return sum + percentage
  }, 0)
})

const canProceedToStep2 = computed(() => {
  return totalPercentage.value === 100
})

// Watch dialog open to load pockets and initialize
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    await loadPockets()
    initializePocketAllocations()
  }
})


function handleAmountInput(event: Event) {
  const input = event.target as HTMLInputElement
  const parsed = parseNumberInput(input.value)
  form.value.sourceAmount = parsed
  sourceAmountDisplay.value = parsed > 0 ? formatNumberInput(parsed) : ''
}

function initializePocketAllocations() {
  pocketAllocations.value = pockets.value.map(pocket => ({
    pocket_id: pocket.id,
    pocket_name: pocket.name,
    percentage: Math.floor(pocket.percentage) // Ensure integer only
  }))
}

function updatePercentage(index: number, value: string | number) {
  if (pocketAllocations.value[index]) {
    // Allow empty string (null value) for better UX
    if (value === '' || value === null || value === undefined) {
      pocketAllocations.value[index].percentage = null
      return
    }
    
    const numValue = typeof value === 'string' ? parseInt(value) : value
    if (isNaN(numValue)) {
      pocketAllocations.value[index].percentage = null
      return
    }
    
    pocketAllocations.value[index].percentage = Math.max(0, Math.min(100, Math.floor(numValue)))
  }
}

function goToStep2() {
  if (canProceedToStep2.value) {
    currentStep.value = 2
  }
}

function goBackToStep1() {
  currentStep.value = 1
}


async function handleSave() {
  if (!form.value.date || form.value.sourceAmount <= 0) return
  
  saving.value = true
  try {
    // Filter out null percentages and ensure valid pockets
    const customPockets = pocketAllocations.value
      .filter(p => p.percentage !== null)
      .map(p => ({
        id: p.pocket_id,
        name: p.pocket_name,
        percentage: p.percentage as number // Safe after filter
      }))

    await createAllocation(
      form.value.sourceAmount, 
      form.value.date, 
      form.value.notes,
      customPockets
    )
    
    showSuccess('Allocation created successfully')
    internalValue.value = false
    resetForm()
  } catch (error) {
    showError('Failed to create allocation')
  } finally {
    saving.value = false
  }
}

function resetForm() {
  currentStep.value = 1
  form.value = {
    sourceAmount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  }
  sourceAmountDisplay.value = ''
  pocketAllocations.value = []
}
</script>

<template>
  <VDialog v-model="internalValue" max-width="800" persistent>
    <VCard>
      <VCardTitle class="pa-5 text-subtitle-1 font-weight-semibold text-primary">
        <VIcon icon="mdi-chart-donut" class="mr-2" />
        Create New Allocation
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-5 overflow-y-auto" style="max-height: 70vh;">
        <VStepper v-model="currentStep" flat :mobile="$vuetify.display.xs">
          <VStepperHeader class="border rounded-pill mx-auto mx-sm-15 mb-sm-15 mb-5 pa-0 stepper-header-scroll">
            <VStepperItem
              title="Confirm Pockets"
              :complete="currentStep > 1"
              :value="1"
              color="primary"
            >
              <template v-slot:icon>
                <VIcon>mdi-wallet-outline</VIcon>
              </template>
            </VStepperItem>

            <VDivider />

            <VStepperItem
              title="Allocation Details"
              :complete="currentStep > 2"
              :value="2"
              color="primary"
            >
              <template v-slot:icon>
                <VIcon>mdi-file-document-outline</VIcon>
              </template>
            </VStepperItem>
          </VStepperHeader>

          <VContainer fluid>
            <VStepperWindow class="ma-0 pt-2">
            <!-- Step 1: Pocket Budgeting Confirmation -->
            <VStepperWindowItem :value="1">
              <div class="d-flex align-center ga-3 mb-3">
                <div class="text-subtitle-2">
                  Confirm Budget Allocation per Pocket
                </div>
                <VChip
                  :color="totalPercentage === 100 ? 'success' : 'error'"
                  size="small"
                  variant="flat"
                >
                  Total: {{ totalPercentage }}%
                </VChip>
                <!-- Validation Message -->
                <VChip
                  v-if="totalPercentage !== 100"
                  color="success"
                  size="small"
                  variant="flat"
                >
                  {{ totalPercentage < 100 ? 'Missing' : 'Exceeds by' }} {{ Math.abs(100 - totalPercentage) }}%
                </VChip>
              </div>
              <div class="text-caption text-medium-emphasis mb-4">
                Adjust percentages as needed. Total must be 100% to proceed.
              </div>

              <!-- Pocket List with Percentage Inputs - 3 Column Grid -->
              <VRow>
                <VCol 
                  v-for="(pocket, index) in pocketAllocations" 
                  :key="pocket.pocket_id"
                  cols="12"
                  sm="6"
                  md="4">
                  <VTextField
                    :model-value="pocket.percentage"
                    @update:model-value="(val) => updatePercentage(index, val)"
                    :label="pocket.pocket_name"
                    type="number"
                    variant="outlined"
                    density="compact"
                    hide-details
                    suffix="%"
                    min="0"
                    max="100"
                    step="1" />
                </VCol>
              </VRow>
            </VStepperWindowItem>

            <!-- Step 2: Allocation Form -->
            <VStepperWindowItem :value="2">
              <VTextField 
                v-model="sourceAmountDisplay" 
                label="Source Amount" 
                type="text" 
                variant="outlined" 
                class="mb-4"
                autofocus 
                prefix="Rp" 
                inputmode="numeric"
                @input="handleAmountInput" />

              <VTextField 
                v-model="form.date" 
                label="Date" 
                type="date" 
                variant="outlined" 
                class="mb-4" />

              <VTextField 
                v-model="form.notes" 
                label="Notes (Optional)" 
                variant="outlined" />
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
          @click="internalValue = false"
          :disabled="saving"
          class="text-none"
        >
          Cancel
        </VBtn>
        <VSpacer />
        <div class="w-100 w-sm-auto d-flex ga-0 ga-sm-4 justify-space-between">
          <VBtn
            variant="text"
            @click="goBackToStep1"
            :disabled="saving || currentStep === 1"
            class="text-none"
            prepend-icon="mdi-chevron-left"
          >
            Back
          </VBtn>
          <VBtn
            v-if="currentStep < 2"
            color="primary"
            variant="flat"
            @click="goToStep2"
            :disabled="!canProceedToStep2 || saving"
            class="text-none"
            append-icon="mdi-chevron-right"
          >
            Next
          </VBtn>
          <VBtn
            v-else
            color="primary"
            variant="flat"
            @click="handleSave"
            :loading="saving"
            :disabled="form.sourceAmount <= 0 || saving"
            class="text-none px-5"
          >
            Save Allocation
          </VBtn>
        </div>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

