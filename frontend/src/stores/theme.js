import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { Dark } from 'quasar'

export const useThemeStore = defineStore('theme', () => {
    const isDark = ref(localStorage.getItem('theme') !== 'light')

    function applyTheme() {
        const theme = isDark.value ? 'dark' : 'light'
        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem('theme', theme)
        Dark.set(isDark.value)
    }

    function toggle() {
        isDark.value = !isDark.value
        applyTheme()
    }

    // Apply on init
    applyTheme()

    return {
        isDark,
        toggle,
        applyTheme,
    }
})
