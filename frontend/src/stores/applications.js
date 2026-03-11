import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'
import { getSocket } from '../services/socket'
import { useAuthStore } from './auth'

export const useApplicationStore = defineStore('applications', () => {
    const applications = ref([])
    const loading = ref(false)

    const onlineCount = computed(
        () => applications.value.filter((a) => a.status === 'online' && (!a.responseTime || a.responseTime < 500)).length
    )
    const offlineCount = computed(
        () => applications.value.filter((a) => a.status === 'offline').length
    )
    const slowCount = computed(
        () => applications.value.filter((a) => a.responseTime && a.responseTime >= 500 && a.status === 'online').length
    )
    const totalCount = computed(() => applications.value.length)

    const recentDrops = ref([])

    async function fetchApplications() {
        loading.value = true
        try {
            const authStore = useAuthStore()
            const { data } = await api.get(`/applications${authStore.companyFilter}`)
            applications.value = data
            // Fetch drops too
            await fetchRecentDrops()
        } finally {
            loading.value = false
        }
    }

    async function fetchRecentDrops() {
        try {
            const authStore = useAuthStore()
            const { data } = await api.get(`/applications/logs/offline${authStore.companyFilter}`)
            recentDrops.value = data
        } catch (error) {
            console.error('Error fetching recent drops:', error)
        }
    }

    async function createApplication(appData) {
        const { data } = await api.post('/applications', appData)
        // Não adiciona aqui — o socket listener 'application:created' já cuida disso
        return data
    }

    async function updateApplication(id, appData) {
        const { data } = await api.put(`/applications/${id}`, appData)
        // Não atualiza aqui — o socket listener 'application:updated' já cuida disso
        return data
    }

    async function deleteApplication(id) {
        await api.delete(`/applications/${id}`)
        // Não remove aqui — o socket listener 'application:deleted' já cuida disso
    }

    async function fetchLogs(id) {
        try {
            const { data } = await api.get(`/applications/${id}/logs`)
            return data
        } catch (error) {
            console.error('Error fetching logs:', error)
            throw error
        }
    }

    function setupSocketListeners() {
        const socket = getSocket()
        if (!socket) return

        socket.on('application:statusUpdate', (updated) => {
            const index = applications.value.findIndex((a) => a.id === updated.id)
            if (index !== -1) {
                applications.value[index] = { ...applications.value[index], ...updated }
            }
        })

        function playAlertSound() {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (!AudioContext) return;

                const audioCtx = new AudioContext();

                // Play 2 short beeps
                for (let i = 0; i < 2; i++) {
                    const osc = audioCtx.createOscillator();
                    const gainNode = audioCtx.createGain();

                    osc.connect(gainNode);
                    gainNode.connect(audioCtx.destination);

                    osc.type = 'square';
                    osc.frequency.setValueAtTime(300, audioCtx.currentTime + i * 0.2);
                    osc.frequency.linearRampToValueAtTime(200, audioCtx.currentTime + i * 0.2 + 0.1);

                    gainNode.gain.setValueAtTime(0, audioCtx.currentTime + i * 0.2);
                    gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + i * 0.2 + 0.05);
                    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + i * 0.2 + 0.15);

                    osc.start(audioCtx.currentTime + i * 0.2);
                    osc.stop(audioCtx.currentTime + i * 0.2 + 0.15);
                }
            } catch (e) {
                console.error('Autoplay prevented or error playing sound:', e);
            }
        }

        socket.on('application:statusChanged', ({ newStatus }) => {
            if (newStatus === 'offline') {
                fetchRecentDrops()
                playAlertSound()
            }
        })

        socket.on('application:created', (app) => {
            const exists = applications.value.find((a) => a.id === app.id)
            if (!exists) {
                applications.value.unshift(app)
            }
        })

        socket.on('application:updated', (app) => {
            const index = applications.value.findIndex((a) => a.id === app.id)
            if (index !== -1) {
                applications.value[index] = app
            }
        })

        socket.on('application:deleted', ({ id }) => {
            applications.value = applications.value.filter((a) => a.id !== id)
        })
    }

    return {
        applications,
        loading,
        onlineCount,
        offlineCount,
        slowCount,
        totalCount,
        recentDrops,
        fetchApplications,
        fetchRecentDrops,
        createApplication,
        updateApplication,
        deleteApplication,
        fetchLogs,
        setupSocketListeners,
    }
})
