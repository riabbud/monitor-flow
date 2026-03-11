<template>
  <q-page padding class="companies-page">
    <div class="companies-container">

      <!-- Header -->
      <div class="page-header animate-fade-in-up">
        <div>
          <div class="page-title row items-center">
            <q-icon name="business" class="q-mr-sm" size="32px" color="primary" />
            <h1 class="text-h4 text-weight-bold q-ma-none">Empresas</h1>
          </div>
          <p class="page-subtitle text-grey-6 q-mt-xs">Gerencie as empresas do sistema</p>
        </div>
        <q-btn
          color="primary"
          icon="add"
          label="Nova Empresa"
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

      <!-- Companies Table -->
      <div class="glass-card table-card animate-fade-in-up" style="animation-delay: 0.2s">
        <q-table
          :rows="companyStore.companies"
          :columns="columns"
          row-key="id"
          flat
          :loading="companyStore.loading"
          :filter="filter"
          :pagination="pagination"
          no-data-label="Nenhuma empresa encontrada"
          loading-label="Carregando..."
          class="data-table"
        >
          <template v-slot:body-cell-name="props">
            <q-td :props="props">
              <div class="row items-center no-wrap">
                <q-avatar size="32px" color="blue-grey-1" class="q-mr-sm" rounded>
                  <img v-if="props.row.logo" :src="props.row.logo" />
                  <q-icon v-else name="business" color="blue-grey-4" />
                </q-avatar>
                <div class="text-weight-bold">{{ props.row.name }}</div>
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-active="props">
            <q-td :props="props">
              <q-badge
                :color="props.row.active ? 'green' : 'red'"
                :label="props.row.active ? 'Ativa' : 'Inativa'"
                rounded
              />
            </q-td>
          </template>

          <template v-slot:body-cell-users="props">
            <q-td :props="props">
              <q-badge color="blue-grey" :label="props.row._count?.users || 0" rounded />
            </q-td>
          </template>

          <template v-slot:body-cell-profiles="props">
            <q-td :props="props">
              <q-badge color="deep-purple" :label="props.row._count?.accessProfiles || 0" rounded />
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props" class="actions-col">
              <q-btn
                flat round dense color="primary" icon="edit" size="sm" class="q-mr-sm"
                @click="openEditDialog(props.row)"
              >
                <q-tooltip>Editar Empresa</q-tooltip>
              </q-btn>
              <q-btn
                flat round dense color="red-4" icon="delete" size="sm"
                @click="confirmDelete(props.row)"
              >
                <q-tooltip>Excluir Empresa</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </div>
    </div>

    <!-- Modal Form -->
    <q-dialog v-model="dialogOpen" persistent>
      <q-card class="dialog-card" style="min-width: 500px">
        <q-card-section class="dialog-header">
          <div class="text-h6">{{ isEditing ? 'Editar Empresa' : 'Nova Empresa' }}</div>
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-card-section class="dialog-body">
          <q-input
            v-model="form.name"
            label="Nome da Empresa *"
            outlined
            dense
            class="q-mb-md"
            :rules="[val => !!val || 'Nome é obrigatório']"
          />
          <q-input
            v-model="form.cnpj"
            label="CNPJ"
            outlined
            dense
            class="q-mb-md"
            mask="##.###.###/####-##"
          />
          <q-file
            v-model="logoFile"
            label="Logomarca da Empresa"
            outlined
            dense
            accept=".jpg, .png, .jpeg, .svg"
            max-file-size="1048576"
            hint="Formatos: JPG, PNG, SVG (Máx: 1MB)"
            class="q-mb-md"
            @update:model-value="onFileSelected"
            @rejected="onFileRejected"
          >
            <template v-slot:prepend>
              <q-icon name="cloud_upload" />
            </template>
            <template v-slot:append v-if="form.logo">
              <q-avatar size="32px" rounded bordered class="bg-white">
                <img :src="form.logo" />
              </q-avatar>
              <q-btn round dense flat icon="close" @click.stop="clearLogo" />
            </template>
          </q-file>

          <q-toggle
            v-if="isEditing"
            v-model="form.active"
            label="Empresa Ativa"
            color="primary"
          />
        </q-card-section>

        <q-card-section class="dialog-actions">
          <q-btn flat label="Cancelar" color="grey" v-close-popup />
          <q-btn
            unelevated
            :label="isEditing ? 'Salvar' : 'Criar'"
            class="btn-primary"
            :loading="saving"
            @click="handleSave"
          />
        </q-card-section>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useCompanyStore } from '../stores/companies'
import { useAuthStore } from '../stores/auth'

const $q = useQuasar()
const companyStore = useCompanyStore()
const authStore = useAuthStore()

const dialogOpen = ref(false)
const filter = ref('')
const saving = ref(false)
const selectedCompany = ref(null)
const pagination = ref({ rowsPerPage: 25 })
const logoFile = ref(null)

const form = ref({ name: '', cnpj: '', logo: '', active: true })

const isEditing = computed(() => !!selectedCompany.value)

const columns = [
  { name: 'actions', label: 'Ações', align: 'left' },
  { name: 'name', label: 'Nome', field: 'name', align: 'left', sortable: true },
  { name: 'cnpj', label: 'CNPJ', field: 'cnpj', align: 'left', sortable: true },
  { name: 'active', label: 'Status', field: 'active', align: 'center', sortable: true },
  { name: 'users', label: 'Usuários', align: 'center', sortable: false },
  { name: 'profiles', label: 'Perfis', align: 'center', sortable: false },
]

companyStore.fetchCompanies()

// Reload when admin changes company
watch(() => authStore.selectedCompanyId, () => {
  companyStore.fetchCompanies()
})

function openCreateDialog() {
  selectedCompany.value = null
  form.value = { name: '', cnpj: '', logo: '', active: true }
  logoFile.value = null
  dialogOpen.value = true
}

function openEditDialog(company) {
  selectedCompany.value = company
  form.value = {
    name: company.name,
    cnpj: company.cnpj || '',
    logo: company.logo || '',
    active: company.active
  }
  logoFile.value = null
  dialogOpen.value = true
}

function onFileSelected(file) {
  if (!file) {
    form.value.logo = ''
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    form.value.logo = e.target.result
  }
  reader.readAsDataURL(file)
}

function onFileRejected(rejectedEntries) {
  const entry = rejectedEntries[0]
  if (entry.failedPropValidation === 'max-file-size') {
    $q.notify({ type: 'negative', message: 'O arquivo deve ter no máximo 1MB.' })
  } else {
    $q.notify({ type: 'negative', message: 'Arquivo inválido.' })
  }
}

function clearLogo() {
  logoFile.value = null
  form.value.logo = ''
}

async function handleSave() {
  if (!form.value.name) {
    $q.notify({ type: 'warning', message: 'Preencha o nome da empresa.' })
    return
  }

  saving.value = true
  try {
    if (isEditing.value) {
      await companyStore.updateCompany(selectedCompany.value.id, form.value)
      $q.notify({ type: 'positive', message: 'Empresa atualizada com sucesso!' })
    } else {
      await companyStore.createCompany(form.value)
      $q.notify({ type: 'positive', message: 'Empresa criada com sucesso!' })
    }
    dialogOpen.value = false
    companyStore.fetchCompanies()
  } catch (error) {
    const msg = error.response?.data?.error || 'Erro ao salvar empresa.'
    $q.notify({ type: 'negative', message: msg })
  } finally {
    saving.value = false
  }
}

function confirmDelete(company) {
  $q.dialog({
    title: 'Excluir Empresa',
    message: `Tem certeza que deseja excluir "${company.name}"? Esta ação removerá todos os perfis e vínculos associados.`,
    cancel: true,
    persistent: true,
    ok: { label: 'Excluir', color: 'red-5', unelevated: true },
    cancel: { label: 'Cancelar', flat: true, color: 'grey' },
  }).onOk(async () => {
    try {
      await companyStore.deleteCompany(company.id)
      $q.notify({ type: 'positive', message: 'Empresa excluída com sucesso!' })
    } catch (error) {
      const msg = error.response?.data?.error || 'Erro ao excluir empresa.'
      $q.notify({ type: 'negative', message: msg })
    }
  })
}
</script>

<style scoped>
.companies-page {
  background: var(--color-bg-primary);
  min-height: 100vh;
}

.companies-container {
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

.data-table {
  background: transparent !important;
}

.data-table .q-table__top,
.data-table thead tr th {
  color: var(--color-text-secondary) !important;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.data-table tbody tr td {
  color: var(--color-text-primary) !important;
  font-size: 14px;
}

.data-table tbody tr:hover td {
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

.dialog-card {
  background: var(--color-bg-card) !important;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md) !important;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-border);
}

.dialog-header .text-h6 {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid var(--color-border);
}
</style>
