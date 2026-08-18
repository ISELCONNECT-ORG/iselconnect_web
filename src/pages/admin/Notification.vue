<!-- src/pages/admin/Notification.vue -->
<template>
  <div class="admin-layout">
    <main class="content">
      <header class="header-bar">
        <h1>ADMIN NOTIFICATIONS</h1>
        <!-- Active Filter Pills -->
        <div class="filter-pills">
          <button
            v-for="tab in filterTabs"
            :key="tab"
            class="pill"
            :class="{ active: selectedFilter === tab }"
            @click="selectedFilter = tab"
          >
            {{ tab }}
          </button>
        </div>
      </header>

      <section class="notification-container">
        <div v-if="filteredGroupedNotifications.length === 0" class="empty-state">
          <p>No notifications found for "{{ selectedFilter }}".</p>
        </div>

        <div
          v-for="group in filteredGroupedNotifications"
          :key="group.label"
          class="notification-section"
        >
          <h3 class="group-label">{{ group.label }}</h3>

          <div class="notification-cards-list">
            <div v-for="note in group.items" :key="note.id" class="notification-card">
              <!-- Left Icon Badge -->
              <div class="card-icon-wrapper" :class="`icon-${getSeverity(note)}`">
                <span class="icon-symbol">{{ getIconSymbol(getType(note)) }}</span>
              </div>

              <!-- Main Card Content -->
              <div class="card-body">
                <div class="card-top-row">
                  <span :class="['type-badge', `badge-${getSeverity(note)}`]">
                    {{ getType(note) }}
                  </span>
                  <div class="timestamp-action">
                    <span class="time-stamp">⏱ {{ formatTimeAgo(note.created_at) }}</span>
                    <button class="close-btn" @click="deleteNotification(note.id)" title="Dismiss">
                      ✕
                    </button>
                  </div>
                </div>

                <h4 class="card-title">{{ note.title }}</h4>
                <p class="card-desc">{{ note.message }}</p>

                <!-- Action Buttons Footer -->
                <div class="card-footer">
                  <button
                    v-if="getType(note) === 'INCIDENT'"
                    class="action-btn btn-decline"
                    @click="handleDecline(note.id)"
                  >
                    Decline
                  </button>
                  <button
                    v-if="getType(note) === 'INCIDENT'"
                    class="action-btn btn-acknowledge"
                    @click="handleAcknowledge(note.id)"
                  >
                    Acknowledge
                  </button>
                  <a
                    v-else-if="getActionText(note)"
                    href="#"
                    :class="['action-link', `text-${getSeverity(note)}`]"
                  >
                    {{ getActionText(note) }} →
                  </a>
                </div>
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

const notifications = ref([])
const selectedFilter = ref('All')
const filterTabs = ['All', 'Incident', 'Advisory', 'Assignment', 'Resolved', 'System']

// Time ago formatter
const formatTimeAgo = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now - date) / 1000)

  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const fetchNotifications = async () => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching admin notifications:', error.message)
  } else {
    notifications.value = data || []
  }
}

const deleteNotification = async (id) => {
  const { error } = await supabase.from('notifications').delete().eq('id', id)
  if (!error) {
    notifications.value = notifications.value.filter((n) => n.id !== id)
  }
}

const handleAcknowledge = (id) => {
  deleteNotification(id)
}

const handleDecline = (id) => {
  deleteNotification(id)
}

const getType = (note) => {
  const t = (note.title || '').toLowerCase()
  if (t.includes('resolved') || t.includes('completed')) return 'RESOLVED'
  if (t.includes('system') || t.includes('deployed')) return 'SYSTEM'
  if (t.includes('assign') || t.includes('dispatch') || t.includes('lineman')) return 'ASSIGNMENT'
  if (t.includes('advisory') || t.includes('scheduled')) return 'ADVISORY'
  return 'INCIDENT'
}

const getSeverity = (note) => {
  const type = getType(note)
  if (type === 'INCIDENT') return 'critical'
  if (type === 'ADVISORY') return 'high'
  if (type === 'ASSIGNMENT') return 'normal'
  return 'low'
}

const getIconSymbol = (type) => {
  switch (type) {
    case 'INCIDENT':
      return '⚠️'
    case 'ASSIGNMENT':
      return '🚗'
    case 'ADVISORY':
      return '⚡'
    case 'RESOLVED':
      return '✓'
    default:
      return 'i'
  }
}

const getActionText = (note) => {
  const type = getType(note)
  if (type === 'INCIDENT') return 'View Details'
  if (type === 'ADVISORY') return 'Review Advisory'
  if (type === 'RESOLVED') return 'View Report'
  if (type === 'SYSTEM') return 'Read Release Notes'
  return ''
}

const filteredGroupedNotifications = computed(() => {
  const now = new Date()
  const todayItems = []
  const yesterdayItems = []
  const olderItems = []

  const filtered = notifications.value.filter((note) => {
    if (selectedFilter.value === 'All') return true
    return getType(note).toLowerCase() === selectedFilter.value.toLowerCase()
  })

  filtered.forEach((note) => {
    const noteDate = new Date(note.created_at)
    const diffInDays = Math.floor((now - noteDate) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) todayItems.push(note)
    else if (diffInDays === 1) yesterdayItems.push(note)
    else olderItems.push(note)
  })

  const groups = []
  if (todayItems.length) groups.push({ label: 'TODAY', items: todayItems })
  if (yesterdayItems.length) groups.push({ label: 'YESTERDAY', items: yesterdayItems })
  if (olderItems.length) groups.push({ label: 'OLDER', items: olderItems })

  return groups
})

onMounted(fetchNotifications)
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
  color: #0f172a;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.content {
  flex-grow: 1;
  padding: 32px 40px 40px;
  max-width: 900px;
  margin: 0 auto;
}

.header-bar h1 {
  margin: 0 0 20px 0;
  font-size: 1.5rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: -0.02em;
}

.filter-pills {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.pill {
  padding: 6px 16px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.pill.active {
  background: #312e81;
  color: white;
  border-color: #312e81;
}

.group-label {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 24px 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 700;
}

.notification-cards-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.notification-card {
  background: #ffffff;
  border-radius: 14px;
  padding: 20px;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.04),
    0 1px 3px rgba(0, 0, 0, 0.02);
  border: 1px solid #f1f5f9;
  display: flex;
  gap: 16px;
  transition: all 0.2s ease;
}

.notification-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.card-icon-wrapper {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.1rem;
}

.icon-critical {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}
.icon-high {
  background: rgba(245, 158, 11, 0.12);
  color: #f59e0b;
}
.icon-normal {
  background: rgba(59, 130, 246, 0.12);
  color: #3b82f6;
}
.icon-low {
  background: rgba(16, 185, 129, 0.12);
  color: #10b981;
}

.card-body {
  flex-grow: 1;
}

.card-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.type-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.badge-critical {
  background: #ef4444;
  color: white;
}
.badge-high {
  background: #f59e0b;
  color: white;
}
.badge-normal {
  background: #3b82f6;
  color: white;
}
.badge-low {
  background: #10b981;
  color: white;
}

.timestamp-action {
  display: flex;
  align-items: center;
  gap: 12px;
}

.time-stamp {
  font-size: 0.78rem;
  color: #94a3b8;
}

.close-btn {
  background: transparent;
  border: none;
  color: #cbd5e1;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s;
}
.close-btn:hover {
  color: #ef4444;
}

.card-title {
  margin: 0 0 6px 0;
  font-size: 0.98rem;
  font-weight: 700;
  color: #0f172a;
}

.card-desc {
  margin: 0 0 14px 0;
  font-size: 0.86rem;
  color: #475569;
  line-height: 1.45;
}

.card-footer {
  display: flex;
  gap: 10px;
  align-items: center;
}

.action-btn {
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-decline {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #475569;
}
.btn-decline:hover {
  background: #f1f5f9;
}

.btn-acknowledge {
  background: #312e81;
  border: 1px solid #312e81;
  color: white;
}
.btn-acknowledge:hover {
  background: #272469;
}

.action-link {
  font-size: 0.8rem;
  font-weight: 600;
  text-decoration: none;
}
.text-critical {
  color: #ef4444;
}
.text-high {
  color: #f59e0b;
}
.text-normal {
  color: #3b82f6;
}
.text-low {
  color: #10b981;
}

.empty-state {
  padding: 40px;
  text-align: center;
  color: #94a3b8;
  background: #ffffff;
  border-radius: 12px;
  border: 1px dashed #cbd5e1;
}
</style>
