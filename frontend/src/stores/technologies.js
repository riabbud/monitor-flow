import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../services/api'
import { getSocket } from '../services/socket'
import { useAuthStore } from './auth'

export const useTechnologyStore = defineStore('technologies', () => {
    const technologies = ref([])
    const loading = ref(false)
    let socketInitialized = false

    async function fetchTechnologies() {
        loading.value = true
        try {
            const authStore = useAuthStore()
            const { data } = await api.get(`/technologies${authStore.companyFilter}`)
            technologies.value = data
        } catch (error) {
            console.error('Error fetching technologies:', error)
            throw error
        } finally {
            loading.value = false
        }
    }

    async function createTechnology(technologyData) {
        try {
            const { data } = await api.post('/technologies', technologyData)
            // Local update (optional, socket will also emit)
            const exists = technologies.value.find((t) => t.id === data.id)
            if (!exists) technologies.value.unshift(data)
            return data
        } catch (error) {
            console.error('Error creating technology:', error)
            throw error
        }
    }

    async function updateTechnology(id, technologyData) {
        try {
            const { data } = await api.put(`/technologies/${id}`, technologyData)
            const index = technologies.value.findIndex((t) => t.id === id)
            if (index !== -1) {
                technologies.value[index] = data
            }
            return data
        } catch (error) {
            console.error('Error updating technology:', error)
            throw error
        }
    }

    async function deleteTechnology(id) {
        try {
            await api.delete(`/technologies/${id}`)
            technologies.value = technologies.value.filter((t) => t.id !== id)
        } catch (error) {
            console.error('Error deleting technology:', error)
            throw error
        }
    }

    function setupSocketListeners() {
        if (socketInitialized) return
        const socket = getSocket()
        if (!socket) return

        socket.on('technology:created', (tech) => {
            const exists = technologies.value.find((t) => t.id === tech.id)
            if (!exists) {
                technologies.value.unshift(tech)
            }
        })

        socket.on('technology:updated', (tech) => {
            const index = technologies.value.findIndex((t) => t.id === tech.id)
            if (index !== -1) {
                technologies.value[index] = tech
            }
        })

        socket.on('technology:deleted', ({ id }) => {
            technologies.value = technologies.value.filter((t) => t.id !== id)
        })

        socketInitialized = true
    }

    return {
        technologies,
        loading,
        fetchTechnologies,
        createTechnology,
        updateTechnology,
        deleteTechnology,
        setupSocketListeners,
    }
})
