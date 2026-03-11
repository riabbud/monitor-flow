<template>
  <div class="auth-page">
    <div class="auth-bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
    </div>

    <div class="auth-container animate-fade-in-up">
      <div class="auth-logo">
        <q-icon name="monitoring" size="48px" class="logo-icon" />
        <h1 class="logo-text">Monitor-Flow</h1>
      </div>

      <div class="auth-card glass-card">
        <template v-if="!resetSuccess">
          <h2 class="auth-title">Nova Senha</h2>
          <p class="auth-subtitle">Defina uma nova senha para sua conta</p>

          <q-form @submit.prevent="handleResetPassword" class="auth-form">
            <q-input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              label="Nova Senha"
              dark
              filled
              :rules="[
                (v) => !!v || 'Senha é obrigatória',
                (v) => v.length >= 6 || 'Mínimo 6 caracteres',
              ]"
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

            <q-input
              v-model="confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              label="Confirmar Nova Senha"
              dark
              filled
              :rules="[
                (v) => !!v || 'Confirme a senha',
                (v) => v === password || 'Senhas não conferem',
              ]"
            >
              <template v-slot:prepend>
                <q-icon name="lock_outline" color="grey-5" />
              </template>
            </q-input>

            <q-btn
              type="submit"
              class="auth-btn"
              :loading="loading"
              unelevated
              no-caps
              size="lg"
            >
              <q-icon name="save" class="q-mr-sm" />
              Redefinir Senha
            </q-btn>
          </q-form>
        </template>

        <template v-else>
          <div class="success-container">
            <q-icon name="check_circle" size="64px" class="success-icon" />
            <h2 class="auth-title q-mt-md">Senha Redefinida!</h2>
            <p class="auth-subtitle">
              Sua senha foi alterada com sucesso. Faça login com a nova senha.
            </p>
            <q-btn
              class="auth-btn q-mt-md"
              unelevated
              no-caps
              size="lg"
              @click="$router.push({ name: 'Login' })"
            >
              <q-icon name="login" class="q-mr-sm" />
              Ir para Login
            </q-btn>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const $q = useQuasar()
const authStore = useAuthStore()

const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const loading = ref(false)
const resetSuccess = ref(false)

async function handleResetPassword() {
  if (password.value !== confirmPassword.value) {
    $q.notify({ type: 'negative', message: 'Senhas não conferem.' })
    return
  }

  loading.value = true
  try {
    await authStore.resetPassword(route.params.token, password.value)
    resetSuccess.value = true
  } catch (error) {
    const msg = error.response?.data?.error || 'Token inválido ou expirado.'
    $q.notify({ type: 'negative', message: msg, icon: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-primary);
  position: relative;
  overflow: hidden;
  padding: 20px;
}

.auth-bg-decoration {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.15;
}

.circle-1 {
  width: 500px;
  height: 500px;
  background: #667eea;
  top: -150px;
  right: -100px;
}

.circle-2 {
  width: 400px;
  height: 400px;
  background: #764ba2;
  bottom: -100px;
  left: -100px;
}

.auth-container {
  width: 100%;
  max-width: 440px;
  z-index: 1;
}

.auth-logo {
  text-align: center;
  margin-bottom: 32px;
}

.logo-icon {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.logo-text {
  font-size: 32px;
  font-weight: 800;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 8px 0 0;
  letter-spacing: -1px;
}

.auth-card {
  padding: 40px 36px;
}

.auth-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 4px;
}

.auth-subtitle {
  color: var(--color-text-secondary);
  font-size: 14px;
  margin: 0 0 28px;
  line-height: 1.6;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.auth-btn {
  width: 100%;
  background: var(--gradient-primary) !important;
  color: #fff !important;
  font-weight: 600;
  border-radius: var(--radius-sm) !important;
  padding: 12px !important;
  font-size: 15px;
  margin-top: 8px;
}

.auth-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
}

.success-container {
  text-align: center;
  padding: 20px 0;
}

.success-icon {
  color: var(--color-online);
}
</style>
