<template>
  <q-page padding class="users-page">
    <div class="users-container">
      <!-- Header -->
      <div class="page-header animate-fade-in-up">
        <div>
          <div class="page-title row items-center">
            <q-icon name="group" class="q-mr-sm" size="32px" color="primary" />
            <h1 class="text-h4 text-weight-bold q-ma-none">Usuários</h1>
          </div>
          <p class="page-subtitle text-grey-6 q-mt-xs">Gerencie os usuários do sistema</p>
        </div>
        <q-btn
          color="primary"
          icon="add"
          label="Novo Usuário"
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

      <!-- Users Table -->
      <div class="glass-card table-card animate-fade-in-up" style="animation-delay: 0.2s">
        <q-table
          :rows="users"
          :columns="columns"
          row-key="id"
          flat
          :loading="loading"
          :filter="filter"
          :pagination="pagination"
          no-data-label="Nenhum usuário encontrado"
          loading-label="Carregando..."
          class="users-table"
        >
          <template v-slot:body-cell-isAdmin="props">
            <q-td :props="props">
              <q-badge v-if="props.row.isAdmin" color="amber-8" label="Admin" rounded />
              <span v-else class="text-grey-6">—</span>
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

          <template v-slot:body-cell-company="props">
            <q-td :props="props">
              {{ props.row.company?.name || '—' }}
            </q-td>
          </template>

          <template v-slot:body-cell-profile="props">
            <q-td :props="props">
              {{ props.row.accessProfile?.name || '—' }}
            </q-td>
          </template>

          <template v-slot:body-cell-createdAt="props">
            <q-td :props="props">
              {{ formatDate(props.row.createdAt) }}
            </q-td>
          </template>

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
                <q-tooltip>Editar Usuário</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                dense
                color="red-4"
                icon="delete"
                size="sm"
                @click="confirmDelete(props.row)"
                :disable="props.row.isAdmin"
              >
                <q-tooltip>{{ props.row.isAdmin ? 'Admin não pode ser excluído' : 'Excluir Usuário' }}</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </div>
    </div>

    <!-- Modal Form (Create/Edit) -->
    <q-dialog v-model="dialogOpen" persistent transition-show="scale" transition-hide="scale">
      <q-card class="modal-card">
        <!-- Header -->
        <q-card-section class="modal-header">
          <div class="modal-title-area">
            <q-icon
              :name="isEditing ? 'edit' : 'person_add'"
              size="24px"
              class="modal-icon"
            />
            <h3 class="modal-title">
              {{ isEditing ? 'Editar Usuário' : 'Novo Usuário' }}
            </h3>
          </div>
          <q-btn
            flat
            round
            dense
            icon="close"
            color="grey-5"
            v-close-popup
          />
        </q-card-section>

        <q-separator />

        <!-- Form -->
        <q-card-section class="modal-body">
          <q-form @submit="saveUser" class="q-gutter-md">
            <div class="form-group">
              <label class="form-label required-label">Nome Completo</label>
              <q-input
                v-model="form.name"
                placeholder="Ex: João da Silva"
                filled
                :rules="[val => !!val || 'O nome é obrigatório']"
              >
                <template v-slot:prepend>
                  <q-icon name="person" color="grey-5" />
                </template>
              </q-input>
            </div>

            <div class="form-group">
              <label class="form-label required-label">E-mail</label>
              <q-input
                v-model="form.email"
                type="email"
                placeholder="exemplo@email.com"
                filled
                :rules="[
                  val => !!val || 'O e-mail é obrigatório',
                  val => /.+@.+\..+/.test(val) || 'Digite um e-mail válido'
                ]"
              >
                <template v-slot:prepend>
                  <q-icon name="mail" color="grey-5" />
                </template>
              </q-input>
            </div>

            <div class="form-group">
              <label class="form-label" :class="{ 'required-label': !isEditing }">{{ isEditing ? 'Nova Senha (opcional)' : 'Senha de Acesso' }}</label>
              <q-input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="******"
                filled
                :rules="isEditing ? undefined : [val => !!val || 'A senha é obrigatória', val => val.length >= 6 || 'Mínimo 6 caracteres']"
              >
                <template v-slot:prepend>
                  <q-icon name="lock" color="grey-5" />
                </template>
                <template v-slot:append>
                  <q-icon
                    :name="showPassword ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    color="grey-5"
                    @click="showPassword = !showPassword"
                  />
                </template>
              </q-input>
            </div>

            <div class="form-group">
              <label class="form-label">Empresa</label>
              <q-select
                v-model="form.companyId"
                :options="companiesOptions"
                label="Selecione a empresa"
                emit-value
                map-options
                filled
                clearable
                @update:model-value="onCompanyChange"
              >
                <template v-slot:prepend>
                  <q-icon name="business" color="grey-5" />
                </template>
              </q-select>
            </div>

            <div class="form-group">
              <label class="form-label">Perfil de Acesso</label>
              <q-select
                v-model="form.accessProfileId"
                :options="profilesOptions"
                label="Selecione o perfil"
                emit-value
                map-options
                filled
                clearable
                :disable="!form.companyId"
              >
                <template v-slot:prepend>
                  <q-icon name="admin_panel_settings" color="grey-5" />
                </template>
              </q-select>
            </div>

            <div class="form-group" v-if="authStore.isAdmin">
              <q-toggle
                v-model="form.isAdmin"
                label="Administrador do Sistema"
                color="amber-8"
              />
            </div>

            <div class="form-group">
              <q-toggle
                v-model="form.active"
                label="Usuário Ativo"
                color="green"
              />
            </div>

            <q-card-actions align="right" class="modal-actions">
              <q-btn flat no-caps label="Cancelar" color="grey-5" v-close-popup />
              <q-btn
                unelevated
                no-caps
                class="save-btn"
                type="submit"
                :loading="submitting"
              >
                <q-icon :name="isEditing ? 'save' : 'add'" class="q-mr-sm" />
                {{ isEditing ? 'Salvar Edição' : 'Criar Usuário' }}
              </q-btn>
            </q-card-actions>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import api from '../services/api'
import { useAuthStore } from '../stores/auth'
import { useCompanyStore } from '../stores/companies'
import { useAccessProfileStore } from '../stores/accessProfiles'

const $q = useQuasar()
const authStore = useAuthStore()
const companyStore = useCompanyStore()
const profileStore = useAccessProfileStore()

// State
const users = ref([])
const loading = ref(false)
const dialogOpen = ref(false)
const submitting = ref(false)
const showPassword = ref(false)
const filter = ref('')
const pagination = ref({ rowsPerPage: 25 })
const companiesOptions = ref([])
const profilesOptions = ref([])

// Form
const defaultForm = { id: null, name: '', email: '', password: '', companyId: null, accessProfileId: null, isAdmin: false, active: true }
const form = ref({ ...defaultForm })

const isEditing = computed(() => !!form.value.id)

// Table Config
const columns = [
  { name: 'actions', label: 'Ações', align: 'left' },
  { name: 'name', label: 'Nome', field: 'name', align: 'left', sortable: true },
  { name: 'email', label: 'E-mail', field: 'email', align: 'left', sortable: true },
  { name: 'company', label: 'Empresa', align: 'left', sortable: true },
  { name: 'profile', label: 'Perfil', align: 'left', sortable: true },
  { name: 'isAdmin', label: 'Admin', field: 'isAdmin', align: 'center', sortable: true },
  { name: 'active', label: 'Status', field: 'active', align: 'center', sortable: true },
  { name: 'createdAt', label: 'Criado em', field: 'createdAt', align: 'left', sortable: true },
]

// =======================
// READ / LIST
// =======================
async function fetchUsers() {
  loading.value = true
  try {
    const { data } = await api.get(`/users${authStore.companyFilter}`)
    users.value = data
  } catch (err) {
    console.error('Erro ao carregar usuários:', err)
    $q.notify({ type: 'negative', message: 'Erro ao listar usuários.' })
  } finally {
    loading.value = false
  }
}

// =======================
// CREATE / EDIT DIALOG
// =======================
function openCreateDialog() {
  form.value = { ...defaultForm, companyId: authStore.selectedCompanyId || null }
  showPassword.value = false
  if (form.value.companyId) {
    onCompanyChange(form.value.companyId)
  }
  dialogOpen.value = true
}

async function openEditDialog(user) {
  form.value = {
    id: user.id,
    name: user.name,
    email: user.email,
    password: '',
    companyId: user.companyId || null,
    accessProfileId: user.accessProfileId || null,
    isAdmin: user.isAdmin || false,
    active: user.active !== undefined ? user.active : true,
  }
  showPassword.value = false
  if (user.companyId) {
    await loadProfilesByCompany(user.companyId)
  }
  dialogOpen.value = true
}

// =======================
// SAVE
// =======================
async function onCompanyChange(companyId) {
  form.value.accessProfileId = null
  profilesOptions.value = []
  if (companyId) {
    await loadProfilesByCompany(companyId)
  }
}

async function loadProfilesByCompany(companyId) {
  const profiles = await profileStore.fetchProfilesByCompany(companyId)
  profilesOptions.value = profiles.map(p => ({ label: p.name, value: p.id }))
}

async function saveUser() {
  submitting.value = true
  try {
    const payload = {
      name: form.value.name,
      email: form.value.email,
      companyId: form.value.companyId,
      accessProfileId: form.value.accessProfileId,
      isAdmin: form.value.isAdmin,
      active: form.value.active,
    }
    if (form.value.password) {
      payload.password = form.value.password
    }

    if (isEditing.value) {
      await api.put(`/users/${form.value.id}`, payload)
      $q.notify({ type: 'positive', message: 'Usuário atualizado com sucesso!' })
    } else {
      await api.post('/users', payload)
      $q.notify({ type: 'positive', message: 'Usuário criado com sucesso!' })
    }

    dialogOpen.value = false
    await fetchUsers()
    
  } catch (error) {
    console.error('Save error:', error)
    const msg = error.response?.data?.error || 'Erro ao salvar usuário.'
    $q.notify({ type: 'negative', message: msg })
  } finally {
    submitting.value = false
  }
}

// =======================
// DELETE
// =======================
function confirmDelete(user) {
  $q.dialog({
    title: 'Excluir Usuário',
    message: `Tem certeza que deseja excluir o usuário "${user.name}"? Esta ação não pode ser desfeita.`,
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
      await api.delete(`/users/${user.id}`)
      $q.notify({ type: 'positive', message: 'Usuário excluído com sucesso!' })
      await fetchUsers()
    } catch (error) {
      console.error('Delete error:', error)
      const msg = error.response?.data?.error || 'Erro ao excluir usuário.'
      $q.notify({ type: 'negative', message: msg })
    }
  })
}

// Utils
function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(async () => {
  fetchUsers()
  const companies = await companyStore.fetchCompaniesSelect()
  companiesOptions.value = companies.map(c => ({ label: c.name, value: c.id }))
})

// Reload users when admin changes company
watch(() => authStore.selectedCompanyId, async () => {
  fetchUsers()
  const companies = await companyStore.fetchCompaniesSelect()
  companiesOptions.value = companies.map(c => ({ label: c.name, value: c.id }))
})
</script>

<style scoped>
.users-page {
  background: var(--color-bg-primary);
  min-height: 100vh;
}

.users-container {
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

.users-table {
  background: transparent !important;
}

.users-table .q-table__top,
.users-table thead tr th {
  color: var(--color-text-secondary) !important;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.users-table tbody tr td {
  color: var(--color-text-primary) !important;
  font-size: 14px;
}

.users-table tbody tr:hover td {
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

.modal-card {
  width: 520px;
  max-width: 95vw;
  background: var(--color-bg-card) !important;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg) !important;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: rgba(0, 0, 0, 0.1);
}

.modal-title-area {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-icon {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 8px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.modal-actions {
  padding: 16px 0 0 0;
}

.save-btn {
  background: var(--gradient-primary) !important;
  color: #fff !important;
  font-weight: 600;
  padding: 8px 24px !important;
  border-radius: var(--radius-sm) !important;
}

.save-btn:hover {
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
}

:deep(.required-label::after) {
  content: " *";
  color: #ff4757;
  font-weight: bold;
}
</style>
