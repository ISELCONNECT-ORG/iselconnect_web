<template>
  <div class="app-layout">
    <!-- Sidebar Navigation -->
    <Sidebar />

    <!-- Main Content Area -->
    <main class="main-content">
      <div class="page-container">
        <!-- Page Header -->
        <div class="page-header">
          <div>
            <h2>Resident Account Verification</h2>
            <p>
              Review newly registered resident profiles and their valid identification documents.
            </p>
          </div>
          <div class="header-actions">
            <button @click="fetchPendingVerifications" class="btn-refresh" :disabled="loading">
              {{ loading ? 'Refreshing...' : 'Refresh List' }}
            </button>
          </div>
        </div>

        <!-- Notifications -->
        <transition name="fade">
          <div v-if="notification.message" :class="['notification', notification.type]">
            {{ notification.message }}
          </div>
        </transition>

        <!-- Loading State -->
        <div v-if="loading" class="empty-state">
          <div class="spinner"></div>
          <p>Loading pending verifications...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="pendingVerifications.length === 0" class="empty-state">
          <p>No pending resident accounts waiting for verification.</p>
        </div>

        <!-- Verifications Grid -->
        <div v-else class="verifications-grid">
          <div v-for="item in pendingVerifications" :key="item.id" class="verification-card">
            <!-- Card Header -->
            <div class="card-header">
              <div class="user-title">
                <h3>{{ getFullName(item.users) }}</h3>
                <span class="badge pending">Pending</span>
              </div>
              <span class="date-submitted">Submitted: {{ formatDate(item.created_at) }}</span>
            </div>

            <!-- Card Body: Text Info -->
            <div class="card-body">
              <div class="info-section">
                <h4>Personal Information</h4>
                <div class="info-row">
                  <span class="label">Email:</span>
                  <span class="value">{{ item.users?.email || 'N/A' }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Mobile:</span>
                  <span class="value">{{ item.users?.mobile_number || 'N/A' }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Registered:</span>
                  <span class="value">{{ formatDate(item.users?.created_at) }}</span>
                </div>
              </div>

              <div class="info-section">
                <h4>Identification Details</h4>
                <div class="info-row">
                  <span class="label">ID Type:</span>
                  <span class="value highlight">{{ item.id_type || 'N/A' }}</span>
                </div>
                <div class="info-row">
                  <span class="label">ID Number:</span>
                  <span class="value">{{ item.id_number || 'N/A' }}</span>
                </div>
              </div>
            </div>

            <!-- Card Body: Images -->
            <div class="images-section">
              <div class="image-box">
                <p><strong>Uploaded ID Photo</strong></p>
                <a
                  v-if="item.id_photo_url"
                  :href="item.id_photo_url"
                  target="_blank"
                  title="Click to view full size"
                >
                  <img :src="item.id_photo_url" alt="ID Photo" />
                </a>
                <div v-else class="no-img">No ID Photo Provided</div>
              </div>

              <div class="image-box">
                <p><strong>Selfie with ID</strong></p>
                <a
                  v-if="item.selfie_photo_url"
                  :href="item.selfie_photo_url"
                  target="_blank"
                  title="Click to view full size"
                >
                  <img :src="item.selfie_photo_url" alt="Selfie Photo" />
                </a>
                <div v-else class="no-img">No Selfie Provided</div>
              </div>
            </div>

            <!-- Card Actions -->
            <div class="card-actions">
              <button @click="updateStatus(item, 'approved')" class="btn-action btn-accept">
                Accept Account
              </button>
              <button @click="updateStatus(item, 'rejected')" class="btn-action btn-reject">
                Reject Account
              </button>
              <button @click="blockUser(item)" class="btn-action btn-block">Block User</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import Sidebar from '@/components/Sidebar.vue'

const pendingVerifications = ref([])
const loading = ref(true)
const notification = ref({ message: '', type: '' })

// Fetch verifications where status is 'pending' and join with users table
const fetchPendingVerifications = async () => {
  loading.value = true
  try {
    console.log('--- Fetching Pending Verifications ---')

    const { data, error } = await supabase
      .from('user_verifications')
      .select(
        `
        *,
        users (
          id,
          first_name,
          middle_name,
          last_name,
          email,
          mobile_number,
          created_at,
          is_active
        )
      `,
      )
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: false })

    // DEBUGGING LOGS: Check your browser console!
    console.log('Supabase Error Result:', error)
    console.log('Supabase Data Result:', data)

    if (error) throw error
    pendingVerifications.value = data || []
  } catch (error) {
    console.error('Error fetching verifications:', error.message)
    showNotification(`Fetch Error: ${error.message}`, 'error')
  } finally {
    loading.value = false
  }
}

// Format Name Helper
const getFullName = (user) => {
  if (!user) return 'Unknown User'
  const middle = user.middle_name && user.middle_name !== 'EMPTY' ? ` ${user.middle_name} ` : ' '
  return `${user.first_name || ''}${middle}${user.last_name || ''}`.trim()
}

// Format Date Helper
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// UI Notification Helper
const showNotification = (message, type) => {
  notification.value = { message, type }
  setTimeout(() => {
    notification.value = { message: '', type: '' }
  }, 4000)
}

// Handle Accept and Reject
const updateStatus = async (item, newStatus) => {
  const actionText = newStatus === 'approved' ? 'accept' : 'reject'
  if (!confirm(`Are you sure you want to ${actionText} this account?`)) return

  try {
    const { error: verifyError } = await supabase
      .from('user_verifications')
      .update({ verification_status: newStatus })
      .eq('id', item.id)

    if (verifyError) throw verifyError

    if (newStatus === 'approved' && item.users?.id) {
      const { error: userError } = await supabase
        .from('users')
        .update({ is_active: true })
        .eq('id', item.users.id)

      if (userError) throw userError
    }

    showNotification(`Account successfully ${newStatus}.`, 'success')
    fetchPendingVerifications()
  } catch (error) {
    console.error('Error updating status:', error.message)
    showNotification(`Error: ${error.message}`, 'error')
  }
}

// Handle Block
const blockUser = async (item) => {
  if (!confirm('Are you sure you want to block this user completely?')) return

  try {
    await supabase
      .from('user_verifications')
      .update({ verification_status: 'rejected' })
      .eq('id', item.id)

    if (item.users?.id) {
      const { error: userError } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', item.users.id)

      if (userError) throw userError
    }

    showNotification('Account has been blocked.', 'success')
    fetchPendingVerifications()
  } catch (error) {
    console.error('Error blocking user:', error.message)
    showNotification(`Error: ${error.message}`, 'error')
  }
}

onMounted(() => {
  fetchPendingVerifications()
})
</script>

<style scoped>
/* Layout Architecture */
.app-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f8fafc;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  height: 100vh;
}

/* Page Container */
.page-container {
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  color: #1e293b;
}

/* Header Styles */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 32px;
}

.page-header h2 {
  font-size: 1.8rem;
  margin: 0 0 8px 0;
  color: #0f172a;
  font-weight: 600;
}

.page-header p {
  color: #64748b;
  margin: 0;
  font-size: 0.95rem;
}

.btn-refresh {
  padding: 8px 16px;
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #334155;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-refresh:hover:not(:disabled) {
  background-color: #f1f5f9;
  border-color: #94a3b8;
}

/* States (Empty / Loading / Notifications) */
.empty-state {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 80px 20px;
  text-align: center;
  color: #64748b;
  font-size: 1.1rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px auto;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.notification {
  padding: 16px 20px;
  border-radius: 8px;
  margin-bottom: 24px;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.notification.success {
  background-color: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}
.notification.error {
  background-color: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Grid and Cards */
.verifications-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.verification-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.2s ease;
}

.verification-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.user-title {
  display: flex;
  align-items: center;
  gap: 16px;
}

.card-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #0f172a;
  font-weight: 600;
}

.date-submitted {
  color: #94a3b8;
  font-size: 0.85rem;
}

.badge.pending {
  background-color: #fef3c7;
  color: #b45309;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

/* Card Body Details */
.card-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-bottom: 32px;
}

.info-section h4 {
  margin: 0 0 16px 0;
  font-size: 0.95rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.info-row {
  display: flex;
  margin-bottom: 12px;
  font-size: 0.95rem;
}

.info-row .label {
  width: 100px;
  color: #64748b;
  font-weight: 500;
}

.info-row .value {
  color: #1e293b;
  font-weight: 500;
}

.info-row .value.highlight {
  color: #2563eb;
  font-weight: 600;
}

/* Images Section */
.images-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
  background-color: #f8fafc;
  padding: 20px;
  border-radius: 12px;
  border: 1px dashed #cbd5e1;
}

.image-box p {
  margin: 0 0 12px 0;
  font-size: 0.9rem;
  color: #475569;
}

.image-box img {
  width: 100%;
  height: 250px;
  object-fit: cover;
  background-color: #e2e8f0;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  transition:
    opacity 0.2s,
    transform 0.2s;
  cursor: pointer;
}

.image-box img:hover {
  opacity: 0.9;
  transform: scale(1.01);
}

.no-img {
  height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f1f5f9;
  color: #94a3b8;
  border-radius: 8px;
  font-style: italic;
  border: 1px solid #e2e8f0;
}

/* Actions Section */
.card-actions {
  display: flex;
  gap: 16px;
  padding-top: 20px;
  border-top: 1px solid #f1f5f9;
}

.btn-action {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition:
    background-color 0.2s,
    transform 0.1s;
}

.btn-action:active {
  transform: scale(0.98);
}

.btn-accept {
  background-color: #10b981;
  color: white;
}
.btn-accept:hover {
  background-color: #059669;
}

.btn-reject {
  background-color: #f59e0b;
  color: white;
}
.btn-reject:hover {
  background-color: #d97706;
}

.btn-block {
  background-color: #ef4444;
  color: white;
  margin-left: auto;
}
.btn-block:hover {
  background-color: #dc2626;
}
</style>
