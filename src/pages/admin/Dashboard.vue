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

      <section class="table-container">
        <h2>Active Consumer Reports</h2>
        <table class="data-table">
          <thead>
            <tr>
              <th>Report Name</th>
              <th>Location</th>
              <th>Lineman</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="report in reports" :key="report.id">
              <td class="bold-text">{{ report.report_types?.name ?? 'General' }}</td>
              <td>{{ report.landmark }}</td>
              <td>{{ report.lineman_names }}</td>
              <td class="muted-text">{{ report.description }}</td>
              <td>
                <select
                  :value="report.status_id"
                  @change="(e) => handleStatusChange(report, e.target.value)"
                  :class="['status-select', getStatusClass(report.status_id)]"
                >
                  <option value="1">Pending</option>
                  <option value="2">In Progress</option>
                  <option value="3">Resolved</option>
                </select>
              </td>
              <td>
                <button @click="openReassignModal(report)" class="btn-action">Assign</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>

    <!-- SEMI-GLASS ASSIGN LINEMEN MODAL -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content">
        <h3>Assign Linemen</h3>
        <p class="modal-subtitle">
          Select one or more linemen to assign to this report. Changes will affect current
          responsibilities.
        </p>

        <div class="checkbox-list">
          <p v-if="availableLinemen.length === 0">
            No linemen are currently available for assignment.
          </p>
          <label v-for="l in availableLinemen" :key="l.user_id">
            <input type="checkbox" :value="l.user_id" v-model="newLinemanIds" />
            {{ l.name }}
          </label>
        </div>

        <div class="modal-actions">
          <button @click="showModal = false" class="btn-cancel">Cancel</button>
          <button @click="confirmReassign" class="btn-confirm">Confirm Assignment</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { FileText, Zap, CheckCircle, AlertTriangle } from 'lucide-vue-next'
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'
import IncidentChart from '@/components/analytics/IncidentChart.vue'
import TopBarangaysChart from '@/components/analytics/TopBarangaysChart.vue'
import { supabase } from '@/services/supabase'
import { sendNotification } from '@/utils/notifications.js'

import '@/assets/style/dashboard.css'

const reports = ref([])
const availableLinemen = ref([])
const showModal = ref(false)
const selectedReport = ref(null)
const newLinemanIds = ref([])
const currentPeriod = ref('Day')

const stats = ref([
  { title: 'Total Reports', value: '0', icon: FileText, trend: 'Reports' },
  { title: 'Active Linemen', value: '0', icon: Zap, trend: 'On Duty' },
  { title: 'Resolved', value: '0', icon: CheckCircle, trend: 'Resolved' },
  { title: 'Pending', value: '0', icon: AlertTriangle, trend: 'Attention' },
])

const getStatusClass = (id) =>
  ({ 1: 'badge-pending', 2: 'badge-progress', 3: 'badge-resolved' })[id] || 'badge-pending'

const gridEfficiency = computed(() => {
  const total = parseInt(stats.value[0].value) || 0
  const resolved = parseInt(stats.value[2].value) || 0
  return total > 0 ? ((resolved / total) * 100).toFixed(1) : 0
})

const fetchReports = async () => {
  // Fetch reports excluding incoming wait-list (status_id = 1) and rejected reports (status_id = 5)
  const { data, error } = await supabase
    .from('reports')
    .select(
      `id, landmark, description, status_id, report_types(name), assignments(lineman_id, users(first_name, last_name))`,
    )
    .gt('status_id', 1)
    .neq('status_id', 5)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching reports:', error)
    return
  }

  const supabaseReports = (data || []).map((r) => {
    const names =
      r.assignments?.length > 0
        ? r.assignments.map((a) => `${a.users.first_name} ${a.users.last_name}`)
        : []

    return {
      ...r,
      lineman_names: names.length > 0 ? [...new Set(names)].join(', ') : 'Unassigned',
    }
  })

  const localReports = (JSON.parse(localStorage.getItem('dashboardIncidents') || '[]') || []).map(
    (r) => ({
      ...r,
      id: r.id,
      landmark: r.landmark || r.location || 'N/A',
      description: r.description || r.title || 'No description provided.',
      status_id: r.status_id || 2,
      report_types: { name: r.report_types?.name || r.severity || 'General' },
      lineman_names: r.lineman_names || 'Unassigned',
    }),
  )

  reports.value = [...localReports, ...supabaseReports].filter(
    (report, index, all) => all.findIndex((item) => item.id === report.id) === index,
  )

  stats.value[0].value = reports.value.length.toString()
  stats.value[2].value = reports.value.filter((r) => r.status_id === 3).length.toString()
  stats.value[3].value = reports.value.filter((r) => r.status_id === 1).length.toString()
}

const fetchLinemen = async () => {
  const { data, error } = await supabase
    .from('employees')
    .select(
      `
      user_id,
      is_available,
      users!inner(first_name, last_name, role_id)
    `,
    )
    .eq('users.role_id', 9)
    .eq('is_available', true)

  if (error) {
    console.error('Error fetching linemen:', error)
    return
  }

  availableLinemen.value = (data || []).map((e) => ({
    user_id: e.user_id,
    name: `${e.users.first_name} ${e.users.last_name}`,
  }))

  const { count } = await supabase
    .from('employees')
    .select('*, users!inner(role_id)', { count: 'exact', head: true })
    .eq('users.role_id', 9)
    .eq('is_available', true)

  stats.value[1].value = (count || 0).toString()
}

const openReassignModal = (report) => {
  selectedReport.value = report
  newLinemanIds.value = report.assignments
    ? [...new Set(report.assignments.map((a) => a.lineman_id))]
    : []
  showModal.value = true
}

const confirmReassign = async () => {
  if (!selectedReport.value) return

  const confirmed = window.confirm(
    `Are you sure you want to reassign linemen for report ${selectedReport.value.id}? ` +
      `This will replace the current assignment with the selection shown.`,
  )
  if (!confirmed) {
    return
  }

  try {
    const { error: deleteError } = await supabase
      .from('assignments')
      .delete()
      .eq('report_id', selectedReport.value.id)

    if (deleteError) throw deleteError

    if (newLinemanIds.value.length > 0) {
      const uniqueIds = [...new Set(newLinemanIds.value)]
      const assignmentsToInsert = uniqueIds.map((id) => ({
        report_id: selectedReport.value.id,
        lineman_id: id,
      }))

      const { error: insertError } = await supabase.from('assignments').insert(assignmentsToInsert)
      if (insertError) throw insertError

      await Promise.all(
        uniqueIds.map((id) =>
          sendNotification(
            'Lineman Assignment Updated',
            `You have been assigned to report ${selectedReport.value.id}. Please review the updated details.`,
            id,
          ),
        ),
      )
    }

    showModal.value = false
    await fetchReports()
  } catch (error) {
    alert('Assignment failed. Please try again or contact system support.')
    console.error(error)
  }
}

const handleStatusChange = async (report, newStatusId) => {
  report.status_id = parseInt(newStatusId)
  await supabase.from('reports').update({ status_id: report.status_id }).eq('id', report.id)

  if (report.status_id === 3) {
    await sendNotification(
      'Report Resolved',
      `Report ${report.id} has been marked as resolved and is now closed in the system.`,
    )
  }

  await fetchReports()
}

onMounted(() => {
  fetchReports()
  fetchLinemen()
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

.content {
  padding: 16px 24px 24px;
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

/* Table */
.table-container {
  margin-top: 18px;
  padding: 12px 14px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 6px 18px rgba(148, 163, 184, 0.25);
}

.table-container h2 {
  margin: 0 0 10px;
  font-size: 1rem;
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

/* Status select as rounded pill */
.status-select {
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 0.8rem;
  font-weight: 600;
  color: #0f172a;
  background-color: #ffffff;
  outline: none;
  cursor: pointer;
  appearance: none;
}

/* Status colors */
.badge-pending {
  background-color: #fef3c7;
  color: #92400e;
  border-color: #fbbf24;
}

.badge-progress {
  background-color: #e0f2fe;
  color: #1d4ed8;
  border-color: #60a5fa;
}

.badge-resolved {
  background-color: #dcfce7;
  color: #166534;
  border-color: #22c55e;
}

/* Assign button */
.btn-action {
  padding: 6px 12px;
  border-radius: 999px;
  border: none;
  background: #083a6d;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-action:hover {
  background: #0b4a88;
}

/* Semi-glass Assign Linemen modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.219);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal-content {
  width: min(480px, 90vw);
  padding: 22px 24px;
  border-radius: 24px;
  background: rgba(178, 201, 233, 0.32);
  border: 1px solid rgba(36, 35, 35, 0.22);
  backdrop-filter: blur(14px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.24);
  color: #617096;
}

.modal-content h3 {
  margin: 0 0 8px;
  font-size: 1.1rem;
  font-weight: 700;
  color: #ffffff;
}

.modal-subtitle {
  margin: 0 0 12px;
  font-size: 0.85rem;
  color: #e5e7eb;
}

/* Inner semi-glass list */
.checkbox-list {
  max-height: 220px;
  overflow-y: auto;
  margin: 12px 0 18px;
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.25);
  color: #e5e7eb;
}

.checkbox-list p {
  margin: 0 0 8px;
}

.checkbox-list label {
  display: block;
  padding: 6px 0;
  cursor: pointer;
  font-size: 0.9rem;
}

.checkbox-list input[type='checkbox'] {
  margin-right: 0.5rem;
}

/* Modal actions */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cancel,
.btn-confirm {
  padding: 8px 16px;
  border-radius: 999px;
  border: none;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.2);
  color: #0f172a;
}

.btn-confirm {
  background: #083a6d;
  color: #ffffff;
}

.btn-confirm:hover {
  background: #0b4a88;
}
</style>
