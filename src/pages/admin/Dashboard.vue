<!-- Dashboard.vue -->
<template>
  <div class="dashboard-root">
    <Sidebar />
    <div class="main-wrapper">
      <Topbar />

      <!-- HERO BANNER -->
      <header class="hero-banner">
        <div class="hero-overlay-content">
          <div class="hero-title">
            <LayoutDashboard :size="16" />
            <span>DASHBOARD</span>
          </div>
          <h1>{{ greeting }}, Administrator</h1>
          <p>
            Manage accounts, validate and prioritize incoming reports, dispatch linemen, generate
            descriptive analytics, and post targeted power advisories.
          </p>
        </div>
      </header>

      <!-- METRIC SUMMARY CARDS (Now emits metricsUpdated) -->
      <MetricSummaryCards
        :period="currentPeriod"
        :branchId="branchId"
        @update:period="currentPeriod = $event"
        @metricsUpdated="handleMetricsUpdate"
      />

      <!-- STATS GRID & EFFICIENCY (Resized) -->
      <div class="stats-top-grid">
        <div class="stats-grid">
          <!-- Total Reports & Active Linemen -->
          <div v-for="stat in stats" :key="stat.title" class="mini-stat-card">
            <div class="mini-stat-header">
              {{ stat.title }}
            </div>
            <div class="mini-stat-body">
              <component :is="stat.icon" class="mini-stat-icon" :size="20" />
              <span class="mini-stat-value">{{ stat.value }}</span>
            </div>
          </div>
        </div>

        <!-- Grid Efficiency Wide Card -->
        <aside class="efficiency-card">
          <div class="efficiency-top-row">
            <div class="efficiency-text">
              <h3>Grid Efficiency</h3>
              <p>Based on total reports vs resolved reports.</p>
            </div>
            <h2 class="efficiency-value-large">{{ gridEfficiency }}%</h2>
          </div>
          <div class="progress-bar">
            <div class="fill" :style="{ width: gridEfficiency + '%' }"></div>
          </div>
        </aside>
      </div>

      <!-- ANALYTICS TOP SECTION (Resized) -->
      <div class="analytics-top-split-grid">
        <div class="section-title-wrapper">
          <h2><span class="title-icon"></span> ANALYTICS</h2>
          <p>
            The analytics module is designed to transform raw utility report data into meaningful
            insights, enabling the ISELCO-I administration to understand why and where power outages
            and infrastructure issues are most frequent.
          </p>
        </div>

        <div class="pie-card">
          <OutageStatusPie />
        </div>
      </div>

      <!-- SYSTEM LOAD & CONSUMPTION CHART (Resized) -->
      <section class="chart-container">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px">
          <h3 style="margin: 0; font-size: 0.9rem">System Load & Consumption</h3>
        </div>
        <IncidentChart :period="currentPeriod" :branchId="branchId" />
      </section>

      <!-- TOP BARANGAYS CHART (Resized) -->
      <TopBarangaysChart :branchId="branchId" />

      <!-- INCIDENT WAIT LIST TABLE -->
      <section class="table-container">
        <h2 style="margin: 0 0 4px 0; font-size: 1rem">Incident Wait List</h2>
        <p style="margin: 0 0 12px 0; font-size: 0.8rem; color: #475569">
          Review new incoming reports before pushing them to the active queue or archive.
        </p>

        <div v-if="incidentReports.length === 0" style="text-align: center; padding: 16px">
          <p>No new incident reports waiting for review.</p>
        </div>

        <table v-else class="data-table">
          <thead>
            <tr>
              <th>Priority</th>
              <th>Report Details</th>
              <th>Location</th>
              <th>Description</th>
              <th>Date</th>
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
              <td style="font-weight: 700">
                {{ report.report_types?.name ?? 'General Incident' }}
                <div
                  style="font-weight: normal; font-size: 0.7rem; color: #64748b"
                  v-if="report.users"
                >
                  Reporter: {{ report.users.first_name }} {{ report.users.last_name }}
                </div>
              </td>
              <td>
                {{ report.landmark || 'N/A' }}
                <div style="font-size: 0.7rem; color: #64748b">
                  Barangay: {{ report.barangays?.name ?? 'Unknown Barangay' }}
                </div>
              </td>
              <td style="color: #64748b; font-size: 0.8rem">{{ report.description || 'EMPTY' }}</td>
              <td style="color: #64748b; font-size: 0.8rem">
                {{ formatDateTime(report.created_at) }}
              </td>
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
import { FileText, Zap, LayoutDashboard } from 'lucide-vue-next'
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'
import IncidentChart from '@/components/analytics/IncidentChart.vue'
import TopBarangaysChart from '@/components/analytics/TopBarangaysChart.vue'
import MetricSummaryCards from '@/components/analytics/MetricSummaryCards.vue'
import OutageStatusPie from '@/components/analytics/OutageStatusPie.vue'
import { supabase } from '@/services/supabase'
import { sendNotification } from '@/utils/notifications.js'

import '@/assets/style/Dashboard.css'

const router = useRouter()
const incidentReports = ref([])
const currentPeriod = ref('Day')
const branchId = ref(null)

// Holds the live metrics fetched from MetricSummaryCards
const globalMetrics = ref({ totalReports: 0, totalResolved: 0 })

const stats = ref([
  { title: 'TOTAL REPORTS', value: '0', icon: FileText },
  { title: 'ACTIVE LINEMEN', value: '0', icon: Zap },
])

const greeting = computed(() => {
  const now = new Date()
  const hour = now.getHours()
  if (hour < 12) return 'Good Morning'
  else if (hour < 17) return 'Good Afternoon'
  else return 'Good Evening'
})

// FULLY COMPUTED GRID EFFICIENCY based on total reports
const gridEfficiency = computed(() => {
  const total = globalMetrics.value.totalReports
  const resolved = globalMetrics.value.totalResolved
  if (total === 0) return '100.0'
  return ((resolved / total) * 100).toFixed(1)
})

// Triggered when MetricSummaryCards finishes loading data
const handleMetricsUpdate = (newMetrics) => {
  globalMetrics.value = newMetrics
  stats.value[0].value = newMetrics.totalReports.toString()
}

const loadIncidentReports = async () => {
  const { data, error } = await supabase
    .from('reports')
    .select(
      `
      id, landmark, description, created_at, status_id,
      report_types(name), barangays(name),
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
}

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString()
}

// Accept & Reject Methods (Trimmed for brevity)
const acceptReport = async (report) => {
  await supabase.from('reports').update({ status_id: 2 }).eq('id', report.id)
  loadIncidentReports()
}

const rejectReport = async (report) => {
  await supabase.from('reports').update({ status_id: 5 }).eq('id', report.id)
  loadIncidentReports()
}

onMounted(() => {
  loadIncidentReports()
  fetchLinemenStats()
})
</script>
