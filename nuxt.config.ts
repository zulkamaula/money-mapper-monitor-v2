// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-07-15',
  // devtools: { enabled: true },
  ssr: true,
  modules: ['@clerk/nuxt'],
  nitro: {
    preset: 'netlify',
    compressPublicAssets: true,
    minify: true,
  },
  experimental: {
    payloadExtraction: false
  },
  css: ['vuetify/styles', '@mdi/font/css/materialdesignicons.css', '~/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: {
        lang: 'id'
      },
      title: 'M3 App - Money Mapper Monitor',
      titleTemplate: '%s | M3 App',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { 
          name: 'description', 
          content: 'M3 App (Money Mapper Monitor) - Smart Envelope System untuk manajemen keuangan pribadi dengan real-time tracking. Kelola budget Anda dengan mudah dan efisien.'
        },
        { 
          name: 'keywords', 
          content: 'money management, envelope system, finance tracker, budgeting, personal finance, manajemen keuangan, budget tracker, money mapper'
        },
        { name: 'author', content: 'M3 App Team' },
        { name: 'theme-color', content: '#0F766E' },
        
        // Open Graph (Facebook, LinkedIn, WhatsApp)
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'M3 App' },
        { property: 'og:title', content: 'M3 App - Money Mapper Monitor' },
        { 
          property: 'og:description', 
          content: 'Smart Envelope System untuk manajemen keuangan pribadi dengan real-time tracking'
        },
        { property: 'og:url', content: 'https://m3-app.netlify.app' },
        { property: 'og:image', content: 'https://m3-app.netlify.app/icon-m3-transparent.webp' },
        { property: 'og:image:width', content: '512' },
        { property: 'og:image:height', content: '512' },
        { property: 'og:locale', content: 'id_ID' },
        
        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'M3 App - Money Mapper Monitor' },
        { 
          name: 'twitter:description', 
          content: 'Smart Envelope System untuk manajemen keuangan pribadi'
        },
        { name: 'twitter:image', content: 'https://m3-app.netlify.app/icon-m3-transparent.webp' },
        
        // Additional SEO
        { name: 'robots', content: 'index, follow' },
        { name: 'googlebot', content: 'index, follow' },
      ],
      link: [
        // Favicon using webp icon
        { rel: 'icon', type: 'image/webp', href: '/icon-m3-transparent.webp' },
        { rel: 'apple-touch-icon', href: '/icon-m3-transparent.webp' },
        
        // Canonical URL
        { rel: 'canonical', href: 'https://m3-app.netlify.app' },
        
        // Font preconnect
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com'
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: ''
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap'
        }
      ]
    }
  },
  build: {
    transpile: ['vuetify'],
  },
  vite: {
    ssr: {
      noExternal: ['vuetify'],
    },
  },
  runtimeConfig: {
    // Server-only secrets (tidak dikirim ke browser)
    CLERK_JWT_ISSUER: process.env.CLERK_JWT_ISSUER,
    NEON_DATABASE_URL: process.env.NEON_DATABASE_URL,
    public: {
      // Kunci publik boleh dibaca di client
      clerkPublishableKey: process.env.NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    }
  },
  typescript: { strict: true }
})
