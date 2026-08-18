<template>
  <div class="dashboard-root">
    <!-- Sidebar Component -->
    <Sidebar />

    <main class="content">
      <!-- Top Banner -->
      <div class="header-banner">
        <h1 class="banner-title">ARCHIVE</h1>
        <p class="banner-subtitle">View and manage historical, resolved, and rejected reports.</p>
      </div>

      <!-- Main Table Container -->
      <div class="table-card mt-4">
        <!-- Filters Toolbar -->
        <div class="table-toolbar">
          <div class="segmented-control">
            <button
              :class="['segment-btn', { active: filterStatus === 'all' }]"
              @click="filterStatus = 'all'"
            >
              ALL ARCHIVED
            </button>
            <button
              :class="['segment-btn', { active: filterStatus === 'resolved' }]"
              @click="filterStatus = 'resolved'"
            >
              RESOLVED
            </button>
            <button
              :class="['segment-btn', { active: filterStatus === 'rejected' }]"
              @click="filterStatus = 'rejected'"
            >
              REJECTED
            </button>
          </div>

          <!-- Search Box (Optional) -->
          <div class="search-box">
            <input type="text" placeholder="Search archive..." class="select-input" />
          </div>
        </div>

        <!-- Data Table -->
        <table class="data-table">
          <thead>
            <tr>
              <th>REPORT ID</th>
              <th>LOCATION</th>
              <th>DATE FILED</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="5" class="empty-state">Loading archive...</td>
            </tr>
            <tr v-else-if="filteredReports.length === 0">
              <td colspan="5" class="empty-state">No archived reports found.</td>
            </tr>
            <tr v-for="report in filteredReports" :key="report.id">
              <td class="col-name">#{{ report.id }}</td>
              <td class="col-role">
                Brgy {{ report.barangay_id }}, {{ report.purok_sitio || 'N/A' }}
              </td>
              <td class="col-contact">
                <div class="contact-email">{{ formatDate(report.created_at) }}</div>
              </td>
              <td class="col-status">
                <div class="status-indicator">
                  <span
                    :class="['status-dot', report.status_id === 6 ? 'active' : 'inactive']"
                  ></span>
                  {{ report.status_id === 6 ? 'Resolved' : 'Rejected' }}
                </div>
              </td>
              <td class="col-actions">
                <!-- Retrieve Button -->
                <button
                  class="action-btn btn-retrieve"
                  :disabled="processingId === report.id"
                  @click="retrieveReport(report)"
                >
                  {{ processingId === report.id ? 'Retrieving...' : 'Retrieve' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import Sidebar from '@/components/Sidebar.vue'

const reports = ref([])
const loading = ref(true)
const processingId = ref(null)
const filterStatus = ref('all') // 'all', 'resolved', 'rejected'

// Helper to format dates
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Fetch Archived Reports (Status 5 = Rejected, 6 = Resolved)
const loadArchivedReports = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .in('status_id', [5, 6])
      .order('created_at', { ascending: false })

    if (error) throw error
    reports.value = data || []
  } catch (err) {
    console.error('Error fetching archived reports:', err.message)
  } finally {
    loading.value = false
  }
}

// Retrieve Report Logic
const retrieveReport = async (report) => {
  const confirmed = window.confirm(
    `Are you sure you want to retrieve Report #${report.id}? This will set its status back to 'Pending'.`,
  )
  if (!confirmed) return

  processingId.value = report.id

  try {
    // status_id 1 is 'Pending' based on your database schema
    const { error } = await supabase.from('reports').update({ status_id: 1 }).eq('id', report.id)

    if (error) throw error

    // Remove the report from the local UI array because it is no longer "Archived"
    reports.value = reports.value.filter((r) => r.id !== report.id)
  } catch (err) {
    console.error('Failed to retrieve report:', err.message)
    alert('Error retrieving the report. Please try again.')
  } finally {
    processingId.value = null
  }
}

// Computed Property for filtering
const filteredReports = computed(() => {
  if (filterStatus.value === 'resolved') {
    return reports.value.filter((r) => r.status_id === 6)
  }
  if (filterStatus.value === 'rejected') {
    return reports.value.filter((r) => r.status_id === 5)
  }
  return reports.value
})

onMounted(() => {
  loadArchivedReports()
})
</script>

<style scoped>
/* Page Layout Setup */
.dashboard-root {
  display: flex;
  min-height: 100vh;
  background-color: #f4f7f6;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

.content {
  flex: 1;
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

/* Header Banner */
.header-banner {
  background: linear-gradient(135deg, #1e2a78 0%, #283593 100%);
  border-radius: 8px;
  padding: 24px 32px;
  color: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.banner-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.banner-subtitle {
  margin: 8px 0 0;
  font-size: 0.9rem;
  color: #c7d2fe;
}

/* Table Card */
.table-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}

/* Filters Toolbar */
.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.segmented-control {
  display: flex;
  background-color: #f1f5f9;
  border-radius: 8px;
  padding: 4px;
}

.segment-btn {
  background: transparent;
  border: none;
  padding: 8px 16px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.segment-btn.active {
  background-color: #1e2a78;
  color: white;
}

.select-input {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background-color: white;
  color: #334155;
  font-size: 0.9rem;
  outline: none;
}

/* Data Table */
.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.data-table th {
  padding: 12px 16px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e2e8f0;
}

.data-table td {
  padding: 16px;
  font-size: 0.95rem;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.col-name {
  font-weight: 600;
  color: #0f172a;
}

.col-role {
  color: #475569;
}

.contact-email {
  font-size: 0.9rem;
  color: #334155;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.status-dot.active {
  background-color: #10b981; /* Green for Resolved */
}
.status-dot.inactive {
  background-color: #ef4444; /* Red for Rejected */
}

/* Action Buttons */
.col-actions {
  text-align: right;
}

.action-btn {
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    opacity 0.2s,
    background-color 0.2s;
  color: white;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Retrieve Button Styling (Amber/Orange to stand out) */
.btn-retrieve {
  background-color: #f59e0b;
}

.btn-retrieve:hover:not(:disabled) {
  background-color: #d97706;
}

.empty-state {
  text-align: center;
  padding: 40px !important;
  color: #64748b;
  font-style: italic;
}
</style>
