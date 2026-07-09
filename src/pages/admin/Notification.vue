<template>
  <div class="dashboard-root">
    <Sidebar />

    <main class="content">
      <!-- Header bar -->
      <header class="header-bar">
        <h1>System Notifications</h1>
        <p class="subtitle">Central feed of reports, advisories, and system alerts.</p>
      </header>

      <!-- Glass container for all notifications -->
      <section class="glass-panel">
        <div
          v-for="(group, label) in groupedNotifications"
          :key="label"
          class="notification-section"
        >
          <h3 class="group-label">{{ label }}</h3>

          <div v-if="group.length === 0" class="empty-state">
            <p>No notifications for this period.</p>
          </div>

          <div v-else class="notification-list">
            <div
              v-for="note in group"
              :key="note.id"
              class="notification-item"
              :class="[{ unread: !note.is_read }, getCategoryClass(note)]"
            >
              <div class="icon-circle">!</div>
              <div class="note-content">
                <h4>{{ note.title }}</h4>
                <p>{{ note.message }}</p>
                <small>{{ formatDate(note.created_at) }}</small>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import Sidebar from '@/components/Sidebar.vue'

const notifications = ref([])

// Format date to Month Day, Year
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(dateString).toLocaleDateString(undefined, options)
}

const fetchNotifications = async () => {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, title, message, is_read, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching notifications:', error.message)
  } else {
    notifications.value = data || []
  }
}

const groupedNotifications = computed(() => {
  const now = new Date()
  const groups = { Today: [], 'This Week': [], 'This Month': [], Older: [] }

  notifications.value.forEach((note) => {
    const noteDate = new Date(note.created_at)
    const diffInDays = (now - noteDate) / (1000 * 60 * 60 * 24)

    if (diffInDays < 1) {
      groups['Today'].push(note)
    } else if (diffInDays < 7) {
      groups['This Week'].push(note)
    } else if (diffInDays < 30) {
      groups['This Month'].push(note)
    } else {
      groups['Older'].push(note)
    }
  })

  return Object.fromEntries(Object.entries(groups).filter(([_, v]) => v.length > 0))
})

// Simple category color based on title keywords
const getCategoryClass = (note) => {
  const title = (note.title || '').toLowerCase()

  if (title.includes('report') || title.includes('incident')) {
    return 'cat-report'
  }
  if (title.includes('advisory') || title.includes('power')) {
    return 'cat-advisory'
  }
  if (title.includes('warning') || title.includes('error')) {
    return 'cat-warning'
  }
  return 'cat-default'
}

onMounted(fetchNotifications)
</script>

<style scoped>
.dashboard-root {
  display: flex;
  min-height: 100vh;
  background: #ffffff; /* white background for whole page */
  color: #0f172a;
}

.content {
  flex-grow: 1;
  padding: 32px 40px 40px;
  max-width: 1100px;
}

/* Header bar */
.header-bar h1 {
  margin: 0;
  font-size: 1.6rem;
  color: #0f172a;
}

.header-bar .subtitle {
  margin: 4px 0 18px;
  font-size: 0.9rem;
  color: #64748b;
}

/* Light glass main panel */
.glass-panel {
  padding: 20px 22px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(148, 163, 184, 0.35);
  box-shadow: 0 14px 30px rgba(148, 163, 184, 0.35);
}

/* Group labels */
.group-label {
  font-size: 0.9rem;
  color: #64748b;
  margin: 24px 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* Notifications */
.notification-item {
  display: flex;
  gap: 15px;
  padding: 14px 16px;
  background: #ffffff;
  margin-bottom: 10px;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 10px rgba(148, 163, 184, 0.25);
}

/* Unread baseline highlight */
.unread {
  box-shadow: 0 0 0 1px #3b82f6;
}

/* Category colors (left border + icon background) */
.cat-report {
  border-left: 4px solid #22c55e;
}

.cat-advisory {
  border-left: 4px solid #3b82f6;
}

.cat-warning {
  border-left: 4px solid #f97316;
}

.cat-default {
  border-left: 4px solid #9ca3af;
}

.icon-circle {
  width: 40px;
  height: 40px;
  background: #e5e7eb;
  color: #111827;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

/* Icon color tweak by category */
.cat-report .icon-circle {
  background: #dcfce7;
  color: #166534;
}

.cat-advisory .icon-circle {
  background: #dbeafe;
  color: #1e40af;
}

.cat-warning .icon-circle {
  background: #ffedd5;
  color: #c2410c;
}

.cat-default .icon-circle {
  background: #e5e7eb;
  color: #111827;
}

.note-content h4 {
  margin: 0;
  color: #1e293b;
  font-size: 0.95rem;
}

.note-content p {
  margin: 5px 0;
  color: #64748b;
  font-size: 0.9rem;
}

.note-content small {
  color: #94a3b8;
  font-size: 0.8rem;
}

/* Empty state inside glass card */
.empty-state {
  padding: 16px;
  border-radius: 12px;
  border: 1px dashed #e2e8f0;
  background: #f9fafb;
  color: #64748b;
  font-size: 0.9rem;
}
</style>
