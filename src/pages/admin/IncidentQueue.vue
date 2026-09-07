<!-- IncidentQueue.vue -->
<template>
  <div class="dashboard-root">
    <Sidebar />
    <main class="content">
      <Topbar />

      <!-- HERO HEADER -->
      <header class="hero-section">
        <div class="hero-text">
          <h1>INCIDENT LIST</h1>
          <p>Comprehensive profile management for the ISELCONNECT field engineering team.</p>
        </div>
        <button @click="openManualModal" class="manual-dispatch-btn">
          <UserPlus class="btn-icon" /> MANUAL REPORT
        </button>
      </header>

      <!-- OPERATIONAL OVERVIEW & PRIORITY CARDS -->
      <section class="overview-section">
        <div class="operational-overview-card">
          <div class="overview-header">Operational Overview</div>
          <div class="overview-stats">
            <div class="o-stat">
              <span><ActivitySquare class="stat-icon" /> ONLINE LINEMAN</span>
              <h2>{{ onlineLinemenCount }}</h2>
            </div>
            <div class="o-stat">
              <span><UserCheck class="stat-icon" /> ASSIGNED</span>
              <h2>{{ assignedCount }}</h2>
            </div>
            <div class="o-stat">
              <span><ClipboardList class="stat-icon" /> TOTAL REPORT</span>
              <h2>{{ totalReportsCount }}</h2>
            </div>
            <div class="o-stat">
              <span><Wifi class="stat-icon" /> SYSTEM STATUS</span>
              <h2 class="active-status"><span class="dot"></span> ACTIVE</h2>
            </div>
          </div>
        </div>

        <div class="priority-cards-row">
          <div class="p-card critical">
            <span><AlertTriangle class="p-icon" /> CRITICAL</span>
            <h2>{{ criticalCount }}</h2>
          </div>
          <div class="p-card high">
            <span><AlertCircle class="p-icon" /> HIGH</span>
            <h2>{{ highCount }}</h2>
          </div>
          <div class="p-card normal">
            <span><Info class="p-icon" /> NORMAL</span>
            <h2>{{ normalCount }}</h2>
          </div>
          <div class="p-card low">
            <span><ShieldAlert class="p-icon" /> LOW</span>
            <h2>{{ lowCount }}</h2>
          </div>
        </div>
      </section>

      <!-- ACTIVE INCIDENTS -->
      <section class="queue-panel">
        <div class="panel-header-row">
          <h3>Active Incidents</h3>
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
              <th style="width: 40px">No.</th>
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
            <tr v-for="(r, index) in activeReports" :key="r.id">
              <td style="font-weight: 600; color: #64748b">
                {{ index + 1 }}
              </td>
              <td>
                <span class="status-pill">{{ r.report_statuses?.name || 'In Progress' }}</span>
              </td>
              <td>
                <span :class="['priority-pill', getPriorityClass(r.report_types?.priority_level)]">
                  {{ r.report_types?.priority_level || 'Normal' }}
                </span>
              </td>
              <td>
                <strong>{{ r.users?.first_name }} {{ r.users?.last_name || 'Walk-in' }}</strong>
              </td>
              <td class="truncate">{{ r.landmark || 'N/A' }}</td>
              <td>{{ r.municipalities?.name }}</td>
              <td>{{ r.barangays?.name }}</td>
              <td>{{ r.purok_sitio }}</td>
              <td :class="{ 'muted-text': r.lineman_display === 'Unassigned' }">
                {{ r.lineman_display }}
              </td>
              <td>{{ formatTime(r.created_at) }}</td>
              <td>
                <div class="action-buttons">
                  <button @click="openAssign(r)" class="action-btn">Assign</button>
                  <router-link :to="`/admin/reports/${r.id}`" class="details-btn"
                    >See Details</router-link
                  >
                </div>
              </td>
            </tr>
            <tr v-if="activeReports.length === 0">
              <td colspan="11" class="text-center">No active incidents found.</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- RESOLVED INCIDENTS -->
      <section class="queue-panel">
        <div class="panel-header-row">
          <h3>Resolved Incidents</h3>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 40px">No.</th>
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
            <tr v-for="(r, index) in resolvedReports" :key="r.id">
              <td style="font-weight: 600; color: #64748b">
                {{ index + 1 }}
              </td>
              <td><span class="status-pill">Resolved</span></td>
              <td>
                <span :class="['priority-pill', getPriorityClass(r.report_types?.priority_level)]">
                  {{ r.report_types?.priority_level || 'Normal' }}
                </span>
              </td>
              <td>
                <strong>{{ r.users?.first_name }} {{ r.users?.last_name || 'Walk-in' }}</strong>
              </td>
              <td class="truncate">{{ r.landmark || 'N/A' }}</td>
              <td>{{ r.municipalities?.name }}</td>
              <td>{{ r.barangays?.name }}</td>
              <td>{{ r.purok_sitio }}</td>
              <td>{{ r.lineman_display }}</td>
              <td>{{ formatTime(r.created_at) }}</td>
              <td>
                <div class="action-buttons">
                  <button class="action-btn" disabled style="opacity: 0.6; cursor: not-allowed">
                    Done
                  </button>
                  <router-link :to="`/admin/reports/${r.id}`" class="details-btn"
                    >See Details</router-link
                  >
                </div>
              </td>
            </tr>
            <tr v-if="resolvedReports.length === 0">
              <td colspan="11" class="text-center">No resolved incidents found.</td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>

    <!-- MANUAL REPORT MODAL -->
    <div v-if="showManualModal" class="modal-overlay" @click.self="closeManualModal">
      <div class="manual-modal-card">
        <div class="manual-modal-header">
          <h2>Manual Report</h2>
          <p>Submit a new incident report to the queue.</p>
        </div>

        <div class="manual-modal-body">
          <div class="section-label"><MapPin class="icon" /> LOCATION DETAILS</div>

          <div class="form-row">
            <div class="input-group custom-dropdown-container">
              <label>Select Barangay <span class="req">*</span></label>
              <div class="dropdown-trigger-btn" @click="toggleBarangayDropdown">
                <span :class="{ 'muted-trigger': !selectedBarangayObj }">
                  {{ selectedBarangayObj ? selectedBarangayObj.name : 'Search or select...' }}
                </span>
                <ChevronDown :size="16" class="dropdown-chevron" />
              </div>

              <div v-if="isBarangayDropdownOpen" class="dropdown-popover">
                <div class="popover-search-box">
                  <Search :size="14" class="search-input-icon" />
                  <input
                    v-model="barangaySearchQuery"
                    type="text"
                    class="search-input"
                    placeholder="Search barangays..."
                  />
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
                    No barangays found.
                  </div>
                </div>
              </div>
            </div>

            <div class="input-group">
              <label>Purok / Street <span class="req">*</span></label>
              <input v-model="manualReport.purok" placeholder="" class="std-input" />
            </div>
          </div>

          <div class="section-label" style="margin-top: 16px">
            <AlertTriangle class="icon" /> ISSUE DETAILS
          </div>

          <div class="input-group custom-dropdown-container" style="margin-bottom: 12px">
            <label>Select Issue Type <span class="req">*</span></label>
            <div class="dropdown-trigger-btn" @click="toggleTypeDropdown">
              <span :class="{ 'muted-trigger': !selectedTypeObj }">
                {{ selectedTypeObj ? selectedTypeObj.name : 'Choose issue category...' }}
              </span>
              <ChevronDown :size="16" class="dropdown-chevron" />
            </div>

            <div v-if="isTypeDropdownOpen" class="dropdown-popover">
              <div class="popover-search-box">
                <Search :size="14" class="search-input-icon" />
                <input
                  v-model="typeSearchQuery"
                  type="text"
                  class="search-input"
                  placeholder="Search issues..."
                />
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
                  No issues found.
                </div>
              </div>
            </div>
          </div>

          <div class="input-group">
            <label>Description</label>
            <textarea
              v-model="manualReport.description"
              placeholder="Provide additional details about the incident, exact landmarks, or potential hazards..."
              class="std-textarea"
            ></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeManualModal" class="btn-cancel">Cancel</button>
          <button @click="submitManualReport" class="btn-submit">
            <FilePlus :size="14" /> Submit Report
          </button>
        </div>
      </div>
    </div>

    <!-- CUSTOM VALIDATION MODAL -->
    <div
      v-if="showValidationModal"
      class="modal-overlay"
      style="z-index: 1050"
      @click.self="closeValidationModal"
    >
      <div class="validation-modal-card">
        <div class="validation-content">
          <div class="validation-icon-wrapper">
            <div class="validation-icon">!</div>
          </div>
          <div class="validation-text">
            <h3>Validation Required</h3>
            <p>Please select both Barangay and Issue Type.</p>
          </div>
        </div>
        <div class="validation-footer">
          <button @click="closeValidationModal" class="btn-ok">OK</button>
        </div>
      </div>
    </div>

    <!-- DISPATCH TIME VALIDATION MODAL (ADMIN LOCK) -->
    <div
      v-if="showTimeLockModal"
      class="modal-overlay"
      style="z-index: 1050"
      @click.self="showTimeLockModal = false"
    >
      <div class="time-lock-card">
        <div class="time-lock-header">
          <Info class="info-icon" :size="20" />
          <h3>Dispatch Time</h3>
        </div>
        <div class="time-lock-body">
          <p>
            Admin assigning is locked right now. 8:00 AM to 5:00 PM is reserved for Branch Only to
            dispatch.
          </p>
          <p>Please wait for the Admin dispatch window (5:01 PM - 7:59 AM).</p>
        </div>
        <div class="time-lock-footer">
          <button @click="showTimeLockModal = false" class="btn-primary-ok">OK</button>
        </div>
      </div>
    </div>

    <!-- ASSIGN LINEMAN MODAL -->
    <div v-if="showAssignModal" class="modal-overlay" @click.self="showAssignModal = false">
      <div class="assign-modal-card">
        <h3>Assign Lineman</h3>
        <p>Select an available lineman to dispatch to this location.</p>

        <div class="assign-search-row">
          <div class="search-input-wrapper">
            <Search class="search-icon" :size="16" />
            <input
              v-model="assignSearchQuery"
              type="text"
              placeholder="Search linemen by name or branch..."
              class="assign-search-input"
            />
          </div>
          <button class="assign-filter-btn"><Filter :size="16" /> Filter</button>
        </div>

        <div class="table-scroll-wrapper">
          <table class="lineman-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Branch</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="l in filteredLinemen" :key="l.id">
                <td>
                  <strong>{{ l.name }}</strong>
                </td>
                <td class="muted-text">{{ l.branch }}</td>
                <td>
                  <span
                    :class="[
                      'lineman-status',
                      l.status === 'Available' ? 'status-available' : 'status-on-job',
                    ]"
                  >
                    {{ l.status || 'Available' }}
                  </span>
                </td>
                <td>
                  <button
                    class="assign-action-btn"
                    :disabled="l.status !== 'Available' || isAssigned(l.id)"
                    @click="assignSingleLineman(l.id)"
                  >
                    {{ isAssigned(l.id) ? 'Assigned' : 'Assign' }}
                  </button>
                </td>
              </tr>
              <tr v-if="filteredLinemen.length === 0">
                <td colspan="4" class="text-center" style="padding: 24px">
                  No matching linemen found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          class="modal-footer"
          style="padding: 0; background: transparent; border: none; margin-top: 16px"
        >
          <button @click="showAssignModal = false" class="btn-close-modal">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/services/supabase'
import { sendNotification } from '@/utils/notifications.js'
import { useSystemAlerts } from '@/composables/useSystemAlerts'
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
  MapPin,
  Search,
  Filter,
  ChevronDown,
} from 'lucide-vue-next'

const { addAlert } = useSystemAlerts()

const pendingReports = ref([])
const reportTypes = ref([])
const barangays = ref([])

const showManualModal = ref(false)
const showValidationModal = ref(false)
const showTimeLockModal = ref(false) // State for new Time Validation modal
const manualReport = ref({
  type_id: null,
  barangay_id: null,
  purok: '',
  description: '',
  municipality_id: null,
})

// Custom Dropdown States
const isBarangayDropdownOpen = ref(false)
const isTypeDropdownOpen = ref(false)
const barangaySearchQuery = ref('')
const typeSearchQuery = ref('')
const selectedBarangayObj = ref(null)
const selectedTypeObj = ref(null)

const showAssignModal = ref(false)
const selectedReport = ref(null)
const availableLinemen = ref([])
const assignSearchQuery = ref('')

const assignedCount = ref(0)
const totalReportsCount = ref(0)
const onlineLinemenCount = ref(0)
const currentPriorityFilter = ref('All')
let refreshIntervalId = null

const now = ref(new Date())
let timerInterval = null

// Admin can ONLY assign from 5:01 PM to 7:59 AM
const isAdminPhase = computed(() => {
  const hour = now.value.getHours()
  const minute = now.value.getMinutes()

  // 8:00 AM (8:00) to exactly 5:00 PM (17:00) belongs to the Branch
  if (hour >= 8 && hour < 17) {
    return false
  }
  if (hour === 17 && minute === 0) {
    return false
  }

  // Outside of branch hours, it's Admin phase
  return true
})

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

// --- Custom Dropdown Computed Logic ---
const groupedBarangays = computed(() => {
  const query = barangaySearchQuery.value.toLowerCase().trim()
  const map = {}
  barangays.value.forEach((b) => {
    const muniName = (b.municipalities?.name || 'UNKNOWN MUNICIPALITY').toUpperCase()
    if (!query || b.name.toLowerCase().includes(query) || muniName.toLowerCase().includes(query)) {
      if (!map[muniName]) map[muniName] = []
      map[muniName].push(b)
    }
  })
  return map
})

const groupedReportTypes = computed(() => {
  const query = typeSearchQuery.value.toLowerCase().trim()
  const map = {}

  // Added 'OTHER' to the priority order array
  const priorityOrder = ['CRITICAL', 'HIGH', 'NORMAL', 'LOW', 'OTHER']

  reportTypes.value.forEach((t) => {
    // Changed fallback from 'NORMAL' to 'OTHER'
    const prio = (t.priority_level || 'OTHER').toUpperCase()
    if (!query || t.name.toLowerCase().includes(query) || prio.toLowerCase().includes(query)) {
      if (!map[prio]) map[prio] = []
      map[prio].push(t)
    }
  })

  const sortedMap = {}
  priorityOrder.forEach((p) => {
    if (map[p] && map[p].length > 0) sortedMap[p] = map[p]
  })
  return sortedMap
})

// --- Dropdown Triggers ---
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
  manualReport.value = {
    type_id: null,
    barangay_id: null,
    purok: '',
    description: '',
    municipality_id: null,
  }
  selectedBarangayObj.value = null
  selectedTypeObj.value = null
}

const closeValidationModal = () => {
  showValidationModal.value = false
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

const fetchAll = async () => {
  const { data, error } = await supabase
    .from('reports')
    .select(
      `
      *, report_statuses(name), report_types(name, priority_level), users!residents_id(first_name, last_name),
      barangays(name), municipalities(name), assignments(lineman_id, users!lineman_id(first_name, last_name))
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

  pendingReports.value = supabaseReports
  totalReportsCount.value = pendingReports.value.length

  const { data: types } = await supabase.from('report_types').select('*')
  reportTypes.value = types || []

  const { data: munis } = await supabase.from('municipalities').select('id, name')
  const muniMap = {}
  if (munis) {
    munis.forEach((m) => {
      muniMap[m.id] = m.name
    })
  }

  const { data: brgys } = await supabase.from('barangays').select('id, name, municipality_id')
  barangays.value = (brgys || []).map((b) => ({
    ...b,
    municipalities: { name: muniMap[b.municipality_id] || 'Unknown Municipality' },
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
    // Replaced native alert with custom validation modal
    showValidationModal.value = true
    return
  }

  const { error } = await supabase.from('reports').insert([
    {
      description: manualReport.value.description || 'EMPTY',
      report_type_id: manualReport.value.type_id,
      landmark: 'Walk-in Report',
      barangay_id: manualReport.value.barangay_id,
      purok_sitio: manualReport.value.purok,
      status_id: 2,
      municipality_id: manualReport.value.municipality_id || 1,
      latitude: 16.716173,
      longitude: 121.678825,
    },
  ])

  if (error) {
    alert('Error: ' + error.message)
  } else {
    // Show success notification
    addAlert({
      title: 'Manual Report Submitted',
      message: 'The incident has been successfully logged and added to the active queue.',
      severity: 'low',
    })

    closeManualModal()
    fetchAll()
  }
}

// Assignment Modal Logic
const filteredLinemen = computed(() => {
  if (!assignSearchQuery.value) return availableLinemen.value
  const q = assignSearchQuery.value.toLowerCase()
  return availableLinemen.value.filter(
    (l) => l.name.toLowerCase().includes(q) || l.branch.toLowerCase().includes(q),
  )
})

const isAssigned = (uid) => {
  return selectedReport.value?.assignments?.some((a) => a.lineman_id === uid)
}

const openAssign = async (r) => {
  // Enforce Admin strict time block lock
  if (!isAdminPhase.value) {
    showTimeLockModal.value = true
    return
  }

  selectedReport.value = r
  assignSearchQuery.value = ''

  // Load Linemen for Admin to dispatch globally
  const { data: usersData } = await supabase
    .from('users')
    .select('id, first_name, last_name, is_active')
    .eq('role_id', 9)
  const { data: empData } = await supabase
    .from('employees')
    .select('user_id, branch_id, is_available')
  const { data: branchData } = await supabase.from('iselco_branch').select('branch_id, branch_name')

  availableLinemen.value =
    usersData?.map((user) => {
      const emp = empData?.find((e) => e.user_id === user.id)
      const branch = branchData?.find((b) => b.branch_id === emp?.branch_id)
      return {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        branch: branch?.branch_name || 'Unassigned Branch',
        status: user.is_active ? 'Available' : 'On Job',
      }
    }) || []

  showAssignModal.value = true
}

const assignSingleLineman = async (uid) => {
  if (!selectedReport.value) return

  const { error } = await supabase.from('assignments').insert({
    report_id: selectedReport.value.id,
    lineman_id: uid,
    assigned_at: new Date().toISOString(),
    inprogress_at: new Date().toISOString(),
  })

  if (!error) {
    sendNotification('Assignment Updated', `Assigned to report ${selectedReport.value.id}`, uid)
    if (!selectedReport.value.assignments) selectedReport.value.assignments = []
    selectedReport.value.assignments.push({ lineman_id: uid })

    // Show success notification
    addAlert({
      title: 'Lineman Dispatched',
      message: 'The selected lineman has been successfully assigned to the incident.',
      severity: 'low',
    })
  } else {
    alert('Error assigning lineman: ' + error.message)
  }

  fetchAll()
}

onMounted(() => {
  fetchAll()
  refreshIntervalId = setInterval(fetchAll, 5000)
  timerInterval = setInterval(() => (now.value = new Date()), 1000)
})

onUnmounted(() => {
  if (refreshIntervalId) clearInterval(refreshIntervalId)
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<style scoped>
.dashboard-root {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
  font-family: 'Inter', sans-serif;
  color: #0f172a;
}
.content {
  flex-grow: 1;
  padding: 0 16px 16px;
  overflow-x: hidden;
}

:deep(.topbar-container) {
  margin-bottom: 16px;
}

/* Hero Section */
.hero-section {
  background: #283593;
  padding: 20px 24px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
.hero-text h1 {
  margin: 0 0 4px;
  font-size: 1.6rem;
  color: white;
  font-weight: 700;
}
.hero-text p {
  margin: 0;
  font-size: 0.85rem;
  color: #cbd5e1;
}
.manual-dispatch-btn {
  background: #fde047;
  color: #0f172a;
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: opacity 0.2s;
}
.manual-dispatch-btn:hover {
  opacity: 0.9;
}

/* Operational Overview */
.overview-section {
  margin-bottom: 16px;
}
.operational-overview-card {
  background: #1e1b4b;
  border-radius: 8px;
  padding: 16px 24px;
  color: white;
  margin-bottom: 12px;
}
.overview-header {
  font-size: 0.95rem;
  font-weight: 700;
  margin-bottom: 12px;
}
.overview-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.o-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: relative;
  padding: 0 16px;
}
.o-stat:first-child {
  padding-left: 0;
}
.o-stat:last-child {
  padding-right: 0;
}
.o-stat:not(:last-child)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 10%;
  bottom: 10%;
  width: 1px;
  background: rgba(255, 255, 255, 0.2);
}
.o-stat span {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.7rem;
  color: #cbd5e1;
  text-transform: uppercase;
  font-weight: 700;
  margin-bottom: 6px;
}
.stat-icon {
  width: 14px;
  height: 14px;
}
.o-stat h2 {
  font-size: 1.8rem;
  font-weight: 800;
  margin: 0;
  color: white;
}
.active-status {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dot {
  width: 10px;
  height: 10px;
  background: #4ade80;
  border-radius: 50%;
}

/* Priority Cards */
.priority-cards-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.p-card {
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.p-card span {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.p-icon {
  width: 14px;
  height: 14px;
}
.p-card h2 {
  font-size: 1.8rem;
  font-weight: 800;
  margin: 0;
}
.p-card.critical {
  background: #f87171;
  color: #7f1d1d;
  border: 1px solid #dc2626;
}
.p-card.high {
  background: #fde047;
  color: #78350f;
  border: 1px solid #ca8a04;
}
.p-card.normal {
  background: #93c5fd;
  color: #1e3a8a;
  border: 1px solid #2563eb;
}
.p-card.low {
  background: #e2e8f0;
  color: #334155;
  border: 1px solid #475569;
}

/* Queue Tables */
.queue-panel {
  padding: 16px;
  border-radius: 8px;
  background: white;
  border: 1px solid #cbd5e1;
  margin-bottom: 16px;
}
.panel-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.queue-panel h3 {
  margin: 0;
  font-size: 1.05rem;
  color: #1e1b4b;
  font-weight: 700;
}
.filter-controls {
  display: flex;
  gap: 6px;
}
.filter-btn {
  padding: 4px 12px;
  border: 1px solid #cbd5e1;
  background: white;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
}
.filter-btn.active {
  background: #1e1b4b;
  color: white;
  border-color: #1e1b4b;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th {
  text-align: left;
  font-weight: 700;
  font-size: 0.65rem;
  color: #64748b;
  padding: 10px 12px;
  border-bottom: 1px solid #e2e8f0;
}
.data-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.8rem;
}
.truncate {
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.muted-text {
  color: #94a3b8;
  font-style: italic;
}

.status-pill {
  background: #e2e8f0;
  color: #475569;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
}
.priority-pill {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
}
.priority-critical {
  background: #f87171;
  color: white;
}
.priority-high {
  background: #fde047;
  color: #0f172a;
}
.priority-normal {
  background: #93c5fd;
  color: #0f172a;
}
.priority-low {
  background: #f1f5f9;
  color: #0f172a;
}

.action-buttons {
  display: flex;
  gap: 6px;
}
.action-btn {
  background: #1e1b4b;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
}
.details-btn {
  background: white;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 3px 12px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}
.text-center {
  text-align: center;
  color: #64748b;
  padding: 24px;
}

/* MODALS */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

/* Dispatch Time Validation Modal (Design Match) */
.time-lock-card {
  background: white;
  border-radius: 6px;
  border: 1px solid #a5b4fc;
  width: 460px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
}
.time-lock-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
}
.time-lock-header .info-icon {
  color: #2563eb;
}
.time-lock-header h3 {
  margin: 0;
  font-size: 1.05rem;
  color: #1e293b;
  font-weight: 600;
}
.time-lock-body {
  padding: 24px 20px;
  color: #475569;
  font-size: 0.95rem;
  line-height: 1.5;
}
.time-lock-body p {
  margin: 0 0 16px 0;
}
.time-lock-body p:last-child {
  margin-bottom: 0;
}
.time-lock-footer {
  padding: 14px 20px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
}
.btn-primary-ok {
  background: #2563eb;
  color: white;
  border: none;
  padding: 8px 24px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-primary-ok:hover {
  background: #1d4ed8;
}

/* Validation Required Modal */
.validation-modal-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #a5b4fc;
  width: 360px;
  padding: 24px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.validation-content {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
.validation-icon-wrapper {
  background: #f1f5f9;
  padding: 12px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.validation-icon {
  background: #1e1b4b;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}
.validation-text {
  flex: 1;
}
.validation-text h3 {
  margin: 0 0 8px 0;
  font-size: 1.15rem;
  color: #0f172a;
  font-weight: 700;
}
.validation-text p {
  margin: 0;
  font-size: 0.85rem;
  color: #475569;
  line-height: 1.4;
}
.validation-footer {
  display: flex;
  justify-content: flex-end;
}
.btn-ok {
  background: #1e1b4b;
  color: white;
  border: none;
  padding: 10px 28px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn-ok:hover {
  opacity: 0.9;
}

/* Manual Report Modal */
.manual-modal-card {
  background: white;
  border-radius: 8px;
  width: 460px;
  overflow: visible;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}
.manual-modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
}
.manual-modal-header h2 {
  margin: 0 0 4px 0;
  font-size: 1.15rem;
  color: #1e1b4b;
  font-weight: 700;
}
.manual-modal-header p {
  margin: 0;
  font-size: 0.8rem;
  color: #64748b;
}
.manual-modal-body {
  padding: 20px;
}
.section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.7rem;
  font-weight: 700;
  color: #1e1b4b;
  text-transform: uppercase;
  margin-bottom: 10px;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 6px;
}
.section-label .icon {
  color: #d97706;
  width: 14px;
  height: 14px;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}
.input-group label {
  display: block;
  font-size: 0.7rem;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 4px;
}
.input-group label span.req {
  color: #ef4444;
}
.std-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.8rem;
  color: #0f172a;
  background: white;
  box-sizing: border-box;
}
.std-textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.8rem;
  color: #0f172a;
  min-height: 70px;
  resize: vertical;
  box-sizing: border-box;
}

/* CUSTOM DROPDOWN STYLES */
.custom-dropdown-container {
  position: relative;
  width: 100%;
}
.dropdown-trigger-btn {
  width: 100%;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 8px 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  box-sizing: border-box;
}
.dropdown-trigger-btn span {
  font-size: 0.8rem;
  font-weight: 500;
  color: #0f172a;
}
.dropdown-trigger-btn span.muted-trigger {
  color: #94a3b8;
}
.dropdown-chevron {
  color: #64748b;
}
.dropdown-popover {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 6px;
  z-index: 1050;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}
.popover-search-box {
  position: relative;
  margin-bottom: 6px;
}
.search-input {
  width: 100%;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 6px 8px 6px 28px;
  font-size: 0.75rem;
  outline: none;
  box-sizing: border-box;
}
.search-input-icon {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}
.popover-scroll-list {
  max-height: 180px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.group-header-label {
  font-size: 0.6rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  margin: 4px 0 2px 4px;
}
.group-option-box {
  padding: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  color: #0f172a;
  cursor: pointer;
  border-radius: 4px;
}
.group-option-box:hover {
  background: #f1f5f9;
}
.no-result-text {
  font-size: 0.75rem;
  color: #94a3b8;
  padding: 6px;
  text-align: center;
}

/* Assign Lineman Modal */
.assign-modal-card {
  background: white;
  border-radius: 8px;
  width: 600px;
  padding: 20px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}
.assign-modal-card h3 {
  margin: 0 0 4px 0;
  font-size: 1.1rem;
  color: #1e1b4b;
}
.assign-modal-card p {
  margin: 0 0 16px 0;
  font-size: 0.8rem;
  color: #64748b;
}
.assign-search-row {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}
.search-input-wrapper {
  position: relative;
  flex: 1;
}
.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}
.assign-search-input {
  width: 100%;
  padding: 8px 10px 8px 32px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.8rem;
  box-sizing: border-box;
}
.assign-filter-btn {
  padding: 8px 12px;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.table-scroll-wrapper {
  max-height: 220px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}
.lineman-table {
  width: 100%;
  border-collapse: collapse;
}
.lineman-table th {
  position: sticky;
  top: 0;
  background: #f8fafc;
  text-align: left;
  font-size: 0.65rem;
  color: #64748b;
  padding: 10px;
  border-bottom: 1px solid #e2e8f0;
  z-index: 10;
}
.lineman-table td {
  padding: 10px;
  font-size: 0.8rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}
.lineman-status {
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 600;
}
.status-available {
  background: #dcfce7;
  color: #166534;
}
.status-on-job {
  background: #fee2e2;
  color: #991b1b;
}
.assign-action-btn {
  background: #2563eb;
  color: white;
  border: none;
  padding: 5px 12px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.75rem;
  cursor: pointer;
}
.assign-action-btn:disabled {
  background: #e2e8f0;
  color: #94a3b8;
  cursor: not-allowed;
}

/* Common Modal Footer */
.modal-footer {
  padding: 12px 20px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.btn-cancel {
  background: white;
  border: 1px solid #cbd5e1;
  color: #1e1b4b;
  padding: 6px 14px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
}
.btn-submit {
  background: #1e1b4b;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}
.btn-close-modal {
  background: #1e1b4b;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
}
</style>
