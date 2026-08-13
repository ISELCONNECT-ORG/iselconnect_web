<!-- IncidentQueue.vue -->
<template>
  <div class="dashboard-root">
    <Sidebar />
    <main class="content">
      <Topbar />

      <!-- HERO HEADER -->
      <header class="hero-section">
        <div class="hero-header-content">
          <div class="hero-text">
            <h1>INCIDENT QUEUE</h1>
            <p>Comprehensive profile management for the ISELCONNECT field engineering team.</p>
          </div>
          <button @click="openManualModal" class="manual-dispatch-btn">
            <UserPlus class="btn-icon" /> MANUAL ENTRY
          </button>
        </div>
      </header>

      <!-- METRICS & STATUS CARDS -->
      <section class="metrics-container stats-grid">
        <div class="priority-grid-cluster">
          <div class="stat-card priority-card-critical">
            <div class="card-header">
              <h3>CRITICAL</h3>
              <AlertTriangle class="stat-icon" />
            </div>
            <p class="stat-value text-center">{{ criticalCount }}</p>
          </div>

          <div class="stat-card priority-card-high">
            <div class="card-header">
              <h3>HIGH</h3>
              <AlertCircle class="stat-icon" />
            </div>
            <p class="stat-value text-center">{{ highCount }}</p>
          </div>

          <div class="stat-card priority-card-normal">
            <div class="card-header">
              <h3>NORMAL</h3>
              <Info class="stat-icon" />
            </div>
            <p class="stat-value text-center">{{ normalCount }}</p>
          </div>

          <div class="stat-card priority-card-low">
            <div class="card-header">
              <h3>LOW</h3>
              <ShieldAlert class="stat-icon" />
            </div>
            <p class="stat-value text-center">{{ lowCount }}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="card-header">
            <h3>ONLINE LINEMAN</h3>
            <ActivitySquare class="stat-icon" />
          </div>
          <p class="stat-value text-center">{{ onlineLinemenCount }}</p>
        </div>

        <div class="stat-card">
          <div class="card-header">
            <h3>ASSIGNED</h3>
            <UserCheck class="stat-icon" />
          </div>
          <p class="stat-value text-center">{{ assignedCount }}</p>
        </div>

        <div class="stat-card">
          <div class="card-header">
            <h3>TOTAL REPORT</h3>
            <ClipboardList class="stat-icon" />
          </div>
          <p class="stat-value text-center">{{ totalReportsCount }}</p>
        </div>

        <div class="stat-card">
          <div class="card-header">
            <h3>SYSTEM STATUS</h3>
            <Wifi class="stat-icon" />
          </div>
          <p class="stat-value text-center">ACTIVE</p>
        </div>
      </section>

      <!-- ACTIVE INCIDENTS -->
      <section class="queue-panel">
        <div class="panel-header-row">
          <h3>Active Incidents</h3>

          <!-- PRIORITY FILTER CONTROLS -->
          <div class="filter-controls">
            <button
              :class="['filter-btn', { active: currentPriorityFilter === 'All' }]"
              @click="setFilter('All')"
            >
              All
            </button>
            <button
              :class="['filter-btn', { active: currentPriorityFilter === 'Critical' }]"
              @click="setFilter('Critical')"
            >
              Critical
            </button>
            <button
              :class="['filter-btn', { active: currentPriorityFilter === 'High' }]"
              @click="setFilter('High')"
            >
              High
            </button>
            <button
              :class="['filter-btn', { active: currentPriorityFilter === 'Normal' }]"
              @click="setFilter('Normal')"
            >
              Normal
            </button>
            <button
              :class="['filter-btn', { active: currentPriorityFilter === 'Low' }]"
              @click="setFilter('Low')"
            >
              Low
            </button>
          </div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>STATUS</th>
              <th>PRIORITY</th>
              <th>CUSTOMER</th>
              <th>LANDMARK</th>
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
              <td>{{ r.landmark || 'N/A' }}</td>
              <td class="text-black">{{ r.municipalities?.name }}</td>
              <td class="text-black">{{ r.barangays?.name }}</td>
              <td class="text-black">{{ r.purok_sitio }}</td>
              <td class="text-black">{{ r.lineman_display }}</td>
              <td>{{ formatTime(r.created_at) }}</td>
              <td>
                <button @click="openAssign(r)" class="action-btn">Assign</button>
                <router-link :to="`/admin/reports/${r.id}`" class="details-btn">
                  See Details
                </router-link>
              </td>
            </tr>
            <tr v-if="activeReports.length === 0">
              <td colspan="10" class="text-center" style="padding: 20px; color: #64748b">
                No active incidents found for this filter.
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
              <th>LANDMARK</th>
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
              <td>{{ r.landmark || 'N/A' }}</td>
              <td class="text-black">{{ r.municipalities?.name }}</td>
              <td class="text-black">{{ r.barangays?.name }}</td>
              <td class="text-black">{{ r.purok_sitio }}</td>
              <td class="text-black">{{ r.lineman_display }}</td>
              <td>{{ formatTime(r.created_at) }}</td>
              <td>
                <button class="action-btn" disabled>Done</button>
                <router-link :to="`/admin/reports/${r.id}`" class="details-btn">
                  See Details
                </router-link>
              </td>
            </tr>
            <tr v-if="resolvedReports.length === 0">
              <td colspan="10" class="text-center" style="padding: 20px; color: #64748b">
                No resolved incidents found for this filter.
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>

    <!-- MANUAL REPORT MODAL -->
    <div v-if="showManualModal" class="modal-overlay" @click.self="closeManualModal">
      <div class="manual-report-card">
        <div class="modal-top-icon">
          <FilePlus class="header-file-icon" />
        </div>
        <h2>MANUAL REPORT</h2>

        <div class="manual-form">
          <!-- SELECT BARANGAY CUSTOM DROPDOWN -->
          <div class="custom-dropdown-container">
            <div class="dropdown-trigger-btn" @click="toggleBarangayDropdown">
              <span>{{
                selectedBarangayObj ? selectedBarangayObj.name.toUpperCase() : 'SELECT BARANGAY'
              }}</span>
              <ChevronDown class="dropdown-chevron" />
            </div>

            <div v-if="isBarangayDropdownOpen" class="dropdown-popover">
              <div class="popover-search-box">
                <input
                  v-model="barangaySearchQuery"
                  type="text"
                  class="search-input"
                  placeholder=""
                />
                <Search class="search-input-icon" />
              </div>

              <div class="popover-scroll-list">
                <template v-for="(bList, muniName) in groupedBarangays" :key="muniName">
                  <div class="group-header-label">{{ muniName }}</div>
                  <div
                    v-for="b in bList"
                    :key="b.id"
                    class="group-option-box"
                    @click="selectBarangay(b)"
                  >
                    {{ b.name }}
                  </div>
                </template>
                <div v-if="Object.keys(groupedBarangays).length === 0" class="no-result-text">
                  No barangays found
                </div>
              </div>
            </div>
          </div>

          <!-- PUROK INPUT -->
          <div class="form-input-box">
            <input v-model="manualReport.purok" placeholder="PUROK" class="manual-styled-input" />
          </div>

          <!-- SELECT ISSUE TYPE CUSTOM DROPDOWN -->
          <div class="custom-dropdown-container">
            <div class="dropdown-trigger-btn" @click="toggleTypeDropdown">
              <span>{{
                selectedTypeObj ? selectedTypeObj.name.toUpperCase() : 'SELECT ISSUE TYPE'
              }}</span>
              <ChevronDown class="dropdown-chevron" />
            </div>

            <div v-if="isTypeDropdownOpen" class="dropdown-popover">
              <div class="popover-search-box">
                <input v-model="typeSearchQuery" type="text" class="search-input" placeholder="" />
                <Search class="search-input-icon" />
              </div>

              <div class="popover-scroll-list">
                <template v-for="(tList, prioLevel) in groupedReportTypes" :key="prioLevel">
                  <div class="group-header-label">{{ prioLevel }}</div>
                  <div
                    v-for="t in tList"
                    :key="t.id"
                    class="group-option-box"
                    @click="selectReportType(t)"
                  >
                    {{ t.name }}
                  </div>
                </template>
                <div v-if="Object.keys(groupedReportTypes).length === 0" class="no-result-text">
                  No issue types found
                </div>
              </div>
            </div>
          </div>

          <!-- DESCRIPTION TEXTAREA -->
          <div class="form-input-box">
            <textarea
              v-model="manualReport.description"
              placeholder="DESCRIPTION OF INCIDENT"
              class="manual-styled-textarea"
            ></textarea>
          </div>

          <!-- ACTION BUTTONS -->
          <div class="manual-modal-actions">
            <button @click="closeManualModal" class="btn-grey-cancel">CANCEL</button>
            <button @click="submitManualReport" class="btn-navy-submit">SUBMIT REPORT</button>
          </div>
        </div>
      </div>
    </div>

    <!-- DISPATCH MODAL -->
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/services/supabase'
import { sendNotification } from '@/utils/notifications.js'
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'

import {
  ActivitySquare,
  UserCheck,
  ClipboardList,
  Wifi,
  UserPlus,
  AlertTriangle,
  AlertCircle,
  Info,
  ShieldAlert,
  FilePlus,
  ChevronDown,
  Search,
} from 'lucide-vue-next'

const pendingReports = ref([])
const reportTypes = ref([])
const barangays = ref([])
const showManualModal = ref(false)
const manualReport = ref({
  type_id: null,
  barangay_id: null,
  purok: '',
  description: '',
  municipality_id: null,
})

const isBarangayDropdownOpen = ref(false)
const isTypeDropdownOpen = ref(false)
const barangaySearchQuery = ref('')
const typeSearchQuery = ref('')
const selectedBarangayObj = ref(null)
const selectedTypeObj = ref(null)

const showAssignModal = ref(false)
const selectedReport = ref(null)
const selectedLinemanIds = ref([])
const availableLinemen = ref([])
const isWorkingHoursModal = ref(false)

const assignedCount = ref(0)
const totalReportsCount = ref(0)
const onlineLinemenCount = ref(0)

// Filtering State
const currentPriorityFilter = ref('All')
let refreshIntervalId = null

const setFilter = (priority) => {
  currentPriorityFilter.value = priority
}

const formatTime = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const criticalCount = computed(
  () =>
    pendingReports.value.filter((r) => (r.report_types?.priority_level || 'Normal') === 'Critical')
      .length,
)

const highCount = computed(
  () =>
    pendingReports.value.filter((r) => (r.report_types?.priority_level || 'Normal') === 'High')
      .length,
)

const normalCount = computed(
  () =>
    pendingReports.value.filter((r) => (r.report_types?.priority_level || 'Normal') === 'Normal')
      .length,
)

const lowCount = computed(
  () =>
    pendingReports.value.filter((r) => (r.report_types?.priority_level || 'Normal') === 'Low')
      .length,
)

const groupedBarangays = computed(() => {
  const query = barangaySearchQuery.value.toLowerCase().trim()
  const map = {}

  barangays.value.forEach((b) => {
    const muniName = (b.municipalities?.name || 'MUNICIPALITY').toUpperCase()
    const matchesQuery =
      !query || b.name.toLowerCase().includes(query) || muniName.toLowerCase().includes(query)

    if (matchesQuery) {
      if (!map[muniName]) map[muniName] = []
      map[muniName].push(b)
    }
  })

  return map
})

const groupedReportTypes = computed(() => {
  const query = typeSearchQuery.value.toLowerCase().trim()
  const map = {}
  const priorityOrder = ['CRITICAL', 'HIGH', 'NORMAL', 'LOW']

  reportTypes.value.forEach((t) => {
    const prio = (t.priority_level || 'NORMAL').toUpperCase()
    const matchesQuery =
      !query || t.name.toLowerCase().includes(query) || prio.toLowerCase().includes(query)

    if (matchesQuery) {
      if (!map[prio]) map[prio] = []
      map[prio].push(t)
    }
  })

  const sortedMap = {}
  priorityOrder.forEach((p) => {
    if (map[p] && map[p].length > 0) {
      sortedMap[p] = map[p]
    }
  })

  Object.keys(map).forEach((p) => {
    if (!sortedMap[p] && map[p].length > 0) {
      sortedMap[p] = map[p]
    }
  })

  return sortedMap
})

const toggleBarangayDropdown = () => {
  isBarangayDropdownOpen.value = !isBarangayDropdownOpen.value
  if (isBarangayDropdownOpen.value) isTypeDropdownOpen.value = false
}

const toggleTypeDropdown = () => {
  isTypeDropdownOpen.value = !isTypeDropdownOpen.value
  if (isTypeDropdownOpen.value) isBarangayDropdownOpen.value = false
}

const selectBarangay = (b) => {
  manualReport.value.barangay_id = b.id
  manualReport.value.municipality_id = b.municipality_id
  selectedBarangayObj.value = b
  isBarangayDropdownOpen.value = false
  barangaySearchQuery.value = ''
}

const selectReportType = (t) => {
  manualReport.value.type_id = t.id
  selectedTypeObj.value = t
  isTypeDropdownOpen.value = false
  typeSearchQuery.value = ''
}

const openManualModal = () => {
  showManualModal.value = true
}

const closeManualModal = () => {
  showManualModal.value = false
  isBarangayDropdownOpen.value = false
  isTypeDropdownOpen.value = false
  barangaySearchQuery.value = ''
  typeSearchQuery.value = ''
}

const activeReports = computed(() => {
  let filtered = pendingReports.value.filter((r) => r.report_statuses?.name !== 'Resolved')

  if (currentPriorityFilter.value !== 'All') {
    filtered = filtered.filter(
      (r) => (r.report_types?.priority_level || 'Normal') === currentPriorityFilter.value,
    )
  }

  return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
})

const resolvedReports = computed(() => {
  let filtered = pendingReports.value.filter((r) => r.report_statuses?.name === 'Resolved')

  if (currentPriorityFilter.value !== 'All') {
    filtered = filtered.filter(
      (r) => (r.report_types?.priority_level || 'Normal') === currentPriorityFilter.value,
    )
  }

  return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
})

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
  landmark: r.landmark || r.location || 'N/A',
  status_id: r.status_id || 2,
  report_types: { name: r.severity || 'General', priority_level: r.priority_level || 'Normal' },
})

const fetchAll = async () => {
  const { data, error } = await supabase
    .from('reports')
    .select(
      `
      *,
      report_statuses(name),
      report_types(name, priority_level),
      users!residents_id(first_name, last_name),
      barangays(name),
      municipalities(name),
      assignments(
        lineman_id,
        users!lineman_id(first_name, last_name)
      )
    `,
    )
    .gt('status_id', 1)
    .neq('status_id', 5)

  if (error) {
    console.error('Supabase fetch error:', error.message)
  }

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

  const { data: brgys } = await supabase.from('barangays').select('id, name, municipality_id')
  const { data: munis } = await supabase.from('municipalities').select('id, name')

  const muniMap = {}
  if (munis) {
    munis.forEach((m) => {
      muniMap[m.id] = m.name
    })
  }

  barangays.value = (brgys || []).map((b) => ({
    ...b,
    municipalities: { name: muniMap[b.municipality_id] || 'N/A' },
  }))

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
  if (!manualReport.value.barangay_id || !manualReport.value.type_id) {
    alert('Please select both Barangay and Issue Type.')
    return
  }

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
      municipality_id: manualReport.value.municipality_id || 1,
    },
  ])

  if (error) {
    alert('Error: ' + error.message)
  } else {
    alert('Report Added!')
    await sendNotification(
      'New Report Received',
      `A new report has been added for barangay ${selectedBarangayObj.value?.name || manualReport.value.barangay_id}.`,
    )
    closeManualModal()
    manualReport.value = {
      type_id: null,
      barangay_id: null,
      purok: '',
      description: '',
      municipality_id: null,
    }
    selectedBarangayObj.value = null
    selectedTypeObj.value = null
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

onMounted(() => {
  fetchAll()
  // Setup 5-second auto-refresh
  refreshIntervalId = setInterval(fetchAll, 5000)
})

onUnmounted(() => {
  // Clear the interval when user leaves the component
  if (refreshIntervalId) {
    clearInterval(refreshIntervalId)
  }
})
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

.metrics-container.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.priority-grid-cluster {
  grid-column: span 2;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.priority-card-critical {
  background: #f87171 !important;
  border-color: #ef4444 !important;
}
.priority-card-high {
  background: #fef08a !important;
  border-color: #fde047 !important;
}
.priority-card-normal {
  background: #93c5fd !important;
  border-color: #60a5fa !important;
}
.priority-card-low {
  background: #cbd5e1 !important;
  border-color: #94a3b8 !important;
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

.text-center {
  text-align: center;
}

.queue-panel {
  margin-top: 16px;
  padding: 24px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.panel-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.queue-panel h3 {
  margin: 0;
  font-size: 1.15rem;
  color: #1f3056 !important;
  font-weight: 700;
}

.filter-controls {
  display: flex;
  gap: 8px;
}

.filter-btn {
  padding: 6px 14px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569 !important;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-btn:hover {
  background: #f1f5f9;
}

.filter-btn.active {
  background: #1f3056;
  color: #ffffff !important;
  border-color: #1f3056;
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
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.manual-report-card {
  width: min(460px, 92vw);
  background: #dce6f2;
  border-radius: 24px;
  padding: 28px 24px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 2px solid #3b42a4;
}

.modal-top-icon {
  margin-bottom: 4px;
}

.header-file-icon {
  width: 28px;
  height: 28px;
  color: #283593 !important;
}

.manual-report-card h2 {
  margin: 0 0 18px 0;
  font-size: 1.45rem;
  font-weight: 900;
  color: #283593 !important;
  letter-spacing: 0.04em;
  font-family: Georgia, 'Times New Roman', serif;
}

.manual-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.custom-dropdown-container {
  position: relative;
  width: 100%;
}

.dropdown-trigger-btn {
  width: 100%;
  background: #ffffff;
  border: 1.5px solid #283593;
  border-radius: 12px;
  padding: 10px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  box-sizing: border-box;
}

.dropdown-trigger-btn span {
  font-size: 0.8rem;
  font-weight: 800;
  color: #283593 !important;
  letter-spacing: 0.05em;
}

.dropdown-chevron {
  width: 18px;
  height: 18px;
  color: #283593 !important;
}

.dropdown-popover {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: #dce6f2;
  border: 1.5px solid #283593;
  border-radius: 14px;
  padding: 10px;
  z-index: 1050;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.popover-search-box {
  position: relative;
  margin-bottom: 8px;
}

.search-input {
  width: 100%;
  background: #ffffff;
  border: 1.5px solid #283593;
  border-radius: 10px;
  padding: 8px 36px 8px 12px;
  font-size: 0.85rem;
  outline: none;
  box-sizing: border-box;
}

.search-input-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: #283593 !important;
}

.popover-scroll-list {
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-right: 4px;
}

.group-header-label {
  font-size: 0.75rem;
  font-weight: 800;
  color: #283593 !important;
  text-transform: uppercase;
  margin: 6px 0 2px 2px;
  letter-spacing: 0.05em;
}

.group-option-box {
  background: #ffffff;
  border: 1px solid #283593;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 0.8rem;
  font-weight: 800;
  color: #1e293b !important;
  cursor: pointer;
  transition: background 0.15s;
}

.group-option-box:hover {
  background: #f1f5f9;
}

.no-result-text {
  font-size: 0.8rem;
  color: #64748b !important;
  padding: 8px;
  text-align: center;
}

.form-input-box {
  width: 100%;
}

.manual-styled-input {
  width: 100%;
  background: #ffffff;
  border: 1.5px solid #283593;
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 0.8rem;
  font-weight: 800;
  color: #283593 !important;
  outline: none;
  box-sizing: border-box;
}

.manual-styled-input::placeholder {
  color: #283593 !important;
  opacity: 0.8;
  letter-spacing: 0.05em;
}

.manual-styled-textarea {
  width: 100%;
  background: #ffffff;
  border: 1.5px solid #283593;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 0.8rem;
  font-weight: 800;
  color: #283593 !important;
  outline: none;
  min-height: 110px;
  resize: vertical;
  box-sizing: border-box;
}

.manual-styled-textarea::placeholder {
  color: #283593 !important;
  opacity: 0.8;
  letter-spacing: 0.05em;
}

.manual-modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 10px;
}

.btn-grey-cancel {
  flex: 1;
  background: #a3a3a3 !important;
  color: #ffffff !important;
  border: none;
  border-radius: 10px;
  padding: 10px;
  font-size: 0.8rem;
  font-weight: 800;
  cursor: pointer;
  letter-spacing: 0.05em;
}

.btn-navy-submit {
  flex: 2;
  background: #283593 !important;
  color: #ffffff !important;
  border: none;
  border-radius: 10px;
  padding: 10px;
  font-size: 0.8rem;
  font-weight: 800;
  cursor: pointer;
  letter-spacing: 0.05em;
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
