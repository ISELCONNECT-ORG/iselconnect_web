<!-- src/pages/printables/DetailedReport.vue -->
<template>
  <div class="layout-wrapper">
    <!-- SIDEBAR -->
    <Sidebar class="no-print" />

    <div class="main-content">
      <!-- TOPBAR -->
      <Topbar class="no-print" />

      <!-- REPORTS DASHBOARD -->
      <div class="reports-dashboard">
        <!-- BANNER SECTION -->
        <div class="banner-section no-print">
          <div class="banner-content">
            <h1>DETAILED SYSTEM REPORTS</h1>
            <p>Detailed, full-data reporting matrix for ISELCONNECT field operations.</p>
          </div>
        </div>

        <!-- NO-PRINT ZONE: Controls and Filters -->
        <div class="controls-section no-print">
          <h2 class="page-title">Filter Detailed Reports</h2>

          <div class="filters-grid">
            <!-- 1. Global Date-Range Filter -->
            <div class="filter-group">
              <label>Date From</label>
              <input type="date" v-model="dateFrom" class="input-field" />
            </div>
            <div class="filter-group">
              <label>Date To</label>
              <input type="date" v-model="dateTo" class="input-field" />
            </div>

            <!-- 2. Status Filter -->
            <div class="filter-group">
              <label>Filter by Status</label>
              <select v-model="selectedStatus" class="input-field">
                <option value="">-- All Statuses --</option>
                <option v-for="status in reportStatuses" :key="status.id" :value="status.id">
                  {{ status.name || status.status_name }}
                </option>
              </select>
            </div>

            <!-- 3. Category Filter -->
            <div class="filter-group">
              <label>Filter by Category</label>
              <select v-model="selectedCategory" class="input-field">
                <option value="">-- All Categories --</option>
                <option v-for="type in reportTypes" :key="type.id" :value="type.id">
                  {{ type.description || type.name || type.type_name }}
                </option>
              </select>
            </div>
          </div>

          <div class="action-row">
            <button class="btn-submit" @click="printReport">
              <Printer :size="16" class="btn-icon" /> Print / Save as PDF
            </button>
          </div>
        </div>

        <!-- PRINT ZONE: Generated Reports -->
        <div class="printable-report">
          <!-- PROFESSIONAL PRINT HEADER -->
          <div class="doc-header only-print">
            <img
              src="@/assets/Background/iselconnectlogo.png"
              alt="ISELCONNECT Logo"
              class="print-logo"
            />
            <div class="doc-titles">
              <h1>DETAILED SYSTEM REPORT</h1>
              <p v-if="dateFrom || dateTo">
                Period: {{ dateFrom ? dateFrom : 'Beginning' }} to {{ dateTo ? dateTo : 'Present' }}
              </p>
              <p>Generated on: {{ currentDateTime }}</p>
            </div>
          </div>

          <div class="report-section">
            <h3 class="section-heading">FULL INCIDENT LOG</h3>
            <p class="total-badge">Total Records Found: {{ filteredReports.length }}</p>

            <table class="data-table print-table">
              <thead>
                <tr>
                  <th>ID & DATES</th>
                  <th>CATEGORY & STATUS</th>
                  <th>LOCATION INFO</th>
                  <th>INCIDENT DETAILS</th>
                  <th>ASSIGNED LINEMAN</th>
                  <th>RESOLUTION LOG</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="report in filteredReports" :key="report.id">
                  <!-- ID & DATES -->
                  <td>
                    <strong>#{{ report.id }}</strong
                    ><br />
                    <span class="text-xs text-muted">Created:</span>
                    <span class="text-xs">{{ formatDate(report.created_at) }}</span
                    ><br />
                    <span class="text-xs text-muted">Updated:</span>
                    <span class="text-xs">{{ formatDate(report.updated_at) }}</span>
                  </td>

                  <!-- CATEGORY & STATUS -->
                  <td>
                    <strong>{{
                      report.report_types?.description ||
                      report.report_types?.name ||
                      report.report_types?.type_name ||
                      'N/A'
                    }}</strong
                    ><br />
                    <span class="status-pill mt-1">{{
                      report.report_statuses?.status_name || report.report_statuses?.name || 'N/A'
                    }}</span
                    ><br />
                    <span class="text-xs text-muted mt-1 block"
                      >Branch ID: {{ report.branch_id || 'N/A' }}</span
                    >
                  </td>

                  <!-- LOCATION INFO -->
                  <td>
                    <span class="text-xs"
                      ><strong>Mun:</strong>
                      {{
                        report.municipalities?.name ||
                        report.municipalities?.municipality_name ||
                        'N/A'
                      }}</span
                    ><br />
                    <span class="text-xs"
                      ><strong>Brgy:</strong>
                      {{ report.barangays?.name || report.barangays?.barangay_name || 'N/A' }}</span
                    ><br />
                    <span class="text-xs"
                      ><strong>Landmark:</strong> {{ report.landmark || 'N/A' }}</span
                    ><br />
                    <span class="text-xs text-muted"
                      >Lat: {{ report.latitude || 'N/A' }}<br />Lng:
                      {{ report.longitude || 'N/A' }}</span
                    >
                  </td>

                  <!-- INCIDENT DETAILS -->
                  <td>
                    <span class="text-xs"
                      ><strong>Desc:</strong>
                      {{ report.description || 'No description provided' }}</span
                    ><br />
                    <span class="text-xs text-muted"
                      >Reporter: {{ report.reporterName || 'N/A' }}</span
                    >
                  </td>

                  <!-- ASSIGNED LINEMAN -->
                  <td>
                    <template v-if="report.assignments && report.assignments.length > 0">
                      <div
                        v-for="assignment in report.assignments"
                        :key="assignment.id"
                        class="mb-2"
                      >
                        <span class="text-xs block">
                          <strong>{{ assignment.employeeName }}</strong>
                        </span>
                        <span class="text-xs text-muted block" v-if="assignment.employees">
                          {{ assignment.employees.designation || 'Lineman' }}
                        </span>
                      </div>
                    </template>
                    <span class="text-xs text-muted" v-else> Unassigned </span>
                  </td>

                  <!-- RESOLUTION LOG -->
                  <td>
                    <span class="text-xs"
                      ><strong>Time:</strong> {{ report.resolution_time || 'N/A' }}</span
                    ><br />
                    <span class="text-xs"
                      ><strong>Remarks:</strong> {{ report.remarks || 'None' }}</span
                    ><br />
                    <span class="text-xs"
                      ><strong>Delay:</strong> {{ report.delay_reason || 'None' }}</span
                    >
                  </td>
                </tr>
                <tr v-if="filteredReports.length === 0">
                  <td colspan="6" class="empty-state text-center">
                    No detailed reports match your current filters.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import { Printer } from 'lucide-vue-next'

// Import Layout Components
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'

// --- State Variables ---
const rawReports = ref([])
const reportStatuses = ref([])
const reportTypes = ref([])
const currentDateTime = ref(new Date().toLocaleString())

// Filters
const dateFrom = ref('')
const dateTo = ref('')
const selectedStatus = ref('')
const selectedCategory = ref('')

// --- Data Fetching ---
const fetchData = async () => {
  try {
    // 1. Fetch dictionaries, assignments, employees, and users tables independently
    const [statusRes, typesRes, assignmentsRes, employeesRes, usersRes] = await Promise.all([
      supabase.from('report_statuses').select('*'),
      supabase.from('report_types').select('*'),
      supabase.from('assignments').select('*'),
      supabase.from('employees').select('*'),
      supabase.from('users').select('*'),
    ])

    if (statusRes.data) reportStatuses.value = statusRes.data
    if (typesRes.data) reportTypes.value = typesRes.data

    // 2. Fetch primary reports
    const { data: reportsData, error: reportsError } = await supabase
      .from('reports')
      .select(
        `
        *,
        report_types (*),
        municipalities (*),
        barangays (*),
        report_statuses (*)
      `,
      )
      .order('created_at', { ascending: false })

    if (reportsError) {
      console.error('Error fetching reports:', reportsError)
      return
    }

    // 3. Manually map the data together using the correct UUID foreign keys
    const allAssignments = assignmentsRes?.data || []
    const allEmployees = employeesRes?.data || []
    const allUsers = usersRes?.data || []

    rawReports.value = (reportsData || []).map((report) => {
      // Find assignments connected to this specific report_id
      const linkedAssignments = allAssignments
        .filter((a) => a.report_id === report.id)
        .map((assignment) => {
          // assignment.lineman_id is a UUID, so we match it to employee.user_id
          const matchedEmployee = allEmployees.find((e) => e.user_id === assignment.lineman_id)

          // Match assignment.lineman_id directly to the users table to get the name
          const matchedUser = allUsers.find(
            (u) => u.id === assignment.lineman_id || u.user_id === assignment.lineman_id,
          )

          let employeeName = 'Unknown Lineman'

          if (matchedUser) {
            const fName = matchedUser.first_name || ''
            const lName = matchedUser.last_name || ''
            employeeName =
              matchedUser.full_name ||
              matchedUser.name ||
              `${fName} ${lName}`.trim() ||
              'No Name Provided'
          } else if (matchedEmployee) {
            // Fallback if user table doesn't have it, but employees table does
            const fName = matchedEmployee.first_name || ''
            const lName = matchedEmployee.last_name || ''
            employeeName =
              matchedEmployee.full_name ||
              matchedEmployee.name ||
              `${fName} ${lName}`.trim() ||
              'No Name Provided'
          }

          return {
            ...assignment,
            employees: matchedEmployee || null,
            employeeName: employeeName,
          }
        })

      // --- MAP THE REPORTER'S NAME ---
      let mappedReporterName = report.residents_id // Fallback to ID if no match is found
      const matchedResident = allUsers.find(
        (u) => u.id === report.residents_id || u.user_id === report.residents_id,
      )

      if (matchedResident) {
        const fName = matchedResident.first_name || ''
        const lName = matchedResident.last_name || ''
        mappedReporterName =
          matchedResident.full_name ||
          matchedResident.name ||
          `${fName} ${lName}`.trim() ||
          report.residents_id
      }

      return {
        ...report,
        assignments: linkedAssignments,
        reporterName: mappedReporterName, // Attach mapped name to the report object
      }
    })
  } catch (err) {
    console.error('Unexpected error fetching comprehensive reports:', err)
  }
}

onMounted(() => {
  fetchData()
  currentDateTime.value = new Date().toLocaleString()
})

// --- Computed & Logic ---
const filteredReports = computed(() => {
  return rawReports.value.filter((report) => {
    let isValid = true
    const reportDate = new Date(report.created_at)

    if (dateFrom.value) {
      isValid = isValid && reportDate >= new Date(dateFrom.value)
    }
    if (dateTo.value) {
      const toDate = new Date(dateTo.value)
      toDate.setHours(23, 59, 59, 999)
      isValid = isValid && reportDate <= toDate
    }
    if (selectedStatus.value) {
      isValid = isValid && report.status_id === selectedStatus.value
    }
    if (selectedCategory.value) {
      isValid = isValid && report.report_type_id === selectedCategory.value
    }

    return isValid
  })
})

const formatDate = (dateString) => {
  if (!dateString) return ''
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
  return new Date(dateString).toLocaleDateString('en-US', options)
}

const printReport = () => {
  currentDateTime.value = new Date().toLocaleString()
  window.print()
}
</script>

<style scoped>
/* Layout Styles */
.layout-wrapper {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Dashboard Styles */
.reports-dashboard {
  padding: 24px 32px;
  background: #f8fafc;
  flex: 1;
  font-family: Arial, sans-serif;
  overflow-y: auto;
}

/* Banner Section */
.banner-section {
  position: relative;
  background-image:
    linear-gradient(to right, rgba(30, 27, 75, 0.95), rgba(30, 27, 75, 0.4)),
    url('@/assets/Background/bannerdashboard.jpg');
  background-size: cover;
  background-position: center;
  border-radius: 8px;
  padding: 32px 40px;
  color: white;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.banner-content h1 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  text-transform: uppercase;
  color: #f8fafc;
}

.banner-content p {
  font-size: 1rem;
  margin: 0;
  color: #e2e8f0;
}

/* Controls */
.controls-section {
  background: white;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.page-title {
  color: #1e293b;
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.25rem;
  font-weight: 700;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #475569;
}

.input-field {
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.9rem;
  outline: none;
  background-color: white;
  color: #000;
}
.input-field:focus {
  border-color: #1e1b4b;
  box-shadow: 0 0 0 1px #1e1b4b;
}

.action-row {
  display: flex;
  justify-content: flex-end;
}

.btn-submit {
  background: #1e1b4b;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: opacity 0.2s;
}
.btn-submit:hover {
  opacity: 0.9;
}

.report-section {
  background: white;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.section-heading {
  font-size: 1.1rem;
  font-weight: 800;
  background: #f8fafc;
  padding: 8px 12px;
  border-left: 4px solid #facc15;
  margin-top: 0;
  margin-bottom: 16px;
  text-transform: uppercase;
  color: #1e1b4b;
}

.total-badge {
  font-weight: 600;
  color: #64748b;
  margin-bottom: 20px;
  font-size: 0.9rem;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 14px 16px;
  text-align: left;
  font-size: 0.9rem;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: top;
}

.data-table td {
  color: #000;
}

.data-table th {
  background-color: #f8fafc;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #e2e8f0;
}

.empty-state {
  text-align: center;
  color: #94a3b8;
  padding: 32px !important;
  font-style: italic;
}
.text-center {
  text-align: center !important;
}
.text-xs {
  font-size: 0.75rem;
  line-height: 1.4;
}
.text-muted {
  color: #64748b;
}
.text-link {
  color: #2563eb;
  text-decoration: underline;
}
.mt-1 {
  margin-top: 4px;
  display: inline-block;
}
.block {
  display: block;
}
.mb-2 {
  margin-bottom: 8px;
}

.status-pill {
  background: #e0e7ff;
  color: #3730a3;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
}

/* Shared Print Header Styles */
.only-print {
  display: none;
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

/* PRINT STYLES */
@media print {
  @page {
    size: A4 landscape;
    margin: 1cm;
  }
  body {
    background: white !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  .no-print,
  .sidebar,
  .topbar-container {
    display: none !important;
  }
  .layout-wrapper,
  .main-content {
    display: block;
    background: white;
  }
  .reports-dashboard {
    padding: 0;
  }
  .printable-report {
    padding: 0 !important;
    margin: 0 !important;
  }
  .report-section {
    box-shadow: none !important;
    border: none !important;
    padding: 0 !important;
    page-break-inside: auto;
  }
  .only-print {
    display: flex !important;
  }
  .section-heading {
    border-left: 4px solid #000 !important;
    background: #f8fafc !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .print-table th {
    background-color: #f1f5f9 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .data-table th,
  .data-table td {
    border: 1px solid #cbd5e1 !important;
    padding: 10px;
    word-wrap: break-word;
    max-width: 200px;
  }
}
</style>
