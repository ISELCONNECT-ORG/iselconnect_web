<template>
  <div class="dashboard-root">
    <Sidebar />
    <div class="main-wrapper">
      <Topbar />

      <!-- HERO HEADER: dark blue, white text -->
      <header class="hero-banner">
        <h1>Good Morning, Admin</h1>
        <p>The grid system is currently operating at {{ gridEfficiency }}% efficiency.</p>
      </header>

      <div class="stats-grid">
        <div v-for="stat in stats" :key="stat.title" class="stat-card">
          <div class="card-header">
            <component :is="stat.icon" class="stat-icon" />
            <span class="trend-badge">{{ stat.trend }}</span>
          </div>
          <h3>{{ stat.title }}</h3>
          <p class="stat-value">{{ stat.value }}</p>
        </div>
      </div>

      <div class="content-grid">
        <section class="chart-container">
          <div class="chart-header">
            <h3>System Load & Consumption</h3>
            <div class="timeframe-tabs">
              <button
                v-for="t in ['Day', 'Week', 'Month', 'Year']"
                :key="t"
                :class="{ active: currentPeriod === t }"
                @click="currentPeriod = t"
              >
                {{ t }}
              </button>
            </div>
          </div>
          <IncidentChart :period="currentPeriod" />
        </section>

        <aside class="efficiency-card">
          <h3>Grid Efficiency</h3>
          <p class="efficiency-value">{{ gridEfficiency }}%</p>
          <div class="progress-bar">
            <div class="fill" :style="{ width: gridEfficiency + '%' }"></div>
          </div>
          <p class="efficiency-label">Current average performance across all sectors.</p>
        </aside>
      </div>

      <div class="full-width-analytics" style="margin-top: 8px">
        <TopBarangaysChart />
      </div>

      <!-- INCIDENT WAIT LIST TABLE SECTION -->
      <section class="table-container">
        <h2>Incident Wait List</h2>
        <p class="subtitle">
          Review new incoming reports before pushing them to the active queue or archive.
        </p>

        <div v-if="incidentReports.length === 0" class="empty-state">
          <p>No new incident reports waiting for review.</p>
        </div>

        <table v-else class="data-table">
          <thead>
            <tr>
              <th>Report Details</th>
              <th>Location</th>
              <th>Description</th>
              <th>Date Reported</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="report in incidentReports" :key="report.id">
              <td class="bold-text">
                {{ report.report_types?.name ?? 'General Incident' }}
                <div
                  class="muted-text"
                  style="font-weight: normal; font-size: 0.75rem"
                  v-if="report.users"
                >
                  Reporter: {{ report.users.first_name }} {{ report.users.last_name }}
                </div>
              </td>
              <td>
                {{ report.landmark || 'N/A' }}
                <div class="muted-text" style="font-size: 0.75rem">
                  Barangay: {{ report.barangays?.name ?? 'Unknown Barangay' }}
                </div>
              </td>
              <td class="muted-text">{{ report.description || 'EMPTY' }}</td>
              <td class="muted-text">{{ formatDateTime(report.created_at) }}</td>
              <td>
                <div class="table-action-buttons">
                  <button class="btn-accept" @click="acceptReport(report)">Accept</button>
                  <button class="btn-reject" @click="rejectReport(report)">Reject</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { FileText, Zap, CheckCircle, AlertTriangle } from 'lucide-vue-next'
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'
import IncidentChart from '@/components/analytics/IncidentChart.vue'
import TopBarangaysChart from '@/components/analytics/TopBarangaysChart.vue'
import { supabase } from '@/services/supabase'
import { sendNotification } from '@/utils/notifications.js'

import '@/assets/style/dashboard.css'

const router = useRouter()
const incidentReports = ref([])
const currentPeriod = ref('Day')

const stats = ref([
  { title: 'Total Reports', value: '0', icon: FileText, trend: 'Reports' },
  { title: 'Active Linemen', value: '0', icon: Zap, trend: 'On Duty' },
  { title: 'Resolved', value: '0', icon: CheckCircle, trend: 'Resolved' },
  { title: 'Pending', value: '0', icon: AlertTriangle, trend: 'Attention' },
])

const gridEfficiency = computed(() => {
  const total = parseInt(stats.value[0].value) || 0
  const resolved = parseInt(stats.value[2].value) || 0
  return total > 0 ? ((resolved / total) * 100).toFixed(1) : 0
})

const loadIncidentReports = async () => {
  const { data, error } = await supabase
    .from('reports')
    .select(
      `
      id,
      landmark,
      description,
      created_at,
      status_id,
      report_types(name),
      barangays(name),
      users:residents_id(first_name, last_name)
    `,
    )
    .neq('landmark', 'Walk-in Report')
    .eq('status_id', 1) // 1 = Pending
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching new reports:', error.message)
  } else {
    incidentReports.value = data || []
    stats.value[3].value = incidentReports.value.length.toString()
  }
}

const fetchLinemenStats = async () => {
  const { count } = await supabase
    .from('employees')
    .select('*, users!inner(role_id)', { count: 'exact', head: true })
    .eq('users.role_id', 9)
    .eq('is_available', true)

  stats.value[1].value = (count || 0).toString()

  const { count: totalCount } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
  const { count: resolvedCount } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('status_id', 3)

  stats.value[0].value = (totalCount || 0).toString()
  stats.value[2].value = (resolvedCount || 0).toString()
}

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString()
}

const acceptReport = async (report) => {
  const bName = report.barangays?.name ?? 'Unknown Barangay'
  const iType = report.report_types?.name ?? 'General Incident'

  const { error } = await supabase.from('reports').update({ status_id: 2 }).eq('id', report.id)

  if (error) {
    alert('Error accepting report: ' + error.message)
    return
  }

  await supabase.from('system_logs').insert([
    {
      action_type: 'CONFIRM_REPORT',
      action_details: `Accepted report #${report.id} (${iType}) for Barangay ${bName}`,
      created_at: new Date().toISOString(),
    },
  ])

  await sendNotification(
    'Report Confirmed',
    `Your report for ${iType} at Barangay ${bName} has been accepted and queued.`,
  )

  loadIncidentReports()
  fetchLinemenStats()
}

const rejectReport = async (report) => {
  const bName = report.barangays?.name ?? 'Unknown Barangay'
  const iType = report.report_types?.name ?? 'General Incident'

  const { error } = await supabase.from('reports').update({ status_id: 5 }).eq('id', report.id)

  if (error) {
    alert('Error rejecting report: ' + error.message)
    return
  }

  await supabase.from('system_logs').insert([
    {
      action_type: 'REJECT_REPORT',
      action_details: `Rejected report #${report.id} (${iType}) for Barangay ${bName}`,
      created_at: new Date().toISOString(),
    },
  ])

  await sendNotification(
    'Report Rejected',
    `Your report for ${iType} at Barangay ${bName} has been rejected and archived.`,
  )

  loadIncidentReports()
  fetchLinemenStats()
}

onMounted(() => {
  loadIncidentReports()
  fetchLinemenStats()
})
</script>

<style scoped>
.dashboard-root {
  min-height: 100vh;
  display: flex;
  background: #f8fafc;
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Hero banner */
.hero-banner {
  margin-bottom: 16px;
  padding: 16px 18px;
  border-radius: 16px;
  background: #1f3056;
  color: #e5e7eb;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.4);
}

.hero-banner h1 {
  margin: 0 0 6px;
  font-size: 1.5rem;
}

.hero-banner p {
  margin: 0;
  font-size: 0.95rem;
}

/* Stats cards */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  padding: 12px 14px;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 6px 18px rgba(148, 163, 184, 0.25);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.stat-icon {
  width: 20px;
  height: 20px;
  color: #0f172a;
}

.trend-badge {
  font-size: 0.7rem;
  padding: 4px 8px;
  border-radius: 999px;
  background: #e0f2fe;
  color: #1d4ed8;
  font-weight: 600;
}

.stat-card h3 {
  margin: 0 0 4px;
  font-size: 0.9rem;
  color: #0f172a;
}

.stat-value {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
}

/* Charts and efficiency */
.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 2.5fr) minmax(0, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.chart-container {
  padding: 12px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 6px 18px rgba(148, 163, 184, 0.25);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.chart-header h3 {
  margin: 0;
  font-size: 0.95rem;
  color: #0f172a;
}

.timeframe-tabs {
  display: flex;
  gap: 6px;
}

.timeframe-tabs button {
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.timeframe-tabs button.active {
  background: #2563eb;
  color: #ffffff;
  border-color: #2563eb;
}

/* Efficiency */
.efficiency-card {
  padding: 12px 14px;
  border-radius: 16px;
  color: #0f172a;
  background: #213663;
  box-shadow: 0 6px 18px rgba(148, 163, 184, 0.25);
}

.efficiency-card h3 {
  margin: 0 0 6px;
  font-size: 0.9rem;
}

.efficiency-value {
  margin: 0 0 6px;
  font-size: 1.3rem;
  font-weight: 700;
}

.progress-bar {
  height: 8px;
  border-radius: 999px;
  background: #e5e7eb;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-bar .fill {
  height: 100%;
  border-radius: 999px;
  background: #16a34a;
}

.efficiency-label {
  margin: 0;
  font-size: 0.8rem;
  color: #64748b;
}

/* Table Styles matching Source 1 */
.table-container {
  margin-top: 18px;
  padding: 12px 14px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 6px 18px rgba(148, 163, 184, 0.25);
}

.table-container h2 {
  margin: 0 0 4px;
  font-size: 1rem;
}

.subtitle {
  color: #64748b;
  font-size: 0.85rem;
  margin-bottom: 10px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.data-table th,
.data-table td {
  padding: 8px 6px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.data-table th {
  font-weight: 700;
  color: #64748b;
}

.bold-text {
  font-weight: 600;
  color: #0f172a;
}

.muted-text {
  color: #64748b;
}

/* Table Action Buttons */
.table-action-buttons {
  display: flex;
  gap: 6px;
}

.btn-accept {
  padding: 5px 10px;
  border-radius: 999px;
  border: none;
  background: #10b981;
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-accept:hover {
  background: #059669;
}

.btn-reject {
  padding: 5px 10px;
  border-radius: 999px;
  border: none;
  background: #ef4444;
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-reject:hover {
  background: #dc2626;
}

.empty-state {
  text-align: center;
  color: #64748b;
  padding: 24px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  font-size: 0.85rem;
}
</style>
