<!-- src/App.vue -->
<template>
  <div id="app">
    <!-- Renders whichever page/route you are currently on -->
    <router-view />

    <!-- Global Messenger-style / Dark Toast Notification Popup -->
    <SystemAlertsPopup />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { supabase } from '@/services/supabase'
import { useSystemAlerts } from '@/composables/useSystemAlerts'
import SystemAlertsPopup from '@/components/SystemAlertsPopup.vue'

const { addAlert } = useSystemAlerts()
let notificationChannel = null

// Determine severity level based on notification text content
const analyzeNotification = (title) => {
  const t = (title || '').toLowerCase()
  if (t.includes('resolved') || t.includes('completed')) return 'low'
  if (t.includes('system') || t.includes('deployed')) return 'low'
  if (t.includes('assign') || t.includes('dispatch') || t.includes('lineman')) return 'normal'
  if (t.includes('advisory') || t.includes('scheduled')) return 'high'
  return 'critical'
}

onMounted(() => {
  console.log('Initializing global Supabase Realtime notification listener...')

  // Listen globally to inserts on the notifications table
  notificationChannel = supabase
    .channel('public:global_notifications_popup')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications' },
      (payload) => {
        console.log('🔥 GLOBAL REALTIME INSERT DETECTED:', payload)
        const newNote = payload.new
        if (!newNote) return

        const severityLevel = analyzeNotification(newNote.title)

        // Triggers the popup card to slide in on any page
        addAlert({
          id: newNote.id || Date.now(),
          title: newNote.title,
          message: newNote.message,
          severity: severityLevel,
        })
      },
    )
    .subscribe((status, err) => {
      console.log('📡 Global Realtime Status:', status, err)
    })
})

onUnmounted(() => {
  if (notificationChannel) {
    supabase.removeChannel(notificationChannel)
  }
})
</script>

<style>
/* Global resets or styles if needed */
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>
