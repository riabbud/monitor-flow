import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'
import { getSocket } from '../services/socket'
import { useAuthStore } from './auth'

export const useServerStore = defineStore('servers', () => {
    const servers = ref([])
    const loading = ref(false)

    async function fetchServers() {
        loading.value = true
        try {
            const authStore = useAuthStore()
            const { data } = await api.get(`/servers${authStore.companyFilter}`)
            servers.value = data
        } finally {
            loading.value = false
        }
    }

    async function createServer(serverData) {
        const { data } = await api.post('/servers', serverData)
        return data
    }

    async function updateServer(id, serverData) {
        const { data } = await api.put(`/servers/${id}`, serverData)
        return data
    }

    async function deleteServer(id) {
        await api.delete(`/servers/${id}`)
    }

    function setupSocketListeners() {
        const socket = getSocket()
        if (!socket) return

        socket.on('server:created', (server) => {
            const exists = servers.value.find((s) => s.id === server.id)
            if (!exists) {
                servers.value.unshift(server)
            }
        })

        socket.on('server:updated', (server) => {
            const index = servers.value.findIndex((s) => s.id === server.id)
            if (index !== -1) {
                servers.value[index] = server
            }
        })

        socket.on('server:deleted', ({ id }) => {
            servers.value = servers.value.filter((s) => s.id !== id)
        })
    }

    return {
        servers,
        loading,
        fetchServers,
        createServer,
        updateServer,
        deleteServer,
        setupSocketListeners,
    }
})
