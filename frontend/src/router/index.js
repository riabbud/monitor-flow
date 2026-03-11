import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('../pages/LoginPage.vue'),
        meta: { guest: true },
    },
    {
        path: '/register',
        name: 'Register',
        component: () => import('../pages/RegisterPage.vue'),
        meta: { guest: true },
    },
    {
        path: '/forgot-password',
        name: 'ForgotPassword',
        component: () => import('../pages/ForgotPasswordPage.vue'),
        meta: { guest: true },
    },
    {
        path: '/reset-password/:token',
        name: 'ResetPassword',
        component: () => import('../pages/ResetPasswordPage.vue'),
        meta: { guest: true },
    },
    {
        path: '/',
        component: () => import('../layouts/AuthenticatedLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'Dashboard',
                component: () => import('../pages/AnalyticsPage.vue'),
                meta: { pageKey: 'dashboard' },
            },
            {
                path: 'monitoramento',
                name: 'Monitoring',
                component: () => import('../pages/DashboardPage.vue'),
                meta: { pageKey: 'monitoring' },
            },
            {
                path: 'applications',
                name: 'Applications',
                component: () => import('../pages/ApplicationsPage.vue'),
                meta: { pageKey: 'applications' },
            },
            {
                path: 'servers',
                name: 'Servers',
                component: () => import('../pages/ServersPage.vue'),
                meta: { pageKey: 'servers' },
            },
            {
                path: 'users',
                name: 'Users',
                component: () => import('../pages/UsersPage.vue'),
                meta: { pageKey: 'users' },
            },
            {
                path: 'technologies',
                name: 'Technologies',
                component: () => import('../pages/TechnologiesPage.vue'),
                meta: { pageKey: 'technologies' },
            },
            {
                path: 'companies',
                name: 'Companies',
                component: () => import('../pages/CompaniesPage.vue'),
                meta: { pageKey: 'companies' },
            },
            {
                path: 'access-profiles',
                name: 'AccessProfiles',
                component: () => import('../pages/AccessProfilesPage.vue'),
                meta: { pageKey: 'accessProfiles' },
            },
        ],
    },
    {
        path: '/access-denied',
        name: 'AccessDenied',
        component: {
            template: `
                <q-page padding class="flex flex-center">
                    <div class="text-center">
                        <q-icon name="block" size="80px" color="red-4" />
                        <h4 class="text-grey-4 q-mt-md">Acesso Negado</h4>
                        <p class="text-grey-6">Você não tem permissão para acessar esta página.</p>
                        <q-btn color="primary" label="Voltar ao Dashboard" to="/" unelevated class="q-mt-md" />
                    </div>
                </q-page>
            `,
        },
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

// Navigation guards
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        next({ name: 'Login' })
    } else if (to.meta.guest && authStore.isAuthenticated) {
        next({ name: 'Dashboard' })
    } else if (to.meta.pageKey && authStore.isAuthenticated) {
        // Check page permission
        if (authStore.hasPermission(to.meta.pageKey)) {
            next()
        } else {
            next({ name: 'AccessDenied' })
        }
    } else {
        next()
    }
})

export default router
