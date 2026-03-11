<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    transition-show="jump-up"
    transition-hide="jump-down"
  >
    <q-card class="logs-card">
      <q-card-section class="modal-header">
        <div class="row items-center no-wrap">
          <q-icon name="history" size="24px" class="q-mr-sm text-primary" />
          <div class="column">
            <div class="text-h6 app-title">{{ application?.name }}</div>
            <div class="text-caption text-grey-5">Histórico de verificações</div>
          </div>
          <q-space />
          <q-btn flat round dense icon="close" color="grey-5" v-close-popup />
        </div>
      </q-card-section>

      <q-separator :dark="$q.dark.isActive" />

      <q-card-section class="q-pa-none logs-body">
        <q-table
          :rows="logs"
          :columns="columns"
          row-key="id"
          flat
          :dark="$q.dark.isActive"
          bordered
          :loading="loading"
          :pagination="pagination"
          class="logs-table"
          no-data-label="Nenhum log encontrado"
        >
          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-badge
                :color="props.row.status === 'online' ? 'positive' : 'negative'"
                class="status-badge"
              >
                <div class="status-dot-mini q-mr-xs" :class="{ 'bg-white': true }"></div>
                {{ props.row.status.toUpperCase() }}
              </q-badge>
            </q-td>
          </template>

          <template v-slot:body-cell-responseTime="props">
            <q-td :props="props">
              <span :class="getResponseTimeClass(props.row.responseTime)">
                {{ props.row.responseTime ? `${props.row.responseTime}ms` : '—' }}
              </span>
            </q-td>
          </template>

          <template v-slot:body-cell-createdAt="props">
            <q-td :props="props">
              {{ formatDateTime(props.row.createdAt) }}
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useApplicationStore } from '../stores/applications'
import { useQuasar } from 'quasar'

const props = defineProps({
  modelValue: Boolean,
  application: Object
})

defineEmits(['update:modelValue'])

const $q = useQuasar()
const appStore = useApplicationStore()
const logs = ref([])
const loading = ref(false)
const pagination = {
  sortBy: 'createdAt',
  descending: true,
  rowsPerPage: 10
}

const columns = [
  { name: 'createdAt', label: 'Data e Hora', field: 'createdAt', align: 'left', sortable: true },
  { name: 'status', label: 'Status', field: 'status', align: 'left', sortable: true },
  { name: 'responseTime', label: 'R. Time', field: 'responseTime', align: 'left', sortable: true }
]

watch(() => props.modelValue, async (val) => {
  if (val && props.application?.id) {
    loading.value = true
    try {
      logs.value = await appStore.fetchLogs(props.application.id)
    } catch (error) {
      console.error('Error loading logs:', error)
    } finally {
      loading.value = false
    }
  }
})

function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function getResponseTimeClass(ms) {
  if (!ms) return 'text-grey'
  if (ms < 500) return 'text-green'
  if (ms < 2000) return 'text-orange'
  return 'text-red'
}
</script>

<style scoped>
.logs-card {
  width: 600px;
  max-width: 95vw;
  background: var(--color-bg-card) !important;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg) !important;
}

.app-title {
  color: var(--color-text-primary);
}

.modal-header {
  padding: 16px 24px;
}

.logs-body {
  max-height: 500px;
  overflow-y: auto;
}

.logs-table {
  background: transparent !important;
}

.status-badge {
  font-weight: 700;
  font-size: 10px;
  padding: 4px 8px;
}

.status-dot-mini {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
</style>
