<template>
  <div class="dashboard-layout">
    <!-- Sidebar Component -->
    <Sidebar class="no-print" />

    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Top Banner Matching Design -->
      <div class="banner-container no-print">
        <div class="banner-text">
          <h1>Lineman Performance Report</h1>
          <p>Manage your team's performance metrics and rankings</p>
        </div>
        <button class="print-btn-banner" @click="printPage">
          <Printer :size="16" style="margin-right: 6px; vertical-align: middle" /> Print Report /
          Save PDF
        </button>
      </div>

      <div class="print-layout">
        <!-- Printable Paper Sheet -->
        <div class="sheet">
          <div class="header">
            <h1>ISELCO ELECTRIC COOPERATIVE</h1>
            <h2>Lineman Performance & Resolution Time Ranking</h2>
            <div class="meta">Generated: {{ generatedDate }}</div>
          </div>

          <div v-if="loading" class="loading-state">Loading data from database...</div>

          <div v-else-if="errorMsg" class="error-state">
            {{ errorMsg }}
          </div>

          <div v-else>
            <!-- Top Ranked Lineman Highlight Card -->
            <div v-if="topPerformer" class="top-badge-card">
              <div class="top-left">
                <div class="trophy-icon-container">
                  <Trophy :size="24" class="trophy-icon" />
                </div>
                <div>
                  <div class="badge-title">BEST PERFORMING LINEMAN</div>
                  <div class="name">{{ topPerformer.name }}</div>
                </div>
              </div>
              <div style="text-align: right">
                <div class="stat">
                  Avg. Resolution: <strong>{{ formatSeconds(topPerformer.avgSeconds) }}</strong>
                </div>
                <div class="stat">
                  Total Completed: <strong>{{ topPerformer.count }} tasks</strong>
                </div>
              </div>
            </div>

            <!-- Rankings Table -->
            <table>
              <thead>
                <tr>
                  <th style="width: 70px; text-align: center">RANK</th>
                  <th>LINEMAN NAME</th>
                  <th>TOTAL RESOLVED</th>
                  <th>FASTEST SINGLE TIME</th>
                  <th>AVG. RESOLUTION TIME</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(lineman, index) in rankedLinemen"
                  :key="index"
                  :class="{ 'rank-1': index === 0 }"
                >
                  <td style="text-align: center">
                    <strong>#{{ index + 1 }}</strong>
                  </td>
                  <td>
                    <strong>{{ lineman.name }}</strong>
                  </td>
                  <td>{{ lineman.count }}</td>
                  <td>{{ formatSeconds(lineman.fastestSeconds) }}</td>
                  <td>
                    <strong>{{ formatSeconds(lineman.avgSeconds) }}</strong>
                  </td>
                </tr>
                <tr v-if="rankedLinemen.length === 0">
                  <td colspan="5" style="text-align: center">No resolved tasks found.</td>
                </tr>
              </tbody>
            </table>

            <!-- Signature Footer -->
            <div class="signatures">
              <div class="sign-box">
                <div class="sign-line"></div>
                <p><strong>Prepared By:</strong></p>
                <p>Operations Supervisor</p>
              </div>
              <div class="sign-box">
                <div class="sign-line"></div>
                <p><strong>Approved By:</strong></p>
                <p>Technical Services Head</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/services/supabase'
import Sidebar from '@/components/Sidebar.vue'
import { Printer, Trophy } from 'lucide-vue-next'

const loading = ref(true)
const errorMsg = ref(null)
const generatedDate = ref(new Date().toLocaleString())
const rankedLinemen = ref([])

const topPerformer = computed(() => {
  return rankedLinemen.value.length > 0 ? rankedLinemen.value[0] : null
})

const printPage = () => {
  window.print()
}

const parseTimeToSeconds = (timeStr) => {
  if (!timeStr) return null
  let total = 0
  const h = timeStr.match(/(\d+)\s*h/)
  const m = timeStr.match(/(\d+)\s*m/)
  const s = timeStr.match(/(\d+)\s*s/)
  if (h) total += parseInt(h[1], 10) * 3600
  if (m) total += parseInt(m[1], 10) * 60
  if (s) total += parseInt(s[1], 10)
  return total > 0 ? total : null
}

const formatSeconds = (seconds) => {
  if (!seconds && seconds !== 0) return 'N/A'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}m ${s < 10 ? '0' : ''}${s}s`
}

const fetchData = async () => {
  try {
    // Robust query starting from 'assignments' to avoid join ambiguity and 400 errors
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select(
        `
        reports!inner (
          resolution_time
        ),
        users (
          id,
          first_name,
          last_name
        )
      `,
      )
      .not('reports.resolution_time', 'is', null)

    if (error) throw error

    const linemanMap = {}

    assignments.forEach((item) => {
      const report = Array.isArray(item.reports) ? item.reports[0] : item.reports
      const user = Array.isArray(item.users) ? item.users[0] : item.users

      if (!report || !report.resolution_time) return
      const seconds = parseTimeToSeconds(report.resolution_time)
      if (!seconds) return

      const id = user ? user.id : 'unknown'
      const name = user
        ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
        : 'Unassigned Lineman'

      if (!linemanMap[id]) {
        linemanMap[id] = { name, totalSeconds: 0, count: 0, fastestSeconds: Infinity }
      }

      linemanMap[id].totalSeconds += seconds
      linemanMap[id].count += 1

      if (seconds < linemanMap[id].fastestSeconds) {
        linemanMap[id].fastestSeconds = seconds
      }
    })

    const list = Object.values(linemanMap).map((l) => ({
      name: l.name,
      count: l.count,
      avgSeconds: l.totalSeconds / l.count,
      fastestSeconds: l.fastestSeconds,
    }))

    list.sort((a, b) => a.avgSeconds - b.avgSeconds)
    rankedLinemen.value = list
  } catch (err) {
    console.error('Error fetching report data:', err)
    errorMsg.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
/* Layout Alignment */
.dashboard-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f8fafc;
}

.main-content {
  flex-grow: 1;
  overflow-y: auto;
}

/* Matching Banner Style */
.banner-container {
  background: linear-gradient(135deg, #1e1b4b 0%, #3b82f6 100%);
  margin: 24px;
  padding: 32px;
  border-radius: 12px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  white-space: nowrap;
}

.banner-text h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.banner-text p {
  margin: 6px 0 0 0;
  font-size: 14px;
  opacity: 0.9;
}

.print-btn-banner {
  background-color: #b45309;
  color: white;
  border: none;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: background 0.2s ease;
  flex-shrink: 0;
}

.print-btn-banner:hover {
  background-color: #92400e;
}

/* Printable Paper Sheet */
.print-layout {
  padding: 0 24px 24px 24px;
  color: #1f2937;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 40px;
  font-size: 16px;
}
.error-state {
  color: #b91c1c;
  background: #fef2f2;
  border-radius: 8px;
  border: 1px solid #fca5a5;
  padding: 20px;
}

.sheet {
  max-width: 900px;
  margin: 0 auto;
  background: white;
  padding: 45px;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.header {
  text-align: center;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 20px;
  margin-bottom: 30px;
}
.header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  color: #1e1b4b;
  letter-spacing: 0.5px;
}
.header h2 {
  margin: 6px 0;
  font-size: 15px;
  font-weight: 600;
  color: #4b5563;
}
.meta {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 6px;
}

/* Top Performer Badge Card */
.top-badge-card {
  border: 1px solid #e5e7eb;
  background-color: #f8fafc;
  border-radius: 8px;
  padding: 20px 24px;
  margin-bottom: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.top-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.trophy-icon-container {
  color: #ef4444;
  display: flex;
  align-items: center;
}
.badge-title {
  font-size: 11px;
  font-weight: 700;
  color: #1e1b4b;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}
.top-badge-card .name {
  font-size: 22px;
  font-weight: bold;
  color: #1e1b4b;
}
.top-badge-card .stat {
  font-size: 13px;
  color: #4b5563;
}
.top-badge-card .stat strong {
  color: #1e1b4b;
}

/* Table Design */
table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 50px;
}
th,
td {
  border: 1px solid #e5e7eb;
  padding: 12px 16px;
  text-align: left;
  font-size: 13px;
}
th {
  background-color: #1e1b4b !important;
  color: white !important;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.5px;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
tr:nth-child(even) {
  background-color: #fdfdfd;
}
.rank-1 {
  background-color: #fef3c7 !important;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.signatures {
  display: flex;
  justify-content: space-between;
  margin-top: 50px;
  padding: 0 10px;
}
.sign-box {
  text-align: center;
  width: 240px;
}
.sign-line {
  border-bottom: 1px solid #d1d5db;
  margin-bottom: 8px;
  height: 40px;
}
.sign-box p {
  margin: 2px 0;
  font-size: 12px;
  color: #4b5563;
}

/* ================= PRINT MEDIA QUERY ================= */
@media print {
  .no-print {
    display: none !important;
  }
  .dashboard-layout {
    background: none;
    display: block;
  }
  .main-content {
    overflow: visible;
    width: 100%;
  }
  .print-layout {
    background: none;
    padding: 0;
    margin: 0;
  }
  .sheet {
    box-shadow: none;
    padding: 0;
    margin: 0;
    max-width: 100%;
    border: none;
  }
  th {
    background-color: #1e1b4b !important;
    color: white !important;
  }
  .top-badge-card {
    border: 1px solid #d1d5db;
    background-color: #f8fafc !important;
  }

  @page {
    size: A4 portrait;
    margin: 1.5cm;
  }
}
</style>
