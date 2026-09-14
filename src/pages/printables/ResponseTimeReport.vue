<!-- src/pages/printables/ResponseTimeReport.vue -->
<template>
  <div class="dashboard-root">
    <Sidebar class="no-print" />
    <div class="main-wrapper">
      <Topbar class="no-print" />

      <!-- Web UI Controls -->
      <div class="report-header-actions no-print">
        <div class="header-left">
          <h2>Response Time Analytics Report</h2>
          <p>Printable overview of resolution speeds across the system.</p>
        </div>
        <button @click="printDocument" class="btn-print">
          <Printer :size="18" /> PRINT REPORT
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state no-print">Generating Analytics...</div>

      <!-- Printable Document -->
      <div v-else class="printable-document" id="print-area">
        <!-- Print Header -->
        <div class="doc-header">
          <img
            src="@/assets/Background/iselconnectlogo.png"
            alt="ISELCONNECT Logo"
            class="print-logo"
          />
          <div class="doc-titles">
            <h1>RESPONSE TIME ANALYTICS</h1>
            <p>Generated on: {{ currentDateTime }}</p>
          </div>
        </div>

        <!-- 1. Overall System Average -->
        <div class="doc-section">
          <div class="section-heading">1. OVERALL SYSTEM AVERAGE</div>
          <div class="overall-box">
            <span class="overall-val">{{ overallART }}</span>
            <span class="overall-sub">Based on {{ totalResolved }} total resolved incidents</span>
          </div>
        </div>

        <div class="split-row">
          <!-- 2. Per Branch Average -->
          <div class="doc-section half-width">
            <div class="section-heading">2. AVERAGE PER BRANCH</div>
            <table class="print-table">
              <thead>
                <tr>
                  <th>Branch Name</th>
                  <th class="text-right">Average Response Time</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="branch in branchART" :key="branch.id">
                  <td>{{ branch.fullName }}</td>
                  <td class="text-right fw-bold" :class="{ 'text-danger': branch.minutes > 60 }">
                    {{ branch.formatted }}
                  </td>
                </tr>
                <tr v-if="branchART.length === 0">
                  <td colspan="2" class="text-center">No branch data available.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 3. Per Lineman Team Average -->
          <div class="doc-section half-width">
            <div class="section-heading">3. AVERAGE PER TEAM (TOP 15)</div>
            <table class="print-table">
              <thead>
                <tr>
                  <th>Team Name</th>
                  <th class="text-right">Average Response Time</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="team in teamART" :key="team.id">
                  <td>{{ team.name }}</td>
                  <td class="text-right fw-bold" :class="{ 'text-danger': team.minutes > 60 }">
                    {{ team.formatted }}
                  </td>
                </tr>
                <tr v-if="teamART.length === 0">
                  <td colspan="2" class="text-center">No team data available.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 4. Individual Report Breakdown -->
        <div class="doc-section">
          <div class="section-heading">4. ACTUAL RESPONSE TIME PER REPORT (RECENT 100)</div>
          <table class="print-table compact-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Issue Type</th>
                <th>Branch</th>
                <th>Assigned Team</th>
                <th>Date Resolved</th>
                <th class="text-right">Actual Time</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="rep in individualReports" :key="rep.id">
                <td>#{{ rep.id }}</td>
                <td>{{ rep.typeName }}</td>
                <td>{{ rep.branchName }}</td>
                <td>{{ rep.teamName }}</td>
                <td>{{ formatDate(rep.resolvedAt) }}</td>
                <td class="text-right fw-bold">{{ rep.resolutionTime || 'N/A' }}</td>
              </tr>
              <tr v-if="individualReports.length === 0">
                <td colspan="6" class="text-center">No resolved reports found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'
import { Printer, Clock } from 'lucide-vue-next'
import { supabase } from '@/services/supabase'

const loading = ref(true)
const currentDateTime = ref(new Date().toLocaleString())

// Analytics State
const overallART = ref('0m')
const totalResolved = ref(0)
const branchART = ref([])
const teamART = ref([])
const individualReports = ref([])

const printDocument = () => {
  window.print()
}

// Helper to format total minutes into "Xh Ym"
const formatTimeStr = (totalMins) => {
  if (isNaN(totalMins) || totalMins === 0) return '0m'
  const h = Math.floor(totalMins / 60)
  const m = Math.floor(totalMins % 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

// Helper to parse Supabase text ("40m 10s") into minutes
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

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const generateReportData = async () => {
  try {
    // 1. Fetch Lookups
    const { data: teamsData } = await supabase.from('lineman_teams').select('*')
    const { data: branchesData } = await supabase
      .from('iselco_branch')
      .select('branch_id, branch_name')

    // 2. Fetch Resolved Reports with Assignment and Types
    const { data: reportsData, error } = await supabase
      .from('reports')
      .select(
        `
        id,
        branch_id,
        resolution_time,
        created_at,
        updated_at,
        report_types(name),
        assignments ( lineman_id )
      `,
      )
      .not('resolution_time', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(100) // Limiting to 100 for the printable log

    if (error) throw error

    totalResolved.value = reportsData.length

    let sysTotalMins = 0
    const bStats = {}
    const tStats = {}
    const reportList = []

    reportsData.forEach((r) => {
      const mins = parseTime(r.resolution_time)
      sysTotalMins += mins

      let repBranchName = 'Unknown Branch'
      let repTeamName = 'Unassigned'

      // Branch Aggregation
      const bId = r.branch_id
      if (bId !== null && bId !== undefined) {
        if (!bStats[bId]) bStats[bId] = { total: 0, count: 0 }
        bStats[bId].total += mins
        bStats[bId].count += 1

        const bLookup = branchesData?.find((x) => String(x.branch_id) === String(bId))
        if (bLookup) repBranchName = bLookup.branch_name
      }

      // Team Aggregation
      if (r.assignments && r.assignments.length > 0 && teamsData) {
        const linemanId = r.assignments[0].lineman_id
        const team = teamsData.find((t) => t.team_members && t.team_members.includes(linemanId))

        if (team) {
          const tName = team.team_name || `Team ${team.id}`
          repTeamName = tName
          if (!tStats[tName]) tStats[tName] = { total: 0, count: 0 }
          tStats[tName].total += mins
          tStats[tName].count += 1
        }
      }

      // Push to Individual Log
      reportList.push({
        id: r.id,
        typeName: r.report_types?.name || 'General',
        branchName: repBranchName,
        teamName: repTeamName,
        resolvedAt: r.updated_at,
        resolutionTime: r.resolution_time,
      })
    })

    // Compute Overall
    overallART.value =
      totalResolved.value > 0 ? formatTimeStr(sysTotalMins / totalResolved.value) : '0m'

    // Compute Branch Array
    branchART.value = Object.keys(bStats)
      .map((id) => {
        let fullName = `Branch ${id}`
        if (branchesData) {
          const b = branchesData.find((x) => String(x.branch_id) === String(id))
          if (b && b.branch_name) fullName = b.branch_name
        }
        const avgMins = Math.round(bStats[id].total / bStats[id].count)
        return { id, fullName, minutes: avgMins, formatted: formatTimeStr(avgMins) }
      })
      .sort((a, b) => a.minutes - b.minutes)

    // Compute Team Array
    teamART.value = Object.keys(tStats)
      .map((name, index) => {
        const avgMins = Math.round(tStats[name].total / tStats[name].count)
        return { id: index, name, minutes: avgMins, formatted: formatTimeStr(avgMins) }
      })
      .sort((a, b) => a.minutes - b.minutes)
      .slice(0, 15) // Top 15 teams to fit page

    individualReports.value = reportList
  } catch (err) {
    console.error('Error generating report:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  generateReportData()
})
</script>

<style scoped>
/* ========================================================
   WEB UI STYLES (Hidden during print)
   ======================================================== */
.dashboard-root {
  display: flex;
  min-height: 100vh;
  background-color: #f1f5f9;
  font-family: 'Inter', sans-serif;
}
.main-wrapper {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  padding: 0 24px 24px;
  overflow-x: hidden;
}

.report-header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 20px 24px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
  border: 1px solid #e2e8f0;
}
.header-left h2 {
  margin: 0 0 4px 0;
  font-size: 1.4rem;
  color: #1e1b4b;
  font-weight: 800;
}
.header-left p {
  margin: 0;
  font-size: 0.85rem;
  color: #64748b;
}

.btn-print {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #2563eb;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-print:hover {
  background: #1d4ed8;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #64748b;
  font-weight: 600;
}

/* ========================================================
   PRINTABLE DOCUMENT STYLES
   ======================================================== */
.printable-document {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  max-width: 1000px;
  margin: 0 auto;
  color: #000;
}

.doc-header {
  display: flex;
  align-items: center;
  gap: 20px;
  border-bottom: 2px solid #1e1b4b;
  padding-bottom: 20px;
  margin-bottom: 30px;
}
.print-logo {
  height: 60px;
  object-fit: contain;
}
.doc-titles h1 {
  margin: 0 0 4px 0;
  font-size: 1.8rem;
  font-weight: 900;
  color: #1e1b4b;
  text-transform: uppercase;
}
.doc-titles p {
  margin: 0;
  font-size: 0.85rem;
  color: #475569;
}

.doc-section {
  margin-bottom: 30px;
}
.section-heading {
  font-size: 1.1rem;
  font-weight: 800;
  background: #f8fafc;
  padding: 8px 12px;
  border-left: 4px solid #facc15;
  margin-bottom: 16px;
  text-transform: uppercase;
  color: #1e1b4b;
}

/* Overall Box */
.overall-box {
  text-align: center;
  padding: 24px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
}
.overall-val {
  display: block;
  font-size: 3rem;
  font-weight: 900;
  color: #2563eb;
  margin-bottom: 8px;
}
.overall-sub {
  font-size: 0.9rem;
  font-weight: 600;
  color: #64748b;
}

/* Grids & Tables */
.split-row {
  display: flex;
  gap: 24px;
}
.half-width {
  flex: 1;
}

.print-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.print-table th,
.print-table td {
  border: 1px solid #cbd5e1;
  padding: 10px 12px;
  text-align: left;
}
.print-table th {
  background: #f1f5f9;
  font-weight: 700;
  color: #1e1b4b;
}
.text-right {
  text-align: right !important;
}
.text-center {
  text-align: center !important;
}
.fw-bold {
  font-weight: 700;
}
.text-danger {
  color: #dc2626 !important;
}

.compact-table th,
.compact-table td {
  padding: 6px 10px;
  font-size: 0.75rem;
}

/* ========================================================
   @MEDIA PRINT RULES
   ======================================================== */
@media print {
  @page {
    size: A4 portrait;
    margin: 1cm;
  }

  body {
    background: white !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  /* Hide Web UI completely */
  .no-print,
  .sidebar,
  .topbar-container {
    display: none !important;
  }

  /* Reset layout for printing */
  .dashboard-root {
    display: block !important;
    background: white !important;
  }
  .main-wrapper {
    padding: 0 !important;
    display: block !important;
  }

  .printable-document {
    box-shadow: none !important;
    padding: 0 !important;
    margin: 0 !important;
    max-width: 100% !important;
  }

  /* Print optimizations */
  .doc-section {
    page-break-inside: avoid;
  }
  .print-table th {
    background: #f1f5f9 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .overall-box {
    background: #f8fafc !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .section-heading {
    border-left: 4px solid #000 !important; /* Forces visible border on B&W printers */
  }
}
</style>
