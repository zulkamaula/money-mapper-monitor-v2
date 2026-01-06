<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Pocket } from '~/types/models'
import { formatNumberInput, parseNumberInput } from '~/utils/format'

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

const internalValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
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

        <VTextField v-model="form.notes" label="Notes (Optional)" variant="outlined" />
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4 flex-column flex-sm-row">
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

