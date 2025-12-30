<script setup lang="ts">
definePageMeta({
  layout: 'blank'
})
</script>

<template>
  <VContainer fluid class="about-container">
    <VCard class="about-card" elevation="0">
      <VCardText class="pa-8 pa-md-12">
        <div class="text-center mb-8">
          <h1 class="about-title mb-3">About M3 App</h1>
          <p class="text-body-1 text-medium-emphasis">Money Mapper Monitor</p>
        </div>

        <div class="about-content">
          <!-- Mission Section -->
          <section class="mb-10">
            <h2>Our Mission</h2>
            <p>
              M3 App (Money Mapper Monitor) is designed to make personal finance management simple and accessible
              for everyone.
              We believe that effective budgeting shouldn't be complicated. Our envelope budgeting system helps you
              visualize
              where your money goes and empowers you to take control of your financial future.
            </p>
          </section>

          <!-- Features Section -->
          <section class="mb-10">
            <h2>What We Offer</h2>
            <div class="features-grid">
              <div class="feature-box">
                <VIcon icon="mdi-wallet-outline" size="40" color="primary" class="mb-3" />
                <h3>Smart Envelopes</h3>
                <p>Create custom budget envelopes (pockets) with percentage allocations that match your financial
                  goals.</p>
              </div>
              <div class="feature-box">
                <VIcon icon="mdi-chart-timeline-variant" size="40" color="primary" class="mb-3" />
                <h3>Real-time Tracking</h3>
                <p>Map your transactions instantly and see exactly where your money is going with detailed history.</p>
              </div>
              <div class="feature-box">
                <VIcon icon="mdi-lock-outline" size="40" color="primary" class="mb-3" />
                <h3>Privacy First</h3>
                <p>Your financial data is encrypted and secure. We never sell your information to third parties.</p>
              </div>
              <div class="feature-box">
                <VIcon icon="mdi-cloud-outline" size="40" color="primary" class="mb-3" />
                <h3>Cloud Synced</h3>
                <p>Access your budget from anywhere. Your data is safely stored and synced across all your devices.</p>
              </div>
            </div>
          </section>

          <!-- Technology Section -->
          <section class="mb-10">
            <h2>Built With Modern Technology</h2>
            <p>
              M3 App is built using cutting-edge web technologies to ensure a fast, secure, and reliable experience:
            </p>
            <ul class="tech-list">
              <li><strong>Nuxt 4</strong> - Modern Vue.js framework for optimal performance</li>
              <li><strong>Vuetify 3</strong> - Beautiful Material Design components</li>
              <li><strong>Clerk</strong> - Enterprise-grade authentication</li>
              <li><strong>Neon Database</strong> - Serverless PostgreSQL for scalability</li>
            </ul>
          </section>

          <!-- Developer Section -->
          <section class="mb-10">
            <h2>About the Developer</h2>
            <div class="developer-card">
              <div class="developer-info">
                <h3 class="mb-2">Zulkariski Mauladi</h3>
                <p class="text-body-2 text-medium-emphasis mb-4"><b>Senior Frontend Developer</b> | Fullstack Developer | UI/UX Enthusiast</p>
                <p class="mb-4">
                  Passionate about building user-friendly applications that solve real-world problems. 
                  M3 App was created to help people manage their finances more effectively through 
                  the proven envelope budgeting method.
                </p>
                <div class="developer-links">
                  <VBtn
                    href="https://github.com/zulkamaula"
                    target="_blank"
                    variant="outlined"
                    color="primary"
                    size="small"
                    class="mr-2 mb-2"
                  >
                    <VIcon icon="mdi-github" start />
                    GitHub
                  </VBtn>
                  <VBtn
                    href="https://www.linkedin.com/in/zulkamaula/"
                    target="_blank"
                    variant="outlined"
                    color="primary"
                    size="small"
                    class="mr-2 mb-2"
                  >
                    <VIcon icon="mdi-linkedin" start />
                    LinkedIn
                  </VBtn>
                  <VBtn
                    href="https://instagram.com/zulkamaula_"
                    target="_blank"
                    variant="outlined"
                    color="primary"
                    size="small"
                    class="mb-2"
                  >
                    <VIcon icon="mdi-instagram" start />
                    Instagram
                  </VBtn>
                </div>
              </div>
            </div>
          </section>

          <!-- Open Source Section -->
          <section class="mb-10">
            <h2>Free & Open Philosophy</h2>
            <p>
              M3 App is committed to being free for personal use. We believe financial tools should be accessible
              to everyone, regardless of their economic situation. Our goal is to help you achieve financial wellness
              without adding to your expenses.
            </p>
          </section>

          <!-- Call to Action -->
          <section class="cta-section text-center">
            <div class="cta-content">
              <VIcon icon="mdi-rocket-launch" size="56" color="primary" class="mb-4" />
              <h2 class="mb-3">Ready to Take Control?</h2>
              <p class="mb-6">Start your journey to better financial management today.</p>
              <div class="cta-buttons">
                <VBtn to="/" color="primary" size="x-large" rounded="xl" elevation="2" class="mr-3 mb-2">
                  <VIcon icon="mdi-home" start />
                  Back to Home
                </VBtn>
                <VBtn to="/contact" color="secondary" variant="tonal" size="x-large" rounded="xl" class="mb-2">
                  <VIcon icon="mdi-email" start />
                  Contact Us
                </VBtn>
              </div>
            </div>
          </section>
        </div>
      </VCardText>
    </VCard>
  </VContainer>
</template>

<style scoped>
.about-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f766e 0%, #0891b2 100%);
  padding: 60px 20px;
}

.about-card {
  max-width: 1000px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.98) !important;
  backdrop-filter: blur(10px);
  border-radius: 24px !important;
}

.about-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #0f766e;
  letter-spacing: -0.02em;
}

.about-content {
  color: #334155;
  line-height: 1.8;
  font-size: 1rem;
}

.about-content h2 {
  font-size: 1.75rem;
  font-weight: 600;
  color: #0f766e;
  margin-bottom: 1rem;
  letter-spacing: -0.01em;
}

.about-content h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #0891b2;
  margin-bottom: 0.5rem;
}

.about-content p {
  margin-bottom: 1rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-top: 24px;
}

@media (max-width: 992px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .features-grid {
    grid-template-columns: 1fr;
  }
}

.feature-box {
  padding: 28px 20px;
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.07) 0%, rgba(8, 145, 178, 0.04) 100%);
  border-radius: 24px;
  border: 1.5px solid rgba(15, 118, 110, 0.12);
  text-align: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(15, 118, 110, 0.06);
}

.feature-box::before {
  content: '';
  position: absolute;
  top: -60%;
  right: -40%;
  width: 140px;
  height: 140px;
  background: radial-gradient(circle, rgba(15, 118, 110, 0.12) 0%, rgba(8, 145, 178, 0.06) 50%, transparent 70%);
  border-radius: 50%;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.feature-box::after {
  content: '';
  position: absolute;
  bottom: -40%;
  left: -30%;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(8, 145, 178, 0.08) 0%, transparent 70%);
  border-radius: 50%;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.5;
}

.feature-box:hover {
  transform: translateY(-10px) scale(1.02);
  box-shadow: 0 16px 40px rgba(15, 118, 110, 0.25);
  border-color: rgba(15, 118, 110, 0.25);
}

.feature-box:hover::before {
  transform: scale(1.6) translateX(-10px);
  opacity: 0.8;
}

.feature-box:hover::after {
  transform: scale(1.3);
  opacity: 0.7;
}

.feature-box h3 {
  margin-bottom: 0.75rem;
  position: relative;
  z-index: 1;
  font-weight: 600;
}

.feature-box p {
  font-size: 0.9rem;
  margin-bottom: 0;
  position: relative;
  z-index: 1;
  line-height: 1.6;
}

.feature-box .v-icon {
  position: relative;
  z-index: 1;
}

.tech-list {
  margin-top: 16px;
  padding-left: 24px;
}

.tech-list li {
  margin-bottom: 12px;
}

.developer-card {
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.06) 0%, rgba(8, 145, 178, 0.04) 100%);
  border-radius: 24px;
  padding: 40px;
  border: 1.5px solid rgba(15, 118, 110, 0.12);
  margin-top: 24px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(15, 118, 110, 0.08);
}

.developer-card::before {
  content: '';
  position: absolute;
  top: -100px;
  left: -100px;
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(15, 118, 110, 0.08) 0%, transparent 70%);
  border-radius: 50%;
}

.developer-card::after {
  content: '';
  position: absolute;
  bottom: -80px;
  right: -80px;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(8, 145, 178, 0.06) 0%, transparent 70%);
  border-radius: 50%;
}

.developer-info {
  position: relative;
  z-index: 1;
}

.developer-info h3 {
  color: #0f766e;
  font-size: 1.5rem;
  font-weight: 700;
}

.developer-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cta-section {
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.12) 0%, rgba(8, 145, 178, 0.10) 50%, rgba(15, 118, 110, 0.08) 100%);
  border-radius: 32px;
  padding: 56px 40px;
  position: relative;
  overflow: hidden;
  border: 2px solid rgba(15, 118, 110, 0.2);
  box-shadow: 0 8px 32px rgba(15, 118, 110, 0.15);
}

/* Large decorative circles */
.cta-section::before {
  content: '';
  position: absolute;
  width: 400px;
  height: 400px;
  top: -200px;
  left: -150px;
  background: radial-gradient(circle, rgba(15, 118, 110, 0.18) 0%, rgba(15, 118, 110, 0.08) 40%, transparent 70%);
  border-radius: 50%;
  animation: float 8s ease-in-out infinite;
}

.cta-section::after {
  content: '';
  position: absolute;
  width: 500px;
  height: 500px;
  bottom: -250px;
  right: -200px;
  background: radial-gradient(circle, rgba(8, 145, 178, 0.15) 0%, rgba(8, 145, 178, 0.06) 40%, transparent 70%);
  border-radius: 50%;
  animation: float 10s ease-in-out infinite reverse;
}

/* Additional abstract shapes */
.cta-content::before {
  content: '';
  position: absolute;
  width: 150px;
  height: 150px;
  top: 20%;
  right: 10%;
  background: linear-gradient(45deg, rgba(15, 118, 110, 0.1) 0%, transparent 70%);
  border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
  animation: morph 12s ease-in-out infinite;
  z-index: 0;
}

.cta-content::after {
  content: '';
  position: absolute;
  width: 120px;
  height: 120px;
  bottom: 15%;
  left: 15%;
  background: linear-gradient(-45deg, rgba(8, 145, 178, 0.08) 0%, transparent 70%);
  border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%;
  animation: morph 10s ease-in-out infinite reverse;
  z-index: 0;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) translateX(0);
  }
  50% {
    transform: translateY(-20px) translateX(10px);
  }
}

@keyframes morph {
  0%, 100% {
    border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
    transform: rotate(0deg);
  }
  50% {
    border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%;
    transform: rotate(10deg);
  }
}

.cta-content {
  position: relative;
  z-index: 1;
}

.cta-content > * {
  position: relative;
  z-index: 2;
}

.cta-buttons {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
}

@media (max-width: 768px) {
  .about-container {
    padding: 40px 16px;
  }

  .about-title {
    font-size: 2rem;
  }

  .about-content h2 {
    font-size: 1.5rem;
  }

  .developer-card {
    padding: 24px;
  }

  .cta-section {
    padding: 36px 24px;
  }

  .cta-buttons {
    flex-direction: column;
  }

  .cta-buttons .v-btn {
    width: 100%;
  }
}
</style>
