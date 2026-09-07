<!-- src/pages/branch/BranchSettings.vue -->
<template>
  <div class="dashboard-root">
    <BranchSidebar />

    <main class="content">
      <BranchTopbar />

      <!-- HERO BANNER -->
      <header class="hero-banner">
        <div class="hero-overlay-content">
          <h1>SECURITY SETTINGS</h1>
          <p>Update your account password and manage branch security preferences.</p>
        </div>
      </header>

      <!-- Change Password Form -->
      <section class="card form-card">
        <div class="card-header">
          <h3>Change Password</h3>
          <p class="text-muted">Ensure your account is using a strong, secure password.</p>
        </div>

        <form @submit.prevent="updatePassword" class="password-form">
          <div class="form-group">
            <label>New Password</label>
            <input
              type="password"
              v-model="newPassword"
              required
              placeholder="Enter new password"
              class="input-field"
            />
          </div>

          <div class="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              v-model="confirmPassword"
              required
              placeholder="Confirm new password"
              class="input-field"
            />
          </div>

          <!-- Alert Messages -->
          <div v-if="errorMessage" class="alert-box error-alert">{{ errorMessage }}</div>
          <div v-if="successMessage" class="alert-box success-alert">{{ successMessage }}</div>

          <div class="form-actions">
            <button type="submit" class="btn-save" :disabled="loading">
              {{ loading ? 'Updating...' : 'Save Password' }}
            </button>
          </div>
        </form>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '@/services/supabase'
import BranchSidebar from '@/components/BranchSidebar.vue'

const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const updatePassword = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  if (newPassword.value.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters long.'
    return
  }

  loading.value = true

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword.value,
    })

    if (error) throw error

    successMessage.value = 'Password updated successfully!'
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.dashboard-root {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
  font-family: 'Inter', sans-serif;
  color: #0f172a;
}

.content {
  flex-grow: 1;
  padding: 0 16px 16px;
}

:deep(.topbar-container) {
  margin-bottom: 16px;
}

/* ========================================================= */
/* HERO BANNER (Left-Aligned)                                */
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
  margin-bottom: 20px;
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
}

.hero-overlay-content h1 {
  margin: 0 0 4px 0;
  font-size: 1.6rem;
  color: white;
  font-weight: 700;
}

.hero-overlay-content p {
  margin: 0;
  font-size: 0.85rem;
  color: #cbd5e1;
}

/* ========================================================= */
/* FORM CARD                                                 */
/* ========================================================= */
.form-card {
  background: #ffffff;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);
  max-width: 600px;
}

.card-header {
  margin-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 16px;
}

.card-header h3 {
  margin: 0 0 4px 0;
  font-size: 1.1rem;
  color: #0f172a;
  font-weight: 700;
}

.text-muted {
  margin: 0;
  color: #64748b;
  font-size: 0.85rem;
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
}

.input-field {
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.9rem;
  outline: none;
  background: #f8fafc;
  transition: border-color 0.2s;
}

.input-field:focus {
  border-color: #283593;
  background: #ffffff;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.btn-save {
  background: #1e1b4b;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-save:hover:not(:disabled) {
  background: #312e81;
}

.btn-save:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Alerts */
.alert-box {
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
}

.error-alert {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
}

.success-alert {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #15803d;
}
</style>
