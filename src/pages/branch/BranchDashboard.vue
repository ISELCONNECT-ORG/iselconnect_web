<!-- BranchDashboard.vue -->
<template>
  <div class="dashboard-root">
    <BranchSidebar />
    <div class="main-wrapper">
      <Topbar />

      <header class="hero-banner">
        <div class="hero-glass-box">
          <div class="hero-text">
            <h1>{{ greeting }}, {{ branchName }}</h1>
            <p>
              Manage accounts, prioritize incoming reports, dispatch linemen, generate descriptive
              analytics, and post targeted power advisories.
            </p>
          </div>
        </div>
      </header>

      <!-- Unified Loading State to prevent CSS Grid Collapse -->
      <div v-if="!branchId" class="loading-state">
        <div class="spinner"></div>
        <p>Loading Dashboard Data...</p>
      </div>

      <!-- Main Grid ONLY renders when data is perfectly ready -->
      <div v-else class="dashboard-content-grid">
        <div class="left-column">
          <!-- Cast branchId to String to satisfy Vue Prop validation -->
          <MetricSummaryCards
            :period="currentPeriod"
            :branchId="String(branchId)"
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

          <!-- AVERAGE RESPONSE TIME ANALYTICS (GRAPH VIEW) -->
          <div class="art-dashboard-grid">
            <!-- Filter Header -->
            <div class="art-header-row">
              <h3 class="section-title">RESPONSE TIME ANALYTICS</h3>
              <div class="period-toggle-group">
                <button
                  v-for="p in ['Day', 'Week', 'Month', 'Year']"
                  :key="p"
                  :class="{ 'active-period': artPeriod === p }"
                  @click="setArtPeriod(p)"
                  class="period-btn"
                >
                  {{ p }}
                </button>
              </div>
            </div>

            <!-- Branch ART Graph (Scanned to Current Branch) -->
            <section class="chart-container art-container">
              <h3><Clock :size="16" class="icon-inline" /> AVG RESPONSE TIME (MY BRANCH)</h3>
              <div
                v-if="branchART.length === 0"
                class="muted-text text-center"
                style="margin-top: 40px"
              >
                No data for this period.
              </div>
              <div v-else class="art-graph-container">
                <div v-for="branch in branchART" :key="branch.id" class="art-bar-group">
                  <div class="art-v-bar-bg">
                    <span class="art-v-bar-value" :class="{ 'text-red': branch.minutes > 60 }">
                      {{ branch.minutes }}m
                    </span>
                    <div
                      class="art-v-bar-fill"
                      :class="branch.minutes <= 60 ? 'bg-success' : 'bg-danger'"
                      :style="{ height: Math.min((branch.minutes / 120) * 100, 100) + '%' }"
                    ></div>
                  </div>
                  <span class="art-v-bar-label" :title="branch.fullName">{{ branch.name }}</span>
                </div>
              </div>
            </section>

            <!-- Lineman Team ART Graph (Scanned to Current Branch) -->
            <section class="chart-container art-container">
              <h3><Users :size="16" class="icon-inline" /> AVG RESPONSE TIME (MY TEAMS)</h3>
              <div
                v-if="linemanART.length === 0"
                class="muted-text text-center"
                style="margin-top: 40px"
              >
                No data for this period.
              </div>
              <div v-else class="art-graph-container">
                <div v-for="team in linemanART" :key="team.id" class="art-bar-group">
                  <div class="art-v-bar-bg">
                    <span class="art-v-bar-value" :class="{ 'text-red': team.minutes > 60 }">
                      {{ team.minutes }}m
                    </span>
                    <div
                      class="art-v-bar-fill"
                      :class="team.minutes <= 60 ? 'bg-success' : 'bg-danger'"
                      :style="{ height: Math.min((team.minutes / 120) * 100, 100) + '%' }"
                    ></div>
                  </div>
                  <span class="art-v-bar-label" :title="team.name">{{ team.name }}</span>
                </div>
              </div>
            </section>
          </div>

          <!-- SYSTEM LOAD & CONSUMPTION -->
          <IncidentChart :branchId="String(branchId)" />

          <!-- TOP BARANGAYS -->
          <TopBarangaysChart :branchId="String(branchId)" />
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
              <span>Time until {{ isBranchPhase ? 'Admin' : 'Branch' }} Window</span>
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
                <router-link
                  :to="`/branch/reports/${inc.id}`"
                  class="inc-btn"
                  style="display: block; width: 100%; text-align: center"
                >
                  DETAILS
                </router-link>
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
                    No barangays found for {{ branchName }}.
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
              placeholder="Provide additional details about the incident..."
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  FileText,
  Users,
  MapPin,
  Search,
  ChevronDown,
  AlertTriangle,
  FilePlus,
  Clock,
  Info,
} from 'lucide-vue-next'
import BranchSidebar from '@/components/BranchSidebar.vue'
import Topbar from '@/components/BranchTopbar.vue'
import IncidentChart from '@/components/analytics/IncidentChart.vue'
import TopBarangaysChart from '@/components/analytics/TopBarangaysChart.vue'
import MetricSummaryCards from '@/components/analytics/MetricSummaryCards.vue'
import OutageStatusPie from '@/components/analytics/OutageStatusPie.vue'
import { supabase } from '@/services/supabase'
import { useSystemAlerts } from '@/composables/useSystemAlerts'

// FIX: Changed this to match the Admin Dashboard stylesheet explicitly to guarantee layout matches
import '@/assets/style/Dashboard.css'

const router = useRouter()
const { addAlert } = useSystemAlerts()

const activeIncidentsList = ref([])
const systemAlerts = ref([])
const recentActivities = ref([])
const currentPeriod = ref('Day')
const branchId = ref(null)
const branchName = ref('Branch')

const globalMetrics = ref({ totalReports: 0, totalResolved: 0 })
const stats = ref([
  { title: 'TOTAL REPORTS', value: '0', icon: FileText },
  { title: 'ACTIVE LINEMEN', value: '0', icon: Users },
])

const showManualModal = ref(false)
const showValidationModal = ref(false)

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

const now = ref(new Date())
let timerInterval = null

// Average Response Time Variables
const branchART = ref([])
const linemanART = ref([])
const artPeriod = ref('Month') // Default filter

const setArtPeriod = (period) => {
  artPeriod.value = period
  loadAverageResponseTimes()
}

// Synchronized Dispatch Window Logic (8:00 AM to 5:00 PM exactly)
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
  const total = globalMetrics.value.totalReports || 0
  const resolved = globalMetrics.value.totalResolved || 0
  if (total === 0) return '100.0'
  return ((resolved / total) * 100).toFixed(1)
})

const handleMetricsUpdate = (newMetrics) => {
  globalMetrics.value = newMetrics || { totalReports: 0, totalResolved: 0 }
  stats.value[0].value = (globalMetrics.value.totalReports || 0).toString()
}

const fetchCurrentBranch = async () => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return

  // Use 'id' instead of 'email' for better auth safety
  const { data: userData } = await supabase
    .from('users')
    .select('branch_id, iselco_branch(branch_name)')
    .eq('id', user.id)
    .single()

  branchId.value = userData?.branch_id ?? null
  branchName.value = userData?.iselco_branch?.branch_name || 'Branch'

  if (branchId.value) {
    await Promise.all([
      loadActiveIncidents(),
      loadSystemAlerts(),
      loadRecentActivity(),
      fetchLinemenStats(),
      fetchDropdownData(),
      loadAverageResponseTimes(),
    ])
  }
}

const loadAverageResponseTimes = async () => {
  if (!branchId.value) return

  try {
    const currentDate = new Date()
    let startDate = new Date()

    if (artPeriod.value === 'Day') {
      startDate.setHours(0, 0, 0, 0)
    } else if (artPeriod.value === 'Week') {
      startDate.setDate(currentDate.getDate() - 7)
    } else if (artPeriod.value === 'Month') {
      startDate.setMonth(currentDate.getMonth() - 1)
    } else if (artPeriod.value === 'Year') {
      startDate.setFullYear(currentDate.getFullYear() - 1)
    }
    const isoStart = startDate.toISOString()

    // 1. Fetch only reports matching this branch ID
    const { data: reportsData, error: reportsErr } = await supabase
      .from('reports')
      .select(
        `
        id,
        branch_id,
        resolution_time,
        created_at,
        assignments ( lineman_id )
      `,
      )
      .eq('branch_id', branchId.value)
      .not('resolution_time', 'is', null)
      .gte('created_at', isoStart)

    if (reportsErr) throw reportsErr

    // 2. Fetch Teams
    const { data: teamsData, error: teamsErr } = await supabase.from('lineman_teams').select('*')

    if (teamsErr) throw teamsErr

    const parseTime = (timeStr) => {
      if (!timeStr) return 0
      let m = 0
      const hours = timeStr.match(/(\d+)h/)
      const mins = timeStr.match(/(\d+)m/)
      const secs = timeStr.match(/(\d+)s/)

      if (hours) m += parseInt(hours[1], 10) * 60
      if (mins) m += parseInt(mins[1], 10)
      if (!hours && !mins && secs && parseInt(secs[1], 10) > 0) m = 1
      return m
    }

    const bStats = { [branchId.value]: { total: 0, count: 0 } }
    const tStats = {}

    ;(reportsData || []).forEach((r) => {
      const mins = parseTime(r.resolution_time)

      // Track Branch Average
      if (bStats[branchId.value]) {
        bStats[branchId.value].total += mins
        bStats[branchId.value].count += 1
      }

      // Track Team Average
      if (r.assignments && r.assignments.length > 0 && teamsData) {
        const linemanId = r.assignments[0].lineman_id
        const team = teamsData.find((t) => t.team_members && t.team_members.includes(linemanId))

        if (team) {
          const tName = team.team_name || `Team ${team.id}`
          if (!tStats[tName]) tStats[tName] = { total: 0, count: 0 }
          tStats[tName].total += mins
          tStats[tName].count += 1
        }
      }
    })

    // Setup UI for My Branch
    if (bStats[branchId.value].count > 0) {
      let shortName = branchName.value
        .replace(' Branch Office', '')
        .replace(' Sub Office', '')
        .replace(' Sub-Office', '')
        .replace(' Office', '')
        .replace('ISELCO-1 ', '')

      branchART.value = [
        {
          id: branchId.value,
          fullName: branchName.value,
          name: shortName,
          minutes: Math.round(bStats[branchId.value].total / bStats[branchId.value].count),
        },
      ]
    } else {
      branchART.value = []
    }

    // Setup UI for My Teams (Top 5)
    linemanART.value = Object.keys(tStats)
      .map((name, index) => ({
        id: index,
        name,
        minutes: Math.round(tStats[name].total / tStats[name].count),
      }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 5)
  } catch (err) {
    console.error('Error loading Average Response Times:', err)
  }
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
    .eq('branch_id', branchId.value)
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
    .eq('branch_id', branchId.value)
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
    .select('*, users!inner(role_id, branch_id)', { count: 'exact', head: true })
    .eq('users.role_id', 9)
    .eq('users.branch_id', branchId.value)
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

  const mappedBarangays = (brgys || []).map((b) => ({
    ...b,
    municipalities: { name: muniMap[b.municipality_id] || 'Unknown' },
  }))

  barangays.value = mappedBarangays.filter((b) => {
    const branchStr = branchName.value.toLowerCase()
    const muniStr = b.municipalities.name.toLowerCase()
    return branchStr.includes(muniStr) || muniStr.includes(branchStr)
  })
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
      branch_id: branchId.value,
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
  fetchCurrentBranch()
  timerInterval = setInterval(() => (now.value = new Date()), 1000)
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<style scoped>
/* Loading State Styles */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  color: #64748b;
  font-weight: 600;
  font-size: 1.1rem;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border-left-color: #2563eb;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
