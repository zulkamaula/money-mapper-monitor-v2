export default defineNuxtPlugin(() => {
  const { getToken } = useAuth()
  const router = useRouter()
  const { error: showError } = useNotification()
  const { showDialog } = useConfirmDialog()

  // Create custom $fetch instance with interceptors
  globalThis.$fetch = $fetch.create({
    // Request interceptor - auto-add auth token
    async onRequest({ options }) {
      const token = await getToken.value()
      if (token) {
        options.headers = new Headers(options.headers)
        options.headers.set('Authorization', `Bearer ${token}`)
      }
    },

    // Response error interceptor
    async onResponseError({ response }) {
      // Handle 401 - Unauthorized
      if (response.status === 401) {
        showError('Session expired. Please login again.')
        await router.push('/')
        return
      }

      // Handle 403 - Forbidden
      if (response.status === 403) {
        await showDialog({
          title: 'Access Denied',
          message: 'You do not have permission to perform this action.',
          icon: 'mdi-lock-alert',
          iconColor: 'error',
          confirmText: 'OK',
          cancelText: '',
          confirmColor: 'primary'
        })
        return
      }

      // Handle 429 - Rate limiting
      if (response.status === 429) {
        await showDialog({
          title: 'Too Many Requests',
          message: 'You\'re sending too many requests. Please wait a moment and try again.',
          icon: 'mdi-clock-alert',
          iconColor: 'warning',
          confirmText: 'OK',
          cancelText: '',
          confirmColor: 'primary'
        })
        return
      }

      // Handle 500+ - Server errors
      if (response.status >= 500) {
        await showDialog({
          title: 'Server Error',
          message: 'Something went wrong on our end. Please try again in a moment.',
          icon: 'mdi-server-network-off',
          iconColor: 'error',
          confirmText: 'OK',
          cancelText: '',
          confirmColor: 'primary'
        })
        return
      }

      // Handle 404 - Not found (only show for specific cases)
      if (response.status === 404) {
        showError('The requested resource was not found.')
        return
      }
    },

    // Automatic retry on network errors
    retry: 1,
    retryDelay: 500,
    retryStatusCodes: [408, 409, 425, 429, 500, 502, 503, 504]
  })
})
