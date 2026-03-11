<template>
  <q-page padding class="analytics-page">
    <div class="row items-center justify-between q-mb-lg">
      <div class="page-title row items-center">
        <q-icon name="analytics" class="q-mr-sm" size="32px" color="primary" />
        <h1 class="text-h4 text-weight-bold q-ma-none">Dashboard Analítico</h1>
      </div>
      <div class="row q-gutter-md items-center filter-row">
        <q-input 
          v-model="startDate" 
          outlined 
          dense 
          type="date" 
          label="Data Início" 
          class="date-input"
          :class="{ 'dark-date-input': themeStore.isDark }"
          @update:model-value="refreshData"
        />
        <q-input 
          v-model="endDate" 
          outlined 
          dense 
          type="date" 
          label="Data Fim" 
          class="date-input"
          :class="{ 'dark-date-input': themeStore.isDark }"
          @update:model-value="refreshData"
        />
        <q-btn
          color="primary"
          icon="refresh"
          label="Atualizar"
          outline
          @click="refreshData"
          class="refresh-btn"
        />
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="row q-col-gutter-lg q-mb-lg stats-cards">
      <div class="col-12 col-sm-4 col-md">
        <q-card class="stat-card">
          <q-card-section>
            <div class="text-subtitle2 stat-label">Total de Pings Online</div>
            <div class="text-h4 text-positive text-weight-bolder">{{ totalOnlinePings }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-4 col-md">
        <q-card class="stat-card">
          <q-card-section>
            <div class="text-subtitle2 stat-label">Total de Pings Lentos</div>
            <div class="text-h4 text-warning text-weight-bolder">{{ totalSlowPings }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-4 col-md">
        <q-card class="stat-card">
          <q-card-section>
            <div class="text-subtitle2 stat-label">Total de Quedas</div>
            <div class="text-h4 text-negative text-weight-bolder">{{ totalDrops }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-4 col-md">
        <q-card class="stat-card">
          <q-card-section>
            <div class="text-subtitle2 stat-label">Servidores</div>
            <div class="text-h4 text-info text-weight-bolder">{{ servers.length }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-4 col-md">
        <q-card class="stat-card">
          <q-card-section>
            <div class="text-subtitle2 stat-label">Média de Resposta</div>
            <div class="text-h4 text-accent text-weight-bolder">{{ globalAvgResponseTime }}ms</div>
          </q-card-section>
        </q-card>
      </div>

    </div>

    <div class="row q-col-gutter-lg">
      <!-- Chart 1: Drops by System by Day -->
      <div class="col-12">
        <q-card class="chart-card">
          <q-card-section class="chart-header row items-center justify-between">
            <div class="text-h6">Quedas por Sistema por Dia</div>
            <q-btn flat round dense icon="fullscreen" color="grey-6" @click="openFullscreen('dropsDay', 'Quedas por Sistema por Dia')">
               <q-tooltip>Ampliar Gráfico</q-tooltip>
            </q-btn>
          </q-card-section>
          <q-card-section>
            <apexchart type="line" height="350" :options="dropsByDayChartOptions" :series="dropsByDayChartSeries"></apexchart>
          </q-card-section>
        </q-card>
      </div>

      <!-- Chart 2: Drops / Quedas -->
      <div class="col-12 col-md-6">
        <q-card class="chart-card">
          <q-card-section class="chart-header row items-center justify-between">
            <div class="text-h6">Sistemas com mais Quedas</div>
            <q-btn flat round dense icon="fullscreen" color="grey-6" @click="openFullscreen('drops', 'Sistemas com mais Quedas')">
               <q-tooltip>Ampliar Gráfico</q-tooltip>
            </q-btn>
          </q-card-section>
          <q-card-section>
            <apexchart type="bar" height="300" :options="dropsChartOptions" :series="dropsChartSeries"></apexchart>
          </q-card-section>
        </q-card>
      </div>

      <!-- Chart 3: Disponibilidade (Uptime %) -->
      <div class="col-12 col-md-6">
        <q-card class="chart-card">
          <q-card-section class="chart-header row items-center justify-between">
            <div class="text-h6">Disponibilidade (SLA %)</div>
            <q-btn flat round dense icon="fullscreen" color="grey-6" @click="openFullscreen('uptime', 'Disponibilidade (SLA %)')">
               <q-tooltip>Ampliar Gráfico</q-tooltip>
            </q-btn>
          </q-card-section>
          <q-card-section>
            <apexchart type="bar" height="300" :options="uptimeChartOptions" :series="uptimeChartSeries"></apexchart>
          </q-card-section>
        </q-card>
      </div>

      <!-- Chart 4: Histograma de Ping -->
      <div class="col-12 col-md-6">
        <q-card class="chart-card">
          <q-card-section class="chart-header row items-center justify-between">
            <div class="text-h6">Histograma de Ping de Velocidade</div>
            <q-btn flat round dense icon="fullscreen" color="grey-6" @click="openFullscreen('pingHist', 'Histograma de Ping de Velocidade')">
               <q-tooltip>Ampliar Gráfico</q-tooltip>
            </q-btn>
          </q-card-section>
          <q-card-section>
            <apexchart type="donut" height="300" :options="pingHistChartOptions" :series="pingHistChartSeries"></apexchart>
          </q-card-section>
        </q-card>
      </div>

      <!-- Chart 5: Quedas por Hora do Dia -->
      <div class="col-12 col-md-6">
        <q-card class="chart-card">
          <q-card-section class="chart-header row items-center justify-between">
            <div class="text-h6">Horários Mais Críticos de Falhas e Lentidão</div>
            <q-btn flat round dense icon="fullscreen" color="grey-6" @click="openFullscreen('hourDrops', 'Horários Mais Críticos de Falhas')">
               <q-tooltip>Ampliar Gráfico</q-tooltip>
            </q-btn>
          </q-card-section>
          <q-card-section>
            <apexchart type="bar" height="300" :options="hourDropsChartOptions" :series="hourDropsChartSeries"></apexchart>
          </q-card-section>
        </q-card>
      </div>

      <!-- Chart 6: Histórico Global de Lentidão -->
      <div class="col-12">
        <q-card class="chart-card">
          <q-card-section class="chart-header row items-center justify-between">
            <div class="text-h6">Histórico Global de Lentidão (ms)</div>
            <q-btn flat round dense icon="fullscreen" color="grey-6" @click="openFullscreen('historyResponse', 'Histórico Global de Lentidão')">
               <q-tooltip>Ampliar Gráfico</q-tooltip>
            </q-btn>
          </q-card-section>
          <q-card-section>
            <apexchart type="area" height="350" :options="historyResponseChartOptions" :series="historyResponseChartSeries"></apexchart>
          </q-card-section>
        </q-card>
      </div>

      <!-- Chart 7: Apps per Technology -->
      <div class="col-12 col-md-6">
        <q-card class="chart-card">
          <q-card-section class="chart-header row items-center justify-between">
            <div class="text-h6">Sistemas por Tecnologia</div>
            <q-btn flat round dense icon="fullscreen" color="grey-6" @click="openFullscreen('tech', 'Sistemas por Tecnologia')">
               <q-tooltip>Ampliar Gráfico</q-tooltip>
            </q-btn>
          </q-card-section>
          <q-card-section>
            <apexchart type="bar" height="300" :options="techChartOptions" :series="techChartSeries"></apexchart>
          </q-card-section>
        </q-card>
      </div>

      <!-- Chart 8: Status Distribution -->
      <div class="col-12 col-md-6">
        <q-card class="chart-card">
          <q-card-section class="chart-header row items-center justify-between">
            <div class="text-h6">Distribuição de Status</div>
            <q-btn flat round dense icon="fullscreen" color="grey-6" @click="openFullscreen('status', 'Distribuição de Status')">
               <q-tooltip>Ampliar Gráfico</q-tooltip>
            </q-btn>
          </q-card-section>
          <q-card-section>
            <apexchart type="donut" height="300" :options="statusChartOptions" :series="statusChartSeries"></apexchart>
          </q-card-section>
        </q-card>
      </div>

      <!-- Chart 9: Quedas por Servidor -->
      <div class="col-12 col-md-6">
        <q-card class="chart-card">
          <q-card-section class="chart-header row items-center justify-between">
            <div class="text-h6">Falhas Agrupadas por Servidor</div>
            <q-btn flat round dense icon="fullscreen" color="grey-6" @click="openFullscreen('serverDrops', 'Falhas Agrupadas por Servidor')">
               <q-tooltip>Ampliar Gráfico</q-tooltip>
            </q-btn>
          </q-card-section>
          <q-card-section>
            <apexchart type="donut" height="300" :options="serverDropsChartOptions" :series="serverDropsChartSeries"></apexchart>
          </q-card-section>
        </q-card>
      </div>

      <!-- Chart 10: Response Times -->
      <div class="col-12 col-md-6">
        <q-card class="chart-card">
          <q-card-section class="chart-header row items-center justify-between">
            <div class="text-h6">Tempo de Resposta Médio (ms)</div>
            <q-btn flat round dense icon="fullscreen" color="grey-6" @click="openFullscreen('response', 'Tempo de Resposta Médio (ms)')">
               <q-tooltip>Ampliar Gráfico</q-tooltip>
            </q-btn>
          </q-card-section>
          <q-card-section>
            <apexchart type="bar" height="300" :options="responseTimeChartOptions" :series="responseTimeChartSeries"></apexchart>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Fullscreen Chart Dialog -->
    <q-dialog v-model="isModalOpen" maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card :class="themeStore.isDark ? 'bg-dark text-white' : 'bg-white text-dark'">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ activeChartTitle }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section style="height: calc(100vh - 60px);">
          <apexchart v-if="activeChartId === 'status'" type="donut" height="100%" :options="statusChartOptions" :series="statusChartSeries"></apexchart>
          <apexchart v-else-if="activeChartId === 'tech'" type="bar" height="100%" :options="techChartOptions" :series="techChartSeries"></apexchart>
          <apexchart v-else-if="activeChartId === 'response'" type="bar" height="100%" :options="responseTimeChartOptions" :series="responseTimeChartSeries"></apexchart>
          <apexchart v-else-if="activeChartId === 'drops'" type="bar" height="100%" :options="dropsChartOptions" :series="dropsChartSeries"></apexchart>
          <apexchart v-else-if="activeChartId === 'dropsDay'" type="line" height="100%" :options="dropsByDayChartOptions" :series="dropsByDayChartSeries"></apexchart>
          <apexchart v-else-if="activeChartId === 'historyResponse'" type="area" height="100%" :options="historyResponseChartOptions" :series="historyResponseChartSeries"></apexchart>
          <apexchart v-else-if="activeChartId === 'uptime'" type="bar" height="100%" :options="uptimeChartOptions" :series="uptimeChartSeries"></apexchart>
          <apexchart v-else-if="activeChartId === 'pingHist'" type="donut" height="100%" :options="pingHistChartOptions" :series="pingHistChartSeries"></apexchart>
          <apexchart v-else-if="activeChartId === 'serverDrops'" type="donut" height="100%" :options="serverDropsChartOptions" :series="serverDropsChartSeries"></apexchart>
          <apexchart v-else-if="activeChartId === 'hourDrops'" type="bar" height="100%" :options="hourDropsChartOptions" :series="hourDropsChartSeries"></apexchart>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useApplicationStore } from '../stores/applications'
import { useServerStore } from '../stores/servers'
import { useTechnologyStore } from '../stores/technologies'
import { useThemeStore } from '../stores/theme'
import VueApexCharts from 'vue3-apexcharts'
import api from '../services/api'
import { useAuthStore } from '../stores/auth'

const appStore = useApplicationStore()
const serverStore = useServerStore()
const techStore = useTechnologyStore()
const themeStore = useThemeStore()
const authStore = useAuthStore()

// Aliases for template
const apexchart = VueApexCharts

const appsCount = computed(() => dashboardData.value?.appsCount || 0)
const apps = computed(() => dashboardData.value?.processedApps || [])

const servers = computed(() => serverStore.servers)
const technologies = computed(() => techStore.technologies)

const onlineApps = computed(() => dashboardData.value?.onlineCount || 0)
const offlineApps = computed(() => dashboardData.value?.offlineCount || 0)
const slowApps = computed(() => dashboardData.value?.slowCount || 0)
const noDataApps = computed(() => dashboardData.value?.noDataCount || 0)
const globalAvgResponseTime = computed(() => dashboardData.value?.globalAvgResponseTime || 0)

const dashboardData = ref(null)

// Fullscreen Modal State
const isModalOpen = ref(false)
const activeChartId = ref('')
const activeChartTitle = ref('')

const openFullscreen = (chartId, title) => {
  activeChartId.value = chartId
  activeChartTitle.value = title
  isModalOpen.value = true
}

const dropsDataRaw = ref([])
const dropsByDayRaw = ref({ dates: [], series: [] })
const totalDrops = ref(0)
const totalOnlinePings = ref(0)
const totalSlowPings = ref(0)
const advancedDataRaw = ref(null)

// Helper for 'YYYY-MM-DD'
const getFormattedDate = (dateObj) => {
  return dateObj.toISOString().split('T')[0]
}

const today = new Date()
const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

const startDate = ref(getFormattedDate(firstDayOfMonth))
const endDate = ref(getFormattedDate(today))

const refreshData = async () => {
  appStore.fetchApplications()
  serverStore.fetchServers()
  techStore.fetchTechnologies()
  try {
    const params = {}
    if (startDate.value) params.startDate = startDate.value
    if (endDate.value) params.endDate = endDate.value
    if (authStore.selectedCompanyId) params.companyId = authStore.selectedCompanyId

    const [dropsRes, dropsByDayRes, totalDropsRes, totalOnlineRes, totalSlowRes, dashboardRes, advancedRes] = await Promise.all([
      api.get('/analytics/drops', { params }),
      api.get('/analytics/drops-by-day', { params }),
      api.get('/analytics/total-drops', { params }),
      api.get('/analytics/total-online-pings', { params }),
      api.get('/analytics/total-slow-pings', { params }),
      api.get('/analytics/dashboard', { params }),
      api.get('/analytics/advanced', { params })
    ])
    dropsDataRaw.value = dropsRes.data
    dropsByDayRaw.value = dropsByDayRes.data
    totalDrops.value = totalDropsRes.data.total
    totalOnlinePings.value = totalOnlineRes.data.total
    totalSlowPings.value = totalSlowRes.data.total
    dashboardData.value = dashboardRes.data
    advancedDataRaw.value = advancedRes.data
  } catch (err) {
    console.error('Failed to fetch drops metrics', err)
  }
}

onMounted(() => {
  refreshData()
})

// Reload analytics when admin changes company
watch(() => authStore.selectedCompanyId, () => {
  refreshData()
})

// common options based on dark theme
const getThemeColor = () => themeStore.isDark ? '#e2e8f0' : '#333333'

const commonOptions = computed(() => ({
  chart: {
    background: 'transparent',
    toolbar: { show: false },
    fontFamily: 'Inter, sans-serif'
  },
  theme: {
    mode: themeStore.isDark ? 'dark' : 'light'
  },
  tooltip: {
    theme: themeStore.isDark ? 'dark' : 'light'
  }
}))

// --- 1. Status Chart ---
const statusChartSeries = computed(() => [onlineApps.value, slowApps.value, offlineApps.value, noDataApps.value])
const statusChartOptions = computed(() => ({
  ...commonOptions.value,
  labels: ['Online', 'Lento', 'Offline', 'Sem Dados'],
  colors: ['#00d2a0', '#ffa502', '#ff4757', '#a0aec0'],
  stroke: { show: false },
  dataLabels: {
    enabled: true,
    formatter: function (val, opts) {
      return opts.w.config.series[opts.seriesIndex]
    },
    style: {
      fontSize: '16px',
      fontFamily: 'Inter, sans-serif',
      fontWeight: 'bold',
      colors: ['#fff']
    },
    dropShadow: {
      enabled: true,
      top: 1,
      left: 1,
      blur: 2,
      color: '#000',
      opacity: 0.4
    }
  },
  legend: {
    position: 'bottom',
    labels: { colors: getThemeColor() }
  }
}))

// --- 2. Tech Chart ---
const techData = computed(() => {
  if (!apps.value.length || !technologies.value.length) return []
  
  const counts = {}
  apps.value.forEach(app => {
    if (app.techStack) {
      const techName = app.techStack
      if (!counts[techName]) {
        counts[techName] = 0
      }
      counts[techName]++
    }
  })
  
  return Object.keys(counts).map(key => ({
    x: key,
    y: counts[key]
  })).sort((a, b) => b.y - a.y) // sort by most used
})

const techChartSeries = computed(() => [{
  name: 'Sistemas',
  data: techData.value
}])

const techChartOptions = computed(() => ({
  ...commonOptions.value,
  plotOptions: {
    bar: {
      borderRadius: 4,
      horizontal: true,
      dataLabels: { position: 'top' }
    }
  },
  colors: ['#667eea'],
  dataLabels: {
    enabled: true,
    offsetX: 10,
    style: {
      colors: [getThemeColor()]
    }
  },
  xaxis: {
    labels: { style: { colors: getThemeColor() } }
  },
  yaxis: {
    labels: { style: { colors: getThemeColor() } }
  }
}))

// --- 3. Response Time Chart ---
const responseTimeData = computed(() => {
  return apps.value.map(app => ({
    x: app.name,
    y: app.responseTime || 0,
    fillColor: app.status === 'offline' ? '#ff4757' : (app.status === 'slow' ? '#ffa502' : '#00d2a0')
  })).sort((a, b) => b.y - a.y)
})

const responseTimeChartSeries = computed(() => [{
  name: 'Tempo (ms)',
  data: responseTimeData.value
}])

const responseTimeChartOptions = computed(() => ({
  ...commonOptions.value,
  plotOptions: {
    bar: {
      borderRadius: 4,
      distributed: true,
    }
  },
  legend: { show: false },
  dataLabels: {
    enabled: true,
    formatter: function (val) {
      return val + ' ms';
    },
    style: {
      fontSize: '12px',
      fontFamily: 'Inter, sans-serif',
      fontWeight: 'bold',
      colors: ['#fff']
    },
    dropShadow: {
      enabled: true,
      top: 1,
      left: 1,
      blur: 1,
      color: '#000',
      opacity: 0.4
    }
  },
  xaxis: {
    labels: {
      style: {
        colors: getThemeColor(),
        fontSize: '12px'
      },
      rotate: -45,
      trim: true,
      maxHeight: 120
    }
  },
  yaxis: {
    title: { text: null },
    labels: { style: { colors: getThemeColor() } }
  }
}))

// --- 4. Drops Chart ---
const dropsChartSeries = computed(() => [{
  name: 'Quedas',
  data: dropsDataRaw.value.map(d => ({
    x: d.name,
    y: d.dropsCount
  }))
}])

const dropsChartOptions = computed(() => ({
  ...commonOptions.value,
  plotOptions: {
    bar: {
      borderRadius: 4,
      horizontal: true,
      dataLabels: { position: 'top' }
    }
  },
  colors: ['#ff4757'],
  dataLabels: {
    enabled: true,
    offsetX: 10,
    style: {
      colors: [getThemeColor()]
    }
  },
  xaxis: {
    labels: { style: { colors: getThemeColor() } }
  },
  yaxis: {
    labels: { style: { colors: getThemeColor() } }
  }
}))

// --- 5. Drops By Day Chart ---
// Convert simple dates to "DD/MM" format for better readability
const formatDates = (dates) => {
  return dates.map(d => {
    const [year, month, day] = d.split('-');
    return `${day}/${month}`;
  })
}

const dropsByDayChartSeries = computed(() => dropsByDayRaw.value.series || [])

const dropsByDayChartOptions = computed(() => ({
  ...commonOptions.value,
  chart: {
    ...commonOptions.value.chart,
    type: 'line',
  },
  stroke: {
    curve: 'smooth',
    width: 3
  },
  markers: {
    size: 4
  },
  xaxis: {
    categories: formatDates(dropsByDayRaw.value.dates || []),
    labels: { style: { colors: getThemeColor() } }
  },
  yaxis: {
    title: { text: 'Quedas', style: { color: getThemeColor() } },
    labels: { style: { colors: getThemeColor() } },
    min: 0,
    forceNiceScale: true,
    decimalsInFloat: 0
  },
  colors: [
    '#f53b57', '#3c40c6', '#0fbcf9', '#0be881', '#ffc048', 
    '#575fcf', '#ef5777', '#31bb45', '#ff5e57', '#d2dae2', 
    '#8050f7', '#ffa801', '#ffd32a', '#ff3f34', '#1e272e', 
    '#05c46b', '#ff9f43', '#1dd1a1', '#f368e0', '#22a6b3'
  ],
  legend: {
    position: 'bottom',
    labels: { colors: getThemeColor() }
  },
  tooltip: {
    theme: themeStore.isDark ? 'dark' : 'light',
    shared: true,
    intersect: false,
    custom: function({ series, seriesIndex, dataPointIndex, w }) {
      const rawDate = dropsByDayRaw.value.dates[dataPointIndex];
      let dateLabel = w.globals.labels[dataPointIndex];
      
      if (rawDate) {
        const [y, m, d] = rawDate.split('-');
        dateLabel = `${d}/${m}/${y}`;
      }

      const items = [];
      
      // Collect all series data for this point
      series.forEach((s, idx) => {
        if (s[dataPointIndex] > 0) {
          items.push({
            name: w.globals.seriesNames[idx],
            value: s[dataPointIndex],
            color: w.globals.colors[idx]
          });
        }
      });
      
      // Sort by value descending
      items.sort((a, b) => b.value - a.value);

      if (items.length === 0) {
        return `<div class="custom-tooltip-empty" style="padding: 10px; font-size: 12px; background: var(--color-card-bg); color: var(--color-text-secondary); border: 1px solid var(--color-border); border-radius: 8px;">Nenhuma queda em ${dateLabel}</div>`;
      }

      let html = '<div class="custom-tooltip-wrapper">';
      html += `<div class="custom-tooltip-header">${dateLabel}</div>`;
      html += '<div class="custom-tooltip-body">';
      items.forEach(item => {
        html += `
          <div class="custom-tooltip-row">
            <span class="custom-tooltip-marker" style="background-color: ${item.color}"></span>
            <span class="custom-tooltip-name">${item.name}:</span>
            <span class="custom-tooltip-value">${item.value}</span>
          </div>`;
      });
      html += '</div></div>';
      return html;
    }
  }
}))

// --- 6. Histórico Global de Lentidão Chart ---
const historyResponseChartSeries = computed(() => advancedDataRaw.value?.responseTimeHistory?.series || [])

const historyResponseChartOptions = computed(() => ({
  ...commonOptions.value,
  chart: {
    ...commonOptions.value.chart,
    type: 'area',
  },
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 2 },
  colors: ['#00b894'],
  fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.2, stops: [0, 90, 100] } },
  xaxis: {
    categories: formatDates(advancedDataRaw.value?.responseTimeHistory?.dates || []),
    labels: { style: { colors: getThemeColor() } }
  },
  yaxis: {
    title: { text: null },
    labels: { style: { colors: getThemeColor() } },
    min: 0,
    forceNiceScale: true
  },
  tooltip: {
    theme: themeStore.isDark ? 'dark' : 'light',
    y: { formatter: (val) => val + ' ms' }
  }
}))

// --- 7. Disponibilidade Uptime SLA Chart ---
const uptimeChartSeries = computed(() => [{
  name: 'Disponibilidade (%)',
  data: (advancedDataRaw.value?.uptime || []).map(d => ({ x: d.name, y: d.uptimePercentage }))
}])

const uptimeChartOptions = computed(() => ({
  ...commonOptions.value,
  plotOptions: {
    bar: {
      borderRadius: 4,
      horizontal: true,
      distributed: true,
      dataLabels: { position: 'top' }
    }
  },
  colors: [
    '#0be881', '#0fbcf9', '#ffc048', '#ff5e57', '#3c40c6', 
    '#f53b57', '#575fcf', '#ef5777', '#31bb45', '#d2dae2', 
    '#8050f7', '#ffa801', '#ffd32a', '#ff3f34', '#1e272e', 
    '#05c46b', '#ff9f43', '#1dd1a1', '#f368e0', '#22a6b3'
  ],
  legend: { show: false },
  dataLabels: {
    enabled: true,
    offsetX: 10,
    formatter: function(val) { return val + '%' },
    style: { colors: [getThemeColor()] }
  },
  xaxis: {
    max: 100,
    labels: { style: { colors: getThemeColor() }, formatter: function(val) { return val + '%' } }
  },
  yaxis: { labels: { style: { colors: getThemeColor() } } },
}))

// --- 8. Histograma de Ping Chart ---
const pingHistChartSeries = computed(() => (advancedDataRaw.value?.pingHistogram || []).map(h => h.count))
const pingHistChartOptions = computed(() => ({
  ...commonOptions.value,
  labels: (advancedDataRaw.value?.pingHistogram || []).map(h => h.name),
  colors: ['#00d2a0', '#0984e3', '#fdcb6e', '#d63031'],
  stroke: { show: false },
  legend: { position: 'bottom', labels: { colors: getThemeColor() } },
  dataLabels: { enabled: true }
}))

// --- 9. Quedas por Servidor Chart ---
const serverDropsChartSeries = computed(() => (advancedDataRaw.value?.dropsByServer || []).map(s => s.drops))
const serverDropsChartOptions = computed(() => ({
  ...commonOptions.value,
  labels: (advancedDataRaw.value?.dropsByServer || []).map(s => s.name),
  stroke: { show: false },
  legend: { position: 'bottom', labels: { colors: getThemeColor() } },
  dataLabels: { enabled: true }
}))

// --- 10. Quedas por Hora do Dia Chart ---
const hourDropsChartSeries = computed(() => [{
  name: 'Quedas',
  data: advancedDataRaw.value?.dropsByHour || Array(24).fill(0)
}])

const hourDropsChartOptions = computed(() => ({
  ...commonOptions.value,
  plotOptions: { bar: { borderRadius: 4, columnWidth: '60%', dataLabels: { position: 'top' } } },
  colors: ['#e17055'],
  dataLabels: { 
    enabled: true,
    offsetY: -20,
    style: { colors: [getThemeColor()] }
  },
  xaxis: {
    categories: Array.from({length: 24}, (_, i) => `${i}h`),
    labels: { style: { colors: getThemeColor() } }
  },
  yaxis: { labels: { style: { colors: getThemeColor() } }, min: 0, forceNiceScale: true, decimalsInFloat: 0 }
}))

</script>

<style scoped>
.analytics-page {
  background: var(--color-bg-primary);
  min-height: 100vh;
}

.page-title h1 {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stat-card {
  background: var(--color-card-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s;
  height: 100%;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-label {
  color: #000000;
  font-weight: 500;
}

.body--dark .stat-label {
  color: var(--color-text-secondary);
}

.chart-card {
  background: var(--color-card-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  height: 100%;
  transition: all 0.3s ease;
}

.chart-card:hover { border-color: rgba(102, 126, 234, 0.5); }

.chart-header {
  border-bottom: 1px solid var(--color-border);
  padding: 16px 20px;
}

.chart-header .text-h6 {
  font-weight: 600;
  color: var(--color-text-primary);
}

.filter-row {
  display: flex;
  align-items: center;
}

.date-input {
  min-width: 160px;
}

/* Make native calendar icon white in dark mode */
.body--dark .date-input :deep(.q-field__native::-webkit-calendar-picker-indicator) {
  filter: invert(1) brightness(1.5);
}

/* Custom Tooltip Styles */
:deep(.custom-tooltip-wrapper) {
  background: var(--color-card-bg, #1a1a3e);
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  min-width: 200px;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
}

:deep(.custom-tooltip-header) {
  background: rgba(102, 126, 234, 0.15);
  padding: 8px 12px;
  font-weight: 700;
  border-bottom: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
  color: var(--color-text-primary, #ffffff);
  font-size: 13px;
}

:deep(.custom-tooltip-body) {
  padding: 6px 0;
  max-height: 280px;
  overflow-y: auto;
}

:deep(.custom-tooltip-row) {
  display: flex;
  align-items: center;
  padding: 4px 12px;
  gap: 8px;
  transition: background 0.2s;
}

:deep(.custom-tooltip-row:hover) {
  background: rgba(255, 255, 255, 0.05);
}

:deep(.custom-tooltip-marker) {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

:deep(.custom-tooltip-name) {
  color: var(--color-text-secondary, #a0aec0);
  font-size: 12px;
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.custom-tooltip-value) {
  color: var(--color-text-primary, #ffffff);
  font-weight: 700;
  font-size: 13px;
  margin-left: auto;
}

/* Custom Scrollbar for Tooltip */
:deep(.custom-tooltip-body::-webkit-scrollbar) {
  width: 4px;
}

:deep(.custom-tooltip-body::-webkit-scrollbar-track) {
  background: transparent;
}

:deep(.custom-tooltip-body::-webkit-scrollbar-thumb) {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
}

:deep(.custom-tooltip-body::-webkit-scrollbar-thumb:hover) {
  background: rgba(255, 255, 255, 0.3);
}
</style>
