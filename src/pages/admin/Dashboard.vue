<!-- Dashboard.vue -->
<template>
  <div class="dashboard-root">
    <Sidebar />
    <div class="main-wrapper">
      <Topbar />

      <header class="hero-banner">
        <div class="hero-glass-box">
          <div class="hero-text">
            <!-- Dynamic greeting applied here -->
            <h1>{{ greeting }}, Administrator</h1>
            <p>
              Manage accounts, validate and prioritizing incoming reports, dispatch linemen,
              generate descriptive analytics, and post targeted power advisories.
            </p>
          </div>
        </div>
      </header>

      <div class="dashboard-content-grid">
        <div class="left-column">
          <MetricSummaryCards
            :period="currentPeriod"
            :branchId="branchId"
            @update:period="currentPeriod = $event"
            @metricsUpdated="handleMetricsUpdate"
          />

          <div class="middle-row-grid">
            <div class="eff-col">
              <div class="totals-row">
                <div class="total-card">
                  <span class="total-card-label"> <FileText :size="28" /> TOTAL REPORT </span>
                  <span class="total-card-value">{{ stats[0].value }}</span>
                </div>
                <div class="total-card">
                  <span class="total-card-label"> <Users :size="28" /> TOTAL LINEMAN </span>
                  <span class="total-card-value">{{ stats[1].value }}</span>
                </div>
              </div>

              <div class="left-efficiency-card">
                <div class="left-eff-header">
                  <span>EFFICIENCY</span>
                  <span class="left-eff-value">{{ gridEfficiency }}%</span>
                </div>
                <div class="left-eff-bar-bg">
                  <div class="left-eff-bar-fill" :style="{ width: gridEfficiency + '%' }"></div>
                </div>
                <div class="left-eff-desc">
                  CALCULATED PERFORMANCE BASED ON<br />THE RESOLUTION OF TOTAL SYSTEM REPORTS.
                </div>
              </div>
            </div>

            <section
              class="chart-container"
              style="
                margin: 0;
                display: flex;
                flex-direction: column;
                height: 100%;
                padding-top: 16px;
              "
            >
              <div class="chart-wrapper pie-wrapper" style="flex-grow: 1; height: 100%">
                <OutageStatusPie />
              </div>
            </section>
          </div>

          <!-- SYSTEM LOAD & CONSUMPTION -->
          <IncidentChart :branchId="branchId" />

          <!-- TOP BARANGAYS -->
          <TopBarangaysChart :branchId="branchId" />

          <!-- Incident List section removed and transferred to new page -->
        </div>

        <aside class="right-sidebar">
          <div class="rs-panel">
            <div class="ttd-header">
              <div class="ttd-left">
                <Clock :size="16" />
                <span>TIME TO<br />DISPATCH</span>
              </div>
              <div class="ttd-right">
                <span>CURRENT PHASE</span>
                <span
                  class="ttd-pill"
                  :style="{
                    backgroundColor: isBranchPhase ? '#fde047' : '#3b82f6',
                    color: isBranchPhase ? '#1e1b4b' : 'white',
                  }"
                >
                  {{ isBranchPhase ? 'BRANCH' : 'ADMIN' }}
                </span>
                <span>WORKING HOUR</span>
              </div>
            </div>
            <div class="ttd-timer-box">
              <h3>{{ timeUntilNextPhase }}</h3>
              <span>{{ nextPhaseSubtitle }}</span>
            </div>
            <div class="ttd-footer">{{ dispatchInfoText }}</div>
          </div>

          <button @click="openManualModal" class="rs-manual-btn">MANUAL REPORT</button>

          <div class="rs-panel">
            <div class="rs-title">ACTIVE INCIDENTS</div>
            <div
              v-if="activeIncidentsList.length === 0"
              style="font-size: 0.7rem; color: rgba(255, 255, 255, 0.6); text-align: center"
            >
              No unassigned incidents found.
            </div>
            <div v-else v-for="inc in activeIncidentsList" :key="inc.id" class="rs-inner-card">
              <div
                class="inc-prio"
                :class="getPriorityColorClass(inc.report_types?.priority_level)"
              >
                {{ inc.report_types?.priority_level || 'NORMAL' }}
              </div>
              <div class="inc-title">{{ inc.report_types?.name || 'GENERAL INCIDENT' }}</div>
              <div class="inc-sub">
                {{
                  inc.users?.first_name
                    ? inc.users.first_name + ' ' + inc.users.last_name
                    : 'WALK IN'
                }}
              </div>
              <div class="inc-actions">
                <button class="inc-btn" @click="openAssign(inc)">ASSIGN</button>
                <router-link :to="`/admin/reports/${inc.id}`" class="inc-btn" style="display: block"
                  >DETAILS</router-link
                >
              </div>
            </div>
          </div>

          <div class="rs-panel">
            <div class="rs-title">SYSTEM ALERTS</div>
            <div
              v-if="systemAlerts.length === 0"
              style="font-size: 0.7rem; color: rgba(255, 255, 255, 0.6); text-align: center"
            >
              No recent alerts.
            </div>
            <div v-else v-for="alert in systemAlerts" :key="alert.id" class="rs-inner-card">
              <div class="alert-row">
                <div class="alert-left">
                  <span
                    class="alert-prio"
                    :class="getPriorityColorClass(alert.report_types?.priority_level)"
                  >
                    {{ alert.report_types?.priority_level || 'Unassigned' }} Priority
                  </span>
                  <span class="alert-title">{{
                    alert.report_types?.name || 'New Incident Logged'
                  }}</span>
                </div>
                <span class="alert-time">{{ timeAgo(alert.created_at) }}</span>
              </div>
            </div>
          </div>

          <div class="rs-panel">
            <div class="rs-title">RECENT ACTIVITY</div>
            <div
              v-if="recentActivities.length === 0"
              style="font-size: 0.7rem; color: rgba(255, 255, 255, 0.6); text-align: center"
            >
              No recent activity.
            </div>
            <div
              v-else
              v-for="activity in recentActivities"
              :key="activity.id"
              class="rs-inner-card"
            >
              <div class="alert-row">
                <div class="alert-left">
                  <span class="alert-title">{{ activity.title }}</span>
                </div>
                <span class="alert-time">{{ timeAgo(activity.created_at) }}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>

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
            <Search class="search-input-icon" :size="16" style="left: 10px" />
            <input
              v-model="assignSearchQuery"
              type="text"
              placeholder="Search linemen by name or branch..."
              class="assign-search-input"
            />
          </div>
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
                    :disabled="l.status !== 'Available' || l.isJustAssigned"
                    @click="assignSingleLineman(l.id)"
                  >
                    {{ l.isJustAssigned ? 'Assigned' : 'Assign' }}
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
import { useRouter } from 'vue-router'
import {
  FileText,
  Users,
  LayoutDashboard,
  MapPin,
  Search,
  ChevronDown,
  AlertTriangle,
  FilePlus,
  Clock,
  Info,
} from 'lucide-vue-next'
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'
import IncidentChart from '@/components/analytics/IncidentChart.vue'
import TopBarangaysChart from '@/components/analytics/TopBarangaysChart.vue'
import MetricSummaryCards from '@/components/analytics/MetricSummaryCards.vue'
import OutageStatusPie from '@/components/analytics/OutageStatusPie.vue'
import { supabase } from '@/services/supabase'
import { sendNotification } from '@/utils/notifications.js'
import { useSystemAlerts } from '@/composables/useSystemAlerts'

import '@/assets/style/Dashboard.css'

const router = useRouter()
const { addAlert } = useSystemAlerts()

const activeIncidentsList = ref([])
const systemAlerts = ref([])
const recentActivities = ref([])
const currentPeriod = ref('Day')
const branchId = ref(null)

const globalMetrics = ref({ totalReports: 0, totalResolved: 0 })
const stats = ref([
  { title: 'TOTAL REPORTS', value: '0', icon: FileText },
  { title: 'ACTIVE LINEMEN', value: '0', icon: Users },
])

const showManualModal = ref(false)
const showValidationModal = ref(false)
const showTimeLockModal = ref(false)
const manualReport = ref({
  type_id: null,
  barangay_id: null,
  purok: '',
  description: '',
  municipality_id: null,
})
const barangays = ref([])
const reportTypes = ref([])
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

const now = ref(new Date())
let timerInterval = null

const isBranchPhase = computed(() => {
  const hour = now.value.getHours()
  const minute = now.value.getMinutes()

  if (hour >= 8 && hour < 17) {
    return true
  }
  if (hour === 17 && minute === 0) {
    return true
  }
  return false
})

const currentDispatchPhase = computed(() => (isBranchPhase.value ? 'Branch Only' : 'Admin Only'))
const dispatchInfoText = computed(() =>
  isBranchPhase.value
    ? '8:00am to 5:00pm branch only assigned but the admin is not assigned'
    : '5:00pm to 8:00am admin only assigned but the branch is not assigned',
)

const nextPhaseSubtitle = computed(() =>
  isBranchPhase.value ? 'Time until Admin Window' : 'Time until Branch Window',
)

const timeUntilNextPhase = computed(() => {
  const current = now.value
  const hour = current.getHours()
  let target = new Date(current)

  if (isBranchPhase.value) {
    target.setHours(17, 0, 0, 0)
  } else {
    target.setHours(8, 0, 0, 0)
    if (hour >= 17) target.setDate(target.getDate() + 1)
  }

  const diff = target - current
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const m = Math.floor((diff / 1000 / 60) % 60)
  const s = Math.floor((diff / 1000) % 60)

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const greeting = computed(() => {
  const hour = now.value.getHours()
  if (hour < 12) return 'Good Morning'
  else if (hour < 17) return 'Good Afternoon'
  else return 'Good Evening'
})

const gridEfficiency = computed(() => {
  const total = globalMetrics.value.totalReports
  const resolved = globalMetrics.value.totalResolved
  if (total === 0) return '100.0'
  return ((resolved / total) * 100).toFixed(1)
})

const handleMetricsUpdate = (newMetrics) => {
  globalMetrics.value = newMetrics
  stats.value[0].value = newMetrics.totalReports.toString()
}

const loadActiveIncidents = async () => {
  const { data, error } = await supabase
    .from('reports')
    .select(
      `
      id, created_at, report_types(name, priority_level),
      users:residents_id(first_name, last_name), assignments(id)
    `,
    )
    .eq('status_id', 2)
    .order('created_at', { ascending: false })

  if (!error && data) {
    const unassignedOnly = data.filter((r) => !r.assignments || r.assignments.length === 0)
    activeIncidentsList.value = unassignedOnly.slice(0, 3)
  }
}

const loadSystemAlerts = async () => {
  const { data, error } = await supabase
    .from('reports')
    .select(`id, created_at, report_types(name, priority_level)`)
    .order('created_at', { ascending: false })
    .limit(3)
  if (!error) systemAlerts.value = data || []
}

const loadRecentActivity = async () => {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, title, created_at')
    .order('created_at', { ascending: false })
    .limit(3)
  if (!error) recentActivities.value = data || []
}

const fetchLinemenStats = async () => {
  const { count } = await supabase
    .from('employees')
    .select('*, users!inner(role_id)', { count: 'exact', head: true })
    .eq('users.role_id', 9)
    .eq('is_available', true)
  stats.value[1].value = (count || 0).toString()
}

const fetchDropdownData = async () => {
  const { data: types } = await supabase.from('report_types').select('*')
  reportTypes.value = types || []
  const { data: munis } = await supabase.from('municipalities').select('id, name')
  const muniMap = {}
  if (munis) munis.forEach((m) => (muniMap[m.id] = m.name))
  const { data: brgys } = await supabase.from('barangays').select('id, name, municipality_id')
  barangays.value = (brgys || []).map((b) => ({
    ...b,
    municipalities: { name: muniMap[b.municipality_id] || 'Unknown' },
  }))
}

const timeAgo = (dateString) => {
  if (!dateString) return ''
  const seconds = Math.floor((now.value - new Date(dateString)) / 1000)
  let interval = Math.floor(seconds / 31536000)
  if (interval >= 1) return interval + 'y ago'
  interval = Math.floor(seconds / 2592000)
  if (interval >= 1) return interval + 'mo ago'
  interval = Math.floor(seconds / 86400)
  if (interval >= 1) return interval + 'd ago'
  interval = Math.floor(seconds / 3600)
  if (interval >= 1) return interval + 'h ago'
  interval = Math.floor(seconds / 60)
  if (interval >= 1) return interval + 'm ago'
  return Math.floor(seconds) + 's ago'
}

const getPriorityColorClass = (level) => {
  if (!level) return 'text-grey'
  const lower = level.toLowerCase()
  if (lower === 'critical' || lower === 'high') return 'text-red'
  if (lower === 'normal' || lower === 'medium') return 'text-yellow'
  return 'text-blue'
}

const filteredLinemen = computed(() => {
  if (!assignSearchQuery.value) return availableLinemen.value
  const q = assignSearchQuery.value.toLowerCase()
  return availableLinemen.value.filter(
    (l) => l.name.toLowerCase().includes(q) || l.branch.toLowerCase().includes(q),
  )
})

const openAssign = async (incident) => {
  if (isBranchPhase.value) {
    showTimeLockModal.value = true
    return
  }

  selectedReport.value = incident
  assignSearchQuery.value = ''

  const { data: usersData } = await supabase
    .from('users')
    .select('id, first_name, last_name, is_active')
    .eq('role_id', 9)
  const { data: empData } = await supabase
    .from('employees')
    .select('user_id, branch_id, is_available')
  const { data: branchData } = await supabase.from('iselco_branch').select('branch_id, branch_name')

  availableLinemen.value = (usersData || []).map((user) => {
    const emp = empData?.find((e) => e.user_id === user.id)
    const branch = branchData?.find((b) => b.branch_id === emp?.branch_id)
    return {
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      branch: branch?.branch_name || 'Unassigned Branch',
      status: user.is_active ? 'Available' : 'On Job',
      isJustAssigned: false,
    }
  })

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
    sendNotification(
      'System: Dispatch Update',
      `Assigned to report ${selectedReport.value.id}`,
      uid,
    )

    addAlert({
      title: 'System Confirmation',
      message: 'Lineman successfully dispatched to the incident.',
      severity: 'low',
    })

    const linemanIndex = availableLinemen.value.findIndex((l) => l.id === uid)
    if (linemanIndex !== -1) {
      availableLinemen.value[linemanIndex].isJustAssigned = true
    }
    loadActiveIncidents()
  } else {
    alert('Error assigning lineman: ' + error.message)
  }
}

const groupedBarangays = computed(() => {
  const query = barangaySearchQuery.value.toLowerCase().trim()
  const map = {}
  barangays.value.forEach((b) => {
    const muniName = (b.municipalities?.name || 'UNKNOWN').toUpperCase()
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
  const priorityOrder = ['CRITICAL', 'HIGH', 'NORMAL', 'LOW', 'OTHER']

  reportTypes.value.forEach((t) => {
    const prio = (t.priority_level || 'OTHER').toUpperCase()

    if (!query || t.name.toLowerCase().includes(query) || prio.toLowerCase().includes(query)) {
      if (!map[prio]) map[prio] = []
      map[prio].push(t)
    }
  })

  const sortedMap = {}
  priorityOrder.forEach((p) => {
    if (map[p]) sortedMap[p] = map[p]
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

const openManualModal = () => (showManualModal.value = true)

const closeManualModal = () => {
  showManualModal.value = false
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

const submitManualReport = async () => {
  if (!manualReport.value.barangay_id || !manualReport.value.type_id) {
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
  if (error) alert('Error: ' + error.message)
  else {
    closeManualModal()
    loadActiveIncidents()
  }
}

onMounted(() => {
  loadActiveIncidents()
  loadSystemAlerts()
  loadRecentActivity()
  fetchLinemenStats()
  fetchDropdownData()
  timerInterval = setInterval(() => (now.value = new Date()), 1000)
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<style scoped>
/* Dispatch Time Validation Modal (Admin Lock) */
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

/* Validation Required Modal Styles (Matches Dashboard Theme) */
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
</style>
