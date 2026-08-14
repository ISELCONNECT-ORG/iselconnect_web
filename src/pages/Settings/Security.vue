<template>
  <div class="dashboard-root">
    <Sidebar />

    <main class="content">
      <!-- Page header matching Settings.vue -->
      <header class="page-header">
        <h1>Account Security</h1>
        <p class="subtitle">Manage your password and secure your administrator account.</p>
      </header>

      <!-- Grid layout for main settings cards -->
      <div class="settings-grid">
        <!-- Security Settings Card -->
        <section class="card glass-card">
          <h3 class="card-title">Change Password</h3>
          <p class="card-subtitle">Update your account password to keep your access secure.</p>

          <div class="form-group">
            <label>New Password</label>
            <input type="password" v-model="newPassword" placeholder="••••••••" />
          </div>

          <div class="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              v-model="confirmPassword"
              placeholder="••••••••"
              :class="{ 'input-error': passwordMismatch }"
            />
            <div v-if="passwordMismatch" class="error-text">Passwords do not match.</div>
          </div>

          <button
            @click="updatePassword"
            :disabled="loading || passwordMismatch"
            class="btn danger"
          >
            {{ loading ? 'Updating...' : 'Update Password' }}
          </button>
        </section>
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

const passwordMismatch = computed(() => {
  return confirmPassword.value.length > 0 && newPassword.value !== confirmPassword.value
})

const updatePassword = async () => {
  if (!newPassword.value) return alert('Enter a new password')
  if (passwordMismatch.value) return alert('Passwords do not match')

  loading.value = true

  // Supabase password update logic
  const { error } = await supabase.auth.updateUser({ password: newPassword.value })

  if (error) {
    alert('Error: ' + error.message)
  } else {
    alert('Password successfully updated!')
    newPassword.value = ''
    confirmPassword.value = ''
  }

  loading.value = false
}
</script>

<style scoped>
/*
  Reusing the exact CSS from Settings.vue to maintain
  perfect consistency across the application.
*/
.dashboard-root {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
  color: #0f172a;
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Inter',
    sans-serif;
}

.content {
  flex-grow: 1;
  padding: 32px 40px 40px;
}

/* Page header */
.page-header h1 {
  margin: 0;
  font-size: 1.6rem;
  color: #0f172a;
}

.page-header .subtitle {
  margin: 4px 0 18px;
  font-size: 0.9rem;
  color: #64748b;
}

/* Layout grid for settings cards */
.settings-grid {
  display: grid;
  /* Adjusting to single column or keeping the grid constraints */
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 18px;
  margin-bottom: 24px;
}

@media (max-width: 768px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}

/* Base card + glass effect */
.card {
  margin-bottom: 20px;
}

.glass-card {
  background: rgba(255, 255, 255, 0.9);
  padding: 22px 24px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  box-shadow: 0 8px 22px rgba(148, 163, 184, 0.35);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* Card headings */
.card-title {
  margin: 0;
  font-size: 1rem;
  color: #0f172a;
}

.card-subtitle {
  margin: 4px 0 14px;
  font-size: 0.85rem;
  color: #64748b;
}

/* Form fields */
.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  font-size: 0.85rem;
  color: #374151;
}

input {
  width: 100%;
  padding: 9px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #0f172a;
  background: #ffffff;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.2s;
}

input:focus {
  border-color: #1e3a8a;
}

.input-error {
  border-color: #ef4444 !important;
}

.error-text {
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: 4px;
  font-weight: 600;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 9px 18px;
  border-radius: 999px;
  border: none;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 6px;
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
</style>
