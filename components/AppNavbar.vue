<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUser, useAuth } from '@clerk/vue'

const { user } = useUser()
const { signOut } = useAuth()
const userMenu = ref(false)

// Get user display name
const userName = computed(() => {
  return user.value?.firstName || 
    user.value?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 
    'User'
})

// Get user avatar
const userAvatar = computed(() => {
  return user.value?.imageUrl || null
})

async function handleLogout() {
  userMenu.value = false
  await signOut.value()
  navigateTo('/')
}
</script>

<template>
  <VAppBar elevation="0" class="app-navbar">
    <VContainer fluid class="d-flex align-center px-6">
      <!-- Logo & Brand -->
      <div class="d-flex align-center gap-3">
        <img src="/icon-m3-transparent.webp" alt="M3 App Logo" class="navbar-logo" />
        <div>
          <div class="brand-name">M3 App</div>
          <div class="brand-subtitle">Money Mapper Monitor</div>
        </div>
      </div>

      <VSpacer />

      <!-- User Menu -->
      <VMenu v-model="userMenu" location="bottom end" offset="12">
        <template v-slot:activator="{ props }">
          <VBtn v-bind="props" class="user-menu-btn px-0" elevation="0" rounded="pill">
            <VAvatar size="35" :color="userAvatar ? undefined : 'primary'" class="user-avatar">
              <VImg v-if="userAvatar" :src="userAvatar" alt="User Avatar" cover />
              <VIcon v-else icon="mdi-account" size="20" />
            </VAvatar>
            <div class="d-flex align-center ga-1 mx-2">
              <span class="user-display-name d-none d-sm-inline">{{ userName }}</span>
              <VIcon icon="mdi-chevron-down" size="15" class="chevron-icon" />
            </div>
          </VBtn>
        </template>

        <VCard min-width="300" elevation="8" class="user-menu-card">
          <VCardText class="pa-4">
            <div class="d-flex align-center mb-3">
              <VAvatar size="56" :color="userAvatar ? undefined : 'primary'" class="menu-user-avatar mr-3">
                <VImg v-if="userAvatar" :src="userAvatar" alt="User Avatar" cover />
                <VIcon v-else icon="mdi-account" size="28" />
              </VAvatar>
              <div class="flex-grow-1">
                <div class="user-name">{{ userName }}</div>
                <div class="user-email">{{ user?.emailAddresses?.[0]?.emailAddress }}</div>
              </div>
            </div>

            <VDivider class="mb-3" />

            <!-- Menu Items -->
            <VList density="compact" class="user-menu-list mb-5">
              <VListItem prepend-icon="mdi-view-dashboard" title="Dashboard" to="/dashboard" />
              <VListItem prepend-icon="mdi-cog-outline" title="Settings" disabled />
              <VListItem prepend-icon="mdi-help-circle-outline" title="Help & Support" disabled />
            </VList>

            <!-- Logout Button -->
            <VBtn color="error" variant="tonal" block @click="handleLogout" class="text-none">
              <VIcon icon="mdi-logout" class="mr-2" />
              Logout
            </VBtn>
          </VCardText>
        </VCard>
      </VMenu>
    </VContainer>
  </VAppBar>
</template>

<style scoped>
.app-navbar {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(15, 118, 110, 0.1) !important;
}

.navbar-logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.brand-name {
  font-size: 20px;
  font-weight: 700;
  color: #0f766e;
  line-height: 1.5;
  letter-spacing: -0.02em;
}

.brand-subtitle {
  font-size: .6rem;
  font-weight: 500;
  color: #0891b2;
  letter-spacing: .5px;
  text-transform: uppercase;
}

.user-menu-btn {
  background: rgba(15, 118, 110, 0.08) !important;
  border: 1.5px solid rgba(15, 118, 110, 0.2) !important;
  transition: all 0.3s ease;
  min-width: auto !important;
  height: auto;
}

.user-menu-btn:hover {
  background: rgba(15, 118, 110, 0.12) !important;
  border-color: rgba(15, 118, 110, 0.3) !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(15, 118, 110, 0.15) !important;
}

.user-avatar {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.menu-user-avatar {
  border: 2px solid rgba(15, 118, 110, 0.2);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.user-display-name {
  font-size: 10px;
  font-weight: 600;
  color: #0f766e;
  line-height: 1;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chevron-icon {
  color: #0f766e;
  opacity: 0.5;
  transition: transform 0.3s ease;
}

.user-menu-btn[aria-expanded="true"] .chevron-icon {
  transform: rotate(180deg);
}

.user-menu-card {
  border-radius: 16px !important;
  border: 1px solid rgba(15, 118, 110, 0.1);
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #0f766e;
  line-height: 1.3;
}

.user-email {
  font-size: 13px;
  color: #64748b;
  line-height: 1.3;
}

.user-menu-list :deep(.v-list-item) {
  border-radius: 8px !important;
  margin-bottom: 4px;
}

.user-menu-list :deep(.v-list-item:hover) {
  background-color: rgba(15, 118, 110, 0.08);
}

.user-menu-list :deep(.v-list-item--disabled) {
  opacity: 0.5;
}
</style>
