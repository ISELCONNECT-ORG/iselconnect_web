<!-- UserManagement.vue -->
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
                  <span :class="['status-dot', user.is_active ? 'active' : 'inactive']"></span>
                  {{ user.is_active ? 'Online' : 'Offline' }}
                  <span
                    v-if="user.ban_status"
                    style="color: #ef4444; font-size: 0.8rem; font-weight: 600; margin-left: 4px"
                    >(Banned)</span
                  >
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
                  @click="promptStatusUpdate(user, true)"
                >
                  {{ processingId === user.id ? 'Wait...' : 'Block' }}
                </button>

                <button
                  v-else
                  class="action-btn btn-unblock"
                  :disabled="processingId === user.id"
                  @click="promptStatusUpdate(user, false)"
                >
                  {{ processingId === user.id ? 'Wait...' : 'Unblock' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>

    <!-- Custom Confirmation Modal for Block/Unblock -->
    <div v-if="showConfirmModal" class="modal-overlay" @click.self="closeModal">
      <div class="confirm-modal">
        <!-- Header -->
        <div class="modal-header">
          <svg
            class="header-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="#dc2626"
            width="20"
            height="20"
          >
            <path d="M12 2L1 21h22L12 2zm1 16h-2v-2h2v2zm0-4h-2v-4h2v4z" />
          </svg>
          <h2>Confirm {{ actionType === 'block' ? 'Block' : 'Unblock' }} Account</h2>
        </div>

        <!-- Body -->
        <div class="modal-body">
          <div class="body-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#dc2626"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              width="24"
              height="24"
            >
              <path
                d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
              />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div class="body-text">
            <h3>Are you sure to {{ actionType }} this account?</h3>
            <p v-if="actionType === 'block'">
              This action will revoke the user's access to the field operations network. This action
              can be reversed by an administrator if needed.
            </p>
            <p v-else>
              This action will restore the user's access to the field operations network. This
              action can be reversed by an administrator if needed.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeModal">Cancel</button>
          <button
            :class="actionType === 'block' ? 'btn-confirm-block' : 'btn-confirm-unblock'"
            @click="executeStatusUpdate"
          >
            {{ actionType === 'block' ? 'Block' : 'Unblock' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import { sendNotification } from '@/utils/notifications.js'
import { useSystemAlerts } from '@/composables/useSystemAlerts'

// IMPORT SIDEBAR: Adjust this path if your Sidebar is located elsewhere!
import Sidebar from '@/components/Sidebar.vue'

const { addAlert } = useSystemAlerts()

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

// --- Modal State ---
const showConfirmModal = ref(false)
const actionType = ref('block') // 'block' or 'unblock'
const userToProcess = ref(null)

// --- Modal Trigger ---
const promptStatusUpdate = (user, newBanStatus) => {
  userToProcess.value = user
  actionType.value = newBanStatus ? 'block' : 'unblock'
  showConfirmModal.value = true
}

const closeModal = () => {
  showConfirmModal.value = false
  userToProcess.value = null
}

// --- Execute Database Operation ---
const executeStatusUpdate = async () => {
  if (!userToProcess.value) return

  const user = userToProcess.value
  const newBanStatus = actionType.value === 'block'
  processingId.value = user.id

  // Close the modal immediately for better UX
  closeModal()

  try {
    const { error } = await supabase
      .from('users')
      .update({ ban_status: newBanStatus })
      .eq('id', user.id)

    if (error) throw error

    user.ban_status = newBanStatus // Optimistic UI Update

    // Send a notification record and trigger local dashboard pop-up (using 'low' severity to hide action buttons)
    const actionText = newBanStatus ? 'blocked' : 'unblocked'
    await sendNotification(
      'Account Status Update',
      `User ${user.first_name || ''} ${user.last_name || ''} has been ${actionText}.`,
      user.id,
    )

    addAlert({
      title: newBanStatus ? 'Account Blocked' : 'Account Unblocked',
      message: `Successfully ${actionText} ${user.first_name || 'the'} user account.`,
      severity: 'low',
    })
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

/* --- Custom Modal Styles --- */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.confirm-modal {
  background-color: #ffffff;
  width: 460px;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  border-bottom: 1px solid #f1f5f9;
}

.modal-header h2 {
  font-size: 1.1rem;
  margin: 0;
  color: #1e293b;
  font-weight: 700;
}

.modal-body {
  display: flex;
  gap: 16px;
  padding: 24px;
  background-color: #ffffff;
}

.body-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.02);
}

.body-text h3 {
  margin: 0 0 8px 0;
  font-size: 1.05rem;
  color: #0f172a;
  font-weight: 700;
}

.body-text p {
  margin: 0;
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.5;
}

.modal-footer {
  padding: 16px 24px;
  background-color: #f8fafc; /* Subtle gray background for footer */
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-cancel {
  background-color: #ffffff;
  border: 1px solid #1e2a78;
  color: #1e2a78;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-cancel:hover {
  background-color: #f1f5f9;
}

.btn-confirm-block {
  background-color: #b91c1c; /* Distinct red matching the block design */
  border: none;
  color: #ffffff;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 8px 24px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-confirm-block:hover {
  background-color: #991b1b;
}

.btn-confirm-unblock {
  background-color: #1e2a78; /* Distinct dark blue matching the unblock design */
  border: none;
  color: #ffffff;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 8px 24px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-confirm-unblock:hover {
  background-color: #151d54;
}
</style>
