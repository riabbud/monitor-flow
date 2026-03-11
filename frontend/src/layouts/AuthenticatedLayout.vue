<template>
  <q-layout view="hHh LpR fFf" class="layout-main">
    <!-- HEADER -->
    <q-header v-show="!isFullscreen" class="layout-header" bordered>
      <q-toolbar class="layout-toolbar">
        <!-- Hamburger -->
        <q-btn
          flat
          round
          dense
          icon="menu"
          class="hamburger-btn q-mr-sm"
          @click="drawerOpen = !drawerOpen"
        />

        <!-- Logo -->
        <router-link :to="{ name: 'Dashboard' }" class="layout-brand">
          <img v-if="selectedCompanyLogo" :src="selectedCompanyLogo" class="brand-logo company-logo-header" />
          <img v-else src="/logo.png" alt="Monitor-Flow" class="brand-logo" />
          <span class="brand-text">Monitor-Flow</span>
        </router-link>

        <q-space />


        <!-- Company Selector -->
        <q-select
          v-model="authStore.selectedCompanyId"
          :options="companiesOptions"
          label="Empresa"
          emit-value
          map-options
          dense
          outlined
          :clearable="authStore.isAdmin"
          :readonly="!authStore.isAdmin"
          options-dense
          class="company-selector q-mr-md"
          popup-content-class="company-selector-popup"
          @update:model-value="onCompanyChanged"
        >
          <template v-slot:option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section avatar v-if="scope.opt.logo">
                <q-avatar size="24px" rounded>
                  <img :src="scope.opt.logo" />
                </q-avatar>
              </q-item-section>
              <q-item-section avatar v-else>
                <q-icon name="business" size="20px" color="grey-6" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ scope.opt.label }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
          <template v-slot:prepend>
            <q-icon name="business" size="18px" />
          </template>
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey">Nenhuma empresa</q-item-section>
            </q-item>
          </template>
        </q-select>

        <!-- Status indicators -->
        <div class="status-badges q-mr-md">
          <q-badge class="status-badge online-badge q-mr-sm" rounded>
            <q-icon name="check_circle" size="14px" class="q-mr-xs" />
            {{ appStore.onlineCount }} Online
          </q-badge>
          <q-badge class="status-badge slow-badge q-mr-sm" rounded>
            <q-icon name="speed" size="14px" class="q-mr-xs" />
            {{ appStore.slowCount }} Lento
          </q-badge>
          <q-badge class="status-badge offline-badge" rounded>
            <q-icon name="cancel" size="14px" class="q-mr-xs" />
            {{ appStore.offlineCount }} Offline
          </q-badge>
        </div>

        <!-- Theme Toggle -->
        <q-btn
          flat
          round
          dense
          class="theme-toggle-btn q-mr-sm"
          @click="themeStore.toggle()"
        >
          <q-icon :name="themeStore.isDark ? 'light_mode' : 'dark_mode'" size="22px" />
          <q-tooltip>{{ themeStore.isDark ? 'Modo Claro' : 'Modo Escuro' }}</q-tooltip>
        </q-btn>

        <!-- Fullscreen Toggle -->
        <q-btn
          flat
          round
          dense
          class="theme-toggle-btn q-mr-sm"
          @click="toggleFullscreen"
        >
          <q-icon name="fullscreen" size="22px" />
          <q-tooltip>Modo TV / Tela Cheia</q-tooltip>
        </q-btn>

        <!-- User info -->
        <q-btn flat round class="user-avatar-btn">
          <q-avatar size="36px" class="user-avatar">
            <span>{{ userInitial }}</span>
          </q-avatar>
          <q-menu class="user-menu">
            <q-list style="min-width: 200px">
              <q-item class="user-menu-header">
                <q-item-section>
                  <q-item-label class="text-weight-bold">
                    {{ authStore.userName }}
                  </q-item-label>
                  <q-item-label caption class="text-grey-5">
                    {{ authStore.user?.email }}
                  </q-item-label>
                  <q-item-label caption class="text-grey-6 q-mt-xs">
                    <q-badge
                      v-if="authStore.isAdmin"
                      color="amber-8"
                      label="Admin"
                      rounded
                      dense
                      class="q-mr-xs"
                    />
                    <q-badge
                      v-if="authStore.userCompany"
                      color="blue-grey-6"
                      :label="authStore.userCompany.name"
                      rounded
                      dense
                    />
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-close-popup @click="handleLogout" class="logout-item">
                <q-item-section avatar>
                  <q-icon name="logout" color="red-4" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-red-4">Sair</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <!-- SIDEBAR DRAWER -->
    <q-drawer
      v-model="drawerOpen"
      :mini="drawerMini"
      :width="260"
      :mini-width="60"
      bordered
      class="sidebar-drawer"
    >
      <div class="column full-height no-wrap">
        <q-list class="sidebar-list col">
          <!-- Dashboard -->
          <q-item
            v-if="authStore.hasPermission('dashboard')"
            clickable
            :to="{ name: 'Dashboard' }"
            exact
            class="sidebar-item"
            active-class="sidebar-item-active"
          >
            <q-item-section avatar>
              <q-icon name="analytics" />
            </q-item-section>
            <q-item-section>Dashboard</q-item-section>
          </q-item>

          <!-- Monitoramento -->
          <q-item
            v-if="authStore.hasPermission('monitoring')"
            clickable
            :to="{ name: 'Monitoring' }"
            exact
            class="sidebar-item"
            active-class="sidebar-item-active"
          >
            <q-item-section avatar>
              <q-icon name="dashboard" />
            </q-item-section>
            <q-item-section>Monitoramento</q-item-section>
          </q-item>

          <!-- Servidores -->
          <q-item
            v-if="authStore.hasPermission('servers')"
            clickable
            :to="{ name: 'Servers' }"
            class="sidebar-item"
            active-class="sidebar-item-active"
          >
            <q-item-section avatar>
              <q-icon name="dns" />
            </q-item-section>
            <q-item-section>Servidores</q-item-section>
          </q-item>

          <!-- Tecnologias -->
          <q-item
            v-if="authStore.hasPermission('technologies')"
            clickable
            :to="{ name: 'Technologies' }"
            class="sidebar-item"
            active-class="sidebar-item-active"
          >
            <q-item-section avatar>
              <q-icon name="code" />
            </q-item-section>
            <q-item-section>Tecnologias</q-item-section>
          </q-item>

          <!-- Sistemas -->
          <q-item
            v-if="authStore.hasPermission('applications')"
            clickable
            :to="{ name: 'Applications' }"
            class="sidebar-item"
            active-class="sidebar-item-active"
          >
            <q-item-section avatar>
              <q-icon name="list_alt" />
            </q-item-section>
            <q-item-section>Sistemas</q-item-section>
          </q-item>


          <!-- Administração do Sistema (Dropdown) -->
          <q-expansion-item
            v-if="showAdminMenu"
            v-model="adminMenuOpen"
            icon="settings"
            label="Administração"
            class="sidebar-expansion"
            :class="{ 'sidebar-expansion-active': isAdminRouteActive }"
            header-class="sidebar-item"
            expand-icon-class="expand-icon"
            dense
          >
            <!-- Empresas -->
            <q-item
              v-if="authStore.hasPermission('companies')"
              clickable
              :to="{ name: 'Companies' }"
              class="sidebar-subitem"
              active-class="sidebar-item-active"
            >
              <q-item-section avatar>
                <q-icon name="business" size="20px" />
              </q-item-section>
              <q-item-section>Empresas</q-item-section>
            </q-item>

            <!-- Perfis de Acesso -->
            <q-item
              v-if="authStore.hasPermission('accessProfiles')"
              clickable
              :to="{ name: 'AccessProfiles' }"
              class="sidebar-subitem"
              active-class="sidebar-item-active"
            >
              <q-item-section avatar>
                <q-icon name="admin_panel_settings" size="20px" />
              </q-item-section>
              <q-item-section>Perfis de Acesso</q-item-section>
            </q-item>

            <!-- Usuários -->
            <q-item
              v-if="authStore.hasPermission('users')"
              clickable
              :to="{ name: 'Users' }"
              class="sidebar-subitem"
              active-class="sidebar-item-active"
            >
              <q-item-section avatar>
                <q-icon name="people" size="20px" />
              </q-item-section>
              <q-item-section>Usuários</q-item-section>
            </q-item>
          </q-expansion-item>
        </q-list>

        <!-- Sidebar Footer -->
        <div v-if="!drawerMini" class="sidebar-footer q-py-md text-center">
          <div class="version-label text-grey-6">v{{ version }}</div>
        </div>
      </div>


    </q-drawer>

    <!-- Fullscreen exit button (floating) -->
    <div v-if="isFullscreen" class="fullscreen-exit-btn" @click="toggleFullscreen">
      <q-icon name="fullscreen_exit" size="20px" />
      <q-tooltip>Sair da Tela Cheia</q-tooltip>
    </div>

    <!-- MAIN CONTENT -->
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from '../stores/auth'
import { useApplicationStore } from '../stores/applications'
import { useServerStore } from '../stores/servers'
import { useTechnologyStore } from '../stores/technologies'
import { useThemeStore } from '../stores/theme'
import { useCompanyStore } from '../stores/companies'
import pkg from '../../package.json'

const version = pkg.version

const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const authStore = useAuthStore()
const appStore = useApplicationStore()
const serverStore = useServerStore()
const technologyStore = useTechnologyStore()
const themeStore = useThemeStore()
const companyStore = useCompanyStore()

const isFullscreen = ref(false)
const drawerOpen = ref(true)
const drawerMini = ref(false)
const companiesOptions = ref([])

const userInitial = computed(() => {
  return authStore.userName ? authStore.userName.charAt(0).toUpperCase() : '?'
})

const selectedCompanyLogo = computed(() => {
  if (!authStore.selectedCompanyId) return null
  
  // Try to find in loaded options
  const selected = companiesOptions.value.find(c => c.value === authStore.selectedCompanyId)
  if (selected?.logo) return selected.logo
  
  // Fallback to current user's company logo if IDs match
  if (authStore.user?.companyId === authStore.selectedCompanyId) {
    return authStore.user?.company?.logo || null
  }
  
  return null
})

// Show admin menu if user is admin or has permission to any admin page
const showAdminMenu = computed(() => {
  return authStore.isAdmin ||
    authStore.hasPermission('users') ||
    authStore.hasPermission('companies') ||
    authStore.hasPermission('accessProfiles')
})

// Highlight admin menu when on admin routes
const isAdminRouteActive = computed(() => {
  const adminRoutes = ['Users', 'Companies', 'AccessProfiles']
  return adminRoutes.includes(route.name)
})

// Keep admin dropdown open when on admin routes
const adminMenuOpen = ref(false)
watch(isAdminRouteActive, (active) => {
  if (active) adminMenuOpen.value = true
}, { immediate: true })

function handleLogout() {
  authStore.selectedCompanyId = null
  authStore.logout()
  router.push({ name: 'Login' })
}

function onCompanyChanged() {
  // Reload data when admin switches company
  appStore.fetchApplications()
  serverStore.fetchServers()
  technologyStore.fetchTechnologies()
}

async function toggleFullscreen() {
  if (!document.fullscreenElement && !isFullscreen.value) {
    // Entrando em tela cheia
    try {
      await document.documentElement.requestFullscreen()
    } catch (err) {
      // Fallback: esconde header manualmente
      isFullscreen.value = true
      drawerMini.value = true
    }
    $q.notify({
      type: 'info',
      message: 'Pressione F11 para ocultar a barra do navegador',
      icon: 'fullscreen',
      timeout: 4000,
      position: 'top',
    })
  } else {
    // Saindo da tela cheia
    isFullscreen.value = false
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        drawerMini.value = false
      }
    } catch (err) {
      // ignore
    }
  }
}

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
  if (isFullscreen.value) {
    drawerMini.value = true
  } else {
    drawerMini.value = false
  }
}

onMounted(async () => {
  authStore.fetchUser()
  appStore.fetchApplications()
  appStore.setupSocketListeners()
  serverStore.fetchServers()
  serverStore.setupSocketListeners()
  technologyStore.fetchTechnologies()
  technologyStore.setupSocketListeners()
  document.addEventListener('fullscreenchange', onFullscreenChange)

  // Load companies for the selector
  const companiesData = await companyStore.fetchCompaniesSelect()
  companiesOptions.value = companiesData.map(c => ({
    label: c.name,
    value: c.id,
    logo: c.logo
  }))

  // If not admin, force selection to their company
  if (!authStore.isAdmin && authStore.user?.companyId) {
    authStore.selectedCompanyId = authStore.user.companyId
  }
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})
</script>

<style scoped>
.layout-main {
  background: var(--color-bg-primary);
}

.layout-header {
  background: rgba(17, 17, 40, 0.85) !important;
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--color-border) !important;
}

.layout-toolbar {
  width: 100%;
  padding: 0 24px 0 8px;
  min-height: 64px;
}

.layout-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.layout-brand:hover {
  opacity: 0.8;
}

.brand-logo {
  height: 32px;
  width: auto;
  object-fit: contain;
}

.company-logo-header {
  border-radius: 4px;
  background: white;
  padding: 2px;
}

.brand-text {
  font-size: 20px;
  font-weight: 700;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.5px;
}

.version-label {
  font-size: 11px;
  opacity: 0.4;
  letter-spacing: 1px;
  font-weight: 500;
}

.company-selector {
  min-width: 200px;
  max-width: 280px;
}

.company-selector :deep(.q-field__control) {
  background: rgba(255, 255, 255, 0.06) !important;
  border-color: rgba(255, 255, 255, 0.12) !important;
  border-radius: 8px;
  color: var(--color-text-primary);
  height: 36px;
  min-height: 36px;
}

.company-selector :deep(.q-field__label) {
  color: var(--color-text-secondary) !important;
  font-size: 12px;
}

.company-selector :deep(.q-field__native),
.company-selector :deep(.q-field__prefix),
.company-selector :deep(.q-field__input) {
  color: var(--color-text-primary) !important;
  font-size: 13px;
}

.company-selector :deep(.q-icon) {
  color: var(--color-text-secondary);
}

.status-badges {
  display: flex;
  align-items: center;
}

.status-badge {
  padding: 6px 12px;
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.3px;
}

.online-badge {
  background: rgba(0, 210, 160, 0.15) !important;
  color: #00d2a0 !important;
  border: 1px solid rgba(0, 210, 160, 0.3);
}

.offline-badge {
  background: rgba(255, 71, 87, 0.15) !important;
  color: #ff4757 !important;
  border: 1px solid rgba(255, 71, 87, 0.3);
}

.slow-badge {
  background: rgba(255, 165, 2, 0.15) !important;
  color: #ffa502 !important;
  border: 1px solid rgba(255, 165, 2, 0.3);
}

.user-avatar {
  background: var(--gradient-primary);
  color: #fff;
  font-weight: 700;
  font-size: 15px;
}

.user-menu {
  background: #1a1a3e !important;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.user-menu-header {
  padding: 16px;
}

.logout-item:hover {
  background: rgba(255, 71, 87, 0.1);
}

.theme-toggle-btn {
  color: var(--color-text-secondary);
  transition: color 0.3s ease, transform 0.3s ease;
}

.theme-toggle-btn:hover {
  color: #ffa502;
  transform: rotate(20deg);
}

@media (max-width: 600px) {
  .status-badges {
    display: none;
  }
  .company-selector {
    display: none;
  }
  .brand-text {
    font-size: 16px;
  }
}

.fullscreen-exit-btn {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9999;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: all 0.3s ease;
  opacity: 0.4;
}

.fullscreen-exit-btn:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.2);
  color: var(--color-text-primary);
  transform: scale(1.1);
}

/* Hamburger */
.hamburger-btn {
  color: var(--color-text-secondary);
}

/* Sidebar Drawer */
.sidebar-drawer {
  background: rgba(17, 17, 40, 0.95) !important;
  border-right: 1px solid var(--color-border) !important;
}

.sidebar-list {
  padding: 12px 8px;
}

.sidebar-item {
  border-radius: 8px;
  margin-bottom: 4px;
  color: var(--color-text-secondary);
  min-height: 44px;
  transition: all 0.2s ease;
}

.sidebar-item:hover {
  background: rgba(102, 126, 234, 0.1);
  color: var(--color-text-primary);
}

.sidebar-item-active {
  background: rgba(102, 126, 234, 0.15) !important;
  color: #667eea !important;
}

.sidebar-item-active .q-icon {
  color: #667eea !important;
}

.sidebar-item .q-icon {
  font-size: 22px;
}

/* Admin expansion item */
.sidebar-expansion {
  border-radius: 8px;
  overflow: hidden;
}

.sidebar-expansion :deep(.q-expansion-item__container) {
  border-radius: 8px;
}

.sidebar-expansion :deep(.q-item) {
  color: var(--color-text-secondary);
  min-height: 44px;
}

.sidebar-expansion :deep(.q-item:hover) {
  background: rgba(102, 126, 234, 0.1);
  color: var(--color-text-primary);
}

.sidebar-expansion :deep(.q-icon) {
  color: var(--color-text-secondary);
  font-size: 22px;
}

.sidebar-expansion-active :deep(.q-expansion-item__toggle-icon) {
  color: #667eea !important;
}

.sidebar-expansion-active > :deep(.q-expansion-item__container > .q-item) {
  color: #667eea !important;
}

.sidebar-expansion-active > :deep(.q-expansion-item__container > .q-item .q-icon) {
  color: #667eea !important;
}

/* Sub-menu items */
.sidebar-subitem {
  border-radius: 6px;
  margin-left: 12px;
  margin-bottom: 2px;
  color: var(--color-text-secondary);
  min-height: 40px;
  padding-left: 16px;
  transition: all 0.2s ease;
  font-size: 13px;
}

.sidebar-subitem:hover {
  background: rgba(102, 126, 234, 0.1);
  color: var(--color-text-primary);
}

.sidebar-subitem .q-icon {
  font-size: 18px;
}

</style>
