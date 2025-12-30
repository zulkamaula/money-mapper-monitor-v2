<script setup lang="ts">
definePageMeta({
  layout: 'blank'
})

const contactInfo = [
  {
    icon: 'mdi-email',
    title: 'Email',
    value: 'mzulkariski@gmail.com',
    href: 'mailto:mzulkariski@gmail.com',
    color: 'primary'
  },
  {
    icon: 'mdi-github',
    title: 'GitHub',
    value: '@zulkamaula',
    href: 'https://github.com/zulkamaula',
    color: 'grey-darken-3'
  },
  {
    icon: 'mdi-linkedin',
    title: 'LinkedIn',
    value: 'zulkamaula',
    href: 'https://www.linkedin.com/in/zulkamaula/',
    color: 'blue'
  },
  {
    icon: 'mdi-instagram',
    title: 'Instagram',
    value: '@zulkamaula_',
    href: 'https://instagram.com/zulkamaula_',
    color: 'pink'
  }
]
</script>

<template>
  <VContainer fluid class="contact-container">
    <VCard class="contact-card" elevation="0">
      <VCardText class="pa-8 pa-md-12">
        <div class="text-center mb-8">
          <h1 class="contact-title mb-3">Get In Touch</h1>
          <p class="text-body-1 text-medium-emphasis">
            Have questions or feedback? We'd love to hear from you!
          </p>
        </div>

        <div class="contact-content">
          <!-- Intro Section -->
          <section class="text-center mb-10">
            <VIcon icon="mdi-email-outline" size="64" color="primary" class="mb-4" />
            <p class="text-h6 mb-2">Let's Connect</p>
            <p>
              Whether you have a question about features, need technical support, or just want to say hi,
              feel free to reach out through any of the channels below.
            </p>
          </section>

          <!-- Contact Cards -->
          <div class="contact-grid mb-10">
            <a
              v-for="contact in contactInfo"
              :key="contact.title"
              :href="contact.href"
              target="_blank"
              class="contact-item"
            >
              <div class="contact-item-inner">
                <div class="contact-icon-wrapper d-flex gap-2 items-center">
                  <VIcon
                    :icon="contact.icon"
                    size="36"
                    :color="contact.color"
                  />
                  <h3 class="contact-item-title">{{ contact.title }}</h3>
                </div>
                <p class="contact-item-value">{{ contact.value }}</p>
                <div class="contact-arrow">
                  <VIcon icon="mdi-arrow-right" :color="contact.color" size="20" />
                </div>
              </div>
            </a>
          </div>

          <!-- Additional Info Section -->
          <section class="info-section">
            <VRow>
              <VCol cols="12" md="6">
                <div class="info-box">
                  <VIcon icon="mdi-bug-outline" size="32" color="error" class="mb-3" />
                  <h3>Found a Bug?</h3>
                  <p>
                    If you've discovered a bug or issue, please report it on our GitHub repository.
                    Include as much detail as possible to help us fix it quickly.
                  </p>
                  <VBtn
                    href="https://github.com/zulkamaula"
                    target="_blank"
                    color="error"
                    variant="outlined"
                    size="small"
                  >
                    <VIcon icon="mdi-github" start />
                    Report Issue
                  </VBtn>
                </div>
              </VCol>
              <VCol cols="12" md="6">
                <div class="info-box">
                  <VIcon icon="mdi-lightbulb-outline" size="32" color="warning" class="mb-3" />
                  <h3>Feature Request?</h3>
                  <p>
                    Have an idea to make M3 App even better? We're always looking for ways to improve.
                    Share your suggestions with us!
                  </p>
                  <VBtn
                    href="mailto:mzulkariski@gmail.com?subject=M3 App Feature Request"
                    color="warning"
                    variant="outlined"
                    size="small"
                  >
                    <VIcon icon="mdi-email" start />
                    Send Suggestion
                  </VBtn>
                </div>
              </VCol>
            </VRow>
          </section>

          <!-- Response Time -->
          <section class="response-section text-center mt-10">
            <VIcon icon="mdi-clock-outline" size="32" color="success" class="mb-3" />
            <h3>Response Time</h3>
            <p class="text-body-2 text-medium-emphasis">
              We typically respond to all inquiries within 24-48 hours.
              Thank you for your patience!
            </p>
          </section>

          <!-- Back Button -->
          <div class="back-section text-center mt-10">
            <VBtn to="/" color="primary" size="x-large" rounded="xl" elevation="2" class="mr-3 mb-2">
              <VIcon icon="mdi-home" start />
              Back to Home
            </VBtn>
            <VBtn to="/about" color="secondary" variant="tonal" size="x-large" rounded="xl" class="mb-2">
              <VIcon icon="mdi-information" start />
              About Us
            </VBtn>
          </div>
        </div>
      </VCardText>
    </VCard>
  </VContainer>
</template>

<style scoped>
.contact-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f766e 0%, #0891b2 100%);
  padding: 60px 20px;
}

.contact-card {
  max-width: 1000px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.98) !important;
  backdrop-filter: blur(10px);
  border-radius: 24px !important;
}

.contact-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #0f766e;
  letter-spacing: -0.02em;
}

.contact-content {
  color: #334155;
  line-height: 1.8;
}

.contact-content h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #0f766e;
  margin-bottom: 0.75rem;
}

.contact-content p {
  margin-bottom: 1rem;
}

.contact-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

@media (max-width: 992px) {
  .contact-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .contact-grid {
    grid-template-columns: 1fr;
  }
}

.contact-item {
  display: block;
  text-decoration: none;
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
}

.contact-item-inner {
  padding: 32px 24px;
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.07) 0%, rgba(8, 145, 178, 0.04) 100%);
  border: 1.5px solid rgba(15, 118, 110, 0.12);
  border-radius: 24px;
  position: relative;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 2px 12px rgba(15, 118, 110, 0.06);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.contact-item-inner::before {
  content: '';
  position: absolute;
  top: -60%;
  right: -35%;
  width: 140px;
  height: 140px;
  background: radial-gradient(circle, rgba(15, 118, 110, 0.12) 0%, rgba(8, 145, 178, 0.06) 50%, transparent 70%);
  border-radius: 50%;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.contact-item-inner::after {
  content: '';
  position: absolute;
  bottom: -40%;
  left: -25%;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(8, 145, 178, 0.08) 0%, transparent 70%);
  border-radius: 50%;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.5;
}

.contact-item:hover .contact-item-inner {
  transform: translateY(-10px) scale(1.02);
  box-shadow: 0 16px 40px rgba(15, 118, 110, 0.25);
  border-color: rgba(15, 118, 110, 0.25);
}

.contact-item:hover .contact-item-inner::before {
  transform: scale(1.6) translateX(-10px);
  opacity: 0.8;
}

.contact-item:hover .contact-item-inner::after {
  transform: scale(1.3);
  opacity: 0.7;
}

.contact-icon-wrapper {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}

.contact-arrow {
  opacity: 0.6;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
  text-align: right;
}

.contact-item:hover .contact-arrow {
  opacity: 1;
  transform: translateX(4px);
}

.contact-item-inner .d-flex {
  align-items: flex-start;
  gap: 16px;
}

.contact-item-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #0f766e;
  position: relative;
  z-index: 1;
  text-align: left;
}

.contact-item-value {
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 0;
  position: relative;
  z-index: 1;
  text-align: left;
  line-height: 1.4;
}

.info-section {
  margin-top: 32px;
}

.info-box {
  padding: 36px;
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.07) 0%, rgba(8, 145, 178, 0.04) 100%);
  border-radius: 24px;
  border: 1.5px solid rgba(15, 118, 110, 0.12);
  height: 100%;
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 12px rgba(15, 118, 110, 0.06);
}

.info-box::before {
  content: '';
  position: absolute;
  bottom: -45%;
  left: -25%;
  width: 180px;
  height: 180px;
  background: radial-gradient(circle, rgba(15, 118, 110, 0.12) 0%, rgba(8, 145, 178, 0.06) 50%, transparent 70%);
  border-radius: 50%;
}

.info-box::after {
  content: '';
  position: absolute;
  top: -30%;
  right: -20%;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(8, 145, 178, 0.08) 0%, transparent 70%);
  border-radius: 50%;
  opacity: 0.6;
}

.info-box:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 32px rgba(15, 118, 110, 0.2);
  border-color: rgba(15, 118, 110, 0.25);
}

.info-box h3 {
  margin-top: 8px;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
}

.info-box p {
  font-size: 0.9rem;
  margin-bottom: 16px;
  position: relative;
  z-index: 1;
  line-height: 1.6;
}

.info-box .v-icon,
.info-box .v-btn {
  position: relative;
  z-index: 1;
}

.response-section {
  padding: 40px 36px;
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.10) 0%, rgba(56, 142, 60, 0.06) 100%);
  border-radius: 24px;
  border: 1.5px solid rgba(76, 175, 80, 0.18);
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(76, 175, 80, 0.12);
}

.response-section::before {
  content: '';
  position: absolute;
  top: -55%;
  right: -35%;
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(76, 175, 80, 0.14) 0%, rgba(76, 175, 80, 0.06) 40%, transparent 70%);
  border-radius: 50%;
}

.response-section::after {
  content: '';
  position: absolute;
  bottom: -40%;
  left: -30%;
  width: 180px;
  height: 180px;
  background: radial-gradient(circle, rgba(56, 142, 60, 0.10) 0%, transparent 70%);
  border-radius: 50%;
  opacity: 0.7;
}

.response-section h3 {
  color: #2e7d32;
  position: relative;
  z-index: 1;
  font-weight: 600;
}

.response-section p,
.response-section .v-icon {
  position: relative;
  z-index: 1;
}

.back-section .v-btn {
  min-width: 160px;
}

@media (max-width: 768px) {
  .contact-container {
    padding: 40px 16px;
  }

  .contact-title {
    font-size: 2rem;
  }

  .contact-item-inner {
    padding: 24px 20px;
  }

  .contact-item-inner .d-flex {
    gap: 12px;
  }

  .info-box {
    padding: 28px;
  }

  .response-section {
    padding: 28px;
  }

  .back-section .v-btn {
    width: 100%;
    margin: 0 0 12px 0 !important;
  }
}
</style>
