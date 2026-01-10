import { createVuetify } from 'vuetify'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Import only used components for tree-shaking
import {
  VAlert,
  VApp,
  VAppBar,
  VAutocomplete,
  VAvatar,
  VBtn,
  VBtnToggle,
  VCard,
  VCardActions,
  VCardText,
  VCardTitle,
  VChip,
  VCol,
  VCombobox,
  VContainer,
  VDialog,
  VDivider,
  VFooter,
  VIcon,
  VImg,
  VList,
  VListItem,
  VListItemSubtitle,
  VListItemTitle,
  VMain,
  VMenu,
  VProgressCircular,
  VRow,
  VSelect,
  VSkeletonLoader,
  VSnackbar,
  VSpacer,
  VStepper,
  VStepperActions,
  VStepperHeader,
  VStepperItem,
  VStepperWindow,
  VStepperWindowItem,
  VSwitch,
  VTextField,
} from 'vuetify/components'

// Import only used directives
import { Ripple } from 'vuetify/directives'

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    ssr: true,
    components: {
      VAlert,
      VApp,
      VAppBar,
      VAutocomplete,
      VAvatar,
      VBtn,
      VBtnToggle,
      VCard,
      VCardActions,
      VCardText,
      VCardTitle,
      VChip,
      VCol,
      VCombobox,
      VContainer,
      VDialog,
      VDivider,
      VFooter,
      VIcon,
      VImg,
      VList,
      VListItem,
      VListItemSubtitle,
      VListItemTitle,
      VMain,
      VMenu,
      VProgressCircular,
      VRow,
      VSelect,
      VSkeletonLoader,
      VSnackbar,
      VSpacer,
      VStepper,
      VStepperActions,
      VStepperHeader,
      VStepperItem,
      VStepperWindow,
      VStepperWindowItem,
      VSwitch,
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
    defaults: {
      global: {
        font: {
          family: 'Poppins, sans-serif',
        },
      },
      // Set default color for all form components
      VTextField: {
        color: 'primary',
      },
      VSelect: {
        color: 'primary',
      },
      VAutocomplete: {
        color: 'primary',
      },
      VCombobox: {
        color: 'primary',
      },
      VSwitch: {
        color: 'primary',
      },
    },
  })

  nuxtApp.vueApp.use(vuetify)
})
