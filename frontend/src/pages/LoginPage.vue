<template>
  <div class="auth-page">
    <!-- Background decoration -->
    <div class="auth-bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>

    <div class="auth-container animate-fade-in-up">
      <div class="auth-logo">
        <div class="logo-group">
          <img src="/logo.png" alt="Monitor-Flow" class="brand-logo" />
          <div class="logo-text">Monitor-Flow</div>
        </div>
        <p class="logo-subtitle">Monitoramento de Sistemas em Tempo Real</p>
      </div>

      <!-- Form Card -->
      <div class="auth-card glass-card">
        <h2 class="auth-title">Entrar</h2>
        <p class="auth-subtitle">Acesse sua conta para gerenciar seus sistemas</p>

        <q-form @submit.prevent="handleLogin" class="auth-form">
          <q-input
            v-model="email"
            type="email"
            label="E-mail"
            filled
            :rules="[
              (v) => !!v || 'E-mail é obrigatório',
              (v) => /.+@.+\..+/.test(v) || 'E-mail inválido',
            ]"
          >
            <template v-slot:prepend>
              <q-icon name="mail" color="grey-5" class="q-pr-sm" />
            </template>
          </q-input>

          <q-input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            label="Senha"
            filled
            :rules="[(v) => !!v || 'Senha é obrigatória']"
          >
            <template v-slot:prepend>
              <q-icon name="lock" color="grey-5" class="q-pr-sm" />
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



          <q-btn
            type="submit"
            class="auth-btn"
            :loading="loading"
            unelevated
            no-caps
            size="lg"
          >
            <q-icon name="login" class="q-mr-sm" />
            Entrar
          </q-btn>
        </q-form>

        <div class="auth-footer">
          <router-link :to="{ name: 'ForgotPassword' }" class="text-link">
            Esqueceu a senha?
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const $q = useQuasar()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  try {
    await authStore.login(email.value, password.value)
    $q.notify({
      type: 'positive',
      message: 'Login realizado com sucesso!',
      icon: 'check_circle',
    })
    router.push({ name: 'Dashboard' })
  } catch (error) {
    const msg = error.response?.data?.error || 'Erro ao fazer login.'
    $q.notify({
      type: 'negative',
      message: msg,
      icon: 'error',
    })
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

.circle-3 {
  width: 300px;
  height: 300px;
  background: #00d2a0;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.auth-container {
  width: 100%;
  max-width: 440px;
  z-index: 1;
}

.auth-logo {
  text-align: center;
  margin-bottom: 24px;
}

.logo-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.brand-logo {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  object-fit: contain;
}

.logo-text {
  font-size: 42px;
  font-weight: 800;
  line-height: 1.2;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  letter-spacing: -1px;
}

.logo-subtitle {
  color: var(--color-text-secondary);
  font-size: 14px;
  margin-top: 4px;
}

.auth-card {
  padding: 40px 36px;
}

.auth-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 4px;
  text-align: center;
}

.auth-subtitle {
  color: var(--color-text-secondary);
  font-size: 14px;
  margin: 0 0 28px;
  text-align: center;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.forgot-link {
  text-align: right;
  margin-bottom: 8px;
}

.text-link {
  color: var(--color-accent-light);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: var(--transition-fast);
}

.text-link:hover {
  color: #fff;
  text-decoration: underline;
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
  transition: var(--transition-normal);
}

.auth-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
}

.auth-footer {
  text-align: center;
  margin-top: 24px;
  color: var(--color-text-secondary);
  font-size: 14px;
  display: flex;
  gap: 6px;
  justify-content: center;
}
</style>
