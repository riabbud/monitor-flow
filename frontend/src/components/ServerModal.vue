<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    persistent
    transition-show="scale"
    transition-hide="scale"
  >
    <q-card class="modal-card">
      <!-- Header -->
      <q-card-section class="modal-header">
        <div class="modal-title-area">
          <q-icon
            :name="isEditing ? 'edit' : 'add_circle'"
            size="24px"
            class="modal-icon"
          />
          <h3 class="modal-title">
            {{ isEditing ? 'Editar Servidor' : 'Novo Servidor' }}
          </h3>
        </div>
        <q-btn
          flat
          round
          dense
          icon="close"
          color="grey-5"
          @click="$emit('update:modelValue', false)"
        />
      </q-card-section>

      <q-separator />

      <!-- Form -->
      <q-card-section class="modal-body">
        <q-form @submit.prevent="handleSubmit" ref="formRef" greedy>
          <div class="form-group">
            <label class="form-label">Nome do Servidor</label>
            <q-input
              v-model="form.name"
              placeholder="Ex: Servidor de Banco de Dados"
              filled
              autofocus
              :rules="[(v) => !!v || 'Nome é obrigatório']"
            >
              <template v-slot:prepend>
                <q-icon name="dns" color="grey-5" />
              </template>
            </q-input>
          </div>

          <div class="form-group">
            <label class="form-label">Conta de Acesso (Opcional)</label>
            <q-input
              v-model="form.accessAccount"
              placeholder="Ex: root, admin"
              filled
            >
              <template v-slot:prepend>
                <q-icon name="manage_accounts" color="grey-5" />
              </template>
            </q-input>
          </div>

          <div class="form-group">
            <label class="form-label">Endereço IP (Opcional)</label>
            <q-input
              v-model="form.ipAddress"
              placeholder="Ex: 192.168.0.10"
              filled
            >
              <template v-slot:prepend>
                <q-icon name="settings_ethernet" color="grey-5" />
              </template>
            </q-input>
          </div>

          <div class="form-group">
            <label class="form-label">Descrição (Opcional)</label>
            <q-input
              v-model="form.description"
              placeholder="Ex: Servidor principal para o Portal"
              filled
            >
              <template v-slot:prepend>
                <q-icon name="description" color="grey-5" />
              </template>
            </q-input>
          </div>
        </q-form>
      </q-card-section>

      <q-separator />

      <!-- Actions -->
      <q-card-actions align="right" class="modal-actions">
        <q-btn
          flat
          no-caps
          label="Cancelar"
          color="grey-5"
          @click="$emit('update:modelValue', false)"
        />
        <q-btn
          unelevated
          no-caps
          class="save-btn"
          :loading="loading"
          @click="handleSubmit"
        >
          <q-icon :name="isEditing ? 'save' : 'add'" class="q-mr-sm" />
          {{ isEditing ? 'Salvar' : 'Adicionar' }}
        </q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useServerStore } from '../stores/servers'

const props = defineProps({
  modelValue: Boolean,
  server: Object,
})

const emit = defineEmits(['update:modelValue', 'saved'])

const $q = useQuasar()
const serverStore = useServerStore()
const formRef = ref(null)
const loading = ref(false)

const form = ref({
  name: '',
  accessAccount: '',
  ipAddress: '',
  description: '',
})

const isEditing = computed(() => !!props.server)

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      if (props.server) {
        form.value = {
          name: props.server.name,
          accessAccount: props.server.accessAccount || '',
          ipAddress: props.server.ipAddress || '',
          description: props.server.description || '',
        }
      } else {
        form.value = { name: '', accessAccount: '', ipAddress: '', description: '' }
      }
    }
  }
)

async function handleSubmit() {
  const valid = await formRef.value?.validate()
  if (!valid) return

  loading.value = true
  try {
    if (isEditing.value) {
      await serverStore.updateServer(props.server.id, form.value)
      $q.notify({
        type: 'positive',
        message: 'Servidor atualizado com sucesso!',
        icon: 'check_circle',
      })
    } else {
      await serverStore.createServer(form.value)
      $q.notify({
        type: 'positive',
        message: 'Servidor adicionado com sucesso!',
        icon: 'check_circle',
      })
    }
    emit('saved')
  } catch (error) {
    const msg =
      error.response?.data?.error ||
      error.response?.data?.errors?.[0]?.msg ||
      'Erro ao salvar servidor.'
    $q.notify({ type: 'negative', message: msg, icon: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-card {
  width: 520px;
  max-width: 95vw;
  background: var(--color-bg-card) !important;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg) !important;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
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
  padding: 16px 24px;
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
</style>
