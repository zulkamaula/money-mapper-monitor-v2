import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    ssr: true,
    components,
    directives,
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
