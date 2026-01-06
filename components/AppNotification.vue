<script setup lang="ts">
const { state, hide } = useNotification()

const notificationConfig = computed(() => {
  const configs = {
    success: {
      icon: 'mdi-check-circle',
      bgColor: '#d1fae5',
      borderColor: '#10b981',
      textColor: '#065f46'
    },
    error: {
      icon: 'mdi-alert-circle',
      bgColor: '#fee2e2',
      borderColor: '#ef4444',
      textColor: '#991b1b'
    },
    warning: {
      icon: 'mdi-alert',
      bgColor: '#fef3c7',
      borderColor: '#f59e0b',
      textColor: '#92400e'
    },
    info: {
      icon: 'mdi-information',
      bgColor: '#dbeafe',
      borderColor: '#3b82f6',
      textColor: '#1e40af'
    }
  }
  return configs[state.type]
})
</script>

<template>
  <VSnackbar
    v-model="state.show"
    :timeout="state.timeout"
    location="top"
    class="app-snackbar"
    :style="{ '--timeout': `${state.timeout}ms` }"
  >
    <div class="notification-content" :style="{
      backgroundColor: notificationConfig.bgColor,
      borderLeft: `4px solid ${notificationConfig.borderColor}`,
      color: notificationConfig.textColor
    }">
      <VIcon :icon="notificationConfig.icon" :color="notificationConfig.borderColor" size="24" class="mr-3" />
      <div class="notification-message">{{ state.message }}</div>
      <VBtn icon="mdi-close" size="small" variant="text" @click="hide"
        class="notification-close" :style="{ color: notificationConfig.textColor }" />
      
      <!-- Auto-close progress indicator -->
      <div class="progress-bar" :style="{ backgroundColor: notificationConfig.borderColor }"></div>
    </div>
  </VSnackbar>
</template>

<style scoped>
.app-snackbar :deep(.v-snackbar__wrapper) {
  background: transparent !important;
  box-shadow: none !important;
  padding: 0;
  min-width: 400px;
}

.app-snackbar :deep(.v-snackbar__content) {
  padding: 0 !important;
}

.notification-content {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  animation: slideInDown 0.3s ease-out;
  position: relative;
  overflow: hidden;
}

.notification-message {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
}

.notification-close {
  opacity: 0.6;
  transition: opacity 0.2s;
}

.notification-close:hover {
  opacity: 1;
}

.progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  width: 100%;
  opacity: 0.3;
  animation: shrinkWidth var(--timeout, 3000ms) linear forwards;
}

@keyframes shrinkWidth {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

@keyframes slideInDown {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (max-width: 600px) {
  .app-snackbar :deep(.v-snackbar__wrapper) {
    min-width: auto;
    width: calc(100vw - 32px);
  }

  .notification-content {
    padding: 12px 16px;
  }

  .notification-message {
    font-size: 13px;
  }
}
</style>
