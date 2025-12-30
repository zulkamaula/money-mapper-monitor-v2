<script setup lang="ts">
definePageMeta({
  layout: 'blank'
})
</script>

<template>
  <VContainer fluid class="home-container d-flex align-center justify-center">
    <LoginForm />
  </VContainer>
</template>

<style scoped>
.home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 25%, #80deea 75%, #4dd0e1 100%);
  padding: 24px;
}
</style>
