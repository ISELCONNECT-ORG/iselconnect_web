<template>
  <div class="dashboard-root">
    <BranchSidebar />
    <main class="content">
      <Topbar />

      <header class="hero-section">
        <div class="hero-header-content">
          <div class="hero-text">
            <h1>{{ branchName }} Service Interruption Queue</h1>
            <p>Manage and assign incoming damage reports for rapid grid restoration.</p>
          </div>
          <button @click="showManualModal = true" class="manual-dispatch-btn">
            + Manual Entry
          </button>
        </div>
      </header>

      <section class="metrics-container stats-grid">
        <div class="stat-card">
          <div class="card-header">
            <ActivitySquare class="stat-icon" />
            <span class="trend-badge">Online</span>
          </div>
          <h3>ONLINE LINEMAN</h3>
          <p class="stat-value">{{ onlineLinemenCount }}</p>
        </div>
        <div class="stat-card">
          <div class="card-header">
            <UserCheck class="stat-icon" />
            <span class="trend-badge">Assigned</span>
          </div>
          <h3>ASSIGNED</h3>
          <p class="stat-value">{{ assignedCount }}</p>
        </div>
        <div class="stat-card">
          <div class="card-header">
            <ClipboardList class="stat-icon" />
            <span class="trend-badge">Reports</span>
          </div>
          <h3>TOTAL REPORT</h3>
          <p class="stat-value">{{ totalReportsCount }}</p>
        </div>
        <div class="stat-card">
          <div class="card-header">
            <Wifi class="stat-icon" />
            <span class="trend-badge">Status</span>
          </div>
          <h3>SYSTEM STATUS</h3>
          <p class="stat-value">ACTIVE</p>
        </div>
      </section>

      <section class="queue-panel">
        <h3>Active Incidents</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>STATUS</th>
              <th>PRIORITY</th>
              <th>CUSTOMER</th>
              <th>DESCRIPTION</th>
              <th>MUNICIPALITY</th>
              <th>BARANGAY</th>
              <th>PUROK</th>
              <th>LINEMAN</th>
              <th>TIME</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="report in activeReports" :key="report.id">
              <td>
                <span class="status-pill">{{ report.report_statuses?.name }}</span>
              </td>
              <td>
                <span
                  :class="['priority-pill', getPriorityClass(report.report_types?.priority_level)]"
                >
                  {{ report.report_types?.priority_level || 'Normal' }}
                </span>
              </td>
              <td>
                <strong
                  >{{ report.users?.first_name }} {{ report.users?.last_name || 'Walk-in' }}</strong
                >
              </td>
              <td>{{ report.description }}</td>
              <td class="text-black">{{ report.municipalities?.name }}</td>
              <td class="text-black">{{ report.barangays?.name }}</td>
              <td class="text-black">{{ report.purok_sitio }}</td>
              <td class="text-black">{{ report.lineman_display }}</td>
              <td>{{ new Date(report.created_at).toLocaleTimeString() }}</td>
              <td>
                <button @click="openAssign(report)" class="action-btn">Assign</button>
                <router-link :to="`/branch/reports/${report.id}`" class="details-btn">
                  See Details
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="queue-panel" style="margin-top: 20px">
        <h3>Resolved Incidents</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>STATUS</th>
              <th>PRIORITY</th>
              <th>CUSTOMER</th>
              <th>DESCRIPTION</th>
              <th>MUNICIPALITY</th>
              <th>BARANGAY</th>
              <th>PUROK</th>
              <th>LINEMAN</th>
              <th>TIME</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="report in resolvedReports" :key="report.id">
              <td>
                <span class="status-pill">{{ report.report_statuses?.name }}</span>
              </td>
              <td>
                <span
                  :class="['priority-pill', getPriorityClass(report.report_types?.priority_level)]"
                >
                  {{ report.report_types?.priority_level || 'Normal' }}
                </span>
              </td>
              <td>
                <strong
                  >{{ report.users?.first_name }} {{ report.users?.last_name || 'Walk-in' }}</strong
                >
              </td>
              <td>{{ report.description }}</td>
              <td class="text-black">{{ report.municipalities?.name }}</td>
              <td class="text-black">{{ report.barangays?.name }}</td>
              <td class="text-black">{{ report.purok_sitio }}</td>
              <td class="text-black">{{ report.lineman_display }}</td>
              <td>{{ new Date(report.created_at).toLocaleTimeString() }}</td>
              <td>
                <button class="action-btn" disabled>Done</button>
                <router-link :to="`/branch/reports/${report.id}`" class="details-btn">
                  See Details
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>

    <div v-if="showManualModal" class="modal-overlay">
      <div class="modal-content glass-card">
        <h3>New Customer Report</h3>
        <select v-model="manualReport.barangay_id" class="input-field">
          <option :value="null" disabled>Select Barangay</option>
          <option v-for="barangay in barangays" :key="barangay.id" :value="barangay.id">
            {{ barangay.name }}
          </option>
        </select>
        <input v-model="manualReport.purok" placeholder="Purok/Sitio" class="input-field" />
        <select v-model="manualReport.type_id" class="input-field">
          <option :value="null" disabled>Select Issue Type</option>
          <option v-for="type in reportTypes" :key="type.id" :value="type.id">
            {{ type.name }}
          </option>
        </select>
        <textarea
          v-model="manualReport.description"
          placeholder="Description of incident"
          class="input-field"
        ></textarea>

        <div class="modal-actions">
          <button @click="submitManualReport" class="assign-btn">SUBMIT REPORT</button>
          <button @click="showManualModal = false" class="cancel-btn">CANCEL</button>
        </div>
      </div>
    </div>

    <div v-if="showAssignModal" class="modal-overlay">
      <div class="modal-content glass-card">
        <h3 style="margin-bottom: 10px">Dispatch Lineman</h3>
        <div class="lineman-checkbox-list">
          <label v-for="lineman in availableLinemen" :key="lineman.user_id" class="checkbox-label">
            <input type="checkbox" :value="lineman.user_id" v-model="selectedLinemanIds" />
            {{ lineman.name }}
          </label>
        </div>
        <div class="modal-actions" style="margin-top: 20px">
          <button @click="submitAssignment" class="assign-btn">DISPATCH</button>
          <button @click="showAssignModal = false" class="cancel-btn">CANCEL</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import { sendNotification } from '@/utils/notifications.js'
import BranchSidebar from '@/components/BranchSidebar.vue'
import Topbar from '@/components/BranchTopbar.vue'
import '@/assets/style/IncidentQueue.css'
import { ActivitySquare, UserCheck, ClipboardList, Wifi } from 'lucide-vue-next'

const pendingReports = ref([])
const reportTypes = ref([])
const barangays = ref([])
const showManualModal = ref(false)
const manualReport = ref({ type_id: null, barangay_id: null, purok: '', description: '' })

const showAssignModal = ref(false)
const selectedReport = ref(null)
const selectedLinemanIds = ref([])
const availableLinemen = ref([])

const assignedCount = ref(0)
const totalReportsCount = ref(0)
const onlineLinemenCount = ref(0)
const branchName = ref('Branch')
const branchId = ref(null)

// Sorted Active Incidents: First by Priority Level, then by Timestamp (Newest first)
const activeReports = computed(() => {
  const priorityRank = { Critical: 1, High: 2, Normal: 3, Low: 4 }

  return pendingReports.value
    .filter((report) => report.report_statuses?.name !== 'Resolved')
    .sort((a, b) => {
      const pA = priorityRank[a.report_types?.priority_level] || 3
      const pB = priorityRank[b.report_types?.priority_level] || 3

      if (pA !== pB) {
        return pA - pB // Critical -> High -> Normal -> Low
      }

      return new Date(b.created_at) - new Date(a.created_at)
    })
})

const resolvedReports = computed(() =>
  pendingReports.value.filter((report) => report.report_statuses?.name === 'Resolved'),
)

const getPriorityClass = (level) => {
  switch (level) {
    case 'Critical':
      return 'priority-critical'
    case 'High':
      return 'priority-high'
    case 'Low':
      return 'priority-low'
    default:
      return 'priority-normal'
  }
}

const getCurrentBranch = async () => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) return

  const { data: userData, error: branchError } = await supabase
    .from('users')
    .select('branch_id, iselco_branch(branch_name)')
    .eq('id', user.id)
    .single()

  if (branchError) {
    console.error('Error loading branch data:', branchError)
    return
  }

  branchId.value = userData?.branch_id ?? null
  branchName.value = userData?.iselco_branch?.branch_name || 'Branch'

  if (branchId.value) {
    await fetchAll()
  }
}

const fetchAll = async () => {
  if (!branchId.value) return

  // Fetch only reports belonging to this branch that have been accepted by admin (status_id > 1 and status_id != 5)
  const { data, error } = await supabase
    .from('reports')
    .select(
      `
      *, report_statuses(name), report_types(name, priority_level), users(first_name, last_name),
      barangays(name), municipalities(name), assignments(lineman_id, users(first_name, last_name))
    `,
    )
    .eq('branch_id', branchId.value)
    .gt('status_id', 1)
    .neq('status_id', 5)

  if (error) {
    console.error('Error loading branch reports:', error)
    return
  }

  pendingReports.value = (data || []).map((report) => {
    const linemanNames = report.assignments
      ?.map((assignment) => {
        const first = assignment.users?.first_name?.trim() || ''
        const last = assignment.users?.last_name?.trim() || ''
        return [first, last].filter(Boolean).join(' ')
      })
      .filter(Boolean)

    return {
      ...report,
      lineman_display:
        linemanNames.length > 0 ? [...new Set(linemanNames)].join(', ') : 'Unassigned',
    }
  })

  totalReportsCount.value = pendingReports.value.length

  const { data: types } = await supabase.from('report_types').select('*')
  reportTypes.value = types || []

  const { data: barangayData } = await supabase.from('barangays').select('*')
  barangays.value = barangayData || []

  const { count: assigned } = await supabase
    .from('assignments')
    .select('*', { count: 'exact', head: true })
    .in(
      'report_id',
      pendingReports.value.map((report) => report.id),
    )
  assignedCount.value = assigned || 0

  const { count: onlineCount } = await supabase
    .from('employees')
    .select('user_id, users!inner(*)', { count: 'exact', head: true })
    .eq('designation', 'Lineman')
    .eq('is_available', true)
    .eq('users.branch_id', branchId.value)
  onlineLinemenCount.value = onlineCount || 0
}

const submitManualReport = async () => {
  if (!branchId.value) return

  const { error } = await supabase.from('reports').insert([
    {
      description: manualReport.value.description || 'EMPTY',
      report_type_id: manualReport.value.type_id,
      landmark: 'Walk-in Report',
      barangay_id: manualReport.value.barangay_id,
      purok_sitio: manualReport.value.purok,
      latitude: 0.0,
      longitude: 0.0,
      status_id: 2,
      municipality_id: 1,
      branch_id: branchId.value,
    },
  ])

  if (error) {
    alert('Error: ' + error.message)
  } else {
    alert('Report Added!')
    await sendNotification(
      'New Report Received',
      `A new report has been added for barangay ${manualReport.value.barangay_id}.`,
    )
    showManualModal.value = false
    manualReport.value = { type_id: null, barangay_id: null, purok: '', description: '' }
    fetchAll()
  }
}

const openAssign = async (report) => {
  selectedReport.value = report
  selectedLinemanIds.value = report.assignments?.map((assignment) => assignment.lineman_id) || []

  const { data, error } = await supabase
    .from('users')
    .select('id, first_name, last_name')
    .eq('role_id', 9)
    .eq('branch_id', branchId.value)

  if (!error) {
    availableLinemen.value =
      data
        ?.map((user) => {
          const first = user.first_name?.trim() || ''
          const last = user.last_name?.trim() || ''
          const name = [first, last].filter(Boolean).join(' ')
          return name ? { user_id: user.id, name } : null
        })
        .filter(Boolean) || []
  }

  showAssignModal.value = true
}

const submitAssignment = async () => {
  if (!selectedReport.value) return

  await supabase.from('assignments').delete().eq('report_id', selectedReport.value.id)

  if (selectedLinemanIds.value.length > 0) {
    const assignmentsToInsert = selectedLinemanIds.value.map((userId) => ({
      report_id: selectedReport.value.id,
      lineman_id: userId,
      assigned_at: new Date().toISOString(),
      inprogress_at: new Date().toISOString(),
    }))
    const { error: assignError } = await supabase.from('assignments').insert(assignmentsToInsert)
    if (!assignError) {
      const customerName = selectedReport.value.users?.first_name
        ? `${selectedReport.value.users.first_name} ${selectedReport.value.users.last_name}`
        : 'the customer'
      const reportLabel = selectedReport.value.report_types?.name || 'service report'

      await Promise.all(
        selectedLinemanIds.value.map((userId) =>
          sendNotification(
            'Lineman Assigned',
            `You have been assigned to ${reportLabel} for ${customerName}.`,
            userId,
          ),
        ),
      )
    }
  }

  showAssignModal.value = false
  fetchAll()
}

onMounted(() => {
  getCurrentBranch()
})
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
  color: #0f172a;
}

.content {
  flex-grow: 1;
  padding: 24px 30px 40px;
}

.hero-section {
  margin-bottom: 24px;
  padding: 0;
  border-radius: 16px;
  overflow: hidden;
}

.hero-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 22px;
  border-radius: 16px;
  background: #1f3056;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
}

.hero-text h1 {
  margin: 0 0 6px;
  font-size: 1.5rem;
  color: #ffffff;
}

.hero-text p {
  margin: 0;
  font-size: 0.9rem;
  color: #e2e8f0;
}

.manual-dispatch-btn {
  background: #ffffff;
  color: #1f3056;
  padding: 8px 18px;
  border-radius: 999px;
  border: 1px solid #cbd5e1;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 3px 8px rgba(15, 23, 42, 0.12);
}

.metrics-container.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 24px;
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

.queue-panel {
  margin-top: 16px;
  padding: 16px 18px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
}

.queue-panel h3 {
  margin: 0 0 12px;
  font-size: 1rem;
  color: #0f172a;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.data-table th,
.data-table td {
  padding: 8px 6px;
  border-bottom: 1px solid #e2e8f0;
}

.data-table thead th {
  text-align: left;
  font-weight: 600;
  font-size: 0.8rem;
  color: #64748b;
}

.data-table tbody tr:hover {
  background: #f8fafc;
}

.status-pill {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  background: #eef2ff;
  color: #1d4ed8;
  font-size: 0.75rem;
}

/* Priority Badge styles */
.priority-pill {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
}
.priority-critical {
  background: #fee2e2;
  color: #991b1b;
}
.priority-high {
  background: #ffedd5;
  color: #9a3412;
}
.priority-normal {
  background: #e0f2fe;
  color: #0369a1;
}
.priority-low {
  background: #f1f5f9;
  color: #475569;
}

.action-btn {
  background: #1f3056;
  color: #ffffff;
  padding: 6px 12px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
}

.details-btn {
  display: inline-block;
  margin-left: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid #cbd5e1;
  font-size: 0.75rem;
  font-weight: 600;
  color: #1f3056;
  background: #ffffff;
  text-decoration: none;
  cursor: pointer;
}

.details-btn:hover {
  background: #f8fafc;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.glass-card {
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.45);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.35);
}

.modal-content {
  width: min(420px, 90vw);
  padding: 20px 22px;
  border-radius: 20px;
  color: #0f172a;
}

.modal-content h3 {
  margin: 0 0 10px;
  font-size: 1.1rem;
}

.input-field {
  width: 100%;
  margin-top: 8px;
  padding: 10px;
  border-radius: 999px;
  border: 1px solid #cbd5e1;
  font-size: 0.9rem;
  outline: none;
  background: rgba(255, 255, 255, 0.9);
}

textarea.input-field {
  border-radius: 12px;
  min-height: 80px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}

.assign-btn {
  background: #1f3056;
  color: #ffffff;
  padding: 8px 16px;
  border-radius: 999px;
  border: none;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(31, 48, 86, 0.35);
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.85);
  color: #475569;
  padding: 8px 16px;
  border-radius: 999px;
  border: none;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.lineman-checkbox-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}

.checkbox-label {
  font-size: 0.85rem;
  color: #0f172a;
}
</style>
