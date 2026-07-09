<template>
  <div class="dashboard-root">
    <Sidebar />
    <main class="content">
      <Topbar />

      <!-- HERO HEADER: dark blue, white text -->
      <header class="hero-section">
        <div class="hero-header-content">
          <div class="hero-text">
            <h1>Service Interruption Queue</h1>
            <p>Manage and assign incoming damage reports for rapid grid restoration.</p>
          </div>
          <button @click="showManualModal = true" class="manual-dispatch-btn">
            + Manual Entry
          </button>
        </div>
      </header>

      <!-- METRICS: dashboard-style cards -->
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

      <!-- ACTIVE INCIDENTS -->
      <section class="queue-panel">
        <h3>Active Incidents</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>STATUS</th>
              <th>CUSTOMER</th>
              <th>DESCRIPTION</th>
              <th>MUNICIPALITY</th>
              <th>BARANGAY</th>
              <th>PUROK</th>
              <th>LINEMAN</th>
              <th>EVIDENCE</th>
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
                <strong>{{ r.users?.first_name }} {{ r.users?.last_name || 'Walk-in' }}</strong>
              </td>
              <td>{{ r.description }}</td>
              <td class="text-black">{{ r.municipalities?.name }}</td>
              <td class="text-black">{{ r.barangays?.name }}</td>
              <td class="text-black">{{ r.purok_sitio }}</td>
              <td class="text-black">{{ r.lineman_display }}</td>
              <td>
                <a v-if="r.photo_url" :href="r.photo_url" target="_blank">View</a>
                <span v-else>—</span>
              </td>
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
              <th>CUSTOMER</th>
              <th>DESCRIPTION</th>
              <th>MUNICIPALITY</th>
              <th>BARANGAY</th>
              <th>PUROK</th>
              <th>LINEMAN</th>
              <th>EVIDENCE</th>
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
                <strong>{{ r.users?.first_name }} {{ r.users?.last_name || 'Walk-in' }}</strong>
              </td>
              <td>{{ r.description }}</td>
              <td class="text-black">{{ r.municipalities?.name }}</td>
              <td class="text-black">{{ r.barangays?.name }}</td>
              <td class="text-black">{{ r.purok_sitio }}</td>
              <td class="text-black">{{ r.lineman_display }}</td>
              <td>
                <a v-if="r.photo_url" :href="r.photo_url" target="_blank">View</a>
                <span v-else>—</span>
              </td>
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
        <h3 style="margin-bottom: 10px">Dispatch Lineman</h3>
        <div class="lineman-checkbox-list">
          <label v-for="l in availableLinemen" :key="l.id" class="checkbox-label">
            <input type="checkbox" :value="l.id" v-model="selectedLinemanIds" />
            {{ l.name }}
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
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'
import '@/assets/style/IncidentQueue.css'

import { ActivitySquare, UserCheck, ClipboardList, Wifi } from 'lucide-vue-next' // or '@lucide/vue' [web:219][web:236]

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

const activeReports = computed(() =>
  pendingReports.value.filter((r) => r.report_statuses?.name !== 'Resolved'),
)
const resolvedReports = computed(() =>
  pendingReports.value.filter((r) => r.report_statuses?.name === 'Resolved'),
)

const fetchAll = async () => {
  const { data } = await supabase.from('reports').select(`
    *, report_statuses(name), report_types(name), users(first_name, last_name),
    barangays(name), municipalities(name), assignments(lineman_id, users(first_name, last_name))
  `)

  pendingReports.value = (data || []).map((r) => ({
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
      status_id: 1,
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

  const { data } = await supabase
    .from('employees')
    .select(`user_id, users(first_name, last_name)`)
    .eq('designation', 'Lineman')
  availableLinemen.value =
    data?.map((emp) => ({
      id: emp.user_id,
      name: `${emp.users?.first_name} ${emp.users?.last_name}`,
    })) || []

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
    }))
    const { error: assignError } = await supabase.from('assignments').insert(assignmentsToInsert)
    if (!assignError) {
      await Promise.all(
        selectedLinemanIds.value.map((uid) =>
          sendNotification(
            'Lineman Assigned',
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

/* Hero header matching previous theme: dark blue bar, white text */
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

/* Metrics row in dashboard style */
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

/* Queue panels */
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

/* Table styling */
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

/* See Details button */
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

/* Modal overlay + glass card */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

/* shared glass card for both modals */
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

/* Modal form controls */
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

/* Modal actions */
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

/* Lineman list in dispatch modal */
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
