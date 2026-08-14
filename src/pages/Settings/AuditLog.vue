<template>
  <div class="dashboard-root">
    <Sidebar />

    <main class="content">
      <Topbar />

      <!-- Hero Banner matching the application's design system -->
      <header class="hero-banner">
        <div class="hero-overlay-content">
          <h1>SYSTEM AUDIT LOGS</h1>
          <p>Track, monitor, and review administrative actions and critical system events.</p>
        </div>
      </header>

      <div class="table-panel">
        <div class="panel-header">
          <div class="header-title">
            <Activity :size="20" class="icon" />
            <h3>Recent Activities</h3>
          </div>
          <button @click="fetchLogs" class="refresh-btn" :disabled="loading">
            <RefreshCw :size="14" :class="{ spin: loading }" /> Refresh
          </button>
        </div>

        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>ACTION TYPE</th>
                <th>DETAILS</th>
                <th>TIMESTAMP</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in logs" :key="log.id">
                <td class="font-bold action-cell">
                  <!-- Optional visual indicator based on action type (you can customize these) -->
                  <div class="status-indicator"></div>
                  {{ log.action_type }}
                </td>
                <td class="muted">{{ log.action_details }}</td>
                <td class="muted timestamp">
                  <Clock :size="14" class="clock-icon" />
                  {{ formatDate(log.created_at) }}
                </td>
              </tr>
              <tr v-if="logs.length === 0 && !loading">
                <td colspan="3" class="empty-state">No system logs found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import Sidebar from '@/components/Sidebar.vue'
import { Activity, RefreshCw, Clock } from 'lucide-vue-next'

const logs = ref([])
const loading = ref(false)

// Formatting helper for cleaner dates
const formatDate = (dateString) => {
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
  return new Date(dateString).toLocaleDateString(undefined, options)
}

const fetchLogs = async () => {
  loading.value = true
  const localLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]')

  try {
    const { data, error } = await supabase
      .from('system_logs')
      .select('id, action_type, action_details, created_at')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error fetching logs:', error.message)
      logs.value = localLogs || []
      return
    }

    const normalizedSupabaseLogs = (data || []).map((log) => ({
      id: log.id,
      action_type: log.action_type,
      action_details: log.action_details,
      created_at: log.created_at,
    }))

    logs.value = [...(localLogs || []), ...normalizedSupabaseLogs].filter(
      (log, index, all) => all.findIndex((item) => item.id === log.id) === index,
    )
  } catch (error) {
    console.error('Error fetching logs:', error)
    logs.value = localLogs || []
  } finally {
    loading.value = false
  }
}

onMounted(fetchLogs)
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
  display: flex;
  flex-direction: column;
}

/* Hero Banner */
.hero-banner {
  position: relative;
  background: url('@/assets/Background/bannerdashboard.jpg') no-repeat center center;
  background-size: cover;
  padding: 24px 32px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
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

/* Table Panel Wrapper */
.table-panel {
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  flex-grow: 1;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title .icon {
  color: #283593;
}

.header-title h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e1b4b;
}

.refresh-btn {
  background: white;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #f1f5f9;
  color: #1e1b4b;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Data Table Styles */
.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  text-align: left;
  font-weight: 700;
  font-size: 0.7rem;
  color: #64748b;
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background-color: #f8fafc;
}

.data-table td {
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.85rem;
  vertical-align: middle;
}

.font-bold {
  font-weight: 600;
  color: #0f172a;
}

.muted {
  color: #475569;
}

.action-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #283593; /* Default blue dot */
}

.timestamp {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #64748b;
}

.clock-icon {
  color: #94a3b8;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #94a3b8;
  font-style: italic;
}
</style>
