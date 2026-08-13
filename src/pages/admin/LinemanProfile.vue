<!-- src/pages/admin/LinemanProfile.vue -->
<template>
  <div class="dashboard-root">
    <Sidebar />

    <main class="content">
      <header class="hero-banner detail-hero">
        <router-link to="/admin/linemen" class="back-link">
          &larr; BACK TO LINEMAN MONITORING
        </router-link>
        <div class="hero-overlay-content">
          <h1>LINEMAN PROFILE</h1>
          <p>Detailed view and management of field engineering personnel.</p>
        </div>
      </header>

      <div v-if="lineman" class="profile-content">
        <div class="section-container">
          <h3 class="section-title"><User :size="16" class="icon" /> Personal Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>FULL NAME</label>
              <p>{{ lineman.users.first_name }} {{ lineman.users.last_name }}</p>
            </div>
            <div class="info-item">
              <label>EMAIL ADDRESS</label>
              <p>{{ lineman.users.email || 'N/A' }}</p>
            </div>
            <div class="info-item">
              <label>CONTACT NUMBER</label>
              <p>{{ lineman.users.mobile_number || 'N/A' }}</p>
            </div>
            <div class="info-item">
              <label>ASSIGNED BRANCH</label>
              <p>{{ lineman.users.iselco_branch?.branch_name || 'North District HQ' }}</p>
            </div>
          </div>
        </div>

        <div class="section-container">
          <h3 class="section-title"><BarChart2 :size="16" class="icon" /> Performance Metrics</h3>
          <div class="metrics-row">
            <div class="metric-item">
              <label>TOTAL TASKS</label>
              <h2>{{ stats.totalAssigned }}</h2>
            </div>
            <div class="divider"></div>
            <div class="metric-item">
              <label>CURRENT STATUS</label>
              <h2 class="status-route">
                <Route :size="18" /> {{ lineman.is_available ? 'Ready' : 'On Route' }}
              </h2>
            </div>
            <div class="divider"></div>
            <div class="metric-item">
              <label>AVG RESOLUTION</label>
              <h2>1.4h</h2>
            </div>
          </div>
        </div>

        <div class="section-container">
          <h3 class="section-title"><History :size="16" class="icon" /> Recent Activity</h3>
          <div class="activity-list">
            <div class="activity-card" v-for="item in assignments" :key="item.id">
              <div class="act-left">
                <h4 class="act-title">
                  {{ item.reports?.report_statuses?.name || 'Assigned' }} Incident #{{
                    item.reports?.id || '---'
                  }}
                </h4>
                <p class="act-desc">{{ item.reports?.description || 'No description provided' }}</p>
              </div>
              <div class="act-right">
                <span class="act-date">{{ new Date(item.assigned_at).toLocaleString() }}</span>
              </div>
            </div>
            <div
              v-if="assignments.length === 0"
              style="padding: 16px; color: #64748b; font-size: 0.85rem"
            >
              No recent activity found.
            </div>
          </div>
        </div>
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
import { User, BarChart2, History, Route } from 'lucide-vue-next'

const route = useRoute()
const lineman = ref(null)
const assignments = ref([])
const stats = ref({ totalResolved: 0, totalAssigned: 0 })

const fetchProfile = async () => {
  const linemanId = route.params.id
  const { data: emp, error } = await supabase
    .from('employees')
    .select(
      `user_id, employee_id_no, is_available, users(first_name, last_name, email, mobile_number, iselco_branch(branch_name))`,
    )
    .eq('id', linemanId)
    .single()

  if (error) return
  lineman.value = emp

  const { data: history } = await supabase
    .from('assignments')
    .select(`assigned_at, reports(id, description, status_id, report_statuses(name))`)
    .eq('lineman_id', emp.user_id)
    .order('assigned_at', { ascending: false })

  assignments.value = history || []
  stats.value.totalAssigned = assignments.value.length
  stats.value.totalResolved = assignments.value.filter(
    (a) => a.reports?.status_id === 3 || a.reports?.status_id === 6,
  ).length
}

onMounted(fetchProfile)
</script>

<style scoped>
.dashboard-root {
  display: flex;
  background: #f8fafc;
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
  color: #0f172a;
}
.content {
  flex-grow: 1;
  padding: 16px 24px;
}

.hero-banner {
  position: relative;
  background: url('@/assets/Background/bannerdashboard.jpg') no-repeat center center;
  background-size: cover;
  padding: 20px 32px;
  border-radius: 8px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
.hero-banner::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(24, 24, 50, 0.9) 0%, rgba(30, 58, 138, 0.85) 100%);
  z-index: 1;
}
.hero-overlay-content {
  position: relative;
  z-index: 2;
  margin-top: 12px;
}
.hero-overlay-content h1 {
  margin: 0 0 4px 0;
  font-size: 1.6rem;
  color: white;
  font-weight: 700;
}
.hero-overlay-content p {
  margin: 0;
  font-size: 0.85rem;
  color: #cbd5e1;
}
.back-link {
  position: relative;
  z-index: 2;
  color: white;
  text-decoration: none;
  font-size: 0.75rem;
  font-weight: 700;
  opacity: 0.8;
}
.back-link:hover {
  opacity: 1;
}

.section-container {
  margin-bottom: 24px;
}
.section-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #1e1b4b;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.icon {
  color: #d97706;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.info-item label {
  display: block;
  font-size: 0.65rem;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 4px;
}
.info-item p {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #0f172a;
}

.metrics-row {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 24px;
}
.metric-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.metric-item label {
  font-size: 0.65rem;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 6px;
}
.metric-item h2 {
  font-size: 1.8rem;
  font-weight: 800;
  color: #1e1b4b;
  margin: 0;
}
.status-route {
  color: #d97706 !important;
  display: flex;
  align-items: center;
  gap: 6px;
}
.divider {
  width: 1px;
  height: 50px;
  background: #e2e8f0;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.activity-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.act-title {
  margin: 0 0 4px 0;
  font-size: 0.85rem;
  font-weight: 700;
  color: #1e1b4b;
}
.act-desc {
  margin: 0;
  font-size: 0.75rem;
  color: #64748b;
}
.act-date {
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 500;
}
.loading {
  padding: 40px;
  color: #64748b;
  font-size: 0.9rem;
}
</style>
