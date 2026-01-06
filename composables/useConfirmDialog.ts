export interface ConfirmDialogConfig {
  title: string
  message: string
  icon?: string
  iconColor?: string
  confirmText?: string
  cancelText?: string
  confirmColor?: string
}

interface DialogState {
  show: boolean
  config: ConfirmDialogConfig
  resolver: ((value: boolean) => void) | null
}

const state = reactive<DialogState>({
  show: false,
  config: {
    title: '',
    message: '',
    icon: 'mdi-alert-circle',
    iconColor: 'error',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmColor: 'error'
  },
  resolver: null
})

export const useConfirmDialog = () => {
  const showDialog = (config: ConfirmDialogConfig): Promise<boolean> => {
    return new Promise((resolve) => {
      state.config = {
        icon: 'mdi-alert-circle',
        iconColor: 'error',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        confirmColor: 'error',
        ...config
      }
      state.resolver = resolve
      state.show = true
    })
  }

  const confirm = (result: boolean) => {
    if (state.resolver) {
      state.resolver(result)
    }
    state.show = false
    state.resolver = null
  }

  return {
    state: readonly(state),
    showDialog,
    confirm
  }
}
