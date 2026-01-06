<script setup lang="ts">
const { state, confirm } = useConfirmDialog()
</script>

<template>
  <VDialog v-model="state.show" max-width="440" persistent class="confirm-dialog">
    <VCard class="confirm-dialog-card" elevation="0">
      <VCardText class="pa-0">
        <!-- Icon Section -->
        <div class="dialog-header">
          <div class="dialog-icon-wrapper" :style="{
            backgroundColor: `rgba(var(--v-theme-${state.config.iconColor}), 0.1)`
          }">
            <VIcon :icon="state.config.icon" :color="state.config.iconColor" size="40" />
          </div>
        </div>

        <!-- Content Section -->
        <div class="pa-6 pa-sm-8 text-center">
          <h3 class="text-h5 text-sm-h4 font-weight-bold text-grey-darken-4 mb-3">{{ state.config.title }}</h3>
          <p class="text-body-2 text-grey mb-0">{{ state.config.message }}</p>
        </div>

        <!-- Actions Section -->
        <div class="d-flex flex-column-reverse flex-sm-row ga-3 px-5 px-sm-6 pb-5 pb-sm-6">
          <VBtn variant="text" color="grey-darken-1" size="large" @click="confirm(false)"
            class="text-none flex-grow-1" rounded="lg" :disabled="state.loading">
            {{ state.config.cancelText }}
          </VBtn>
          <VBtn :color="state.config.confirmColor" size="large" @click="confirm(true)"
            class="text-none flex-grow-1" rounded="lg" elevation="0"
            :loading="state.loading" :disabled="state.loading">
            {{ state.config.confirmText }}
          </VBtn>
        </div>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<style scoped>
.confirm-dialog :deep(.v-overlay__content) {
  margin: 24px;
}

.confirm-dialog-card {
  border-radius: 24px !important;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3) !important;
  border: 1px solid rgba(15, 118, 110, 0.1);
}

.dialog-header {
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.03) 0%, rgba(8, 145, 178, 0.03) 100%);
  padding: 32px 24px 24px 24px;
  text-align: center;
}

.dialog-icon-wrapper {
  width: 88px;
  height: 88px;
  margin: 0 auto;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: scaleIn 0.3s ease-out;
}

@keyframes scaleIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }

  to {
    transform: scale(1);
    opacity: 1;
  }
}

</style>
