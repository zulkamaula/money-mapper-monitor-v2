import { createVuetify } from 'vuetify'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Import only used components for tree-shaking
import {
  VApp,
  VAppBar,
  VAvatar,
  VBtn,
  VCard,
  VCardActions,
  VCardText,
  VCardTitle,
  VChip,
  VCol,
  VContainer,
  VDialog,
  VDivider,
  VFooter,
  VIcon,
  VImg,
  VList,
  VListItem,
  VListItemTitle,
  VMain,
  VMenu,
  VProgressCircular,
  VRow,
  VSkeletonLoader,
  VSpacer,
  VTextField,
} from 'vuetify/components'

// Import only used directives
import { Ripple } from 'vuetify/directives'

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    ssr: true,
    components: {
      VApp,
      VAppBar,
      VAvatar,
      VBtn,
      VCard,
      VCardActions,
      VCardText,
      VCardTitle,
      VChip,
      VCol,
      VContainer,
      VDialog,
      VDivider,
      VFooter,
      VIcon,
      VImg,
      VList,
      VListItem,
      VListItemTitle,
      VMain,
      VMenu,
      VProgressCircular,
      VRow,
      VSkeletonLoader,
      VSpacer,
      VTextField,
    },
    directives: {
      Ripple,
    },
    theme: {
      defaultTheme: 'light',
      themes: {
        light: {
          colors: {
            primary: '#0F766E',
            secondary: '#14B8A6',
            accent: '#06B6D4',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#3B82F6',
            success: '#10B981',
          },
        },
      },
    },
  })

  nuxtApp.vueApp.use(vuetify)
})
