export type NotificationType = 'success' | 'error' | 'warning' | 'info'

interface NotificationState {
  show: boolean
  message: string
  type: NotificationType
  timeout: number
}

const state = reactive<NotificationState>({
  show: false,
  message: '',
  type: 'success',
  timeout: 3000
})

export const useNotification = () => {
  const showNotification = (message: string, type: NotificationType = 'success', timeout = 3000) => {
    state.message = message
    state.type = type
    state.timeout = timeout
    state.show = true
  }

  const success = (message: string) => {
    showNotification(message, 'success')
  }

  const error = (message: string) => {
    showNotification(message, 'error', 4000)
  }

  const warning = (message: string) => {
    showNotification(message, 'warning')
  }

  const info = (message: string) => {
    showNotification(message, 'info')
  }

  const hide = () => {
    state.show = false
  }

  return {
    state: readonly(state),
    showNotification,
    success,
    error,
    warning,
    info,
    hide
  }
}
