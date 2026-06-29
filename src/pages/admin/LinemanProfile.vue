<template>
  <div class="dashboard-root">
    <Sidebar />
    <main class="content">
      <router-link to="/admin/linemen" class="back-link">← Back to Directory</router-link>

      <div v-if="lineman" class="profile-container">
        <header class="profile-header">
          <h1>{{ lineman.users.first_name }} {{ lineman.users.last_name }}</h1>
          <p>Employee ID: {{ lineman.employee_id_no }}</p>
          <span class="status-badge" :class="lineman.is_available ? 'active' : 'deployed'">
            {{ lineman.is_available ? 'Available' : 'Deployed' }}
          </span>
        </header>

        <div class="stats-grid">
          <div class="stat-card">
            <h3>{{ stats.totalResolved }}</h3>
            <p>RESOLVED JOBS</p>
          </div>
          <div class="stat-card">
            <h3>{{ stats.totalAssigned }}</h3>
            <p>TOTAL ASSIGNMENTS</p>
          </div>
        </div>

        <section class="activity-section">
          <h3>Recent Activity</h3>
          <div class="activity-list">
            <div v-for="item in assignments" :key="item.id" class="activity-item">
              <div class="activity-info">
                <span class="desc">{{
                  item.reports?.description || 'No description provided'
                }}</span>
                <span class="date">{{ new Date(item.assigned_at).toLocaleDateString() }}</span>
              </div>
              <span class="pill" :class="getStatusClass(item.reports?.status_id)">
                {{ item.reports?.report_statuses?.name }}
              </span>
            </div>
            <div v-if="assignments.length === 0" class="empty-state">
              No recent activity found for this lineman.
            </div>
          </div>
        </section>
      </div>

      <div v-else class="loading">Loading profile...</div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/services/supabase'
import Sidebar from '@/components/Sidebar.vue'

const route = useRoute()
const lineman = ref(null)
const assignments = ref([])
const stats = ref({ totalResolved: 0, totalAssigned: 0 })

// Helper to determine badge color based on your status logic
const getStatusClass = (statusId) => {
  return (
    {
      1: 'badge-pending',
      2: 'badge-progress',
      3: 'badge-resolved',
    }[statusId] || 'badge-default'
  )
}

const fetchProfile = async () => {
  const linemanId = route.params.id

  // 1. Fetch Lineman Basic Info
  const { data: emp, error } = await supabase
    .from('employees')
    .select('user_id, employee_id_no, is_available, users(first_name, last_name)')
    .eq('id', linemanId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return
  }

  lineman.value = emp

  // 2. Fetch Assignments and associated Report statuses
  const { data: history } = await supabase
    .from('assignments')
    .select(`assigned_at, reports(description, status_id, report_statuses(name))`)
    .eq('lineman_id', emp.user_id)
    .order('assigned_at', { ascending: false })

  assignments.value = history || []
  stats.value.totalAssigned = assignments.value.length
  stats.value.totalResolved = assignments.value.filter((a) => a.reports?.status_id === 3).length
}

onMounted(fetchProfile)
</script>

<style scoped>
.dashboard-root {
  display: flex;
  font-family: sans-serif;
  background: #ffffff;
  min-height: 100vh;
  color: #000;
}
.content {
  flex-grow: 1;
  padding: 40px;
}
.back-link {
  display: inline-block;
  margin-bottom: 20px;
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
}
.profile-header {
  margin-bottom: 30px;
}
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.85rem;
  margin-top: 10px;
}
.active {
  background: #dcfce7;
  color: #166534;
}
.deployed {
  background: #ffedd5;
  color: #9a3412;
}
.stats-grid {
  display: flex;
  gap: 20px;
  margin-bottom: 40px;
}
.stat-card {
  background: #f9f9f9;
  padding: 25px;
  border-radius: 12px;
  flex: 1;
  border: 1px solid #ddd;
  text-align: center;
}
.activity-item {
  border-bottom: 1px solid #eee;
  padding: 15px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.activity-info {
  display: flex;
  flex-direction: column;
}
.date {
  font-size: 0.8rem;
  color: #666;
  margin-top: 4px;
}

/* Status Pill Styling */
.pill {
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 0.75rem;
  font-weight: 600;
}
.badge-pending {
  background: #fef3c7;
  color: #92400e;
}
.badge-progress {
  background: #dbeafe;
  color: #1e40af;
}
.badge-resolved {
  background: #dcfce7;
  color: #166534;
}
</style>
