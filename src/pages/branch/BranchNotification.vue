<template>
  <div class="dashboard-root">
    <BranchSidebar />
    <main class="content">
      <h1>Branch Notifications</h1>

      <div v-for="(group, label) in groupedNotifications" :key="label" class="notification-section">
        <h3 class="group-label">{{ label }}</h3>

        <div v-if="group.length === 0" class="empty-state">
          <p>No notifications for this period.</p>
        </div>

        <div v-else class="notification-list">
          <div
            v-for="note in group"
            :key="note.id"
            class="notification-item"
            :class="{ unread: !note.is_read }"
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
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import BranchSidebar from '@/components/BranchSidebar.vue'

const notifications = ref([])

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

onMounted(fetchNotifications)
</script>

<style scoped>
.dashboard-root {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
}
.content {
  flex-grow: 1;
  padding: 40px;
  max-width: 800px;
}
.group-label {
  font-size: 0.9rem;
  color: #64748b;
  margin: 30px 0 15px 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.notification-item {
  display: flex;
  gap: 15px;
  padding: 15px;
  border-bottom: 1px solid #f1f5f9;
  background: #ffffff;
  margin-bottom: 10px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}
.unread {
  background: #f0f7ff;
  border-left: 4px solid #3b82f6;
}
.icon-circle {
  width: 40px;
  height: 40px;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}
.note-content h4 {
  margin: 0;
  color: #1e293b;
}
.note-content p {
  margin: 5px 0;
  color: #64748b;
  font-size: 0.9rem;
}
</style>
