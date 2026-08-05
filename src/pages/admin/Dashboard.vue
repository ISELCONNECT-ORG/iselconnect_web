<!-- Dashboard.vue -->
<template>
  <div class="dashboard-root">
    <Sidebar />
    <div class="main-wrapper">
      <Topbar />

      <!-- HERO BANNER WITH BACKGROUND IMAGE -->
      <header class="hero-banner">
        <div class="hero-overlay-content">
          <h1>{{ greeting }}, Administrator</h1>
          <p>
            Manage accounts, validate and prioritize incoming reports, dispatch linemen, generate
            descriptive analytics, and post targeted power advisories.
          </p>
        </div>
        <!-- METRIC SUMMARY CARDS EMBEDDED INSIDE HERO BANNER -->
        <div class="hero-metrics-container">
          <MetricSummaryCards :period="currentPeriod" :branchId="branchId" />
        </div>
      </header>

      <!-- STATS GRID & EFFICIENCY -->
      <div class="stats-top-grid">
        <div class="stats-grid">
          <div v-for="stat in stats" :key="stat.title" class="stat-card">
            <div class="card-header">
              <h3>{{ stat.title }}</h3>
            </div>
            <div class="stat-body-content">
              <component :is="stat.icon" class="stat-icon" />
              <p class="stat-value">{{ stat.value }}</p>
            </div>
          </div>
        </div>

        <aside class="efficiency-card">
          <div class="efficiency-header">
            <h3>Grid Efficiency</h3>
            <span class="efficiency-value-top">{{ gridEfficiency }}%</span>
          </div>
          <div class="progress-bar">
            <div class="fill" :style="{ width: gridEfficiency + '%' }"></div>
          </div>
          <p class="efficiency-label">Current average performance across all sectors.</p>
        </aside>
      </div>

      <!-- ANALYTICS TOP SECTION: ANALYTICS HEADER + OUTAGE STATUS BREAKDOWN SIDE-BY-SIDE -->
      <div class="analytics-top-split-grid">
        <div class="section-title-wrapper">
          <h2><span class="title-icon"></span> ANALYTICS</h2>
          <p>
            The analytics module is designed to transform raw utility report data into meaningful
            insights, enabling the ISELCO-I administration to understand why and where power outages
            and infrastructure issues are most frequent.
          </p>
          <div class="analytics-sub-icons">
            <span class="sub-icon-box">🕒</span>
            <span class="sub-icon-box">📊</span>
            <span class="sub-icon-box">📋</span>
          </div>
        </div>

        <div class="pie-card">
          <div class="card-header-flex">
            <h3>Outage Status Breakdown</h3>
          </div>
          <OutageStatusPie />
        </div>
      </div>

      <!-- SYSTEM LOAD & CONSUMPTION CHART (FULL WIDTH BELOW) -->
      <div class="content-grid">
        <section class="chart-container">
          <div class="chart-header">
            <h3>System Load & Consumption</h3>
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
          <IncidentChart :period="currentPeriod" :branchId="branchId" />
        </section>
      </div>

      <!-- TOP BARANGAYS CHART -->
      <div class="barangay-full-width">
        <TopBarangaysChart :branchId="branchId" />
      </div>

      <!-- INCIDENT WAIT LIST TABLE SECTION -->
      <section class="table-container">
        <h2>Incident Wait List</h2>
        <p class="subtitle">
          Review new incoming reports before pushing them to the active queue or archive.
        </p>

        <div v-if="incidentReports.length === 0" class="empty-state">
          <p>No new incident reports waiting for review.</p>
        </div>

        <table v-else class="data-table">
          <thead>
            <tr>
              <th>Priority</th>
              <th>Report Details</th>
              <th>Location</th>
              <th>Description</th>
              <th>Date Reported</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="report in incidentReports" :key="report.id">
              <td>
                <span
                  :class="[
                    'priority-badge',
                    report.status_id === 1 ? 'badge-pending' : 'badge-progress',
                  ]"
                >
                  {{ report.status_id === 1 ? 'Pending' : 'Active' }}
                </span>
              </td>
              <td class="bold-text">
                {{ report.report_types?.name ?? 'General Incident' }}
                <div
                  class="muted-text"
                  style="font-weight: normal; font-size: 0.75rem"
                  v-if="report.users"
                >
                  Reporter: {{ report.users.first_name }} {{ report.users.last_name }}
                </div>
              </td>
              <td>
                {{ report.landmark || 'N/A' }}
                <div class="muted-text" style="font-size: 0.75rem">
                  Barangay: {{ report.barangays?.name ?? 'Unknown Barangay' }}
                </div>
              </td>
              <td class="muted-text">{{ report.description || 'EMPTY' }}</td>
              <td class="muted-text">{{ formatDateTime(report.created_at) }}</td>
              <td>
                <div class="table-action-buttons">
                  <button class="btn-accept" @click="acceptReport(report)">Accept</button>
                  <button class="btn-reject" @click="rejectReport(report)">Reject</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { FileText, Zap } from 'lucide-vue-next'
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'
import IncidentChart from '@/components/analytics/IncidentChart.vue'
import TopBarangaysChart from '@/components/analytics/TopBarangaysChart.vue'
import MetricSummaryCards from '@/components/analytics/MetricSummaryCards.vue'
import OutageStatusPie from '@/components/analytics/OutageStatusPie.vue'
import { supabase } from '@/services/supabase'
import { sendNotification } from '@/utils/notifications.js'

import '@/assets/style/dashboard.css'

const router = useRouter()
const incidentReports = ref([])
const currentPeriod = ref('Day')
const branchId = ref(null)

const stats = ref([
  { title: 'Total Reports', value: '0', icon: FileText, trend: 'Reports' },
  { title: 'Active Linemen', value: '0', icon: Zap, trend: 'On Duty' },
])

const greeting = computed(() => {
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()
  if (hour < 12) return 'Good Morning'
  else if (hour < 17 || (hour === 17 && minute === 0)) return 'Good Afternoon'
  else return 'Good Evening'
})

const gridEfficiency = computed(() => {
  const total = parseInt(stats.value[0].value) || 0
  return total > 0 ? '100.0' : '0.0'
})

const loadIncidentReports = async () => {
  const { data, error } = await supabase
    .from('reports')
    .select(
      `
      id,
      landmark,
      description,
      created_at,
      status_id,
      report_types(name),
      barangays(name),
      users:residents_id(first_name, last_name)
    `,
    )
    .neq('landmark', 'Walk-in Report')
    .eq('status_id', 1)
    .order('created_at', { ascending: false })

  if (!error) {
    incidentReports.value = data || []
  }
}

const fetchLinemenStats = async () => {
  const { count } = await supabase
    .from('employees')
    .select('*, users!inner(role_id)', { count: 'exact', head: true })
    .eq('users.role_id', 9)
    .eq('is_available', true)

  stats.value[1].value = (count || 0).toString()

  const { count: totalCount } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })

  stats.value[0].value = (totalCount || 0).toString()
}

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString()
}

const acceptReport = async (report) => {
  const bName = report.barangays?.name ?? 'Unknown Barangay'
  const iType = report.report_types?.name ?? 'General Incident'

  const { error } = await supabase.from('reports').update({ status_id: 2 }).eq('id', report.id)
  if (error) return alert('Error accepting report: ' + error.message)

  await supabase.from('system_logs').insert([
    {
      action_type: 'CONFIRM_REPORT',
      action_details: `Accepted report #${report.id} (${iType}) for Barangay ${bName}`,
      created_at: new Date().toISOString(),
    },
  ])

  await sendNotification(
    'Report Confirmed',
    `Your report for ${iType} at Barangay ${bName} has been accepted and queued.`,
  )
  loadIncidentReports()
  fetchLinemenStats()
}

const rejectReport = async (report) => {
  const bName = report.barangays?.name ?? 'Unknown Barangay'
  const iType = report.report_types?.name ?? 'General Incident'

  const { error } = await supabase.from('reports').update({ status_id: 5 }).eq('id', report.id)
  if (error) return alert('Error rejecting report: ' + error.message)

  await supabase.from('system_logs').insert([
    {
      action_type: 'REJECT_REPORT',
      action_details: `Rejected report #${report.id} (${iType}) for Barangay ${bName}`,
      created_at: new Date().toISOString(),
    },
  ])

  await sendNotification(
    'Report Rejected',
    `Your report for ${iType} at Barangay ${bName} has been rejected and archived.`,
  )
  loadIncidentReports()
  fetchLinemenStats()
}

onMounted(() => {
  loadIncidentReports()
  fetchLinemenStats()
})
</script>
