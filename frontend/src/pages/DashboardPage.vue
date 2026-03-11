<template>
  <q-page padding class="dashboard-page">
    <div class="dashboard-container">

      <!-- Header Section -->
      <div class="dashboard-header animate-fade-in-up">
        <div>
          <div class="page-title row items-center">
            <q-icon name="dashboard" class="q-mr-sm" size="32px" color="primary" />
            <h1 class="text-h4 text-weight-bold q-ma-none">Monitoramento</h1>
          </div>
          <p class="page-subtitle text-grey-6 q-mt-xs">
            Monitore seus sistemas em tempo real
          </p>
        </div>
        <div class="row items-center gap-md">
          <q-input
            v-model="search"
            placeholder="Pesquisar sistemas (nome, url, stack, servidor)..."
            outlined
            dense
            clearable
            class="search-input-dashboard"
          >
            <template v-slot:prepend>
              <q-icon name="search" color="primary" />
            </template>
          </q-input>

          <q-select
            v-model="selectedRefreshInterval"
            :options="refreshIntervalOptions"
            outlined
            dense
            emit-value
            map-options
            class="refresh-selector q-mr-sm"
            style="min-width: 130px"
          >
            <template v-slot:prepend>
              <q-icon name="update" color="primary" size="20px" />
            </template>
          </q-select>

          <q-btn
            class="add-btn"
            unelevated
            no-caps
            @click="openModal()"
          >
            <q-icon name="add_circle" class="q-mr-sm" />
            Novo Sistema
          </q-btn>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-row animate-fade-in-up" style="animation-delay: 0.1s">
        <div class="stat-card glass-card">
          <div class="stat-icon-wrapper stat-total">
            <q-icon name="apps" size="24px" />
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ appStore.totalCount }}</span>
            <span class="stat-label">Total de Sistemas</span>
          </div>
        </div>

        <div 
          class="stat-card glass-card clickable-card"
          :class="{ 'card-active': activeFilters.online }"
          @click="toggleFilter('online')"
        >
          <div class="stat-icon-wrapper stat-online">
            <q-icon name="check_circle" size="24px" />
          </div>
          <div class="stat-info">
            <span class="stat-value text-green">{{ appStore.onlineCount }}</span>
            <span class="stat-label">Sistemas Online</span>
          </div>
          <q-icon v-if="activeFilters.online" name="filter_alt" color="primary" class="filter-icon" size="20px" />
        </div>

        <div 
          class="stat-card glass-card clickable-card"
          :class="{ 'card-active': activeFilters.slow }"
          @click="toggleFilter('slow')"
        >
          <div class="stat-icon-wrapper stat-slow">
            <q-icon name="speed" size="24px" />
          </div>
          <div class="stat-info">
            <span class="stat-value text-orange">{{ appStore.slowCount }}</span>
            <span class="stat-label">Sistemas Lentos</span>
          </div>
          <q-icon v-if="activeFilters.slow" name="filter_alt" color="primary" class="filter-icon" size="20px" />
        </div>

        <div 
          class="stat-card glass-card clickable-card"
          :class="{ 'card-active': activeFilters.offline }"
          @click="toggleFilter('offline')"
        >
          <div class="stat-icon-wrapper stat-offline">
            <q-icon name="cancel" size="24px" />
          </div>
          <div class="stat-info">
            <span class="stat-value text-red">{{ appStore.offlineCount }}</span>
            <span class="stat-label">Sistemas Offline</span>
          </div>
          <q-icon v-if="activeFilters.offline" name="filter_alt" color="primary" class="filter-icon" size="20px" />
        </div>
      </div>
 
       <!-- Recent Drops Card -->
       <div v-if="appStore.recentDrops.length > 0" class="drops-container animate-fade-in-up" style="animation-delay: 0.15s">
         <div class="stat-card glass-card full-width-card">
           <div class="card-header-simple">
             <div class="row items-center gap-sm">
               <div class="stat-icon-wrapper stat-offline mini-icon q-mr-sm">
                 <q-icon name="warning" size="20px" />
               </div>
               <h3 class="card-title-text">Quedas Recentes</h3>
             </div>
             <q-space />
             <q-btn flat round dense :icon="isDropsExpanded ? 'expand_less' : 'expand_more'" @click="isDropsExpanded = !isDropsExpanded">
               <q-tooltip>{{ isDropsExpanded ? 'Recolher' : 'Expandir' }}</q-tooltip>
             </q-btn>
           </div>
           <div class="drops-list" :class="{ 'collapsed': !isDropsExpanded }">
             <div 
               v-for="drop in appStore.recentDrops" 
               :key="drop.id"
               class="drop-item"
             >
               <div class="row items-center full-width no-wrap">
                  <q-icon name="error_outline" color="red" size="20px" class="q-mr-sm" />
                  <span class="drop-app-name">{{ drop.application?.name }}</span>
                  <q-space />
                  <div class="row items-center no-wrap">
                    <q-btn flat round dense size="sm" icon="history" color="grey-7" @click="openDropLog(drop)" class="btn-history q-mr-xs">
                      <q-tooltip>Ver Histórico</q-tooltip>
                    </q-btn>
                    <span class="drop-time">{{ formatDate(drop.createdAt) }}</span>
                  </div>
               </div>
             </div>
           </div>
         </div>
       </div>

      <!-- Loading State -->
      <div v-if="appStore.loading" class="loading-container">
        <q-spinner-dots color="primary" size="48px" />
        <p class="q-mt-md text-grey-5">Carregando sistemas...</p>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="appStore.applications.length === 0"
        class="empty-state animate-fade-in-up glass-card"
      >
        <q-icon name="dns" size="72px" class="empty-icon" />
        <h3>Nenhum sistema cadastrado</h3>
        <p>Adicione seu primeiro sistema para começar o monitoramento</p>
        <q-btn class="add-btn q-mt-md" unelevated no-caps @click="openModal()">
          <q-icon name="add_circle" class="q-mr-sm" />
          Adicionar Sistema
        </q-btn>
      </div>

      <!-- Applications Grid -->
      <div v-else class="apps-grid">
        <div
          v-for="(app, index) in sortedApplications"
          :key="app.id"
          class="app-card glass-card animate-fade-in-up"
          :class="{
            'card-online': app.status === 'online' && !(app.responseTime >= 500),
            'card-slow': app.status === 'online' && app.responseTime >= 500,
            'card-offline': app.status === 'offline'
          }"
          :style="{ animationDelay: `${0.05 * index}s` }"
        >
          <!-- Status indicator bar -->
          <div
            class="status-bar"
            :class="{
              'bar-online': app.status === 'online' && !(app.responseTime >= 500),
              'bar-slow': app.status === 'online' && app.responseTime >= 500,
              'bar-offline': app.status === 'offline'
            }"
          ></div>

          <div class="card-content">
            <!-- Card Header -->
            <div class="card-header">
              <div class="card-title-area">
                <h3 class="card-title">{{ app.name }}</h3>
                <q-badge
                  :class="{
                    'badge-online': app.status === 'online' && !(app.responseTime >= 500),
                    'badge-slow': app.status === 'online' && app.responseTime >= 500,
                    'badge-offline': app.status === 'offline'
                  }"
                  rounded
                >
                  <div class="status-dot" :class="{
                    'dot-online': app.status === 'online' && !(app.responseTime >= 500),
                    'dot-slow': app.status === 'online' && app.responseTime >= 500,
                    'dot-offline': app.status === 'offline'
                  }"></div>
                  {{ app.status === 'offline' ? 'Offline' : (app.responseTime >= 500 ? 'Lento' : 'Online') }}
                </q-badge>
              </div>
              <div class="row no-wrap">
                <q-btn flat round dense size="sm" icon="history" class="card-menu-btn q-mr-xs" @click="openLogs(app)">
                  <q-tooltip>Ver Histórico</q-tooltip>
                </q-btn>
                <q-btn flat round dense size="sm" icon="more_vert" class="card-menu-btn">
                  <q-menu class="card-menu">
                    <q-list dense>
                      <q-item clickable v-close-popup @click="openModal(app)">
                        <q-item-section avatar>
                          <q-icon name="edit" size="18px" color="blue-4" />
                        </q-item-section>
                        <q-item-section>Editar</q-item-section>
                      </q-item>
                      <q-item clickable v-close-popup @click="confirmDelete(app)">
                        <q-item-section avatar>
                          <q-icon name="delete" size="18px" color="red-4" />
                        </q-item-section>
                        <q-item-section class="text-red-4">Excluir</q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </div>
            </div>

            <!-- Card Details -->
            <div class="card-details">
              <!-- Server (optional) -->
              <div v-if="app.server" class="detail-row">
                <q-icon name="dns" size="16px" class="detail-icon" />
                <span class="detail-text">{{ app.server.name }}</span>
              </div>

              <div class="detail-row">
                <q-icon name="link" size="16px" class="detail-icon" />
                <a :href="app.url" target="_blank" rel="noopener" class="detail-url">
                  {{ app.url }}
                </a>
              </div>

              <div class="detail-row">
                <q-icon name="code" size="16px" class="detail-icon" />
                <span class="detail-text">{{ app.techStack }}</span>
              </div>

              <div class="card-metrics">
                <div class="metric">
                  <span class="metric-label">Tempo de Resposta</span>
                  <span
                    class="metric-value"
                    :class="{
                      'text-green': app.responseTime && app.responseTime < 500,
                      'text-orange': app.responseTime && app.responseTime >= 500 && app.responseTime < 2000,
                      'text-red': app.responseTime && app.responseTime >= 2000,
                    }"
                  >
                    {{ app.responseTime ? `${app.responseTime}ms` : '—' }}
                  </span>
                </div>
                <div class="metric">
                  <span class="metric-label">Última Verificação</span>
                  <span class="metric-value">
                    {{ formatDate(app.lastChecked) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CRUD Modal -->
    <ApplicationModal
      v-model="showModal"
      :application="selectedApp"
      @saved="handleSaved"
    />

    <!-- Logs Modal -->
    <LogsModal
      v-model="showLogs"
      :application="selectedAppForLogs"
      :targetLog="selectedTargetLog"
    />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useApplicationStore } from '../stores/applications'
import ApplicationModal from '../components/ApplicationModal.vue'
import LogsModal from '../components/LogsModal.vue'

const $q = useQuasar()
const appStore = useApplicationStore()

const showModal = ref(false)
const selectedApp = ref(null)

const showLogs = ref(false)
const selectedAppForLogs = ref(null)
const selectedTargetLog = ref(null)

const isDropsExpanded = ref(false)
const search = ref('')

const activeFilters = ref({
  online: false,
  slow: false,
  offline: false
})

const selectedRefreshInterval = ref(30000) // Default 30 segundos
const refreshIntervalOptions = [
  { label: '30 Segundos', value: 30000 },
  { label: '1 Minuto', value: 60000 },
  { label: '2 Minutos', value: 120000 },
  { label: '3 Minutos', value: 180000 },
  { label: '4 Minutos', value: 240000 },
  { label: '5 Minutos', value: 300000 },
  { label: '10 Minutos', value: 600000 },
  { label: '15 Minutos', value: 900000 },
  { label: '30 Minutos', value: 1800000 },
  { label: '45 Minutos', value: 2700000 },
  { label: '60 Minutos', value: 3600000 }
]

function toggleFilter(filterName) {
  activeFilters.value[filterName] = !activeFilters.value[filterName]
}

const sortedApplications = computed(() => {
  let filtered = [...appStore.applications]

  // Verifica se há pelo menos um filtro ativo
  const isAnyFilterActive = activeFilters.value.online || activeFilters.value.slow || activeFilters.value.offline

  if (isAnyFilterActive) {
    filtered = filtered.filter(app => {
      if (activeFilters.value.offline && app.status === 'offline') return true
      if (activeFilters.value.slow && app.status === 'online' && app.responseTime >= 500) return true
      if (activeFilters.value.online && app.status === 'online' && app.responseTime < 500) return true
      return false
    })
  }

  // Filtra por texto de pesquisa
  if (search.value) {
    const s = search.value.toLowerCase()
    filtered = filtered.filter(app => {
      return app.name.toLowerCase().includes(s) ||
             app.url.toLowerCase().includes(s) ||
             app.techStack.toLowerCase().includes(s) ||
             (app.server && app.server.name.toLowerCase().includes(s)) ||
             (app.status === 'offline' && 'offline'.includes(s)) ||
             (app.status === 'online' && app.responseTime >= 500 && 'lento'.includes(s)) ||
             (app.status === 'online' && app.responseTime < 500 && 'online'.includes(s))
    })
  }

  return filtered.sort((a, b) => {
    // Definimos prioridades: 
    // 1 - Offline
    // 2 - Lento (online e responseTime >= 500)
    // 3 - Online
    const getPrio = (app) => {
      if (app.status === 'offline') return 1;
      if (app.status === 'online' && app.responseTime >= 500) return 2;
      return 3;
    }
    
    const prioA = getPrio(a);
    const prioB = getPrio(b);
    
    if (prioA !== prioB) {
      return prioA - prioB;
    }
    
    // Desempate: ordem alfabética do nome do sistema
    return a.name.localeCompare(b.name);
  });
})

function openLogs(app) {
  selectedAppForLogs.value = app
  selectedTargetLog.value = null
  showLogs.value = true
}

function openDropLog(drop) {
  selectedAppForLogs.value = drop.application
  selectedTargetLog.value = drop
  showLogs.value = true
}

function openModal(app = null) {
  selectedApp.value = app
  showModal.value = true
}

function handleSaved() {
  showModal.value = false
  selectedApp.value = null
}

function confirmDelete(app) {
  $q.dialog({
    title: 'Confirmar Exclusão',
    message: `Deseja realmente excluir "${app.name}"?`,
    cancel: {
      label: 'Cancelar',
      flat: true,
      color: 'grey',
    },
    ok: {
      label: 'Excluir',
      color: 'negative',
      unelevated: true,
    },
    persistent: true,
  }).onOk(async () => {
    try {
      await appStore.deleteApplication(app.id)
      $q.notify({
        type: 'positive',
        message: 'Sistema removido com sucesso!',
        icon: 'check_circle',
      })
    } catch {
      $q.notify({
        type: 'negative',
        message: 'Erro ao excluir sistema.',
        icon: 'error',
      })
    }
  })
}

function formatDate(dateStr) {
  if (!dateStr) return 'Nunca'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 60) return `${diffSec}s atrás`
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}min atrás`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h atrás`

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

let refreshIntervalTimer = null

function setupRefreshInterval() {
  if (refreshIntervalTimer) {
    clearInterval(refreshIntervalTimer)
  }
  refreshIntervalTimer = setInterval(() => {
    appStore.fetchApplications()
  }, selectedRefreshInterval.value)
}

watch(selectedRefreshInterval, () => {
  setupRefreshInterval()
})

onMounted(() => {
  appStore.fetchApplications()
  setupRefreshInterval()
})

onUnmounted(() => {
  if (refreshIntervalTimer) {
    clearInterval(refreshIntervalTimer)
  }
})
</script>

<style scoped>
.dashboard-page {
  background: var(--color-bg-primary);
  min-height: 100vh;
}

.dashboard-container {
  width: 100%;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-title h1 {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-subtitle {
  color: var(--color-text-secondary);
  font-size: 14px;
}

.add-btn {
  background: var(--gradient-primary) !important;
  color: #fff !important;
  font-weight: 600;
  padding: 10px 24px !important;
  border-radius: var(--radius-sm) !important;
  font-size: 14px;
  transition: var(--transition-normal);
}

.add-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
}

.search-input-dashboard {
  width: 350px;
  background: var(--color-bg-card);
  border-radius: var(--radius-sm);
  transition: all 0.3s ease;
}

.search-input-dashboard:focus-within {
  width: 450px;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.15);
}

.refresh-selector {
  background: var(--color-bg-card);
  border-radius: var(--radius-sm);
}

.refresh-selector :deep(.q-field__control) {
  height: 40px;
  min-height: 40px;
}

.gap-md {
  gap: 16px;
}

/* Stats */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  position: relative;
  transition: var(--transition-normal);
}

.clickable-card {
  cursor: pointer;
  border: 1px solid transparent;
}

.clickable-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover);
  border-color: var(--color-border);
}

.card-active {
  background: rgba(102, 126, 234, 0.05) !important;
  border: 1px solid var(--color-primary) !important;
  box-shadow: 0 0 0 1px inset var(--color-primary), 0 4px 16px rgba(102, 126, 234, 0.2) !important;
}

.filter-icon {
  position: absolute;
  top: 12px;
  right: 12px;
  opacity: 0.8;
}

.stat-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-total {
  background: rgba(102, 126, 234, 0.15);
  color: #667eea;
}

.stat-online {
  background: rgba(0, 210, 160, 0.15);
  color: #00d2a0;
}

.stat-offline {
  background: rgba(255, 71, 87, 0.15);
  color: #ff4757;
}

.stat-slow {
  background: rgba(255, 165, 2, 0.15);
  color: #ffa502;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 28px;
  font-weight: 800;
  line-height: 1;
  color: var(--color-text-primary);
}

.stat-label {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.text-green {
  color: #00d2a0;
}

.text-red {
  color: #ff4757;
}

.text-orange {
  color: #ffa502;
}

/* Loading */
.loading-container {
  text-align: center;
  padding: 80px 0;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 40px;
  margin-top: 40px;
}

.empty-icon {
  color: var(--color-text-muted);
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 16px 0 8px;
}

.empty-state p {
  color: var(--color-text-secondary);
  font-size: 14px;
  margin: 0;
}

/* Applications Grid */
.apps-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.app-card {
  position: relative;
  overflow: hidden;
  transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
  cursor: default;
}

.app-card:hover {
  transform: translateY(-12px) scale(1.04);
  z-index: 10;
}

.card-online.glass-card {
  border: 1px solid rgba(0, 210, 160, 0.2) !important;
}

.card-online.glass-card:hover {
  border-color: rgba(0, 210, 160, 0.8) !important;
  box-shadow:
    0 16px 48px rgba(0, 210, 160, 0.4),
    0 0 0 1px rgba(0, 210, 160, 0.5),
    0 4px 16px rgba(0, 0, 0, 0.4) !important;
}

.card-offline.glass-card {
  border: 1px solid rgba(255, 71, 87, 0.2) !important;
  animation: blink-offline 2s infinite ease-in-out;
}

@keyframes blink-offline {
  0%, 100% {
    background: var(--color-bg-card);
    border-color: rgba(255, 71, 87, 0.2);
  }
  50% {
    background: rgba(255, 71, 87, 0.1);
    border-color: rgba(255, 71, 87, 0.8);
    box-shadow: 0 0 20px rgba(255, 71, 87, 0.3);
  }
}

.card-offline.glass-card:hover {
  border-color: rgba(255, 71, 87, 0.8) !important;
  box-shadow:
    0 16px 48px rgba(255, 71, 87, 0.4),
    0 0 0 1px rgba(255, 71, 87, 0.5),
    0 4px 16px rgba(0, 0, 0, 0.4) !important;
}

.card-slow.glass-card {
  border: 1px solid rgba(255, 165, 2, 0.2) !important;
}

.card-slow.glass-card:hover {
  border-color: rgba(255, 165, 2, 0.8) !important;
  box-shadow:
    0 16px 48px rgba(255, 165, 2, 0.4),
    0 0 0 1px rgba(255, 165, 2, 0.5),
    0 4px 16px rgba(0, 0, 0, 0.4) !important;
}

.status-bar {
  height: 3px;
  width: 100%;
}

.bar-online {
  background: var(--gradient-online);
}

.bar-slow {
  background: linear-gradient(135deg, #ffa502 0%, #e67e22 100%);
}

.bar-offline {
  background: var(--gradient-offline);
}

.card-content {
  padding: 20px 24px 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.card-title-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.2;
}

.badge-online {
  background: rgba(0, 210, 160, 0.15) !important;
  color: #00d2a0 !important;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.badge-offline {
  background: rgba(255, 71, 87, 0.15) !important;
  color: #ff4757 !important;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.badge-slow {
  background: rgba(255, 165, 2, 0.15) !important;
  color: #ffa502 !important;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.dot-online {
  background: #00d2a0;
  animation: pulse 2s infinite;
}

.dot-offline {
  background: #ff4757;
  animation: pulse 2s infinite;
}

.dot-slow {
  background: #ffa502;
  animation: pulse 2s infinite;
}

.card-menu-btn {
  color: var(--color-text-secondary);
}

.card-menu {
  background: #1a1a3e !important;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm) !important;
}

.card-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-icon {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.detail-url {
  color: var(--color-accent-light);
  text-decoration: none;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-url:hover {
  text-decoration: underline;
}

.detail-text {
  color: var(--color-text-secondary);
  font-size: 13px;
}

.card-metrics {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  column-gap: 12px;
  row-gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.metric-label {
  font-size: 11px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
  white-space: nowrap;
}

.metric-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

@media (max-width: 1200px) {
  .apps-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
  .drops-list {
    grid-template-columns: repeat(3, 1fr) !important;
  }
}

@media (max-width: 900px) {
  .apps-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .drops-list {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

@media (max-width: 600px) {
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .stats-row {
    grid-template-columns: 1fr;
  }

  .apps-grid {
    grid-template-columns: 1fr;
  }

  .drops-list {
    grid-template-columns: 1fr !important;
  }
}

/* Recent Drops Styles */
.full-width-card {
  width: 100%;
  flex-direction: column;
  align-items: flex-start !important;
  gap: 8px !important;
  padding: 24px !important;
}

.drops-container {
  margin-bottom: 16px;
}

.mini-icon {
  width: 36px !important;
  height: 36px !important;
  border-radius: var(--radius-sm);
}

.card-header-simple {
  width: 100%;
  display: flex;
  align-items: center;
}

.card-title-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.drops-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  width: 100%;
  transition: max-height 0.3s ease;
  overflow: hidden;
  max-height: 1000px; /* Grande o suficiente para todos os itens no expanded */
}

.drops-list.collapsed {
  max-height: 50px; /* Ajuste para evitar sobreposição (46px da altura do item + tolerância) */
}

.drop-item {
  padding: 12px 16px;
  background: rgba(255, 71, 87, 0.05);
  border: 1px solid rgba(255, 71, 87, 0.1);
  border-radius: var(--radius-sm);
  transition: var(--transition-normal);
}

.drop-item:first-child {
  animation: blink-offline 2s infinite ease-in-out;
}

.drop-item:hover {
  background: rgba(255, 71, 87, 0.08);
  border-color: rgba(255, 71, 87, 0.2);
  transform: translateX(4px);
}

.drop-app-name {
  font-weight: 600;
  color: var(--color-text-primary);
}

.drop-time {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.btn-history {
  transition: all 0.2s ease;
}

.btn-history:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea !important;
}

.gap-sm {
  gap: 8px;
}
</style>
