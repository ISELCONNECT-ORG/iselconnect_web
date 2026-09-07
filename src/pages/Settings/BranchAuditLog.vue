<template>
  <div class="dashboard-root">
    <Sidebar />

    <main class="content">
      <Topbar />

      <!-- Hero Banner -->
      <header class="hero-banner">
        <div class="hero-overlay-content">
          <div class="hero-title">
            <FileText :size="28" class="hero-icon" />
            <h1>Audit Log</h1>
          </div>
          <p>Complete ledger of system actions and administrative events.</p>
        </div>
      </header>

      <!-- Filters Section -->
      <div class="filters-container">
        <div class="search-box">
          <Search :size="16" class="filter-icon" />
          <input type="text" v-model="searchQuery" placeholder="Search by user or target..." />
        </div>

        <div class="filter-dropdowns">
          <div class="dropdown-wrapper">
            <Calendar :size="16" class="filter-icon" />
            <select v-model="dateFilter">
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div class="dropdown-wrapper">
            <Filter :size="16" class="filter-icon" />
            <select v-model="actionFilter">
              <option value="all">All Actions</option>
              <option value="USER_LOGIN">USER_LOGIN</option>
              <option value="USER_LOGOUT">USER_LOGOUT</option>
              <option value="SUBMIT_REPORT">SUBMIT_REPORT</option>
              <option value="UPDATE_REPORT_STATUS">UPDATE_REPORT_STATUS</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Table Panel -->
      <div class="table-panel">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>ACTION TYPE</th>
                <th>DETAILS</th>
                <th>TIMESTAMP</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="4" class="empty-state">Loading logs...</td>
              </tr>
              <tr v-else-if="logs.length === 0">
                <td colspan="4" class="empty-state">
                  No system logs found matching your criteria.
                </td>
              </tr>
              <tr v-for="log in logs" :key="log.id" v-else>
                <td class="font-bold id-cell">{{ log.id }}</td>
                <td>
                  <span :class="['badge', getBadgeClass(log.action_type)]">
                    {{ log.action_type }}
                  </span>
                </td>
                <td class="muted">{{ log.action_details }}</td>
                <td class="muted timestamp">
                  {{ formatDateTime(log.created_at) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Footer -->
        <div class="pagination-footer">
          <span class="pagination-info">
            Showing {{ paginationStart }} to {{ paginationEnd }} of {{ totalItems }} entries
          </span>
          <div class="pagination-controls">
            <!-- Previous Button -->
            <button
              class="page-btn"
              :disabled="currentPage === 1"
              @click="changePage(currentPage - 1)"
            >
              <ChevronLeft :size="14" />
            </button>

            <!-- Page Numbers -->
            <button
              v-for="page in visiblePages"
              :key="page"
              :class="['page-btn', { active: page === currentPage }]"
              @click="changePage(page)"
            >
              {{ page }}
            </button>

            <!-- Ellipsis and Last Page -->
            <span v-if="showEllipsis" class="ellipsis">...</span>
            <button v-if="showLastPage" class="page-btn" @click="changePage(totalPages)">
              {{ totalPages }}
            </button>

            <!-- Next Button -->
            <button
              class="page-btn"
              :disabled="currentPage === totalPages || totalPages === 0"
              @click="changePage(currentPage + 1)"
            >
              <ChevronRight :size="14" />
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import Sidebar from '@/components/BranchSidebar.vue'
import Topbar from '@/components/BranchTopbar.vue'
import { FileText, Search, Calendar, Filter, ChevronLeft, ChevronRight } from 'lucide-vue-next'

// --- State Variables ---
const logs = ref([])
const loading = ref(false)

// Filters
const searchQuery = ref('')
const dateFilter = ref('7') // Defaults to 7 Days
const actionFilter = ref('all') // Defaults to All Actions

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(5) // Adjust this if you want more rows per page
const totalItems = ref(0)

// --- Computed Properties for Pagination ---
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))
const paginationStart = computed(() =>
  totalItems.value === 0 ? 0 : (currentPage.value - 1) * itemsPerPage.value + 1,
)
const paginationEnd = computed(() =>
  Math.min(currentPage.value * itemsPerPage.value, totalItems.value),
)

const visiblePages = computed(() => {
  const pages = []
  let start = Math.max(1, currentPage.value - 1)
  let end = Math.min(totalPages.value, currentPage.value + 1)

  // Adjust window if we are at the beginning or end
  if (currentPage.value === 1) end = Math.min(totalPages.value, 3)
  if (currentPage.value === totalPages.value) start = Math.max(1, totalPages.value - 2)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

const showEllipsis = computed(
  () => totalPages.value > visiblePages.value[visiblePages.value.length - 1] + 1,
)
const showLastPage = computed(
  () => totalPages.value > visiblePages.value[visiblePages.value.length - 1],
)

// --- Formatting Helpers ---
const formatDateTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')

  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`
}

const getBadgeClass = (actionType) => {
  const type = actionType ? actionType.toUpperCase() : ''
  if (type.includes('LOGOUT') || type.includes('LOGIN')) return 'badge-grey'
  if (type.includes('SUBMIT')) return 'badge-blue'
  if (type.includes('UPDATE')) return 'badge-yellow'
  return 'badge-default'
}

// --- Data Fetching Logic ---
const fetchLogs = async () => {
  loading.value = true

  try {
    let query = supabase
      .from('system_logs')
      .select('id, action_type, action_details, created_at', { count: 'exact' })

    // Apply Search Filter (searching within action_details)
    if (searchQuery.value.trim()) {
      query = query.ilike('action_details', `%${searchQuery.value.trim()}%`)
    }

    // Apply Date Filter
    if (dateFilter.value !== 'all') {
      const d = new Date()
      d.setDate(d.getDate() - parseInt(dateFilter.value))
      query = query.gte('created_at', d.toISOString())
    }

    // Apply Action Filter
    if (actionFilter.value !== 'all') {
      query = query.eq('action_type', actionFilter.value)
    }

    // Apply Pagination logic
    const from = (currentPage.value - 1) * itemsPerPage.value
    const to = from + itemsPerPage.value - 1

    query = query.order('created_at', { ascending: false }).range(from, to)

    const { data, error, count } = await query

    if (error) throw error

    logs.value = data || []
    totalItems.value = count || 0
  } catch (error) {
    console.error('Error fetching logs:', error.message)
    logs.value = []
    totalItems.value = 0
  } finally {
    loading.value = false
  }
}

// --- Interaction Handlers ---
const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchLogs()
  }
}

// Watch for filter changes and debounce the search
let searchTimeout = null
watch([searchQuery, dateFilter, actionFilter], () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1 // Reset to first page when filters change
    fetchLogs()
  }, 300) // 300ms delay to prevent excessive queries while typing
})

onMounted(() => {
  fetchLogs()
})
</script>

<style scoped>
.dashboard-root {
  display: flex;
  background: #f8fafc;
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
  color: #0f172a;
}

.content {
  flex-grow: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
}

/* Hero Banner */
.hero-banner {
  position: relative;
  background: url('@/assets/Background/bannerdashboard.jpg') no-repeat right center;
  background-size: cover;
  background-color: #4b6cb7;
  border-radius: 8px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.hero-banner::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(75, 108, 183, 1) 0%, rgba(24, 40, 72, 0.8) 100%);
  z-index: 1;
}

.hero-overlay-content {
  position: relative;
  z-index: 2;
  color: white;
}

.hero-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.hero-icon {
  color: #ffd700;
}

.hero-overlay-content h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.hero-overlay-content p {
  margin: 0;
  font-size: 0.95rem;
  color: #e2e8f0;
}

/* Filters Section */
.filters-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 16px;
}

.search-box {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 8px 12px;
  flex-grow: 1;
  max-width: 300px;
}

.search-box input {
  border: none;
  outline: none;
  margin-left: 8px;
  width: 100%;
  font-size: 0.85rem;
  color: #334155;
}

.filter-dropdowns {
  display: flex;
  gap: 12px;
}

.dropdown-wrapper {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 8px 12px;
}

.dropdown-wrapper select {
  border: none;
  outline: none;
  background: transparent;
  margin-left: 8px;
  font-size: 0.85rem;
  color: #475569;
  cursor: pointer;
  appearance: none;
  padding-right: 16px;
}

.filter-icon {
  color: #64748b;
}

/* Table Panel */
.table-panel {
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  text-align: left;
  font-weight: 700;
  font-size: 0.75rem;
  color: #475569;
  padding: 16px 24px;
  border-bottom: 1px solid #e2e8f0;
  text-transform: uppercase;
  background-color: #f8fafc;
}

.data-table td {
  padding: 16px 24px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.85rem;
  vertical-align: middle;
}

.font-bold {
  font-weight: 600;
  color: #334155;
}

.id-cell {
  width: 80px;
}

.muted {
  color: #64748b;
}

.timestamp {
  white-space: nowrap;
}

/* Badges */
.badge {
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 700;
  display: inline-block;
  text-transform: uppercase;
}

.badge-grey {
  background-color: #e2e8f0;
  color: #475569;
}

.badge-blue {
  background-color: #312e81;
  color: white;
}

.badge-yellow {
  background-color: #fbbf24;
  color: #78350f;
}

.badge-default {
  background-color: #f1f5f9;
  color: #64748b;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #94a3b8;
  font-style: italic;
}

/* Pagination Footer */
.pagination-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: #f8fafc;
  border-top: 1px solid #e2e8f0;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
}

.pagination-info {
  font-size: 0.85rem;
  color: #64748b;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  min-width: 28px;
  height: 28px;
  font-size: 0.8rem;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #f1f5f9;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f8fafc;
}

.page-btn.active {
  background: #1e1b4b;
  color: white;
  border-color: #1e1b4b;
}

.ellipsis {
  color: #94a3b8;
  padding: 0 4px;
}
</style>
