<script setup lang="ts">
import type { MoneyBook } from '~/types/models'

const props = defineProps<{
  modelValue: boolean
  book?: MoneyBook
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': [data: { name: string }]
}>()

const bookName = ref('')
const submitting = ref(false)

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEditMode = computed(() => !!props.book)

function resetForm() {
  if (props.book) {
    bookName.value = props.book.name
  } else {
    bookName.value = ''
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
    name: bookName.value.trim()
  })
}

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

        <!-- Info Message -->
        <VAlert
          type="info"
          variant="tonal"
          density="compact"
        >
          <span class="text-caption">
            <strong>All money books now support investment tracking!</strong><br>
            Track investments from budget allocations in platforms like Bibit, Pluang, and more.
          </span>
        </VAlert>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4 flex-column-reverse flex-sm-row ga-2">
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

