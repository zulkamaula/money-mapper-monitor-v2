<script setup lang="ts">
import { ref, watch } from 'vue'
import { useUser, useAuth } from '@clerk/vue'
import type { MoneyBook, Pocket, Allocation } from '~/types/models'

definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

const { user } = useUser()
const { getToken } = useAuth()

// Use composables for state management
const { selectedBook } = useMoneyBooks()
</script>

<template>
  <div class="dashboard-main">
    <VContainer fluid class="dashboard-container px-6">
      <!-- Money Book Selector (Self-contained, no props needed) -->
      <VRow class="mb-6" justify="center">
        <VCol cols="12">
          <LazyMoneyBookSelector />
        </VCol>
      </VRow>

      <!-- Bottom Row: Pockets + Allocations -->
      <VRow v-if="selectedBook" class="dashboard-content-row">
        <!-- Pockets Manager (Self-contained, no props needed) -->
        <VCol cols="12" sm="12" md="4" class="dashboard-col">
          <LazyPocketsManager />
        </VCol>

        <!-- Allocations History (Self-contained with dialog) -->
        <VCol cols="12" sm="12" md="8" class="dashboard-col">
          <LazyAllocationsHistory />
        </VCol>
      </VRow>
    </VContainer>

    <!-- Modular Components -->
    <AppNotification />
    <ConfirmDialog />
  </div>
</template>

<style scoped>
.dashboard-main {
  background: linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 25%, #80deea 75%, #4dd0e1 100%);
  min-height: 100%;
  padding-top: 30px;
  padding-bottom: 40px;
  overflow-x: hidden;
}

.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
}

.glass-card {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(15, 118, 110, 0.1);
}

/* Hide number input spinners */
:deep(input[type="number"]) {
  -moz-appearance: textfield;
  appearance: textfield;
}

:deep(input[type="number"]::-webkit-outer-spin-button),
:deep(input[type="number"]::-webkit-inner-spin-button) {
  -webkit-appearance: none;
  margin: 0;
}

/* Responsive */
/* Extra small screens - flex column with optimized spacing */
@media (max-width: 599px) {
  .dashboard-main {
    padding-top: 16px;
    padding-bottom: 70px;
  }

  .dashboard-container {
    padding-left: 16px !important;
    padding-right: 16px !important;
  }

  .dashboard-content-row {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .dashboard-col {
    padding-top: 0 !important;
    padding-bottom: 0 !important;
  }
}

/* Small to medium screens */
@media (min-width: 600px) and (max-width: 959px) {
  .dashboard-main {
    padding-top: 20px;
    padding-bottom: 70px;
  }

  .dashboard-content-row {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
}

/* Medium screens and up - default grid layout */
@media (min-width: 960px) {
  .dashboard-content-row {
    display: flex;
    flex-direction: row;
  }
}
</style>
