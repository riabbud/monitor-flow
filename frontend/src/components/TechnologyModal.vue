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
            {{ isEditing ? 'Editar Tecnologia' : 'Nova Tecnologia' }}
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
            <label class="form-label">Nome da Tecnologia</label>
            <q-input
              v-model="form.name"
              placeholder="Ex: Vue.js, PostgreSQL, Docker"
              filled
              autofocus
              :rules="[(v) => !!v || 'Nome é obrigatório']"
            >
              <template v-slot:prepend>
                <q-icon name="code" color="grey-5" />
              </template>
            </q-input>
          </div>

          <div class="form-group">
            <label class="form-label">Tipo</label>
            <q-select
              v-model="form.type"
              :options="typeOptions"
              placeholder="Selecione o tipo"
              filled
              :rules="[(v) => !!v || 'Tipo é obrigatório']"
            >
              <template v-slot:prepend>
                <q-icon name="category" color="grey-5" />
              </template>
            </q-select>
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
import { useTechnologyStore } from '../stores/technologies'

const props = defineProps({
  modelValue: Boolean,
  technology: Object,
})

const emit = defineEmits(['update:modelValue', 'saved'])

const $q = useQuasar()
const techStore = useTechnologyStore()
const formRef = ref(null)
const loading = ref(false)

const form = ref({
  name: '',
  type: null,
})

const typeOptions = ['Banco de Dados', 'Frontend', 'Backend']

const isEditing = computed(() => !!props.technology)

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      if (props.technology) {
        form.value = {
          name: props.technology.name,
          type: props.technology.type || null,
        }
      } else {
        form.value = { name: '', type: null }
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
      await techStore.updateTechnology(props.technology.id, form.value)
      $q.notify({
        type: 'positive',
        message: 'Tecnologia atualizada com sucesso!',
        icon: 'check_circle',
      })
    } else {
      await techStore.createTechnology(form.value)
      $q.notify({
        type: 'positive',
        message: 'Tecnologia adicionada com sucesso!',
        icon: 'check_circle',
      })
    }
    emit('saved')
  } catch (error) {
    const msg =
      error.response?.data?.error ||
      error.response?.data?.errors?.[0]?.msg ||
      'Erro ao salvar tecnologia.'
    $q.notify({ type: 'negative', message: msg, icon: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-card {
  width: 480px;
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
