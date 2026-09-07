<template>
  <div class="dashboard-root">
    <Sidebar />

    <main class="main-content">
      <!-- Centered Content Wrapper with Profile UI Layout -->
      <div class="content-wrapper">
        <div class="profile-card">
          <!-- Image Banner -->
          <div class="card-banner">
            <div class="banner-overlay"></div>
            <div class="banner-content">
              <h2 class="banner-name">Account Security</h2>
              <p class="banner-email">
                Manage your password and secure your administrator account.
              </p>
            </div>
          </div>

          <!-- Card Body -->
          <div class="card-body">
            <!-- Form Section for Password Update -->
            <div class="form-section">
              <div class="input-group">
                <label>NEW PASSWORD</label>
                <div
                  class="input-wrapper-custom"
                  :class="{ 'input-error-border': passwordTooShort }"
                >
                  <input type="password" v-model="newPassword" placeholder="••••••••" />
                </div>
                <div v-if="passwordTooShort" class="error-text">
                  Password must be at least 8 characters long.
                </div>
              </div>

              <div class="input-group">
                <label>CONFIRM NEW PASSWORD</label>
                <div
                  class="input-wrapper-custom"
                  :class="{ 'input-error-border': passwordMismatch }"
                >
                  <input type="password" v-model="confirmPassword" placeholder="••••••••" />
                </div>
                <div v-if="passwordMismatch" class="error-text">Passwords do not match.</div>
              </div>

              <div class="button-group">
                <button
                  @click="promptUpdate"
                  :disabled="loading || passwordMismatch || passwordTooShort || !newPassword"
                  class="btn danger"
                >
                  Update Password
                </button>
              </div>
            </div>

            <!-- Side Info Box matching Profile UI style -->
            <div class="status-section">
              <div class="status-card">
                <h3 class="status-label">SECURITY GUIDELINES</h3>
                <p class="status-desc">
                  Ensure your password is at least 8 characters long and includes a mix of letters,
                  numbers, and symbols to protect your account.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Confirmation Modal Overlay -->
      <div v-if="showConfirmModal" class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <div class="modal-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h3>Are you sure that you want to change password?</h3>
          </div>
          <div class="modal-body">
            <p>
              This action will update your security credentials and require logging in with the new
              password on all active sessions.
            </p>
          </div>
          <div class="modal-footer">
            <button @click="showConfirmModal = false" class="btn-cancel" :disabled="loading">
              Cancel
            </button>
            <button @click="executeupdatePassword" class="btn-confirm" :disabled="loading">
              {{ loading ? 'Updating...' : 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'
import Sidebar from '@/components/Sidebar.vue'

const loading = ref(false)
const newPassword = ref('')
const confirmPassword = ref('')
const showConfirmModal = ref(false)

const passwordTooShort = computed(() => {
  return newPassword.value.length > 0 && newPassword.value.length < 8
})

const passwordMismatch = computed(() => {
  return confirmPassword.value.length > 0 && newPassword.value !== confirmPassword.value
})

const promptUpdate = () => {
  if (!newPassword.value) {
    alert('Please enter a new password.')
    return
  }
  if (passwordTooShort.value) {
    alert('Password must be at least 8 characters long.')
    return
  }
  if (passwordMismatch.value) {
    alert('Passwords do not match.')
    return
  }
  // Open confirmation modal if validations pass
  showConfirmModal.value = true
}

const executeupdatePassword = async () => {
  loading.value = true

  // Supabase password update logic
  const { error } = await supabase.auth.updateUser({ password: newPassword.value })

  if (error) {
    alert('Error: ' + error.message)
  } else {
    alert('Password successfully updated!')
    newPassword.value = ''
    confirmPassword.value = ''
    showConfirmModal.value = false
  }

  loading.value = false
}
</script>

<style scoped>
/* Base Layout with HomeBackground.jpg */
.dashboard-root {
  display: flex;
  min-height: 100vh;
  background-image: url('@/assets/Background/HomeBackground.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
}

.main-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

/* Center Layout */
.content-wrapper {
  padding: 40px;
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Profile Card */
.profile-card {
  width: 100%;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  max-width: 1100px;
}

/* Image Banner using bannerdashboard.jpg */
.card-banner {
  position: relative;
  background-image: url('@/assets/Background/bannerdashboard.jpg');
  background-size: cover;
  background-position: center;
  padding: 40px 32px 32px 32px;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  color: #ffffff;
}

/* Gradient overlay for banner text readability */
.banner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.4) 100%);
  z-index: 1;
}

.banner-content {
  position: relative;
  z-index: 2;
}

.banner-name {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 4px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.banner-email {
  font-size: 0.9rem;
  opacity: 0.95;
  margin: 0;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

/* Card Body Layout */
.card-body {
  display: flex;
  padding: 32px;
  gap: 48px;
}

.form-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Input Fields matching Profile UI */
.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #94a3b8;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.input-wrapper-custom {
  background-color: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
  padding: 4px 12px;
  display: flex;
  align-items: center;
  transition: border-color 0.2s;
}

.input-error-border {
  border-color: #ef4444 !important;
}

input {
  width: 100%;
  padding: 10px 0;
  border: none;
  font-size: 0.95rem;
  font-weight: 500;
  color: #1e293b;
  background: transparent;
  outline: none;
}

input:focus {
  outline: none;
}

.error-text {
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: -2px;
  font-weight: 600;
}

/* Button Styling */
.button-group {
  margin-top: 4px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn:hover:not(:disabled) {
  opacity: 0.9;
}

.btn[disabled] {
  cursor: not-allowed;
  opacity: 0.6;
}

.btn.danger {
  background: #dc2626;
  color: #ffffff;
}

/* Status Section (Right side card) */
.status-section {
  width: 320px;
  flex-shrink: 0;
}

.status-card {
  background-color: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  padding: 24px;
}

.status-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #94a3b8;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin: 0 0 16px 0;
}

.status-desc {
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0;
}

/* Modal Overlay Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-card {
  background: #ffffff;
  width: 100%;
  max-width: 440px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: modalFadeIn 0.2s ease-out;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  padding: 24px 24px 16px 24px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.modal-icon {
  background: #eef2ff;
  color: #312e81;
  padding: 10px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.4;
}

.modal-body {
  padding: 20px 24px;
}

.modal-body p {
  margin: 0;
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.5;
}

.modal-footer {
  padding: 16px 24px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-cancel {
  background: transparent;
  border: 1px solid #cbd5e1;
  color: #334155;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-cancel:hover {
  background: #f1f5f9;
}

.btn-confirm {
  background: #1e1b4b;
  border: none;
  color: #ffffff;
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-confirm:hover {
  opacity: 0.9;
}

/* Responsive adjustments */
@media (max-width: 868px) {
  .card-body {
    flex-direction: column;
  }
  .status-section {
    width: 100%;
  }
}
</style>
