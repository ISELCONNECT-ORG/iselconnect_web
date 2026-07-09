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
            <tr v-for="report in activeReports" :key="report.id">
              <td>
                <span class="status-pill">{{ report.report_statuses?.name }}</span>
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
              <td>
                <a v-if="report.photo_url" :href="report.photo_url" target="_blank">View</a>
                <span v-else>—</span>
              </td>
              <td>{{ new Date(report.created_at).toLocaleTimeString() }}</td>
              <td><button @click="openAssign(report)" class="action-btn">Assign</button></td>
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
            <tr v-for="report in resolvedReports" :key="report.id">
              <td>
                <span class="status-pill">{{ report.report_statuses?.name }}</span>
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
              <td>
                <a v-if="report.photo_url" :href="report.photo_url" target="_blank">View</a>
                <span v-else>—</span>
              </td>
              <td>{{ new Date(report.created_at).toLocaleTimeString() }}</td>
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
      <div class="modal-content">
        <h3 style="margin-bottom: 10px">Dispatch Lineman</h3>
        <div class="lineman-checkbox-list">
          <label v-for="lineman in availableLinemen" :key="lineman.id" class="checkbox-label">
            <input type="checkbox" :value="lineman.id" v-model="selectedLinemanIds" />
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
const branchName = ref('Branch')
const branchId = ref(null)

const activeReports = computed(() =>
  pendingReports.value.filter((report) => report.report_statuses?.name !== 'Resolved'),
)
const resolvedReports = computed(() =>
  pendingReports.value.filter((report) => report.report_statuses?.name === 'Resolved'),
)

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

  const { data, error } = await supabase
    .from('reports')
    .select(
      `
      *, report_statuses(name), report_types(name), users(first_name, last_name),
      barangays(name), municipalities(name), assignments(lineman_id, users(first_name, last_name))
    `,
    )
    .eq('branch_id', branchId.value)

  if (error) {
    console.error('Error loading branch reports:', error)
    return
  }

  pendingReports.value = (data || []).map((report) => ({
    ...report,
    lineman_display:
      report.assignments?.length > 0
        ? [
            ...new Set(
              report.assignments.map((assignment) =>
                `${assignment.users?.first_name || ''} ${assignment.users?.last_name || ''}`.trim(),
              ),
            ),
          ].join(', ')
        : 'Unassigned',
  }))

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
    .select('*', { count: 'exact', head: true })
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
      status_id: 1,
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
    .from('employees')
    .select(`user_id, users(first_name, last_name)`)
    .eq('designation', 'Lineman')
    .eq('is_available', true)
    .eq('users.branch_id', branchId.value)

  if (!error) {
    availableLinemen.value =
      data?.map((employee) => ({
        id: employee.user_id,
        name: `${employee.users?.first_name} ${employee.users?.last_name}`,
      })) || []
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
    }))
    const { error: assignError } = await supabase.from('assignments').insert(assignmentsToInsert)
    if (!assignError) {
      await Promise.all(
        selectedLinemanIds.value.map((userId) =>
          sendNotification(
            'Lineman Assigned',
            `You have been assigned to report ${selectedReport.value.id}.`,
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
