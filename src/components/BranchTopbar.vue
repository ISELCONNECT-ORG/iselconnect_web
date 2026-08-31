<!-- src/components/BranchTopbar.vue -->
<template>
  <header class="topbar-container" @click="closeDropdown">
    <div class="topbar-inner-box">
      <div class="topbar-left">
        <span class="brand-logo-icon">⚡</span>
        <span class="brand-title">ISELCONNECT • BRANCH</span>
      </div>

      <div class="topbar-right">
        <!-- Notification Bell Trigger -->
        <div class="notification-bell-wrapper" @click.stop="toggleNotifications">
          <button class="bell-btn" title="Notifications">
            🔔<span class="notification-dot"></span>
          </button>

          <!-- Notification Dropdown Panel (Branch Account Only) -->
          <div v-if="showNotifications" class="notification-dropdown-card" @click.stop>
            <div class="dropdown-header">
              <h3 class="dropdown-title">Branch Notifications</h3>
              <div class="filter-dropdown-wrapper">
                <select v-model="selectedFilter" class="filter-select">
                  <option value="All">Filter by All</option>
                  <option value="Incident">Incident</option>
                  <option value="Advisory">Advisory</option>
                  <option value="Assignment">Assignment</option>
                  <option value="Resolved">Resolved</option>
                  <option value="System">System</option>
                </select>
              </div>
            </div>

            <div class="dropdown-body">
              <div v-if="filteredGroupedNotifications.length === 0" class="empty-state">
                <p>No branch notifications found.</p>
              </div>

              <div
                v-for="group in filteredGroupedNotifications"
                :key="group.label"
                class="notification-group"
              >
                <span class="group-label">{{ group.label }}</span>
                <div class="items-list">
                  <div v-for="note in group.items" :key="note.id" class="notification-item">
                    <!-- Lucide Icon -->
                    <div class="item-icon-wrapper" :class="`icon-${getSeverity(note)}`">
                      <component :is="getLucideIcon(getType(note))" class="lucide-icon" />
                    </div>

                    <!-- Real Data Content -->
                    <div class="item-content">
                      <div class="item-top-row">
                        <span class="item-source-time">
                          {{ getTypeLabel(note) }} •
                          <span class="time-ago">{{ formatTimeAgo(note.created_at) }}</span>
                        </span>
                      </div>
                      <h4 class="item-title">{{ note.title }}</h4>
                      <p class="item-desc">{{ note.message }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Profile Pill Button -->
        <div class="profile-pill">
          <span class="profile-icon">👤</span>
          <span class="profile-name">Branch Profile</span>
          <span class="profile-chevron">▼</span>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'
import { AlertTriangle, Zap, CheckCircle2, Truck, Info } from 'lucide-vue-next'

const showNotifications = ref(false)
const notifications = ref([])
const selectedFilter = ref('All')

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) {
    fetchBranchNotifications()
  }
}

const closeDropdown = () => {
  showNotifications.value = false
}

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

const fetchBranchNotifications = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let query = supabase.from('notifications').select('*').order('created_at', { ascending: false })

  if (user && user.id) {
    query = query.or(`residents_id.eq.${user.id},residents_id.is.null`)
  }

  const { data, error } = await query

  if (!error) {
    notifications.value = data || []
  }
}

const getType = (note) => {
  const t = (note.title || '').toLowerCase()
  if (t.includes('resolved') || t.includes('completed')) return 'RESOLVED'
  if (t.includes('system') || t.includes('deployed')) return 'SYSTEM'
  if (t.includes('assign') || t.includes('dispatch') || t.includes('lineman')) return 'ASSIGNMENT'
  if (t.includes('advisory') || t.includes('scheduled')) return 'ADVISORY'
  return 'INCIDENT'
}

const getTypeLabel = (note) => {
  const type = getType(note)
  if (type === 'INCIDENT') return 'System Alert'
  if (type === 'ASSIGNMENT') return 'Dispatch Control'
  if (type === 'ADVISORY') return 'Grid Management'
  return 'System Update'
}

const getSeverity = (note) => {
  const type = getType(note)
  if (type === 'INCIDENT') return 'critical'
  if (type === 'ADVISORY') return 'high'
  if (type === 'ASSIGNMENT') return 'normal'
  return 'low'
}

const getLucideIcon = (type) => {
  switch (type) {
    case 'INCIDENT':
      return AlertTriangle
    case 'ASSIGNMENT':
      return Truck
    case 'ADVISORY':
      return Zap
    case 'RESOLVED':
      return CheckCircle2
    default:
      return Info
  }
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
    const diffInDays = Math.floor((now - new Date(note.created_at)) / (1000 * 60 * 60 * 24))
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
</script>

<style scoped>
.topbar-container {
  padding: 12px 0;
  background: transparent;
  position: relative;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.topbar-inner-box {
  background: #283593;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  width: 100%;
  box-sizing: border-box;
}
.topbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.brand-logo-icon {
  color: #ffffff;
  font-size: 1rem;
}
.topbar-left .brand-title {
  font-weight: 800;
  font-size: 1rem;
  color: #ffffff;
  letter-spacing: 0.05em;
}
.topbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.notification-bell-wrapper {
  position: relative;
  cursor: pointer;
}
.bell-btn {
  background: transparent;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  transition: background 0.2s;
  position: relative;
}
.bell-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}
.notification-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 6px;
  height: 6px;
  background: #ef4444;
  border-radius: 50%;
}
.profile-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 6px 14px;
  border-radius: 999px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}
.profile-icon {
  font-size: 0.85rem;
}
.profile-chevron {
  font-size: 0.65rem;
  opacity: 0.8;
}

/* Dropdown Styles */
.notification-dropdown-card {
  position: absolute;
  top: 55px;
  right: 20px;
  width: 400px;
  max-height: 560px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow:
    0 16px 40px rgba(0, 0, 0, 0.12),
    0 4px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  z-index: 10000;
  overflow: hidden;
  text-align: left;
}
.dropdown-header {
  padding: 18px 20px 14px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
}
.dropdown-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
}
.filter-select {
  padding: 5px 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  outline: none;
}
.dropdown-body {
  overflow-y: auto;
  padding: 12px 16px;
  flex-grow: 1;
}
.group-label {
  display: block;
  font-size: 0.7rem;
  font-weight: 700;
  color: #94a3b8;
  margin: 12px 0 8px 4px;
  letter-spacing: 0.05em;
}
.notification-item {
  display: flex;
  gap: 12px;
  padding: 14px 12px;
  border-radius: 12px;
  transition: background 0.15s ease;
  margin-bottom: 6px;
  border-bottom: 1px solid #f8fafc;
}
.notification-item:hover {
  background: #f8fafc;
}
.item-icon-wrapper {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.lucide-icon {
  width: 18px;
  height: 18px;
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
.item-content {
  flex-grow: 1;
}
.item-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.item-source-time {
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
}
.time-ago {
  color: #94a3b8;
  font-weight: 400;
}
.item-title {
  margin: 0 0 4px 0;
  font-size: 0.88rem;
  font-weight: 700;
  color: #1e293b;
  word-break: break-word;
  white-space: normal;
}
.item-desc {
  margin: 0;
  font-size: 0.8rem;
  color: #64748b;
  line-height: 1.4;
  word-break: break-word;
  white-space: normal;
}
.empty-state {
  padding: 30px;
  text-align: center;
  color: #94a3b8;
  font-size: 0.85rem;
}
</style>
