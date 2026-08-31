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
            <h1>REPORTS & DOCUMENTS</h1>
            <p>Comprehensive reporting and document management for ISELCONNECT field operations.</p>
          </div>
        </div>

        <!-- NO-PRINT ZONE: Controls and Filters -->
        <div class="controls-section no-print">
          <h2 class="page-title">Reports & Documents</h2>

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

            <!-- 2. Main Report Category Selection -->
            <div class="filter-group">
              <label>Report View</label>
              <select v-model="reportView" class="input-field">
                <option value="summary">Category Summary Report</option>
                <option value="category">Report by Category</option>
                <option value="municipality">Report by Municipality/Town</option>
                <option value="barangay">Report by Barangay</option>
              </select>
            </div>

            <!-- 3. Conditional Filters -->
            <div v-if="reportView === 'category'" class="filter-group">
              <label>Select Specific Category</label>
              <select v-model="selectedCategory" class="input-field">
                <option value="">-- All Categories --</option>
                <option v-for="type in reportTypes" :key="type.id" :value="type.id">
                  {{ type.description || type.name || type.type_name }}
                </option>
              </select>
            </div>

            <div v-if="reportView === 'barangay'" class="filter-group">
              <label>Select Barangay</label>
              <select v-model="selectedBarangay" class="input-field">
                <option value="">-- All Barangays --</option>
                <option v-for="brgy in barangays" :key="brgy.id" :value="brgy.id">
                  {{ brgy.name || brgy.barangay_name }}
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
          <div class="print-header only-print">
            <h2>ISELCONNECT System Report</h2>
            <p v-if="dateFrom || dateTo">
              Period: {{ dateFrom ? dateFrom : 'Beginning' }} to {{ dateTo ? dateTo : 'Present' }}
            </p>
          </div>

          <!-- VIEW A: Category Summary Report -->
          <div v-if="reportView === 'summary'" class="report-section">
            <h3>Overall Category Summary</h3>
            <p class="total-badge">Total Reports: {{ filteredReports.length }}</p>

            <table class="data-table">
              <thead>
                <tr>
                  <th>REPORT CATEGORY</th>
                  <th>TOTAL INCIDENTS</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(count, name) in categorySummaryData" :key="name">
                  <td>{{ name }}</td>
                  <td>{{ count }}</td>
                </tr>
                <tr v-if="Object.keys(categorySummaryData).length === 0">
                  <td colspan="2" class="empty-state">No data available for this period.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- VIEW B: Report by Municipality (Summary) -->
          <div v-if="reportView === 'municipality'" class="report-section">
            <h3>Municipality / Town Breakdown</h3>
            <p class="total-badge">Total Reports: {{ filteredReports.length }}</p>

            <table class="data-table">
              <thead>
                <tr>
                  <th>MUNICIPALITY / TOWN</th>
                  <th>TOTAL INCIDENTS</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(count, name) in municipalitySummaryData" :key="name">
                  <td>{{ name }}</td>
                  <td>{{ count }}</td>
                </tr>
                <tr v-if="Object.keys(municipalitySummaryData).length === 0">
                  <td colspan="2" class="empty-state">No data available for this period.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- VIEW C & D: Detailed Table -->
          <div v-if="reportView === 'category' || reportView === 'barangay'" class="report-section">
            <h3 v-if="reportView === 'category'">
              Detailed Reports
              {{ selectedCategory ? '(Filtered by Category)' : '(All Categories)' }}
            </h3>
            <h3 v-if="reportView === 'barangay'">
              Detailed Reports {{ selectedBarangay ? '(Filtered by Barangay)' : '(All Barangays)' }}
            </h3>

            <table class="data-table">
              <thead>
                <tr>
                  <th>REPORT ID</th>
                  <th>DATE CREATED</th>
                  <th>CATEGORY</th>
                  <th>MUNICIPALITY</th>
                  <th>BARANGAY</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="report in detailedReports" :key="report.id">
                  <td>#{{ report.id }}</td>
                  <td>{{ formatDate(report.created_at) }}</td>
                  <td>
                    {{
                      report.report_types?.description ||
                      report.report_types?.name ||
                      report.report_types?.type_name ||
                      'N/A'
                    }}
                  </td>
                  <td>
                    {{
                      report.municipalities?.name ||
                      report.municipalities?.municipality_name ||
                      'N/A'
                    }}
                  </td>
                  <td>{{ report.barangays?.name || report.barangays?.barangay_name || 'N/A' }}</td>
                  <td>
                    <span class="status-pill">{{
                      report.report_statuses?.status_name || report.report_statuses?.name || 'N/A'
                    }}</span>
                  </td>
                </tr>
                <tr v-if="detailedReports.length === 0">
                  <td colspan="6" class="empty-state">No reports match your current filters.</td>
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

// Import Layout Components (Adjust paths to match your project structure)
import Sidebar from '@/components/Sidebar.vue'

// --- State Variables ---
const rawReports = ref([])
const reportTypes = ref([])
const barangays = ref([])

// Filters
const dateFrom = ref('')
const dateTo = ref('')
const reportView = ref('category')
const selectedCategory = ref('')
const selectedBarangay = ref('')

// --- Data Fetching ---
const fetchData = async () => {
  const [typesRes, brgysRes] = await Promise.all([
    supabase.from('report_types').select('*'),
    supabase.from('barangays').select('*'),
  ])
  if (typesRes.data) reportTypes.value = typesRes.data
  if (brgysRes.data) barangays.value = brgysRes.data

  const { data, error } = await supabase
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

  if (error) {
    console.error('Error fetching reports:', error)
  } else {
    rawReports.value = data
  }
}

onMounted(() => {
  fetchData()
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
    return isValid
  })
})

const categorySummaryData = computed(() => {
  const counts = {}
  filteredReports.value.forEach((report) => {
    const catName =
      report.report_types?.description ||
      report.report_types?.name ||
      report.report_types?.type_name ||
      'Uncategorized'
    counts[catName] = (counts[catName] || 0) + 1
  })
  return counts
})

const municipalitySummaryData = computed(() => {
  const counts = {}
  filteredReports.value.forEach((report) => {
    const munName =
      report.municipalities?.name ||
      report.municipalities?.municipality_name ||
      'Unspecified Municipality'
    counts[munName] = (counts[munName] || 0) + 1
  })
  return counts
})

const detailedReports = computed(() => {
  let list = filteredReports.value

  if (reportView.value === 'category' && selectedCategory.value) {
    list = list.filter((r) => r.report_type_id === selectedCategory.value)
  }
  if (reportView.value === 'barangay' && selectedBarangay.value) {
    list = list.filter((r) => r.barangay_id === selectedBarangay.value)
  }

  return list
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
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.banner-content h1 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.banner-content p {
  font-size: 1rem;
  margin: 0;
  color: #e2e8f0;
  max-width: 600px;
}

/* Controls / Card styling */
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
  color: #000000;
  background-color: white;
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
  transition:
    opacity 0.2s,
    transform 0.1s;
}
.btn-submit:hover {
  opacity: 0.9;
}
.btn-submit:active {
  transform: scale(0.98);
}

.report-section {
  background: white;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.report-section h3 {
  color: #1e293b;
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 1.15rem;
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
}

.data-table td {
  color: #000000;
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

.data-table tr:last-child td {
  border-bottom: none;
}

.empty-state {
  text-align: center;
  color: #94a3b8;
  padding: 32px !important;
  font-style: italic;
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

.only-print {
  display: none;
}

/* PRINT STYLES */
@media print {
  .no-print {
    display: none !important;
  }

  .layout-wrapper {
    display: block;
    background: white;
  }

  .reports-dashboard {
    background: white;
    padding: 0;
    overflow: visible;
  }

  .report-section {
    box-shadow: none;
    border: none;
    padding: 0;
  }

  .data-table th,
  .data-table td {
    border: 1px solid #cbd5e1;
  }
  .data-table tr:last-child td {
    border-bottom: 1px solid #cbd5e1;
  }

  .only-print {
    display: block;
    margin-bottom: 20px;
    border-bottom: 2px solid #1e1b4b;
    padding-bottom: 10px;
  }

  .only-print h2 {
    color: #1e1b4b;
    margin: 0 0 5px 0;
  }

  .only-print p {
    margin: 0;
    color: #64748b;
  }

  .data-table th {
    background-color: #f1f5f9 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
</style>
