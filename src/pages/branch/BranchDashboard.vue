<template>
  <div class="dashboard-root">
    <BranchSidebar />
    <div class="main-wrapper">
      <Topbar />

      <main class="content">
        <div class="hero-banner">
          <h1>Good Morning, {{ branchName }}</h1>
          <p>
            The {{ branchName }} grid is currently operating at {{ gridEfficiency }}% efficiency.
          </p>
        </div>

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
              <h3>{{ branchName }} Load & Consumption</h3>
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
            <IncidentChart :period="currentPeriod" :branch-id="branchId" />
          </section>

          <aside class="efficiency-card">
            <h3>Branch Efficiency</h3>
            <p class="efficiency-value">{{ gridEfficiency }}%</p>
            <div class="progress-bar">
              <div class="fill" :style="{ width: gridEfficiency + '%' }"></div>
            </div>
            <p class="efficiency-label">
              Current average performance across {{ branchName }} sectors.
            </p>
          </aside>
        </div>

        <div class="full-width-analytics" style="margin-top: 8px">
          <TopBarangaysChart :branch-id="branchId" />
        </div>

        <section class="table-container">
          <h2>{{ branchName }} Active Consumer Reports</h2>
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
                    :class="getStatusClass(report.status_id)"
                    class="status-select"
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
      </main>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content">
        <h3>Assign Linemen</h3>

        <div
          class="checkbox-list"
          style="max-height: 200px; overflow-y: auto; text-align: left; margin: 1rem 0"
        >
          <p v-if="availableLinemen.length === 0">No linemen available.</p>
          <label
            v-for="lineman in availableLinemen"
            :key="lineman.user_id"
            style="display: block; padding: 0.5rem 0; cursor: pointer"
          >
            <input
              type="checkbox"
              :value="lineman.user_id"
              v-model="newLinemanIds"
              style="margin-right: 0.5rem"
            />
            {{ lineman.name }}
          </label>
        </div>

        <div class="modal-actions">
          <button @click="showModal = false" class="btn-cancel">Cancel</button>
          <button @click="confirmReassign" class="btn-confirm">Confirm</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { FileText, Zap, CheckCircle, AlertTriangle } from 'lucide-vue-next'
import BranchSidebar from '@/components/BranchSidebar.vue'
import Topbar from '@/components/BranchTopbar.vue'
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
const branchName = ref('Loading...')
const branchId = ref(null)

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

const fetchCurrentBranch = async () => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Unable to load branch dashboard user:', userError)
    return
  }

  const { data: userData, error: branchError } = await supabase
    .from('users')
    .select('branch_id, iselco_branch(branch_name)')
    .eq('email', user.email)
    .single()

  if (branchError) {
    console.error('Error loading branch data:', branchError)
    return
  }

  branchId.value = userData?.branch_id ?? null
  branchName.value = userData?.iselco_branch?.branch_name || 'Branch'

  if (branchId.value) {
    await Promise.all([fetchReports(), fetchLinemen()])
  } else {
    reports.value = []
    availableLinemen.value = []
    stats.value[0].value = '0'
    stats.value[1].value = '0'
    stats.value[2].value = '0'
    stats.value[3].value = '0'
  }
}

const fetchReports = async () => {
  if (!branchId.value) return

  const { data, error } = await supabase
    .from('reports')
    .select(
      `id, landmark, description, status_id, branch_id, report_types(name), users(first_name, last_name), assignments(lineman_id, users(first_name, last_name))`,
    )
    .eq('branch_id', branchId.value)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching branch reports:', error)
    return
  }

  reports.value = (data || []).map((report) => {
    const names =
      report.assignments?.length > 0
        ? report.assignments.map(
            (assignment) => `${assignment.users.first_name} ${assignment.users.last_name}`,
          )
        : []

    return {
      ...report,
      lineman_names: names.length > 0 ? [...new Set(names)].join(', ') : 'Unassigned',
    }
  })

  stats.value[0].value = reports.value.length.toString()
  stats.value[2].value = reports.value.filter((report) => report.status_id === 3).length.toString()
  stats.value[3].value = reports.value.filter((report) => report.status_id === 1).length.toString()
}

const fetchLinemen = async () => {
  if (!branchId.value) return

  const { data, error } = await supabase
    .from('employees')
    .select(
      `
      id,
      user_id,
      is_available,
      users!inner(first_name, last_name, role_id, branch_id)
    `,
    )
    .eq('users.role_id', 9)
    .eq('users.branch_id', branchId.value)
    .eq('is_available', true)

  if (error) {
    console.error('Error fetching branch linemen:', error)
    return
  }

  availableLinemen.value = (data || []).map((employee) => ({
    user_id: employee.user_id,
    name: `${employee.users.first_name} ${employee.users.last_name}`,
  }))

  const { count } = await supabase
    .from('employees')
    .select('*, users!inner(role_id, branch_id)', { count: 'exact', head: true })
    .eq('users.role_id', 9)
    .eq('users.branch_id', branchId.value)
    .eq('is_available', true)

  stats.value[1].value = (count || 0).toString()
}

const openReassignModal = (report) => {
  selectedReport.value = report
  newLinemanIds.value = report.assignments
    ? [...new Set(report.assignments.map((assignment) => assignment.lineman_id))]
    : []
  showModal.value = true
}

const confirmReassign = async () => {
  if (!selectedReport.value) return

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

      const customerName = selectedReport.value.users?.first_name
        ? `${selectedReport.value.users.first_name} ${selectedReport.value.users.last_name}`
        : 'a customer'
      const reportLabel = selectedReport.value.report_types?.name || 'service report'

      await Promise.all(
        uniqueIds.map((id) =>
          sendNotification(
            'Lineman Assigned',
            `You have been assigned to ${reportLabel} for ${customerName}.`,
            id,
          ),
        ),
      )
    }

    showModal.value = false
    await fetchReports()
  } catch (error) {
    alert('Assignment failed: ' + error.message)
    console.error(error)
  }
}

const handleStatusChange = async (report, newStatusId) => {
  report.status_id = parseInt(newStatusId)
  await supabase.from('reports').update({ status_id: report.status_id }).eq('id', report.id)

  if (report.status_id === 3) {
    const customerName = report.users?.first_name
      ? `${report.users.first_name} ${report.users.last_name}`
      : 'The customer'
    await sendNotification(
      'Report Resolved',
      `${customerName}'s report has been marked as resolved.`,
    )
  }

  await fetchReports()
}

onMounted(() => {
  fetchCurrentBranch()
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
