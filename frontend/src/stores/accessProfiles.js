import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../services/api'
import { useAuthStore } from './auth'

export const useAccessProfileStore = defineStore('accessProfiles', () => {
    const profiles = ref([])
    const availablePages = ref([])
    const loading = ref(false)

    async function fetchProfiles() {
        loading.value = true
        try {
            const authStore = useAuthStore()
            const { data } = await api.get(`/access-profiles${authStore.companyFilter}`)
            profiles.value = data
        } catch (error) {
            console.error('Fetch profiles error:', error)
        } finally {
            loading.value = false
        }
    }

    async function fetchAvailablePages() {
        try {
            const { data } = await api.get('/access-profiles/pages')
            availablePages.value = data
            return data
        } catch (error) {
            console.error('Fetch pages error:', error)
            return []
        }
    }

    async function fetchProfilesByCompany(companyId) {
        try {
            const { data } = await api.get(`/access-profiles/by-company/${companyId}`)
            return data
        } catch (error) {
            console.error('Fetch profiles by company error:', error)
            return []
        }
    }

    async function createProfile(payload) {
        const { data } = await api.post('/access-profiles', payload)
        profiles.value.push(data)
        return data
    }

    async function updateProfile(id, payload) {
        const { data } = await api.put(`/access-profiles/${id}`, payload)
        const index = profiles.value.findIndex(p => p.id === id)
        if (index !== -1) profiles.value[index] = data
        return data
    }

    async function deleteProfile(id) {
        await api.delete(`/access-profiles/${id}`)
        profiles.value = profiles.value.filter(p => p.id !== id)
    }

    return {
        profiles,
        availablePages,
        loading,
        fetchProfiles,
        fetchAvailablePages,
        fetchProfilesByCompany,
        createProfile,
        updateProfile,
        deleteProfile,
    }
})
