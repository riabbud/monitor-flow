<template>
  <q-page padding class="systems-page">
    <div class="systems-container">

      <!-- Header -->
      <div class="page-header animate-fade-in-up">
        <div>
          <div class="page-title row items-center">
            <q-icon name="list_alt" class="q-mr-sm" size="32px" color="primary" />
            <h1 class="text-h4 text-weight-bold q-ma-none">Sistemas</h1>
          </div>
          <p class="page-subtitle text-grey-6 q-mt-xs">Gerencie os sistemas monitorados</p>
        </div>
        <q-btn
          color="primary"
          icon="add"
          label="Novo Sistema"
          unelevated
          class="btn-primary"
          @click="openCreateDialog"
        />
      </div>

      <div class="search-section animate-fade-in-up" style="animation-delay: 0.1s">
        <q-input
          v-model="filter"
          debounce="300"
          placeholder="Pesquisar..."
          outlined
          dense
          class="search-input"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>

      <!-- Systems Table -->
      <div class="glass-card table-card animate-fade-in-up" style="animation-delay: 0.2s">
        <q-table
          :rows="appStore.applications"
          :columns="columns"
          row-key="id"
          flat
          :loading="appStore.loading"
          :filter="filter"
          :pagination="pagination"
          no-data-label="Nenhum sistema encontrado"
          loading-label="Carregando..."
          class="systems-table"
        >
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" class="actions-col">
              <q-btn
                flat
                round
                dense
                color="primary"
                icon="edit"
                size="sm"
                class="q-mr-sm"
                @click="openEditDialog(props.row)"
              >
                <q-tooltip>Editar Sistema</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                dense
                color="red-4"
                icon="delete"
                size="sm"
                @click="confirmDelete(props.row)"
              >
                <q-tooltip>Excluir Sistema</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </div>
    </div>

    <!-- Modal Form (Create/Edit) -->
    <ApplicationModal
      v-model="dialogOpen"
      :application="selectedApp"
      @saved="handleSaved"
    />

  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useApplicationStore } from '../stores/applications'
import ApplicationModal from '../components/ApplicationModal.vue'

const $q = useQuasar()
const appStore = useApplicationStore()

// State
const dialogOpen = ref(false)
const filter = ref('')
const selectedApp = ref(null)
const pagination = ref({ rowsPerPage: 25 })

const columns = [
  { name: 'actions', label: 'Ações', align: 'left' },
  { name: 'name', label: 'Sistema', field: 'name', align: 'left', sortable: true },
  { name: 'checkInterval', label: 'Intervalo (s)', field: 'checkInterval', align: 'left', sortable: true },
  { name: 'server', label: 'Servidor', field: row => row.server?.name || '-', align: 'left', sortable: true },
  { name: 'url', label: 'URL', field: 'url', align: 'left', sortable: true },
  { name: 'techStack', label: 'Tecnologia', field: 'techStack', align: 'left', sortable: true },
]

// =======================
// CREATE / EDIT DIALOG
// =======================
function openCreateDialog() {
  selectedApp.value = null
  dialogOpen.value = true
}

function openEditDialog(app) {
  selectedApp.value = app
  dialogOpen.value = true
}

// =======================
// SAVE
// =======================
function handleSaved() {
  dialogOpen.value = false
  selectedApp.value = null
}

// =======================
// DELETE
// =======================
function confirmDelete(app) {
  $q.dialog({
    title: 'Excluir Sistema',
    message: `Tem certeza que deseja parar de monitorar "${app.name}"? Esta ação não pode ser desfeita.`,
    cancel: true,
    persistent: true,
    color: 'red',
    ok: {
      label: 'Excluir',
      color: 'red-5',
      unelevated: true
    },
    cancel: {
      label: 'Cancelar',
      flat: true,
      color: 'grey'
    }
  }).onOk(async () => {
    try {
      await appStore.deleteApplication(app.id)
      $q.notify({ type: 'positive', message: 'Sistema excluído com sucesso!' })
    } catch (error) {
      console.error('Delete error:', error)
      const msg = error.response?.data?.error || 'Erro ao excluir sistema.'
      $q.notify({ type: 'negative', message: msg })
    }
  })
}
</script>

<style scoped>
.systems-page {
  background: var(--color-bg-primary);
  min-height: 100vh;
}

.systems-container {
  width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
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

.btn-primary {
  background: var(--gradient-primary) !important;
  color: white;
  padding: 8px 24px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.table-card {
  padding: 0;
  overflow: hidden;
}

.systems-table {
  background: transparent !important;
}

.systems-table .q-table__top,
.systems-table thead tr th {
  color: var(--color-text-secondary) !important;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.systems-table tbody tr td {
  color: var(--color-text-primary) !important;
  font-size: 14px;
}

.systems-table tbody tr:hover td {
  background: rgba(102, 126, 234, 0.05) !important;
}

.actions-col {
  width: 100px;
}

.search-section {
  margin-bottom: 24px;
}

.search-input {
  width: 50%;
  max-width: 600px;
  min-width: 320px;
  background: var(--color-bg-card);
  border-radius: var(--radius-sm);
}

</style>
