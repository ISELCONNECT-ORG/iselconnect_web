<!-- IncidentQueue.vue -->
<template>
  <div class="dashboard-root">
    <Sidebar />
    <main class="content">
      <Topbar />

      <!-- HERO HEADER: matching exact requested design banner layout using bannerdashboard.jpg -->
      <header class="hero-section">
        <div class="hero-header-content">
          <div class="hero-text">
            <h1>INCIDENT QUEUE</h1>
            <p>Comprehensive profile management for the ISELCONNECT field engineering team.</p>
          </div>
          <button @click="showManualModal = true" class="manual-dispatch-btn">
            <UserPlus class="btn-icon" /> MANUAL ENTRY
          </button>
        </div>
      </header>

      <!-- METRICS & STATUS CARDS: exact layout matching the target image -->
      <section class="metrics-container stats-grid">
        <div class="stat-card status-box-dark">
          <h3>INCIDENT QUEUE STATUS</h3>
          <p class="status-desc">
            Comprehensive administration module designed for the Isabela-1 Electric Cooperative,
            Inc. (ISELCO-I) to review resident-submitted damage reports, validate crowdsourced
            photographic evidence, analyze precise GPS coordinates, and coordinate rapid field
            responses.
          </p>
        </div>

        <div class="stat-card">
          <div class="card-header">
            <h3>ONLINE LINEMAN</h3>
            <ActivitySquare class="stat-icon" />
          </div>
          <p class="stat-value">{{ onlineLinemenCount }}</p>
        </div>

        <div class="stat-card">
          <div class="card-header">
            <h3>ASSIGNED</h3>
            <UserCheck class="stat-icon" />
          </div>
          <p class="stat-value">{{ assignedCount }}</p>
        </div>

        <div class="stat-card">
          <div class="card-header">
            <h3>TOTAL REPORT</h3>
            <ClipboardList class="stat-icon" />
          </div>
          <p class="stat-value">{{ totalReportsCount }}</p>
        </div>

        <div class="stat-card">
          <div class="card-header">
            <h3>SYSTEM STATUS</h3>
            <Wifi class="stat-icon" />
          </div>
          <p class="stat-value">ACTIVE</p>
        </div>
      </section>

      <!-- ACTIVE INCIDENTS -->
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
            <tr v-for="r in activeReports" :key="r.id">
              <td>
                <span class="status-pill">{{ r.report_statuses?.name }}</span>
              </td>
              <td>
                <span :class="['priority-pill', getPriorityClass(r.report_types?.priority_level)]">
                  {{ r.report_types?.priority_level || 'Normal' }}
                </span>
              </td>
              <td>
                <strong>{{ r.users?.first_name }} {{ r.users?.last_name || 'Walk-in' }}</strong>
              </td>
              <td>{{ r.description }}</td>
              <td class="text-black">{{ r.municipalities?.name }}</td>
              <td class="text-black">{{ r.barangays?.name }}</td>
              <td class="text-black">{{ r.purok_sitio }}</td>
              <td class="text-black">{{ r.lineman_display }}</td>
              <td>{{ new Date(r.created_at).toLocaleTimeString() }}</td>
              <td>
                <button @click="openAssign(r)" class="action-btn">Assign</button>
                <router-link :to="`/admin/reports/${r.id}`" class="details-btn">
                  See Details
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- RESOLVED INCIDENTS -->
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
            <tr v-for="r in resolvedReports" :key="r.id">
              <td>
                <span class="status-pill">{{ r.report_statuses?.name }}</span>
              </td>
              <td>
                <span :class="['priority-pill', getPriorityClass(r.report_types?.priority_level)]">
                  {{ r.report_types?.priority_level || 'Normal' }}
                </span>
              </td>
              <td>
                <strong>{{ r.users?.first_name }} {{ r.users?.last_name || 'Walk-in' }}</strong>
              </td>
              <td>{{ r.description }}</td>
              <td class="text-black">{{ r.municipalities?.name }}</td>
              <td class="text-black">{{ r.barangays?.name }}</td>
              <td class="text-black">{{ r.purok_sitio }}</td>
              <td class="text-black">{{ r.lineman_display }}</td>
              <td>{{ new Date(r.created_at).toLocaleTimeString() }}</td>
              <td>
                <button class="action-btn" disabled>Done</button>
                <router-link :to="`/admin/reports/${r.id}`" class="details-btn">
                  See Details
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>

    <!-- MANUAL ENTRY MODAL: semi-glass -->
    <div v-if="showManualModal" class="modal-overlay">
      <div class="modal-content glass-card">
        <h3>New Customer Report</h3>
        <select v-model="manualReport.barangay_id" class="input-field">
          <option :value="null" disabled>Select Barangay</option>
          <option v-for="b in barangays" :key="b.id" :value="b.id">{{ b.name }}</option>
        </select>
        <input v-model="manualReport.purok" placeholder="Purok/Sitio" class="input-field" />
        <select v-model="manualReport.type_id" class="input-field">
          <option :value="null" disabled>Select Issue Type</option>
          <option v-for="t in reportTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
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

    <!-- DISPATCH MODAL: semi-glass -->
    <div v-if="showAssignModal" class="modal-overlay">
      <div class="modal-content glass-card">
        <h3 style="margin-bottom: 10px">
          {{ isWorkingHoursModal ? 'Branch Dispatch' : 'Dispatch Lineman' }}
        </h3>
        <div class="lineman-checkbox-list">
          <label v-for="l in availableLinemen" :key="l.id" class="checkbox-label">
            <input type="checkbox" :value="l.id" v-model="selectedLinemanIds" />
            {{ l.name }}
          </label>
        </div>
        <div class="modal-actions" style="margin-top: 20px">
          <button @click="submitAssignment" class="assign-btn">
            {{ isWorkingHoursModal ? 'ASSIGN BRANCH' : 'DISPATCH' }}
          </button>
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
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'

import { ActivitySquare, UserCheck, ClipboardList, Wifi, UserPlus } from 'lucide-vue-next'

const pendingReports = ref([])
const reportTypes = ref([])
const barangays = ref([])
const showManualModal = ref(false)
const manualReport = ref({ type_id: null, barangay_id: null, purok: '', description: '' })

const showAssignModal = ref(false)
const selectedReport = ref(null)
const selectedLinemanIds = ref([])
const availableLinemen = ref([])
const isWorkingHoursModal = ref(false)

const assignedCount = ref(0)
const totalReportsCount = ref(0)
const onlineLinemenCount = ref(0)

const activeReports = computed(() => {
  const priorityRank = { Critical: 1, High: 2, Normal: 3, Low: 4 }

  return pendingReports.value
    .filter((r) => r.report_statuses?.name !== 'Resolved')
    .sort((a, b) => {
      const pA = priorityRank[a.report_types?.priority_level] || 3
      const pB = priorityRank[b.report_types?.priority_level] || 3

      if (pA !== pB) {
        return pA - pB
      }
      return new Date(b.created_at) - new Date(a.created_at)
    })
})

const resolvedReports = computed(() =>
  pendingReports.value.filter((r) => r.report_statuses?.name === 'Resolved'),
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

const normalizeLocalQueueReport = (r) => ({
  ...r,
  description: r.description || r.title || 'No description provided.',
  report_statuses: { name: r.status || 'Pending' },
  users: {
    first_name: r.reporter ? r.reporter.split(' ')[0] : 'Unknown',
    last_name: r.reporter ? r.reporter.split(' ').slice(1).join(' ') : '',
  },
  municipalities: { name: r.location || 'N/A' },
  barangays: { name: r.location || 'N/A' },
  purok_sitio: r.location || 'N/A',
  lineman_display: r.lineman_display || 'Unassigned',
  photo_url: r.photo_url || null,
  created_at: r.date || new Date().toISOString(),
  landmark: r.location || 'N/A',
  status_id: r.status_id || 2,
  report_types: { name: r.severity || 'General', priority_level: r.priority_level || 'Normal' },
})

const fetchAll = async () => {
  const { data } = await supabase
    .from('reports')
    .select(
      `
      *, report_statuses(name), report_types(name, priority_level), users(first_name, last_name),
      barangays(name), municipalities(name), assignments(lineman_id, users(first_name, last_name))
    `,
    )
    .gt('status_id', 1)
    .neq('status_id', 5)

  const supabaseReports = (data || []).map((r) => ({
    ...r,
    lineman_display:
      r.assignments?.length > 0
        ? [
            ...new Set(
              r.assignments.map((a) =>
                `${a.users?.first_name || ''} ${a.users?.last_name || ''}`.trim(),
              ),
            ),
          ].join(', ')
        : 'Unassigned',
  }))

  const localReports = (JSON.parse(localStorage.getItem('incidentQueue') || '[]') || []).map(
    normalizeLocalQueueReport,
  )

  pendingReports.value = [...localReports, ...supabaseReports].filter(
    (report, index, all) => all.findIndex((item) => item.id === report.id) === index,
  )

  totalReportsCount.value = pendingReports.value.length

  const { data: types } = await supabase.from('report_types').select('*')
  reportTypes.value = types || []
  const { data: brgys } = await supabase.from('barangays').select('*')
  barangays.value = brgys || []

  const { count: aCount } = await supabase
    .from('assignments')
    .select('*', { count: 'exact', head: true })
  assignedCount.value = aCount || 0

  const { count: oCount } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('designation', 'Lineman')
  onlineLinemenCount.value = oCount || 0
}

const submitManualReport = async () => {
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
    },
  ])
  if (error) alert('Error: ' + error.message)
  else {
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

const openAssign = async (r) => {
  selectedReport.value = r
  selectedLinemanIds.value = r.assignments?.map((a) => a.lineman_id) || []

  const now = new Date()
  const totalMinutes = now.getHours() * 60 + now.getMinutes()

  isWorkingHoursModal.value = totalMinutes >= 480 && totalMinutes <= 1020

  if (isWorkingHoursModal.value) {
    const { data } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .eq('role_id', 6)

    availableLinemen.value =
      data?.map((user) => ({
        id: user.id,
        name: `${user.first_name} ${user.last_name} (Branch Account)`,
      })) || []
  } else {
    const { data } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .eq('role_id', 9)

    availableLinemen.value =
      data?.map((user) => ({
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
      })) || []
  }

  showAssignModal.value = true
}

const submitAssignment = async () => {
  if (!selectedReport.value) return

  await supabase.from('assignments').delete().eq('report_id', selectedReport.value.id)

  if (selectedLinemanIds.value.length > 0) {
    const assignmentsToInsert = selectedLinemanIds.value.map((uid) => ({
      report_id: selectedReport.value.id,
      lineman_id: uid,
      assigned_at: new Date().toISOString(),
      inprogress_at: new Date().toISOString(),
    }))
    const { error: assignError } = await supabase.from('assignments').insert(assignmentsToInsert)
    if (!assignError) {
      await Promise.all(
        selectedLinemanIds.value.map((uid) =>
          sendNotification(
            'Assignment Updated',
            `You have been assigned to report ${selectedReport.value.id}.`,
            uid,
          ),
        ),
      )
    }
  }

  showAssignModal.value = false
  fetchAll()
}

onMounted(fetchAll)
</script>

<style scoped>
.dashboard-root,
.dashboard-root *,
.dashboard-root h1,
.dashboard-root h2,
.dashboard-root h3,
.dashboard-root p,
.dashboard-root th,
.dashboard-root td,
.dashboard-root span {
  color: #0f172a !important;
}

.dashboard-root {
  display: flex;
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Inter',
    sans-serif;
  background: #f1f5f9;
  min-height: 100vh;
}

.content {
  flex-grow: 1;
  padding: 24px 30px 40px;
}

/* Exact banner size & bannerdashboard.jpg background matching the reference */
.hero-section {
  position: relative;
  background: url('@/assets/Background/bannerdashboard.jpg') no-repeat center center;
  background-size: cover;
  padding: 45px 36px;
  border-radius: 16px;
  box-shadow: 0 10px 25px -5px rgba(31, 48, 86, 0.3);
  border: 1px solid #cbd5e1;
  overflow: hidden;
  margin-bottom: 24px;
  min-height: 220px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(31, 48, 86, 0.72) 0%, rgba(23, 37, 84, 0.65) 100%);
  z-index: 1;
}

.hero-header-content {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hero-text h1 {
  margin: 0 0 6px;
  font-size: 2.2rem;
  color: #ffffff !important;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.hero-text p {
  margin: 0;
  font-size: 0.95rem;
  color: #e2e8f0 !important;
}

.manual-dispatch-btn {
  background: #fef08a !important;
  color: #1f3056 !important;
  padding: 10px 20px;
  border-radius: 12px;
  border: 1px solid #fde047;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: background 0.2s;
}

.manual-dispatch-btn:hover {
  background: #fde047 !important;
}

.btn-icon {
  width: 18px;
  height: 18px;
  color: #1f3056 !important;
}

/* Metrics and Status Cards Grid matching exact 5-column layout */
.metrics-container.stats-grid {
  display: grid;
  grid-template-columns: 1.5fr repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

/* Dark Queue Status Card Style */
.stat-card.status-box-dark {
  background: #1f3056 !important;
  color: #ffffff !important;
  padding: 20px;
  border-radius: 16px;
  border: 1px solid #334155;
  box-shadow: 0 4px 12px rgba(31, 48, 86, 0.2);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.stat-card.status-box-dark h3,
.stat-card.status-box-dark .status-desc {
  color: #ffffff !important;
}

.stat-card.status-box-dark h3 {
  margin: 0 0 8px 0;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.status-desc {
  margin: 0;
  font-size: 0.72rem;
  line-height: 1.4;
  color: #cbd5e1 !important;
}

.stat-card {
  padding: 18px 20px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.stat-icon {
  width: 24px;
  height: 24px;
  color: #1f3056 !important;
}

.stat-card h3 {
  margin: 0;
  font-size: 0.85rem;
  color: #475569 !important;
  font-weight: 600;
}

.stat-value {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: #0f172a !important;
}

.queue-panel {
  margin-top: 16px;
  padding: 24px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.queue-panel h3 {
  margin: 0 0 16px;
  font-size: 1.15rem;
  color: #1f3056 !important;
  font-weight: 700;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.data-table th,
.data-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #e2e8f0;
}

.data-table thead th {
  text-align: left;
  font-weight: 600;
  font-size: 0.7rem;
  color: #475569 !important;
  background: #f8fafc;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.data-table tbody tr:hover {
  background: #f8fafc;
}

.status-pill {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  background: #dbeafe;
  color: #1e40af !important;
  font-size: 0.75rem;
  font-weight: 600;
}

.priority-pill {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
}
.priority-critical {
  background: #fee2e2;
  color: #991b1b !important;
}
.priority-high {
  background: #ffedd5;
  color: #9a3412 !important;
}
.priority-normal {
  background: #e0f2fe;
  color: #0369a1 !important;
}
.priority-low {
  background: #f1f5f9;
  color: #475569 !important;
}

.action-btn {
  background: #2563eb;
  color: #ffffff !important;
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  transition: background 0.2s;
}

.action-btn:hover {
  background: #1d4ed8;
}

.details-btn {
  display: inline-block;
  margin-left: 6px;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  font-size: 0.75rem;
  font-weight: 600;
  color: #0f172a !important;
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
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.45);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.35);
}

.modal-content {
  width: min(420px, 90vw);
  padding: 24px;
  border-radius: 16px;
  color: #0f172a;
}

.modal-content h3 {
  margin: 0 0 12px;
  font-size: 1.15rem;
  color: #1f3056 !important;
}

.input-field {
  width: 100%;
  margin-top: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  font-size: 0.9rem;
  outline: none;
  background: #ffffff;
}

textarea.input-field {
  border-radius: 8px;
  min-height: 80px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.assign-btn {
  background: #2563eb;
  color: #ffffff !important;
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.cancel-btn {
  background: #e2e8f0;
  color: #475569 !important;
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.lineman-checkbox-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
  max-height: 200px;
  overflow-y: auto;
}

.checkbox-label {
  font-size: 0.85rem;
  color: #0f172a !important;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
</style>
