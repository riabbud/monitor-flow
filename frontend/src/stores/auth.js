import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import api from '../services/api'
import { connectSocket, disconnectSocket } from '../services/socket'

export const useAuthStore = defineStore('auth', () => {
    const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
    const token = ref(localStorage.getItem('token') || null)

    const isAuthenticated = computed(() => !!token.value)
    const userName = computed(() => user.value?.name || '')
    const isAdmin = computed(() => user.value?.isAdmin || false)
    const userPermissions = computed(() => user.value?.accessProfile?.permissions || {})
    const userCompany = computed(() => user.value?.company || null)
    const selectedCompanyId = ref(localStorage.getItem('selectedCompanyId') || null)

    // Returns query string param for API filtering
    const companyFilter = computed(() => {
        if (selectedCompanyId.value) {
            return `?companyId=${selectedCompanyId.value}`
        }
        return ''
    })

    /**
     * Check if the current user has permission to access a page
     * Admin always has full access
     */
    function hasPermission(pageKey) {
        if (isAdmin.value) return true
        return !!userPermissions.value[pageKey]
    }

    async function login(email, password) {
        const { data } = await api.post('/auth/login', { email, password })
        setAuthData(data)
        return data
    }

    async function register(name, email, password) {
        const { data } = await api.post('/auth/register', { name, email, password })
        setAuthData(data)
        return data
    }

    async function forgotPassword(email) {
        const { data } = await api.post('/auth/forgot-password', { email })
        return data
    }

    async function resetPassword(resetToken, password) {
        const { data } = await api.post('/auth/reset-password', {
            token: resetToken,
            password,
        })
        return data
    }

    async function fetchUser() {
        try {
            const { data } = await api.get('/auth/me')
            user.value = data.user
            localStorage.setItem('user', JSON.stringify(data.user))
        } catch {
            logout()
        }
    }

    function setAuthData(data) {
        user.value = data.user
        token.value = data.token
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.setItem('token', data.token)
        connectSocket(data.token)
    }

    function logout() {
        user.value = null
        token.value = null
        selectedCompanyId.value = null
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        localStorage.removeItem('selectedCompanyId')
        disconnectSocket()
    }

    // Persist selected company
    watch(selectedCompanyId, (val) => {
        if (val) {
            localStorage.setItem('selectedCompanyId', val)
        } else {
            localStorage.removeItem('selectedCompanyId')
        }
    })

    // Reconnect socket if already authenticated
    function initSocket() {
        if (token.value) {
            connectSocket(token.value)
        }
    }

    return {
        user,
        token,
        isAuthenticated,
        userName,
        isAdmin,
        userPermissions,
        userCompany,
        selectedCompanyId,
        companyFilter,
        hasPermission,
        login,
        register,
        forgotPassword,
        resetPassword,
        fetchUser,
        logout,
        initSocket,
    }
})
