<script setup lang="ts">
import type { MoneyBook } from '~/types/models'

const props = defineProps<{
  modelValue: boolean
  book?: MoneyBook
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': [data: { name: string, hasInvestmentPortfolio: boolean }]
}>()

const bookName = ref('')
const hasInvestmentPortfolio = ref(false)
const submitting = ref(false)
const infoAlertRef = ref<any>(null)

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEditMode = computed(() => !!props.book)

function resetForm() {
  if (props.book) {
    bookName.value = props.book.name
    hasInvestmentPortfolio.value = props.book.has_investment_portfolio || false
  } else {
    bookName.value = ''
    hasInvestmentPortfolio.value = false
  }
  submitting.value = false
}

function handleCancel() {
  resetForm()
  dialog.value = false
}

async function handleSubmit() {
  if (!bookName.value.trim()) return
  
  submitting.value = true
  emit('confirm', {
    name: bookName.value.trim(),
    hasInvestmentPortfolio: hasInvestmentPortfolio.value
  })
}

watch(() => hasInvestmentPortfolio.value, (newVal) => {
  if (newVal) {
    nextTick(() => {
      infoAlertRef.value?.$el?.scrollIntoView({ behavior: 'smooth' })
    })
  }
})

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    resetForm()
  }
})
</script>

<template>
  <VDialog v-model="dialog" max-width="500" persistent>
    <VCard>
      <VCardTitle class="pa-5 text-subtitle-1 font-weight-semibold text-primary">
        <VIcon :icon="isEditMode ? 'mdi-book-edit' : 'mdi-book-plus'" class="mr-2" />
        {{ isEditMode ? 'Edit Money Book' : 'Create Money Book' }}
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-5 overflow-y-auto">
        <!-- Book Name Input -->
        <VTextField
          v-model="bookName"
          label="Book Name"
          placeholder="e.g., Income Salary"
          variant="outlined"
          :disabled="submitting"
          autofocus
          @keyup.enter="handleSubmit"
          class="mb-4"
        />

        <!-- Investment Tracking Toggle -->
        <VCard variant="outlined" color="primary" class="pa-4 mb-4">
          <div class="d-flex flex-wrap align-center justify-end justify-sm-space-between">
            <div class="flex-grow-1 mr-4">
              <div class="d-flex align-center mb-1">
                <VIcon icon="mdi-chart-line" size="20" color="success" class="mr-2" />
                <span class="text-subtitle-2 font-weight-semibold">Investment Tracking</span>
              </div>
              <p class="text-caption text-medium-emphasis mb-0">
                Enable to track your investment portfolio alongside budget management
              </p>
            </div>
            <VSwitch
              v-model="hasInvestmentPortfolio"
              color="success"
              hide-details
              inset
              :disabled="submitting || isEditMode"
            />
          </div>
        </VCard>

        <!-- Edit Mode Warning -->
        <VAlert
          v-if="isEditMode"
          type="warning"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          <span class="text-caption">
            Investment tracking cannot be changed after creation.
          </span>
        </VAlert>

        <!-- Info Message -->
        <VAlert
          v-if="hasInvestmentPortfolio"
          ref="infoAlertRef"
          type="info"
          variant="tonal"
          density="compact"
          class="mt-4"
        >
          <span class="text-caption">
            You'll be able to track investments in platforms like Bibit, Pluang, and more.
          </span>
        </VAlert>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4 flex-column flex-sm-row">
        <VSpacer />
        <VBtn
          variant="text"
          color="grey"
          @click="handleCancel"
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
          :disabled="!bookName.trim() || submitting"
          class="text-none px-5"
        >
          {{ isEditMode ? 'Update' : 'Create Book' }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

