<template>
  <q-page padding class="profiles-page">
    <div class="profiles-container">

      <!-- Header -->
      <div class="page-header animate-fade-in-up">
        <div>
          <div class="page-title row items-center">
            <q-icon name="admin_panel_settings" class="q-mr-sm" size="32px" color="primary" />
            <h1 class="text-h4 text-weight-bold q-ma-none">Perfis de Acesso</h1>
          </div>
          <p class="page-subtitle text-grey-6 q-mt-xs">Gerencie os perfis e permissões por página</p>
        </div>
        <q-btn
          color="primary"
          icon="add"
          label="Novo Perfil"
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

      <!-- Profiles Table -->
      <div class="glass-card table-card animate-fade-in-up" style="animation-delay: 0.2s">
        <q-table
          :rows="profileStore.profiles"
          :columns="columns"
          row-key="id"
          flat
          :loading="profileStore.loading"
          :filter="filter"
          :pagination="pagination"
          no-data-label="Nenhum perfil encontrado"
          loading-label="Carregando..."
          class="data-table"
        >
          <template v-slot:body-cell-company="props">
            <q-td :props="props">
              {{ props.row.company?.name || '-' }}
            </q-td>
          </template>

          <template v-slot:body-cell-permissions="props">
            <q-td :props="props">
              <div class="permissions-badges">
                <q-badge
                  v-for="page in getActivePermissions(props.row.permissions)"
                  :key="page.key"
                  color="deep-purple-4"
                  :label="page.label"
                  rounded
                  class="q-mr-xs q-mb-xs"
                  style="font-size: 10px"
                />
                <span v-if="getActivePermissions(props.row.permissions).length === 0" class="text-grey-6">
                  Nenhuma permissão
                </span>
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-users="props">
            <q-td :props="props">
              <q-badge color="blue-grey" :label="props.row._count?.users || 0" rounded />
            </q-td>
          </template>

          <template v-slot:body-cell-active="props">
            <q-td :props="props">
              <q-badge
                :color="props.row.active ? 'green' : 'red'"
                :label="props.row.active ? 'Ativo' : 'Inativo'"
                rounded
              />
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props" class="actions-col">
              <q-btn
                flat round dense color="primary" icon="edit" size="sm" class="q-mr-sm"
                @click="openEditDialog(props.row)"
              >
                <q-tooltip>Editar Perfil</q-tooltip>
              </q-btn>
              <q-btn
                flat round dense color="red-4" icon="delete" size="sm"
                @click="confirmDelete(props.row)"
              >
                <q-tooltip>Excluir Perfil</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </div>
    </div>

    <!-- Modal Form -->
    <q-dialog v-model="dialogOpen" persistent>
      <q-card class="dialog-card" style="min-width: 600px">
        <q-card-section class="dialog-header">
          <div class="text-h6">{{ isEditing ? 'Editar Perfil' : 'Novo Perfil' }}</div>
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-card-section class="dialog-body">
          <q-select
            v-model="form.companyId"
            :options="companiesOptions"
            label="Empresa *"
            outlined
            dense
            emit-value
            map-options
            class="q-mb-md"
            :rules="[val => !!val || 'Empresa é obrigatória']"
          />

          <q-input
            v-model="form.name"
            label="Nome do Perfil *"
            outlined
            dense
            class="q-mb-md"
            :rules="[val => !!val || 'Nome é obrigatório']"
          />

          <q-input
            v-model="form.description"
            label="Descrição"
            outlined
            dense
            class="q-mb-md"
            type="textarea"
            autogrow
          />

          <div class="permissions-section q-mb-md">
            <div class="text-subtitle2 q-mb-sm" style="color: var(--color-text-secondary)">
              <q-icon name="lock" class="q-mr-xs" />
              Permissões por Página
            </div>
            <div class="permissions-grid">
              <q-toggle
                v-for="page in availablePages"
                :key="page.key"
                v-model="form.permissions[page.key]"
                :label="page.label"
                color="primary"
                class="permission-toggle"
              />
            </div>
          </div>

          <q-toggle
            v-if="isEditing"
            v-model="form.active"
            label="Perfil Ativo"
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
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useAccessProfileStore } from '../stores/accessProfiles'
import { useCompanyStore } from '../stores/companies'
import { useAuthStore } from '../stores/auth'

const $q = useQuasar()
const profileStore = useAccessProfileStore()
const companyStore = useCompanyStore()
const authStore = useAuthStore()

const dialogOpen = ref(false)
const filter = ref('')
const saving = ref(false)
const selectedProfile = ref(null)
const pagination = ref({ rowsPerPage: 25 })
const companiesOptions = ref([])
const availablePages = ref([])

const defaultPermissions = () => ({
  dashboard: false,
  monitoring: false,
  servers: false,
  technologies: false,
  applications: false,
  users: false,
  companies: false,
  accessProfiles: false,
})

const form = ref({
  name: '',
  companyId: null,
  description: '',
  permissions: defaultPermissions(),
  active: true,
})

const isEditing = computed(() => !!selectedProfile.value)

const columns = [
  { name: 'actions', label: 'Ações', align: 'left' },
  { name: 'name', label: 'Nome', field: 'name', align: 'left', sortable: true },
  { name: 'company', label: 'Empresa', align: 'left', sortable: true },
  { name: 'permissions', label: 'Permissões', align: 'left' },
  { name: 'users', label: 'Usuários', align: 'center' },
  { name: 'active', label: 'Status', field: 'active', align: 'center', sortable: true },
]

function getActivePermissions(permissions) {
  if (!permissions || typeof permissions !== 'object') return []
  const pageMap = {
    dashboard: 'Dashboard',
    monitoring: 'Monitoramento',
    servers: 'Servidores',
    technologies: 'Tecnologias',
    applications: 'Sistemas',
    users: 'Usuários',
    companies: 'Empresas',
    accessProfiles: 'Perfis de Acesso',
  }
  return Object.entries(permissions)
    .filter(([, val]) => val)
    .map(([key]) => ({ key, label: pageMap[key] || key }))
}

onMounted(async () => {
  profileStore.fetchProfiles()
  const companies = await companyStore.fetchCompaniesSelect()
  companiesOptions.value = companies.map(c => ({ label: c.name, value: c.id }))
  const pages = await profileStore.fetchAvailablePages()
  availablePages.value = pages
})

// Reload when admin changes company
watch(() => authStore.selectedCompanyId, async () => {
  profileStore.fetchProfiles()
  const companies = await companyStore.fetchCompaniesSelect()
  companiesOptions.value = companies.map(c => ({ label: c.name, value: c.id }))
})

function openCreateDialog() {
  selectedProfile.value = null
  form.value = {
    name: '',
    companyId: authStore.selectedCompanyId || null,
    description: '',
    permissions: defaultPermissions(),
    active: true,
  }
  dialogOpen.value = true
}

function openEditDialog(profile) {
  selectedProfile.value = profile
  form.value = {
    name: profile.name,
    companyId: profile.companyId || profile.company?.id,
    description: profile.description || '',
    permissions: { ...defaultPermissions(), ...(profile.permissions || {}) },
    active: profile.active,
  }
  dialogOpen.value = true
}

async function handleSave() {
  if (!form.value.name || !form.value.companyId) {
    $q.notify({ type: 'warning', message: 'Preencha os campos obrigatórios.' })
    return
  }

  saving.value = true
  try {
    if (isEditing.value) {
      await profileStore.updateProfile(selectedProfile.value.id, form.value)
      $q.notify({ type: 'positive', message: 'Perfil atualizado com sucesso!' })
    } else {
      await profileStore.createProfile(form.value)
      $q.notify({ type: 'positive', message: 'Perfil criado com sucesso!' })
    }
    dialogOpen.value = false
    profileStore.fetchProfiles()
  } catch (error) {
    const msg = error.response?.data?.error || 'Erro ao salvar perfil.'
    $q.notify({ type: 'negative', message: msg })
  } finally {
    saving.value = false
  }
}

function confirmDelete(profile) {
  $q.dialog({
    title: 'Excluir Perfil',
    message: `Tem certeza que deseja excluir "${profile.name}"? Usuários vinculados perderão o perfil.`,
    cancel: true,
    persistent: true,
    ok: { label: 'Excluir', color: 'red-5', unelevated: true },
    cancel: { label: 'Cancelar', flat: true, color: 'grey' },
  }).onOk(async () => {
    try {
      await profileStore.deleteProfile(profile.id)
      $q.notify({ type: 'positive', message: 'Perfil excluído com sucesso!' })
    } catch (error) {
      const msg = error.response?.data?.error || 'Erro ao excluir perfil.'
      $q.notify({ type: 'negative', message: msg })
    }
  })
}
</script>

<style scoped>
.profiles-page {
  background: var(--color-bg-primary);
  min-height: 100vh;
}

.profiles-container {
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

.permissions-section {
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: rgba(102, 126, 234, 0.03);
}

.permissions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
}

.permission-toggle {
  font-size: 13px;
}

.permissions-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}
</style>
