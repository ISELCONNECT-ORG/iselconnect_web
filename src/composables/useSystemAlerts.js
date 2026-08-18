// src/composables/useSystemAlerts.js
import { ref } from 'vue'

const activeAlerts = ref([])

export function useSystemAlerts() {
  const addAlert = (alert) => {
    const id = alert.id || Date.now() + Math.random().toString(36).substr(2, 9)
    const newAlert = {
      time: 'Just now',
      ...alert,
      id,
    }

    // Add to the front of the array so it appears at the top
    activeAlerts.value.unshift(newAlert)

    // Automatically remove after 20 seconds (20000ms)
    setTimeout(() => {
      removeAlert(id)
    }, 20000)
  }

  const removeAlert = (id) => {
    activeAlerts.value = activeAlerts.value.filter((alert) => alert.id !== id)
  }

  return {
    activeAlerts,
    addAlert,
    removeAlert,
  }
}
