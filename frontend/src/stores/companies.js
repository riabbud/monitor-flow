import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../services/api'
import { useAuthStore } from './auth'

export const useCompanyStore = defineStore('companies', () => {
    const companies = ref([])
    const loading = ref(false)

    async function fetchCompanies() {
        loading.value = true
        try {
            const authStore = useAuthStore()
            const { data } = await api.get(`/companies${authStore.companyFilter}`)
            companies.value = data
        } catch (error) {
            console.error('Fetch companies error:', error)
        } finally {
            loading.value = false
        }
    }

    async function fetchCompaniesSelect() {
        try {
            const { data } = await api.get('/companies/select/list')
            return data
        } catch (error) {
            console.error('Fetch companies select error:', error)
            return []
        }
    }

    async function createCompany(payload) {
        const { data } = await api.post('/companies', payload)
        companies.value.push(data)
        return data
    }

    async function updateCompany(id, payload) {
        const { data } = await api.put(`/companies/${id}`, payload)
        const index = companies.value.findIndex(c => c.id === id)
        if (index !== -1) companies.value[index] = data
        return data
    }

    async function deleteCompany(id) {
        await api.delete(`/companies/${id}`)
        companies.value = companies.value.filter(c => c.id !== id)
    }

    return {
        companies,
        loading,
        fetchCompanies,
        fetchCompaniesSelect,
        createCompany,
        updateCompany,
        deleteCompany,
    }
})
