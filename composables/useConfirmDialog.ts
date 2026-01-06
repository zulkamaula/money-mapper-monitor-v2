export interface ConfirmDialogConfig {
  title: string
  message: string
  icon?: string
  iconColor?: string
  confirmText?: string
  cancelText?: string
  confirmColor?: string
  onConfirm?: () => Promise<void>
}

interface DialogState {
  show: boolean
  loading: boolean
  config: ConfirmDialogConfig
  resolver: ((value: boolean) => void) | null
}

const state = reactive<DialogState>({
  show: false,
  loading: false,
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

  const confirm = async (result: boolean) => {
    if (!result) {
      // Cancel clicked
      if (state.resolver) {
        state.resolver(false)
      }
      state.show = false
      state.resolver = null
      return
    }

    // Confirm clicked - execute async callback if provided
    if (state.config.onConfirm) {
      state.loading = true
      try {
        await state.config.onConfirm()
        if (state.resolver) {
          state.resolver(true)
        }
      } catch (error) {
        console.error('Confirm action failed:', error)
        if (state.resolver) {
          state.resolver(false)
        }
      } finally {
        state.loading = false
        state.show = false
        state.resolver = null
      }
    } else {
      // No async callback - just return result
      if (state.resolver) {
        state.resolver(true)
      }
      state.show = false
      state.resolver = null
    }
  }

  return {
    state: readonly(state),
    showDialog,
    confirm
  }
}
