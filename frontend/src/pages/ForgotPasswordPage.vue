<template>
  <div class="auth-page">
    <div class="auth-bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
    </div>

    <div class="auth-container animate-fade-in-up">
      <div class="auth-logo">
        <div class="logo-group">
          <img src="/logo.png" alt="Monitor-Flow" class="brand-logo" />
          <div class="logo-text">Monitor-Flow</div>
        </div>
      </div>

      <div class="auth-card glass-card">
        <!-- Request Form -->
        <template v-if="!emailSent">
          <h2 class="auth-title">Esqueceu a Senha?</h2>
          <p class="auth-subtitle">
            Informe seu e-mail para receber o link de recuperação
          </p>

          <q-form @submit.prevent="handleForgotPassword" class="auth-form">
            <q-input
              v-model="email"
              type="email"
              label="E-mail"
              dark
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

            <q-btn
              type="submit"
              class="auth-btn"
              :loading="loading"
              unelevated
              no-caps
              size="lg"
            >
              <q-icon name="send" class="q-mr-sm" />
              Enviar Link
            </q-btn>
          </q-form>
        </template>

        <!-- Success Message -->
        <template v-else>
          <div class="success-container">
            <q-icon name="mark_email_read" size="64px" class="success-icon" />
            <h2 class="auth-title q-mt-md">E-mail Enviado!</h2>
            <p class="auth-subtitle">
              Se o e-mail estiver cadastrado, você receberá um link para
              redefinir sua senha. Verifique sua caixa de entrada e spam.
            </p>
          </div>
        </template>

        <div class="auth-footer">
          <router-link :to="{ name: 'Login' }" class="text-link">
            <q-icon name="arrow_back" size="16px" class="q-mr-xs" />
            Voltar ao Login
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from '../stores/auth'

const $q = useQuasar()
const authStore = useAuthStore()

const email = ref('')
const loading = ref(false)
const emailSent = ref(false)

async function handleForgotPassword() {
  loading.value = true
  try {
    await authStore.forgotPassword(email.value)
    emailSent.value = true
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Erro ao enviar e-mail. Tente novamente.',
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
  line-height: 1.6;
  text-align: center;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.text-link {
  color: var(--color-accent-light);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-link:hover {
  color: #fff;
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

.auth-footer {
  text-align: center;
  margin-top: 24px;
}

.success-container {
  text-align: center;
  padding: 20px 0;
}

.success-icon {
  color: var(--color-online);
}
</style>
