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
    let audioCtx = null
    const isSoundEnabled = ref(true)

    function initAudio() {
        console.log('[Audio] Initializing AudioContext...');
        try {
            if (audioCtx) return
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                audioCtx = new AudioContextClass();
                console.log('[Audio] Context created, state:', audioCtx.state);
                // Browsers often start in 'suspended' state
                if (audioCtx.state === 'suspended') {
                    const resume = () => {
                        audioCtx.resume().then(() => {
                            console.log('[Audio] Context resumed via user interaction');
                            window.removeEventListener('click', resume);
                            window.removeEventListener('keydown', resume);
                        });
                    };
                    window.addEventListener('click', resume);
                    window.addEventListener('keydown', resume);
                }
            }
        } catch (e) {
            console.error('[Audio] Error initializing context:', e);
        }
    }

    function playAlertSound() {
        console.log('[Audio] playAlertSound triggered, enabled:', isSoundEnabled.value);
        if (!isSoundEnabled.value) return;

        try {
            if (!audioCtx) initAudio();
            if (!audioCtx) return;

            console.log('[Audio] Context state:', audioCtx.state);
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            // Play a series of beeps for a more "alarm" feel
            const playBeep = (time, freq, duration) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();

                osc.connect(gain);
                gain.connect(audioCtx.destination);

                osc.type = 'sine'; // Sine is cleaner than square
                osc.frequency.setValueAtTime(freq, time);
                osc.frequency.exponentialRampToValueAtTime(freq / 2, time + duration);

                gain.gain.setValueAtTime(0, time);
                gain.gain.linearRampToValueAtTime(0.2, time + 0.05);
                gain.gain.linearRampToValueAtTime(0, time + duration);

                osc.start(time);
                osc.stop(time + duration);
            };

            const now = audioCtx.currentTime;
            // Three descending beeps
            playBeep(now, 880, 0.4);
            playBeep(now + 0.5, 880, 0.4);
            playBeep(now + 1.0, 440, 0.6);

        } catch (e) {
            console.error('[Audio] Error playing sound:', e);
        }
    }

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
        isSoundEnabled,
        initAudio,
        playAlertSound,
        fetchApplications,
        fetchRecentDrops,
        createApplication,
        updateApplication,
        deleteApplication,
        fetchLogs,
        setupSocketListeners,
    }
})
