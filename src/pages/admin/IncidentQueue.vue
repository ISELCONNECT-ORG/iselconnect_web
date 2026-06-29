<template>
  <div class="dashboard-root">
    <Sidebar />
    <main class="content">
      <Topbar />

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

      <section class="metrics-container">
        <div class="metric-box">
          <span>ONLINE LINEMAN</span>
          <h3>{{ onlineLinemenCount }}</h3>
        </div>
        <div class="metric-box">
          <span>ASSIGNED</span>
          <h3>{{ assignedCount }}</h3>
        </div>
        <div class="metric-box">
          <span>TOTAL REPORT</span>
          <h3>{{ totalReportsCount }}</h3>
        </div>
        <div class="metric-box">
          <span>SYSTEM STATUS</span>
          <h3>ACTIVE</h3>
        </div>
      </section>

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
              <td><button @click="openAssign(r)" class="action-btn">Assign</button></td>
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
              <td><button class="action-btn" disabled>Done</button></td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>

    <div v-if="showManualModal" class="modal-overlay">
      <div class="modal-content">
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

    <div v-if="showAssignModal" class="modal-overlay">
      <div class="modal-content">
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
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'
import '@/assets/style/IncidentQueue.css'

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
    await supabase.from('assignments').insert(assignmentsToInsert)
  }

  showAssignModal.value = false
  fetchAll()
}

onMounted(fetchAll)
</script>
