<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import type { MoneyBook } from '~/types/models'

interface Props {
  books: MoneyBook[]
  selectedBook: MoneyBook | null
  loading?: boolean
  creatingBook?: boolean
}

interface Emits {
  (e: 'select', book: MoneyBook): void
  (e: 'create', name: string): void
  (e: 'update', book: MoneyBook, name: string): void
  (e: 'delete', book: MoneyBook): void
  (e: 'reorder', books: MoneyBook[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const newBookName = ref('')
const editingBook = ref<string | null>(null)
const editingBookName = ref('')
const showSelector = ref(props.books.length > 0)
const showCreateDialog = ref(false)

// Track initialization to prevent empty state flash
const isInitialized = ref(false)
const hasBooks = computed(() => props.books.length > 0)

// Drag and drop state (desktop only)
const localBooks = ref<MoneyBook[]>([])
const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

// Mark as initialized when books data changes (after first fetch)
watch(() => props.books, (newBooks) => {
  isInitialized.value = true
  localBooks.value = [...newBooks]
}, { immediate: true }) // Sync props to local state

// Cleanup
onUnmounted(() => {
  isInitialized.value = false
})

function handleCreate() {
  if (!newBookName.value.trim()) return
  emit('create', newBookName.value.trim())
  newBookName.value = ''
  showCreateDialog.value = false
}

function openCreateDialog() {
  showCreateDialog.value = true
  newBookName.value = ''
}

function startEdit(book: MoneyBook, event?: Event) {
  if (event) event.stopPropagation()
  editingBook.value = book.id
  editingBookName.value = book.name
}

function cancelEdit() {
  editingBook.value = null
  editingBookName.value = ''
}

function saveEdit(book: MoneyBook) {
  if (!editingBookName.value.trim() || editingBookName.value === book.name) {
    cancelEdit()
    return
  }
  emit('update', book, editingBookName.value.trim())
  cancelEdit()
}

function handleSelect(book: MoneyBook) {
  emit('select', book)
}

function handleDelete(book: MoneyBook, event?: Event) {
  if (event) event.stopPropagation()
  emit('delete', book)
}

// Drag and drop handlers
function onDragStart(index: number) {
  draggedIndex.value = index
}

function onDragOver(event: DragEvent, index: number) {
  event.preventDefault()
  dragOverIndex.value = index
}

function onDragLeave() {
  dragOverIndex.value = null
}

function onDrop(event: DragEvent, dropIndex: number) {
  event.preventDefault()
  
  if (draggedIndex.value === null || draggedIndex.value === dropIndex) {
    draggedIndex.value = null
    dragOverIndex.value = null
    return
  }

  // Reorder array
  const items = [...localBooks.value]
  const draggedItem = items[draggedIndex.value]
  
  if (!draggedItem) {
    draggedIndex.value = null
    dragOverIndex.value = null
    return
  }
  
  items.splice(draggedIndex.value, 1)
  items.splice(dropIndex, 0, draggedItem)
  
  localBooks.value = items
  emit('reorder', items)
  
  // Reset state
  draggedIndex.value = null
  dragOverIndex.value = null
}

function onDragEnd() {
  draggedIndex.value = null
  dragOverIndex.value = null
}
</script>

<template>
  <div class="money-book-selector">
    <!-- Loading Skeleton -->
    <VCard v-if="!isInitialized" class="selector-card" elevation="0">
      <VCardText class="pa-5">
        <VSkeletonLoader type="chip" class="mb-3" />
        <VSkeletonLoader type="list-item-two-line" />
      </VCardText>
    </VCard>

    <!-- Empty State -->
     <template v-else-if="!hasBooks && isInitialized">
         <div class="empty-state-container">
           <VIcon icon="mdi-book-open-variant" size="80" color="grey-darken-1" class="mb-4" />
           <div class="text-left">
             <div class="text-body-1 text-sm-h6 text-grey-darken-1">No Money Books Yet</div>
             <VBtn color="white" variant="flat" size="small" rounded="pill" @click="openCreateDialog"
               class="mt-2 text-capitalize">
               <VIcon icon="mdi-plus" start />
               Create Your First One
             </VBtn>
           </div>
         </div>
     </template>

    <!-- Selector Card with Books Data -->
    <template v-else-if="hasBooks">
      <Transition name="slide-down">
        <VCard class="selector-card" elevation="0">
        <VCardText class="pa-5">
          <div class="selector-wrapper">
            <!-- Create New Book (Top) -->
            <div class="create-section">
              <VTextField v-model="newBookName" variant="outlined" density="comfortable" placeholder="New book name"
                color="primary" hide-details class="create-input" :loading="creatingBook" autofocus
                @keyup.enter="handleCreate">
                <template #append-inner>
                  <VBtn icon="mdi-book-plus" color="primary" variant="plain" class="pa-0 h-auto w-auto"
                    @click="handleCreate" />
                </template>
              </VTextField>
            </div>

            <!-- Books List (Bottom with horizontal scroll) -->
            <div v-if="hasBooks" class="books-scroll-container">
              <div class="books-list">
                <div 
                  v-for="(book, index) in localBooks" 
                  :key="book.id" 
                  class="book-item"
                  :draggable="editingBook !== book.id"
                  :class="{ 'drag-over': dragOverIndex === index, 'dragging': draggedIndex === index }"
                  @dragstart="onDragStart(index)"
                  @dragover="onDragOver($event, index)"
                  @dragleave="onDragLeave"
                  @drop="onDrop($event, index)"
                  @dragend="onDragEnd"
                >
                  <!-- Edit Mode -->
                  <VTextField v-if="editingBook === book.id" v-model="editingBookName" variant="outlined"
                    density="compact" hide-details class="edit-input" autofocus @keyup.enter="saveEdit(book)"
                    @keyup.esc="cancelEdit">
                    <template v-slot:append-inner>
                      <VBtn icon="mdi-check" size="x-small" color="success" variant="text" @click="saveEdit(book)" />
                      <VBtn icon="mdi-close" size="x-small" color="grey" variant="text" @click="cancelEdit" />
                    </template>
                  </VTextField>

                  <!-- Display Mode -->
                  <VChip v-else :color="selectedBook?.id === book.id ? 'primary' : 'grey'" @click="handleSelect(book)"
                    class="book-chip" :variant="selectedBook?.id === book.id ? 'flat' : 'outlined'">
                    <VIcon icon="mdi-drag-vertical" size="small" class="drag-handle desktop-only mr-1" />
                    {{ book.name }}
                    <VMenu>
                      <template v-slot:activator="{ props }">
                        <VBtn icon="mdi-menu-down" size="small" variant="plain" class="pa-0 h-auto w-auto ml-3" :class="[selectedBook?.id === book.id ? 'border-active' : 'border-inactive']"
                          v-bind="props" @click.stop />
                      </template>
                      <VList density="compact">
                        <VListItem @click="startEdit(book)">
                          <template v-slot:prepend>
                            <VIcon icon="mdi-pencil" />
                          </template>
                          <VListItemTitle>Edit</VListItemTitle>
                        </VListItem>
                        <VListItem @click="handleDelete(book)">
                          <template v-slot:prepend>
                            <VIcon icon="mdi-delete" color="error" />
                          </template>
                          <VListItemTitle class="text-error">Delete</VListItemTitle>
                        </VListItem>
                      </VList>
                    </VMenu>
                  </VChip>
                </div>
              </div>
            </div>
          </div>
        </VCardText>
      </VCard>
    </Transition>
    </template>

    <!-- Create Money Book Dialog -->
    <VDialog v-model="showCreateDialog" max-width="600">
      <VCard class="dialog-card" elevation="0">
        <VCardText class="pa-6">
          <div class="create-form">
            <VTextField v-model="newBookName" variant="outlined" placeholder="Money Book Name" color="primary" autofocus
              hide-details :loading="creatingBook" @keyup.enter="handleCreate" class="flex-1">
              <template v-slot:prepend-inner>
                <VIcon icon="mdi-book-outline" />
              </template>
            </VTextField>
            <VBtn variant="tonal" color="primary" size="large" @click="handleCreate"
              :disabled="!newBookName.trim() || creatingBook" :loading="creatingBook">
              Next
              <VIcon icon="mdi-arrow-right" end />
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
:deep(.border-active) {
  border: 1px solid rgba(var(--v-theme-surface), 0.3) !important;
}

:deep(.book-chip:hover .border-active) {
  border: 1px solid rgb(var(--v-theme-surface)) !important;
}

:deep(.border-inactive) {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.3) !important;
}

:deep(.book-chip:hover .border-inactive) {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.7) !important;
}

.money-book-selector {
  height: 100%;
}

.empty-state-container {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  margin-top: 80px;
}

.create-form {
  display: flex;
  gap: 12px;
  align-items: center;
}

.create-form .flex-1 {
  flex: 1;
}

.dialog-card {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(15, 118, 110, 0.1);
}

.selector-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(15, 118, 110, 0.1);
}

.selector-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.create-section {
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
}

.create-input {
  flex: 1;
}

.create-input :deep(.v-field) {
  border-radius: 12px;
}

.add-btn {
  height: 48px;
  min-width: 48px;
  flex-shrink: 0;
}

.books-scroll-container {
  width: 100%;
  overflow-x: auto;
  padding: 4px 0 8px 0;
  position: relative;
  border-radius: 10px;

  /* Pure CSS scroll shadows using background-attachment trick */
  background:
    /* Shadow covers - move with content (local) */
    linear-gradient(to right, white 40%, rgba(255, 255, 255, 0)) 0 0,
    linear-gradient(to left, white 40%, rgba(255, 255, 255, 0)) 100% 0,

    /* Shadow gradients - fixed to container (scroll) */
    radial-gradient(farthest-side at 0 50%, rgba(15, 118, 110, 0.3), transparent) 0 0,
    radial-gradient(farthest-side at 100% 50%, rgba(15, 118, 110, 0.3), transparent) 100% 0;

  background-repeat: no-repeat;
  background-size: 25px 100%, 25px 100%, 16px 100%, 16px 100%;
  background-attachment: local, local, scroll, scroll;

  /* Smooth scrolling */
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

/* Hide scrollbar by default */
.books-scroll-container::-webkit-scrollbar {
  height: 4px;
  width: 4px;
}

.books-scroll-container::-webkit-scrollbar-track {
  background: transparent;
}

.books-scroll-container::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 2px;
  transition: background 0.2s ease;
}

/* Show scrollbar on hover */
.books-scroll-container:hover::-webkit-scrollbar-thumb {
  background: rgba(15, 118, 110, 0.2);
}

.books-scroll-container:hover::-webkit-scrollbar-thumb:hover {
  background: rgba(15, 118, 110, 0.35);
}

.books-list {
  display: flex;
  gap: 10px;
  min-height: 48px;
}

.book-item {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 15px;
  transition: all 0.2s ease;
}

.book-item.dragging {
  opacity: 0.5;
  transform: scale(0.95);
}

.book-item.drag-over {
  transform: translateX(8px);
  transition: transform 0.2s ease;
}

.book-chip {
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
}

.book-chip:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(15, 118, 110, 0.2);
}

.drag-handle {
  opacity: 0.4;
  cursor: grab;
  transition: opacity 0.2s;
}

.book-chip:hover .drag-handle {
  opacity: 0.8;
}

.book-item[draggable="true"] .drag-handle {
  cursor: grab;
}

.book-item.dragging .drag-handle {
  cursor: grabbing;
}

/* Mobile: Hide drag functionality completely */
@media (max-width: 768px) {
  .drag-handle.desktop-only {
    display: none;
  }
  
  .books-scroll-container {
    touch-action: pan-x pan-y;
    -webkit-overflow-scrolling: touch;
  }
  
  .book-item {
    touch-action: auto;
    cursor: default;
    pointer-events: auto;
  }
  
  .book-item[draggable="true"] {
    -webkit-user-drag: none;
    user-select: auto;
  }
}

.edit-input {
  min-width: 200px;
  max-width: 300px;
}

.edit-input :deep(.v-field) {
  border-radius: 8px;
  background: white;
}

/* Slide Down Animation - simplified to prevent layout shift */
.slide-down-enter-active {
  transition: opacity 0.3s ease-out;
}

.slide-down-leave-active {
  transition: opacity 0.2s ease-in;
}

.slide-down-enter-from {
  opacity: 0;
}

.slide-down-leave-to {
  opacity: 0;
}
</style>
