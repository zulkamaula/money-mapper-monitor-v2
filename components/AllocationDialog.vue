<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Pocket } from '~/types/models'
import { formatPercentage, formatCurrency, formatNumberInput, parseNumberInput } from '~/utils/format'

interface Props {
  modelValue: boolean
  pockets: Pocket[]
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', data: { sourceAmount: number; date: string; notes: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const form = ref({
  sourceAmount: 0,
  date: new Date().toISOString().split('T')[0],
  notes: ''
})

const sourceAmountDisplay = ref('')
const previewAllocation = ref<{ pocket: Pocket; amount: number }[]>([])

const internalValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

watch(() => form.value.sourceAmount, (newAmount) => {
  if (newAmount > 0) {
    calculatePreview()
  } else {
    previewAllocation.value = []
  }
})

function handleAmountInput(event: Event) {
  const input = event.target as HTMLInputElement
  const parsed = parseNumberInput(input.value)
  form.value.sourceAmount = parsed
  sourceAmountDisplay.value = parsed > 0 ? formatNumberInput(parsed) : ''
}

function handleAmountPaste(event: ClipboardEvent) {
  event.preventDefault()
  const pastedText = event.clipboardData?.getData('text') || ''
  const parsed = parseNumberInput(pastedText)
  form.value.sourceAmount = parsed
  sourceAmountDisplay.value = parsed > 0 ? formatNumberInput(parsed) : ''
}

function calculatePreview() {
  const sourceAmount = form.value.sourceAmount
  if (sourceAmount <= 0 || props.pockets.length === 0) {
    previewAllocation.value = []
    return
  }

  const results: { pocket: Pocket; amount: number }[] = []
  let totalAllocated = 0

  for (const pocket of props.pockets) {
    const exactAmount = (sourceAmount * pocket.percentage) / 100
    const floorAmount = Math.floor(exactAmount)
    results.push({ pocket, amount: floorAmount })
    totalAllocated += floorAmount
  }

  let remainder = sourceAmount - totalAllocated
  let index = 0
  while (remainder > 0 && index < results.length) {
    const item = results[index]
    if (item) {
      item.amount += 1
      remainder -= 1
    }
    index += 1
  }

  previewAllocation.value = results
}

function handleSave() {
  if (!form.value.date) return
  emit('save', {
    sourceAmount: form.value.sourceAmount,
    date: form.value.date,
    notes: form.value.notes
  })
  resetForm()
}

function resetForm() {
  form.value = {
    sourceAmount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  }
  sourceAmountDisplay.value = ''
  previewAllocation.value = []
}
</script>

<template>
  <VDialog v-model="internalValue" max-width="600">
    <VCard>
      <VCardTitle class="pa-5 text-subtitle-1">
        <VIcon icon="mdi-chart-donut" class="mr-2" />
        Create New Allocation
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-5 overflow-auto">
        <VTextField v-model="sourceAmountDisplay" label="Source Amount" type="text" variant="outlined" class="mb-4"
          autofocus prefix="Rp" @input="handleAmountInput" @paste="handleAmountPaste" inputmode="numeric" />

        <VTextField v-model="form.date" label="Date" type="date" variant="outlined" class="mb-4" />

        <VTextField v-model="form.notes" label="Notes (Optional)" variant="outlined" class="mb-4" />

        <!-- Preview -->
        <div v-if="previewAllocation.length > 0" class="preview-section">
          <div class="preview-title">
            <VIcon icon="mdi-eye" size="small" class="mr-2" />
            Allocation Preview
          </div>
          <VList class="preview-list">
            <VListItem v-for="preview in previewAllocation" :key="preview.pocket.id" class="preview-item">
              <VListItemTitle class="d-flex flex-wrap justify-space-between">
                <div class="preview-pocket">
                  <span class="preview-name text-wrap">{{ preview.pocket.name }}</span>
                  <VChip size="x-small" variant="flat" color="primary">
                    {{ formatPercentage(preview.pocket.percentage) }}
                  </VChip>
                </div>
                <span class="preview-amount">{{ formatCurrency(preview.amount) }}</span>
              </VListItemTitle>
            </VListItem>
          </VList>
        </div>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4">
        <VSpacer />
        <VBtn color="grey" variant="text" class="text-none" @click="internalValue = false">Cancel</VBtn>
        <VBtn color="primary" variant="flat" class="text-none px-5" @click="handleSave"
          :disabled="form.sourceAmount <= 0">
          Save Allocation
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.preview-section {
  margin-top: 24px;
  padding: 16px;
  background: rgba(15, 118, 110, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(15, 118, 110, 0.1);
}

.preview-title {
  font-weight: 600;
  font-size: 14px;
  color: rgba(15, 118, 110, 0.9);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.preview-list {
  background: transparent !important;
}

.preview-item {
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  padding: 12px !important;
  margin-bottom: 8px;
}

.preview-item:last-child {
  margin-bottom: 0;
}

.preview-pocket {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  align-items: center;
}

.preview-name {
  font-weight: 600;
  font-size: 0.9rem;
  line-height: 19px;
  color: rgba(15, 118, 110, 0.9);
}

.preview-amount {
  font-weight: 700;
  color: rgba(15, 118, 110, 0.9);
}
</style>
