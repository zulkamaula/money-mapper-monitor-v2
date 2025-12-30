<script setup lang="ts">
// Default layout with navbar and footer
</script>

<template>
  <VApp id="app">
    <AppNavbar />
    <VMain class="main-content">
      <slot />
    </VMain>
    <AppFooter />
  </VApp>
</template>

<style>
.main-content {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
</style>
