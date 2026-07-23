<template>
  <div class="dashboard-root">
    <Sidebar />

    <main class="content">
      <router-link to="/admin/linemen" class="back-link"> ← Back to Directory </router-link>

      <div v-if="lineman" class="profile-container">
        <!-- Glass header card -->
        <header class="profile-header glass-card">
          <div class="header-main">
            <div>
              <h1>{{ lineman.users.first_name }} {{ lineman.users.last_name }}</h1>
              <p class="emp-id">Employee ID: {{ lineman.employee_id_no }}</p>
              <p class="branch-info">
                <strong>Branch:</strong>
                {{ lineman.users.iselco_branch?.branch_name || 'Not assigned' }}
              </p>
            </div>
            <span class="status-badge" :class="lineman.is_available ? 'active' : 'deployed'">
              {{ lineman.is_available ? 'Available' : 'Deployed' }}
            </span>
          </div>
        </header>

        <!-- Glass stats cards -->
        <div class="stats-grid">
          <div class="stat-card glass-card">
            <h3>{{ stats.totalResolved }}</h3>
            <p>RESOLVED JOBS</p>
          </div>
          <div class="stat-card glass-card">
            <h3>{{ stats.totalAssigned }}</h3>
            <p>TOTAL ASSIGNMENTS</p>
          </div>
        </div>

        <!-- Glass activity section -->
        <section class="activity-section glass-card">
          <h3>Recent Activity</h3>
          <div class="activity-list">
            <div v-for="item in assignments" :key="item.id" class="activity-item">
              <div class="activity-info">
                <span class="desc">
                  {{ item.reports?.description || 'No description provided' }}
                </span>
                <span class="date">
                  {{ new Date(item.assigned_at).toLocaleDateString() }}
                </span>
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

  // 1. Fetch Lineman Info with Branch join
  const { data: emp, error } = await supabase
    .from('employees')
    .select(
      `
      user_id,
      employee_id_no,
      is_available,
      users(
        first_name,
        last_name,
        iselco_branch(branch_name)
      )
    `,
    )
    .eq('id', linemanId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return
  }

  lineman.value = emp

  // 2. Fetch Assignments
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
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Inter',
    sans-serif;
  background: #ffffff;
  min-height: 100vh;
  color: #000;
}

.content {
  flex-grow: 1;
  padding: 32px 40px 40px;
}

/* Back link */
.back-link {
  display: inline-block;
  margin-bottom: 20px;
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
}

/* Generic glass card used in header, stats, activity */
.glass-card {
  background: rgba(255, 255, 255, 0.85);
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  box-shadow: 0 8px 20px rgba(148, 163, 184, 0.35);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* Profile header */
.profile-header {
  padding: 18px 22px;
  margin-bottom: 24px;
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.profile-header h1 {
  margin: 0;
  font-size: 1.4rem;
  color: #111827;
}

.emp-id {
  margin: 4px 0;
  font-size: 0.9rem;
  color: #4b5563;
}

.branch-info {
  margin: 6px 0 0;
  color: #4b5563;
  font-size: 0.9rem;
}

/* Status badge */
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.8rem;
}

.active {
  background: #dcfce7;
  color: #166534;
}

.deployed {
  background: #ffedd5;
  color: #9a3412;
}

/* Stats grid */
.stats-grid {
  display: flex;
  gap: 18px;
  margin-bottom: 28px;
}

.stat-card {
  padding: 20px;
  flex: 1;
  text-align: center;
}

.stat-card h3 {
  margin: 0;
  font-size: 1.4rem;
  color: #0f172a;
}

.stat-card p {
  margin-top: 6px;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  color: #6b7280;
}

/* Activity section */
.activity-section {
  padding: 18px 22px;
}

.activity-section h3 {
  margin: 0 0 12px;
  font-size: 1rem;
  color: #111827;
}

/* Activity rows */
.activity-item {
  border-bottom: 1px solid #e5e7eb;
  padding: 12px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-info {
  display: flex;
  flex-direction: column;
  max-width: 70%;
}

.desc {
  font-size: 0.9rem;
  color: #374151;
}

.date {
  font-size: 0.8rem;
  color: #6b7280;
  margin-top: 4px;
}

/* Status pill */
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

.badge-default {
  background: #e5e7eb;
  color: #374151;
}

/* Empty state */
.empty-state {
  margin-top: 10px;
  font-size: 0.9rem;
  color: #6b7280;
}

/* Loading text */
.loading {
  margin-top: 40px;
  font-size: 0.95rem;
  color: #6b7280;
}
</style>
