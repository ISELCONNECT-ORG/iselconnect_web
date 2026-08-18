<template>
  <div class="dashboard-root">
    <Sidebar />

    <main class="content">
      <div class="header-banner">
        <h1 class="banner-title">USER MANAGEMENT</h1>
        <p class="banner-subtitle">Comprehensive profile and access management for all users</p>
      </div>

      <div class="stats-card">
        <div class="add-btn-container">
          <button class="btn-primary" style="visibility: hidden">
            <span class="icon">+</span> ADD USER
          </button>
        </div>

        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">TOTAL USERS</span>
            <span class="stat-value">{{ totalUsers }}</span>
          </div>
          <div class="stat-divider"></div>

          <div class="stat-item">
            <span class="stat-label">ACTIVE</span>
            <span class="stat-value">{{ activeCount }}</span>
          </div>
          <div class="stat-divider"></div>

          <div class="stat-item">
            <span class="stat-label">BANNED</span>
            <span class="stat-value text-red">{{ bannedCount }}</span>
          </div>
          <div class="stat-divider"></div>

          <div class="stat-item">
            <span class="stat-label">RESIDENT REJECTIONS</span>
            <span class="stat-value text-orange">{{ totalResidentRejections }}</span>
          </div>
        </div>
      </div>

      <div class="table-card">
        <div class="table-toolbar">
          <div class="segmented-control">
            <button
              :class="['segment-btn', { active: filterStatus === 'all' }]"
              @click="filterStatus = 'all'"
            >
              ALL
            </button>
            <button
              :class="['segment-btn', { active: filterStatus === 'active' }]"
              @click="filterStatus = 'active'"
            >
              ACTIVE
            </button>
            <button
              :class="['segment-btn', { active: filterStatus === 'banned' }]"
              @click="filterStatus = 'banned'"
            >
              BANNED
            </button>
          </div>

          <div class="role-filter">
            <select v-model="filterRole" class="select-input">
              <option value="all">All Roles</option>
              <option value="7">Residents</option>
              <option value="9">Linemen</option>
              <option value="6">Branches</option>
              <option value="8">Admins</option>
            </select>
          </div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>NAME</th>
              <th>ROLE</th>
              <th>EMAIL / MOBILE</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="5" class="empty-state">Loading users...</td>
            </tr>
            <tr v-else-if="filteredUsers.length === 0">
              <td colspan="5" class="empty-state">No users found matching your filters.</td>
            </tr>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td class="col-name">{{ user.first_name || 'N/A' }} {{ user.last_name || '' }}</td>
              <td class="col-role">
                {{ getRoleName(user.role_id) }}
              </td>
              <td class="col-contact">
                <div class="contact-email">{{ user.email || 'No Email' }}</div>
                <div class="contact-mobile">{{ user.mobile_number || 'No Mobile' }}</div>
              </td>
              <td class="col-status">
                <div class="status-indicator">
                  <span :class="['status-dot', user.ban_status ? 'inactive' : 'active']"></span>
                  {{ user.ban_status ? 'Banned' : 'Active' }}
                </div>
                <div v-if="user.rejected_count > 0" class="rejection-text">
                  {{ user.rejected_count }}/5 Rejections
                </div>
              </td>
              <td class="col-actions">
                <button
                  v-if="!user.ban_status"
                  class="action-btn btn-block"
                  :disabled="processingId === user.id"
                  @click="updateUserStatus(user, true)"
                >
                  {{ processingId === user.id ? 'Wait...' : 'Block' }}
                </button>

                <button
                  v-else
                  class="action-btn btn-unblock"
                  :disabled="processingId === user.id"
                  @click="updateUserStatus(user, false)"
                >
                  {{ processingId === user.id ? 'Wait...' : 'Unblock' }}
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

// IMPORT SIDEBAR: Adjust this path if your Sidebar is located elsewhere!
import Sidebar from '@/components/Sidebar.vue'

const users = ref([])
const loading = ref(true)
const processingId = ref(null)

// Filters
const filterStatus = ref('all') // 'all', 'active', 'banned'
const filterRole = ref('all') // 'all', '6', '7', '8', '9'

// Role Mapping based on DB schema
const roleMap = {
  6: 'Branch',
  7: 'Resident',
  8: 'Admin',
  9: 'Lineman',
}

const getRoleName = (roleId) => {
  return roleMap[roleId] || `Unknown (${roleId})`
}

// --- Fetch Data & Auto-Ban Logic ---
const fetchUsers = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*, reports(status_id)')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Process users for the Auto-Ban logic
    const processedUsers = await Promise.all(
      (data || []).map(async (user) => {
        // Safely count rejected reports (ID = 5)
        const rejectedCount =
          user.reports?.filter((r) => r.status_id === 5 || r.report_status_id === 5).length || 0
        user.rejected_count = rejectedCount

        // Auto-Ban Condition: 5 or more rejections AND they are not currently banned
        if (rejectedCount >= 5 && user.ban_status !== true) {
          const { error: banError } = await supabase
            .from('users')
            .update({ ban_status: true })
            .eq('id', user.id)

          if (!banError) {
            user.ban_status = true // Update local state automatically
          } else {
            console.error(`Failed to auto-ban user ${user.id}:`, banError.message)
          }
        }
        return user
      }),
    )

    users.value = processedUsers
  } catch (err) {
    console.error('Error fetching users:', err.message)
  } finally {
    loading.value = false
  }
}

// --- Dynamic Counts ---
const totalUsers = computed(() => users.value.length)
const activeCount = computed(() => users.value.filter((u) => !u.ban_status).length)
const bannedCount = computed(() => users.value.filter((u) => u.ban_status === true).length)

// NEW: Calculate Total Rejected Reports ONLY for Residents (role_id === 7)
const totalResidentRejections = computed(() => {
  return users.value
    .filter((u) => u.role_id === 7) // Filter for residents
    .reduce((total, user) => total + (user.rejected_count || 0), 0) // Sum up their rejections
})

// --- Filtering Logic ---
const filteredUsers = computed(() => {
  return users.value.filter((user) => {
    // 1. Status Filter
    let matchesStatus = true
    if (filterStatus.value === 'active') matchesStatus = !user.ban_status
    if (filterStatus.value === 'banned') matchesStatus = user.ban_status === true

    // 2. Role Filter
    let matchesRole = true
    if (filterRole.value !== 'all') {
      matchesRole = user.role_id === parseInt(filterRole.value)
    }

    return matchesStatus && matchesRole
  })
})

// --- Block / Unblock Database Operation ---
const updateUserStatus = async (user, newBanStatus) => {
  const actionText = newBanStatus ? 'block' : 'unblock'
  const confirmed = window.confirm(`Are you sure you want to ${actionText} ${user.first_name}?`)
  if (!confirmed) return

  processingId.value = user.id

  try {
    const { error } = await supabase
      .from('users')
      .update({ ban_status: newBanStatus })
      .eq('id', user.id)

    if (error) throw error
    user.ban_status = newBanStatus // Optimistic UI Update
  } catch (err) {
    console.error('Failed to update status:', err.message)
    alert('Error updating user ban status.')
  } finally {
    processingId.value = null
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
/* Page Layout Setup for Sidebar + Main Content */
.dashboard-root {
  display: flex; /* This aligns the Sidebar and the main content side-by-side */
  min-height: 100vh;
  background-color: #f4f7f6;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

.content {
  flex: 1; /* Makes the main content area take up the remaining width */
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
}

/* Header Banner */
.header-banner {
  background: linear-gradient(135deg, #1e2a78 0%, #283593 100%);
  border-radius: 8px;
  padding: 24px 32px;
  color: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
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

/* Stats Card */
.stats-card {
  background: white;
  border-radius: 8px;
  padding: 24px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}

.btn-primary {
  background-color: #1e2a78;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.stats-grid {
  display: flex;
  align-items: center;
  gap: 40px;
  flex: 1;
  justify-content: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #0f172a;
}

.text-red {
  color: #ef4444;
}

.text-orange {
  color: #f97316;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background-color: #e2e8f0;
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
  padding: 8px 32px 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background-color: white;
  color: #334155;
  font-size: 0.9rem;
  cursor: pointer;
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

.contact-mobile {
  font-size: 0.8rem;
  color: #94a3b8;
  margin-top: 2px;
}

.col-status {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.rejection-text {
  font-size: 0.75rem;
  color: #ef4444;
  font-weight: 600;
  margin-left: 16px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.status-dot.active {
  background-color: #10b981;
}
.status-dot.inactive {
  background-color: #ef4444;
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
  transition: opacity 0.2s;
  color: white;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-unblock {
  background-color: #1e2a78;
}
.btn-unblock:hover:not(:disabled) {
  background-color: #151d54;
}

.btn-block {
  background-color: #ef4444;
}
.btn-block:hover:not(:disabled) {
  background-color: #dc2626;
}

.empty-state {
  text-align: center;
  padding: 40px !important;
  color: #64748b;
  font-style: italic;
}
</style>
