<!-- src/pages/admin/AccountVerification.vue -->
<template>
  <div class="dashboard-root">
    <Sidebar />

    <div class="main-wrapper">
      <Topbar />

      <!-- ========================================== -->
      <!-- LIST VIEW: QUEUE & STATS                   -->
      <!-- ========================================== -->
      <div v-if="!selectedApplicant" class="view-container">
        <!-- Hero Banner -->
        <header class="hero-banner">
          <div class="hero-overlay-content">
            <h1>ACCOUNT VERIFICATION</h1>
            <p>
              Manage and review pending field personnel accounts to ensure secure and authorized
              access to the utility network.
            </p>
          </div>
        </header>

        <!-- Stats Row -->
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-header">
              <span>PENDING VERIFICATIONS</span>
              <div class="icon-box yellow"><ClipboardList :size="14" /></div>
            </div>
            <h2>{{ pendingVerifications.length }}</h2>
            <p>Requires immediate attention</p>
          </div>
          <div class="stat-card">
            <div class="stat-header">
              <span>REJECTED APPLICATIONS</span>
              <div class="icon-box red"><Ban :size="14" /></div>
            </div>
            <h2>7</h2>
            <p>In the last 7 days</p>
          </div>
          <div class="stat-card">
            <div class="stat-header">
              <span>VERIFIED TODAY</span>
              <div class="icon-box blue"><ShieldCheck :size="14" /></div>
            </div>
            <h2>15</h2>
            <p>Successfully processed</p>
          </div>
        </div>

        <!-- Table Section -->
        <div class="table-container">
          <div class="table-header">
            <h3>Pending Queue</h3>
            <!-- Filters removed as requested -->
          </div>

          <div v-if="loading" class="empty-state">
            <div class="spinner"></div>
            <p>Loading pending verifications...</p>
          </div>

          <div v-else-if="pendingVerifications.length === 0" class="empty-state">
            <p>No pending accounts waiting for verification.</p>
          </div>

          <table v-else class="data-table">
            <thead>
              <tr>
                <th>APPLICANT</th>
                <th>DATE APPLIED</th>
                <th>DOCUMENT PREVIEW</th>
                <th class="align-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in pendingVerifications" :key="item.id">
                <td>
                  <div class="applicant-cell">
                    <div class="avatar">{{ getInitials(item.users) }}</div>
                    <div class="applicant-info">
                      <span class="name">{{ getFullName(item.users) }}</span>
                      <span class="email">{{ item.users?.email }}</span>
                    </div>
                  </div>
                </td>
                <td class="muted-text">{{ formatDate(item.created_at) }}</td>
                <td>
                  <button @click="openDetails(item)" class="btn-outline-gray">View Details</button>
                </td>
                <td class="align-right">
                  <div class="action-group">
                    <button @click="promptAction(item, 'reject')" class="btn-outline-gold">
                      Reject
                    </button>
                    <button @click="promptAction(item, 'approve')" class="btn-solid-navy">
                      Approve
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- DETAIL VIEW: APPLICANT PROFILE             -->
      <!-- ========================================== -->
      <div v-else class="view-container detail-view">
        <header class="hero-banner detail-hero">
          <button @click="closeDetails" class="btn-back">
            <ArrowLeft :size="16" /> Back to Queue
          </button>
          <div class="hero-overlay-content">
            <h1>APPLICANT VERIFICATION</h1>
            <p>Review detailed applicant profile and submitted documentation for network access.</p>
          </div>
        </header>

        <div class="detail-grid">
          <!-- Left Column: Personal Info -->
          <div class="info-card">
            <div class="info-header">
              <h3>Personal Info</h3>
              <span class="badge-pending">PENDING REVIEW</span>
            </div>

            <div class="info-group">
              <label>NAME</label>
              <p>{{ getFullName(selectedApplicant.users) }}</p>
            </div>
            <div class="info-group">
              <label>EMAIL</label>
              <p>{{ selectedApplicant.users?.email || 'N/A' }}</p>
            </div>
            <div class="info-group">
              <label>MOBILE NUMBER</label>
              <p>{{ selectedApplicant.users?.mobile_number || 'N/A' }}</p>
            </div>
            <div class="info-group">
              <label>DATE APPLIED</label>
              <p>{{ formatDateTime(selectedApplicant.created_at) }}</p>
            </div>

            <h4 class="sub-heading">Identification Details</h4>
            <div class="info-group">
              <label>ID TYPE</label>
              <p>{{ selectedApplicant.id_type || 'Government Issued ID' }}</p>
            </div>
            <div class="info-group">
              <label>ID NUMBER</label>
              <p>{{ selectedApplicant.id_number || 'N/A' }}</p>
            </div>
          </div>

          <!-- Right Column: Documents -->
          <div class="documents-card">
            <div class="docs-header">
              <h3>Submitted Documentation</h3>
              <span class="docs-subtitle"><Shield :size="14" /> ID Verification</span>
            </div>

            <div class="doc-box">
              <div class="doc-title">
                <FileImage :size="14" class="doc-icon" /> OFFICIAL ID DOCUMENT
              </div>
              <div class="img-container">
                <img
                  v-if="selectedApplicant.id_photo_url"
                  :src="selectedApplicant.id_photo_url"
                  alt="ID Document"
                />
                <div v-else class="no-img">
                  <UserCircle2 :size="32" />
                  <p>No image provided</p>
                </div>
              </div>
            </div>

            <div class="doc-box">
              <div class="doc-title">
                <Camera :size="14" class="doc-icon" /> LIVE VERIFICATION SELFIE
              </div>
              <div class="img-container">
                <img
                  v-if="selectedApplicant.selfie_photo_url"
                  :src="selectedApplicant.selfie_photo_url"
                  alt="Selfie"
                />
                <div v-else class="no-img">
                  <UserCircle2 :size="32" />
                  <p>No image provided</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Detail Actions Footer -->
        <div class="detail-actions-footer">
          <button @click="promptAction(selectedApplicant, 'block')" class="btn-outline-red">
            BLOCK ACCOUNT
          </button>
          <div class="right-actions">
            <button
              @click="promptAction(selectedApplicant, 'reject')"
              class="btn-outline-gray-large"
            >
              REJECT APPLICATION
            </button>
            <button
              @click="promptAction(selectedApplicant, 'approve')"
              class="btn-solid-navy-large"
            >
              APPROVE APPLICATION
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- MODALS (Teleported to Body)                -->
    <!-- ========================================== -->
    <Teleport to="body">
      <!-- Approve Modal -->
      <div v-if="modals.approve" class="modal-overlay" @click.self="closeModals">
        <div class="modal-content">
          <div class="modal-header">
            <ShieldCheck :size="18" class="modal-icon-blue" />
            <h3 class="modal-title-text">Confirm Approval</h3>
          </div>
          <div class="modal-body">
            <div class="modal-alert-box">
              <div class="alert-icon-box"><Lightbulb :size="20" class="icon-gray" /></div>
              <div class="alert-text">
                <h4 class="alert-prompt-text">Are you sure to approve this application?</h4>
                <p>
                  This action will grant the applicant immediate access to the field operations
                  network and provision their account for active duty.
                </p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="closeModals" class="btn-modal-cancel">Cancel</button>
            <button @click="executeAction('approved')" class="btn-modal-approve">Approve</button>
          </div>
        </div>
      </div>

      <!-- Reject Modal -->
      <div v-if="modals.reject" class="modal-overlay" @click.self="closeModals">
        <div class="modal-content">
          <div class="modal-header">
            <AlertTriangle :size="18" class="modal-icon-red" />
            <h3 class="modal-title-text">Confirm Rejection</h3>
          </div>
          <div class="modal-body">
            <div class="modal-alert-box">
              <div class="alert-icon-box outline-red">
                <AlertTriangle :size="20" class="icon-red" />
              </div>
              <div class="alert-text">
                <h4 class="alert-prompt-text">Are you sure to reject this application?</h4>
                <p>
                  This action will deny the applicant access to the field operations network and
                  archive their submission. This action can be reversed by an administrator if
                  needed.
                </p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="closeModals" class="btn-modal-cancel">Cancel</button>
            <button @click="executeAction('rejected')" class="btn-modal-reject">Reject</button>
          </div>
        </div>
      </div>

      <!-- Block Modal -->
      <div v-if="modals.block" class="modal-overlay" @click.self="closeModals">
        <div class="modal-content">
          <div class="modal-header">
            <div class="icon-bg-red"><Ban :size="14" class="modal-icon-dark-red" /></div>
            <h3 class="modal-title-text">Confirm Block Account</h3>
          </div>
          <div class="modal-body">
            <div class="modal-alert-box simple">
              <AlertTriangle :size="20" class="icon-gray-dark" />
              <div class="alert-text">
                <h4 class="alert-prompt-text">Are you sure to block this account?</h4>
              </div>
            </div>
            <p class="modal-subtext">
              Blocking this account will immediately revoke all access to the system. This action is
              intended for security violations or account misuse.
            </p>
          </div>
          <div class="modal-footer">
            <button @click="closeModals" class="btn-modal-cancel">Cancel</button>
            <button @click="executeBlock" class="btn-modal-block">Block Account</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'
import {
  ClipboardList,
  Ban,
  ShieldCheck,
  ArrowLeft,
  Shield,
  FileImage,
  Camera,
  UserCircle2,
  Lightbulb,
  AlertTriangle,
} from 'lucide-vue-next'

const pendingVerifications = ref([])
const loading = ref(true)
const selectedApplicant = ref(null)
const actionTarget = ref(null)

const modals = ref({
  approve: false,
  reject: false,
  block: false,
})

const fetchPendingVerifications = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('user_verifications')
      .select(
        `
        *,
        users (id, first_name, middle_name, last_name, email, mobile_number, created_at, is_active)
      `,
      )
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw error
    pendingVerifications.value = data || []
  } catch (error) {
    console.error('Error fetching verifications:', error.message)
  } finally {
    loading.value = false
  }
}

// Formatters
const getFullName = (user) => {
  if (!user) return 'Unknown User'
  return `${user.first_name || ''} ${user.last_name || ''}`.trim()
}

const getInitials = (user) => {
  if (!user) return '?'
  return `${(user.first_name || '').charAt(0)}${(user.last_name || '').charAt(0)}`.toUpperCase()
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return `${formatDate(dateString)} - ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
}

// Navigation
const openDetails = (item) => {
  selectedApplicant.value = item
}

const closeDetails = () => {
  selectedApplicant.value = null
}

// Modal Logic
const promptAction = (item, action) => {
  actionTarget.value = item
  modals.value[action] = true
}

const closeModals = () => {
  modals.value = { approve: false, reject: false, block: false }
  actionTarget.value = null
}

const executeAction = async (newStatus) => {
  if (!actionTarget.value) return
  try {
    const item = actionTarget.value
    await supabase
      .from('user_verifications')
      .update({ verification_status: newStatus })
      .eq('id', item.id)

    if (newStatus === 'approved' && item.users?.id) {
      await supabase.from('users').update({ is_active: true }).eq('id', item.users.id)
    }

    fetchPendingVerifications()
    closeDetails()
    closeModals()
  } catch (error) {
    console.error(`Error updating status:`, error.message)
  }
}

const executeBlock = async () => {
  if (!actionTarget.value) return
  try {
    const item = actionTarget.value
    await supabase
      .from('user_verifications')
      .update({ verification_status: 'rejected' })
      .eq('id', item.id)

    if (item.users?.id) {
      await supabase.from('users').update({ is_active: false }).eq('id', item.users.id)
    }

    fetchPendingVerifications()
    closeDetails()
    closeModals()
  } catch (error) {
    console.error('Error blocking user:', error.message)
  }
}

onMounted(() => {
  fetchPendingVerifications()
})
</script>

<style scoped>
/* ========================================================= */
/* BASE LAYOUT                                               */
/* ========================================================= */
.dashboard-root {
  display: flex;
  min-height: 100vh;
  background-color: #f8fafc;
  font-family: 'Inter', sans-serif;
  color: #0f172a;
}
.main-wrapper {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  padding: 0 16px 16px 16px;
  max-width: 100%;
  overflow-x: hidden;
}
.view-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ========================================================= */
/* HERO BANNER                                               */
/* ========================================================= */
.hero-banner {
  position: relative;
  background: url('@/assets/Background/bannerdashboard.jpg') no-repeat center center;
  background-size: cover;
  padding: 24px 32px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
.hero-banner::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(24, 24, 50, 0.9) 0%, rgba(30, 58, 138, 0.85) 100%);
  z-index: 1;
}
.hero-overlay-content {
  position: relative;
  z-index: 2;
  text-align: left;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.hero-overlay-content h1 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: white;
}
.hero-overlay-content p {
  margin: 0;
  font-size: 0.8rem;
  color: #cbd5e1;
  max-width: 600px;
  line-height: 1.4;
}

/* ========================================================= */
/* LIST VIEW: STATS & TABLE                                  */
/* ========================================================= */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.stat-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
}
.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.65rem;
  font-weight: 700;
  color: #475569;
  letter-spacing: 0.5px;
}
.icon-box {
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-box.yellow {
  background: #fef3c7;
  color: #d97706;
}
.icon-box.red {
  background: #fee2e2;
  color: #dc2626;
}
.icon-box.blue {
  background: #e0e7ff;
  color: #3730a3;
}
.stat-card h2 {
  font-size: 1.6rem;
  font-weight: 800;
  margin: 8px 0 4px 0;
}
.stat-card p {
  margin: 0;
  font-size: 0.75rem;
  color: #64748b;
}

.table-container {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
}
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.table-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th {
  text-align: left;
  font-size: 0.65rem;
  font-weight: 700;
  color: #475569;
  padding: 10px 12px;
  border-bottom: 1px solid #e2e8f0;
}
.data-table td {
  padding: 12px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}
.align-right {
  text-align: right !important;
}

/* Applicant Cell Styling */
.applicant-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.avatar {
  background: #312e81;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
}
.applicant-info {
  display: flex;
  flex-direction: column;
}
.applicant-info .name {
  font-weight: 600;
  font-size: 0.85rem;
}
.applicant-info .email {
  font-size: 0.7rem;
  color: #64748b;
}
.muted-text {
  color: #475569;
  font-size: 0.8rem;
}

/* Buttons */
.btn-outline-gray {
  background: white;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-outline-gray:hover {
  background: #f8fafc;
}

.action-group {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.btn-outline-gold {
  background: white;
  border: 1px solid #d97706;
  color: #b45309;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-outline-gold:hover {
  background: #fef3c7;
}

.btn-solid-navy {
  background: #1e1b4b;
  border: none;
  color: white;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-solid-navy:hover {
  background: #312e81;
}

.empty-state {
  padding: 32px;
  text-align: center;
  color: #64748b;
}

/* ========================================================= */
/* DETAIL VIEW: PROFILE & DOCUMENTS                          */
/* ========================================================= */
.detail-view {
  gap: 16px;
}
.detail-hero {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 20px 32px;
}
.btn-back {
  background: transparent;
  border: none;
  color: white;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 16px;
  padding: 0;
  z-index: 2;
  position: relative;
  opacity: 0.8;
}
.btn-back:hover {
  opacity: 1;
}

.detail-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 16px;
}

.info-card,
.documents-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
}
.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.info-header h3,
.docs-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
}
.badge-pending {
  background: #312e81;
  color: white;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 700;
}
.info-group {
  margin-bottom: 16px;
}
.info-group label {
  display: block;
  font-size: 0.65rem;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 4px;
}
.info-group p {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 500;
}
.sub-heading {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 24px 0 16px 0;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.docs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.docs-subtitle {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 0.75rem;
}
.doc-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}
.doc-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 12px;
}
.doc-icon {
  color: #3b82f6;
}
.img-container {
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 180px; /* Shrunk down heavily */
}
.img-container img {
  max-width: 100%;
  max-height: 250px;
  border-radius: 4px;
}
.no-img {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #94a3b8;
  gap: 8px;
}

/* Detail Actions Footer */
.detail-actions-footer {
  background: white;
  padding: 16px 20px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.right-actions {
  display: flex;
  gap: 12px;
}

.btn-outline-red {
  background: transparent;
  border: 1px solid #ef4444;
  color: #ef4444;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
}
.btn-outline-gray-large {
  background: white;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
}
.btn-solid-navy-large {
  background: #1e1b4b;
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
}

/* ========================================================= */
/* MODALS (Custom Gray Dialog Designs)                       */
/* ========================================================= */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  border-radius: 8px;
  width: 400px; /* Reduced width */
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  animation: slideDown 0.2s ease-out;
}
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
}
/* FORCED VISIBLE COLOR FOR MODAL TITLES */
.modal-title-text {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a !important;
}

.modal-icon-blue {
  color: #312e81;
}
.modal-icon-red {
  color: #dc2626;
}
.icon-bg-red {
  background: #fee2e2;
  padding: 6px;
  border-radius: 8px;
  display: flex;
}
.modal-icon-dark-red {
  color: #991b1b;
}

.modal-body {
  background: #f1f5f9; /* Ensured light gray for contrast */
  padding: 20px;
}
.modal-alert-box {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
.modal-alert-box.simple {
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.alert-icon-box {
  background: white;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.alert-icon-box.outline-red {
  border: 1px solid #fecaca;
}
.icon-gray {
  color: #64748b;
}
.icon-gray-dark {
  color: #475569;
}
.icon-red {
  color: #dc2626;
}

/* STRICT LEFT ALIGNMENT AND FORCED VISIBLE COLORS FOR PROMPTS */
.alert-text {
  display: flex;
  flex-direction: column;
  text-align: left;
}
.alert-prompt-text {
  margin: 0 0 8px 0;
  font-size: 0.95rem;
  font-weight: 700 !important;
  color: #0f172a !important;
  text-align: left;
}

.alert-text p,
.modal-subtext {
  margin: 0;
  font-size: 0.8rem;
  color: #475569;
  line-height: 1.5;
  text-align: left;
}

.modal-footer {
  background: white;
  padding: 16px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.btn-modal-cancel {
  background: white;
  border: 1px solid #cbd5e1;
  color: #334155;
  padding: 6px 16px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
}
.btn-modal-approve {
  background: #1e1b4b;
  border: none;
  color: white;
  padding: 6px 20px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
}
.btn-modal-reject,
.btn-modal-block {
  background: #b91c1c;
  border: none;
  color: white;
  padding: 6px 20px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
}
</style>
