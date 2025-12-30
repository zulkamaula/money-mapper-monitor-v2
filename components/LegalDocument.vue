<script setup lang="ts">
defineProps<{
  title: string
  lastUpdated: string
}>()
</script>

<template>
  <VContainer fluid class="legal-container">
    <VCard class="legal-card" elevation="0">
      <VCardText class="pa-8 pa-md-12">
        <div class="text-center mb-8">
          <h1 class="legal-title mb-3">{{ title }}</h1>
          <p class="text-caption text-medium-emphasis">Last Updated: {{ lastUpdated }}</p>
        </div>

        <div class="legal-content">
          <slot />
        </div>

        <div class="text-end mt-10">
          <VBtn to="/" color="secondary" variant="text" rounded="lg">
            <VIcon icon="mdi-arrow-left" class="mr-2" />
            Back to Home
          </VBtn>
        </div>
      </VCardText>
    </VCard>
  </VContainer>
</template>

<style scoped>
.legal-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f766e 0%, #0891b2 100%);
  padding: 60px 20px;
}

.legal-card {
  max-width: 900px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.98) !important;
  backdrop-filter: blur(10px);
  border-radius: 24px !important;
}

.legal-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #0f766e;
  letter-spacing: -0.02em;
}

.legal-content {
  color: #334155;
  line-height: 1.8;
  font-size: 1rem;
}

.legal-content :deep(h2) {
  font-size: 1.75rem;
  font-weight: 600;
  color: #0f766e;
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  letter-spacing: -0.01em;
}

.legal-content :deep(h3) {
  font-size: 1.25rem;
  font-weight: 600;
  color: #0891b2;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.legal-content :deep(p) {
  margin-bottom: 1rem;
}

.legal-content :deep(ul),
.legal-content :deep(ol) {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

.legal-content :deep(li) {
  margin-bottom: 0.5rem;
}

.legal-content :deep(strong) {
  color: #1e293b;
  font-weight: 600;
}

.legal-content :deep(a) {
  color: #0891b2;
  text-decoration: underline;
  transition: color 0.2s;
}

.legal-content :deep(a:hover) {
  color: #0f766e;
}

@media (max-width: 768px) {
  .legal-container {
    padding: 40px 16px;
  }

  .legal-title {
    font-size: 2rem;
  }

  .legal-content {
    font-size: 0.95rem;
  }

  .legal-content :deep(h2) {
    font-size: 1.5rem;
  }

  .legal-content :deep(h3) {
    font-size: 1.125rem;
  }
}
</style>
