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
            {{ isEditing ? 'Editar Sistema' : 'Novo Sistema' }}
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
            <label class="form-label">Nome do Sistema</label>
            <q-input
              v-model="form.name"
              placeholder="Ex: Portal Administrativo"
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
            <label class="form-label">URL</label>
            <q-input
              v-model="form.url"
              placeholder="https://meusite.com.br"
              filled
              :rules="[
                (v) => !!v || 'URL é obrigatória',
                (v) =>
                  /^https?:\/\/.+/.test(v) || 'URL deve começar com http:// ou https://',
              ]"
            >
              <template v-slot:prepend>
                <q-icon name="link" color="grey-5" />
              </template>
            </q-input>
          </div>

          <div class="form-group">
            <label class="form-label">Tempo de Monitoramento (segundos)</label>
            <q-input
              v-model.number="form.checkInterval"
              type="number"
              min="10"
              placeholder="Ex: 60"
              filled
              :rules="[
                (v) => !!v || 'Tempo é obrigatório',
                (v) => v >= 10 || 'Mínimo de 10 segundos'
              ]"
            >
              <template v-slot:prepend>
                <q-icon name="timer" color="grey-5" />
              </template>
            </q-input>
          </div>

          <div class="form-group">
            <label class="form-label">Servidor (Opcional)</label>
            <q-select
              v-model="form.serverId"
              :options="serverOptions"
              option-value="id"
              option-label="name"
              emit-value
              map-options
              filled
              clearable
              placeholder="Selecione um servidor"
            >
              <template v-slot:prepend>
                <q-icon name="dns" color="grey-5" />
              </template>
            </q-select>
          </div>

          <div class="form-group">
            <label class="form-label">Stack Tecnológica</label>
            <q-input
              v-model="form.techStack"
              placeholder="Ex: Oracle APEX, Node.js, Vue.js, PostgreSQL"
              filled
              :rules="[(v) => !!v || 'Tecnologia é obrigatória']"
            >
              <template v-slot:prepend>
                <q-icon name="code" color="grey-5" />
              </template>
            </q-input>
          </div>

          <!-- Tech stack suggestions -->
          <div class="tech-suggestions">
            <span
              v-for="tech in techSuggestions"
              :key="tech"
              class="tech-chip"
              @click="addTech(tech)"
            >
              {{ tech }}
            </span>
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
import { ref, watch, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useApplicationStore } from '../stores/applications'
import { useServerStore } from '../stores/servers'
import { useTechnologyStore } from '../stores/technologies'

const props = defineProps({
  modelValue: Boolean,
  application: Object,
})

const emit = defineEmits(['update:modelValue', 'saved'])

const $q = useQuasar()
const appStore = useApplicationStore()
const serverStore = useServerStore()
const techStore = useTechnologyStore()
const formRef = ref(null)
const loading = ref(false)

const form = ref({
  name: '',
  url: '',
  techStack: '',
  serverId: null,
  checkInterval: 60,
})

const serverOptions = computed(() => serverStore.servers)

onMounted(() => {
  if (serverStore.servers.length === 0) {
    serverStore.fetchServers()
  }
  if (techStore.technologies.length === 0) {
    techStore.fetchTechnologies()
  }
})

const isEditing = computed(() => !!props.application)

const techSuggestions = computed(() => {
  return techStore.technologies.map(t => t.name).sort((a, b) => a.localeCompare(b))
})

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      if (props.application) {
        form.value = {
          name: props.application.name,
          url: props.application.url,
          techStack: props.application.techStack,
          serverId: props.application.serverId || null,
          checkInterval: props.application.checkInterval || 60,
        }
      } else {
        form.value = { name: '', url: '', techStack: '', serverId: null, checkInterval: 60 }
      }
    }
  }
)

function addTech(tech) {
  if (form.value.techStack) {
    if (!form.value.techStack.includes(tech)) {
      form.value.techStack += `, ${tech}`
    }
  } else {
    form.value.techStack = tech
  }
}

async function handleSubmit() {
  const valid = await formRef.value?.validate()
  if (!valid) return

  loading.value = true
  try {
    if (isEditing.value) {
      await appStore.updateApplication(props.application.id, form.value)
      $q.notify({
        type: 'positive',
        message: 'Sistema atualizado com sucesso!',
        icon: 'check_circle',
      })
    } else {
      await appStore.createApplication(form.value)
      $q.notify({
        type: 'positive',
        message: 'Sistema adicionado com sucesso!',
        icon: 'check_circle',
      })
    }
    emit('saved')
  } catch (error) {
    const msg =
      error.response?.data?.error ||
      error.response?.data?.errors?.[0]?.msg ||
      'Erro ao salvar sistema.'
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

.tech-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.tech-chip {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: rgba(102, 126, 234, 0.1);
  color: var(--color-accent-light);
  border: 1px solid rgba(102, 126, 234, 0.2);
  cursor: pointer;
  transition: var(--transition-fast);
}

.tech-chip:hover {
  background: rgba(102, 126, 234, 0.25);
  border-color: var(--color-accent);
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
