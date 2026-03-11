<template>
  <q-page padding class="technologies-page">
    <div class="technologies-container">

      <!-- Header -->
      <div class="page-header animate-fade-in-up">
        <div>
          <div class="page-title row items-center">
            <q-icon name="code" class="q-mr-sm" size="32px" color="primary" />
            <h1 class="text-h4 text-weight-bold q-ma-none">Tecnologias</h1>
          </div>
          <p class="page-subtitle text-grey-6 q-mt-xs">Gerencie as tecnologias do sistema</p>
        </div>
        <q-btn
          color="primary"
          icon="add"
          label="Nova Tecnologia"
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

      <!-- Technologies Table -->
      <div class="glass-card table-card animate-fade-in-up" style="animation-delay: 0.2s">
        <q-table
          :rows="techStore.technologies"
          :columns="columns"
          row-key="id"
          flat
          :loading="techStore.loading"
          :filter="filter"
          :pagination="pagination"
          no-data-label="Nenhuma tecnologia encontrada"
          loading-label="Carregando..."
          class="technologies-table"
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
                <q-tooltip>Editar Tecnologia</q-tooltip>
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
                <q-tooltip>Excluir Tecnologia</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </div>
    </div>

    <!-- Modal Form (Create/Edit) -->
    <TechnologyModal
      v-model="dialogOpen"
      :technology="selectedTech"
      @saved="handleSaved"
    />

  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useTechnologyStore } from '../stores/technologies'
import TechnologyModal from '../components/TechnologyModal.vue'

const $q = useQuasar()
const techStore = useTechnologyStore()

// State
const dialogOpen = ref(false)
const filter = ref('')
const selectedTech = ref(null)
const pagination = ref({ rowsPerPage: 25 })

// Table Config
const columns = [
  { name: 'actions', label: 'Ações', align: 'left' },
  { name: 'name', label: 'Tecnologia', field: 'name', align: 'left', sortable: true },
  { name: 'type', label: 'Tipo', field: 'type', align: 'left', sortable: true },
]

// Fetch data
onMounted(() => {
  techStore.fetchTechnologies()
  techStore.setupSocketListeners()
})

// =======================
// CREATE / EDIT DIALOG
// =======================
function openCreateDialog() {
  selectedTech.value = null
  dialogOpen.value = true
}

function openEditDialog(tech) {
  selectedTech.value = tech
  dialogOpen.value = true
}

// =======================
// SAVE
// =======================
function handleSaved() {
  dialogOpen.value = false
  selectedTech.value = null
}

// =======================
// DELETE
// =======================
function confirmDelete(tech) {
  $q.dialog({
    title: 'Excluir Tecnologia',
    message: `Tem certeza que deseja excluir "${tech.name}"? Esta ação não pode ser desfeita.`,
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
      await techStore.deleteTechnology(tech.id)
      $q.notify({ type: 'positive', message: 'Tecnologia excluída com sucesso!' })
    } catch (error) {
      console.error('Delete error:', error)
      const msg = error.response?.data?.error || 'Erro ao excluir tecnologia.'
      $q.notify({ type: 'negative', message: msg })
    }
  })
}
</script>

<style scoped>
.technologies-page {
  background: var(--color-bg-primary);
  min-height: 100vh;
}

.technologies-container {
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

.technologies-table {
  background: transparent !important;
}

.technologies-table .q-table__top,
.technologies-table thead tr th {
  color: var(--color-text-secondary) !important;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.technologies-table tbody tr td {
  color: var(--color-text-primary) !important;
  font-size: 14px;
}

.technologies-table tbody tr:hover td {
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
