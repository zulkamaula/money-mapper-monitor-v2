<script setup lang="ts">
const currentYear = new Date().getFullYear()

const footerLinks = [
  { title: 'About', to: '/about' },
  { title: 'Privacy Policy', to: '/privacy' },
  { title: 'Terms of Service', to: '/terms' },
  { title: 'Contact', to: '/contact' }
]

const socialLinks = [
  { icon: 'mdi-github', url: 'https://github.com/zulkamaula', label: 'GitHub' },
  { icon: 'mdi-linkedin', url: 'https://www.linkedin.com/in/zulkamaula/', label: 'LinkedIn' },
  { icon: 'mdi-instagram', url: 'https://instagram.com/zulkamaula_', label: 'Instagram' }
]
</script>

<template>
  <VFooter class="app-footer" elevation="0">
    <VContainer fluid class="footer-container">
      <VRow align="center" justify="space-between">
        <!-- Brand Section -->
        <VCol cols="12" md="4" class="text-center text-md-left mb-4 mb-md-0">
          <div class="d-flex align-center justify-center justify-md-start gap-2 mb-3">
            <img src="/icon-m3-transparent.webp" alt="M3 App Logo" class="footer-logo" />
            <div>
              <div class="footer-brand-name">M3 App</div>
              <div class="footer-brand-subtitle">Money Mapper Monitor</div>
            </div>
          </div>
          <p class="footer-tagline">
            Smart envelope budgeting made simple
          </p>
        </VCol>

        <!-- Links Section -->
        <VCol cols="12" md="4" class="text-center mb-4 mb-md-0">
          <div class="footer-links">
            <NuxtLink v-for="link in footerLinks" :key="link.title" :to="link.to" class="footer-link">
              {{ link.title }}
            </NuxtLink>
          </div>
        </VCol>

        <!-- Social & Copyright -->
        <VCol cols="12" md="4" class="text-center text-md-right">
          <div class="social-links mb-3">
            <VBtn v-for="social in socialLinks" :key="social.icon" :href="social.url" :aria-label="social.label" icon
              size="small" variant="text" class="social-btn">
              <VIcon :icon="social.icon" size="20" />
            </VBtn>
          </div>
          <div class="footer-copyright">
            © {{ currentYear }} M3 App. All rights reserved.
          </div>
        </VCol>
      </VRow>
    </VContainer>
  </VFooter>
</template>

<style scoped>
.app-footer {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(15, 118, 110, 0.1) !important;
  padding: 32px 0 40px 0;
  margin-top: auto;
}

.footer-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
}

.footer-logo {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.footer-brand-name {
  font-size: 18px;
  font-weight: 700;
  color: #0f766e;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.footer-brand-subtitle {
  font-size: 10px;
  font-weight: 500;
  color: #0891b2;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.footer-tagline {
  font-size: 14px;
  color: #64748b;
  margin: 0;
  font-style: italic;
}

.footer-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  justify-content: center;
}

.footer-link {
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  text-decoration: none;
  transition: color 0.2s;
  position: relative;
}

.footer-link:hover {
  color: #0f766e;
}

.footer-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: #0f766e;
  transition: width 0.2s;
}

.footer-link:hover::after {
  width: 100%;
}

.social-links {
  display: flex;
  gap: 8px;
  justify-content: center;
  justify-content: flex-end;
}

.social-btn {
  transition: transform 0.2s, background-color 0.2s;
}

.social-btn:hover {
  transform: translateY(-2px);
  background-color: rgba(15, 118, 110, 0.1) !important;
}

.footer-copyright {
  font-size: 13px;
  color: #94a3b8;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 960px) {
  .app-footer {
    padding: 24px 0 12px 0;
  }

  .footer-links {
    flex-direction: column;
    gap: 12px;
  }

  .social-links {
    justify-content: center;
  }

  .footer-copyright {
    margin-top: 8px;
  }
}
</style>
