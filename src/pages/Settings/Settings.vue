<template>
  <div class="dashboard-root">
    <Sidebar />

    <main class="content">
      <!-- Page header -->
      <header class="page-header">
        <h1>System Settings</h1>
        <p class="subtitle">Manage your profile details, security, and administration tools.</p>
      </header>

      <!-- Two-column layout for main settings cards -->
      <div class="settings-grid">
        <!-- Profile Management -->
        <section class="card glass-card">
          <h3 class="card-title">Profile Settings</h3>
          <p class="card-subtitle">
            Update your personal information associated with this administrator account.
          </p>

          <div class="form-group">
            <label>First Name</label>
            <input type="text" v-model="profile.first_name" />
          </div>

          <div class="form-group">
            <label>Middle Name</label>
            <input type="text" v-model="profile.middle_name" />
          </div>

          <div class="form-group">
            <label>Last Name</label>
            <input type="text" v-model="profile.last_name" />
          </div>

          <div class="form-group">
            <label>Email (Read-only)</label>
            <input type="email" v-model="profile.email" disabled />
          </div>

          <button @click="updateProfile" :disabled="loading" class="btn primary">
            {{ loading ? 'Saving...' : 'Update Profile' }}
          </button>
        </section>

        <!-- Security Settings -->
        <section class="card glass-card">
          <h3 class="card-title">Security</h3>
          <p class="card-subtitle">Change your account password to keep your access secure.</p>

          <div class="form-group">
            <label>New Password</label>
            <input type="password" v-model="newPassword" placeholder="••••••••" />
          </div>

          <button @click="updatePassword" :disabled="loading" class="btn danger">
            Update Password
          </button>
        </section>
      </div>

      <!-- Integrated Management Components, full-width below -->
      <section class="card glass-card wide-card">
        <h3 class="card-title">User Management</h3>
        <p class="card-subtitle">Create, update, and manage system user accounts and roles.</p>
        <UserManagement />
      </section>

      <section class="card glass-card wide-card">
        <h3 class="card-title">Audit Log</h3>
        <p class="card-subtitle">Review recent administrative actions and system changes.</p>
        <AuditLog />
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import { sendNotification } from '@/utils/notifications.js'
import Sidebar from '@/components/Sidebar.vue'
import UserManagement from './UserManagement.vue'
import AuditLog from './AuditLog.vue'

const loading = ref(false)
const profile = ref({ first_name: '', middle_name: '', last_name: '', email: '' })
const newPassword = ref('')

const fetchProfile = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  profile.value.email = user.email

  const { data } = await supabase
    .from('users')
    .select('first_name, middle_name, last_name')
    .eq('id', user.id)
    .maybeSingle()

  if (data) {
    profile.value.first_name = data.first_name || ''
    profile.value.middle_name = data.middle_name || ''
    profile.value.last_name = data.last_name || ''
  }
}

const updateProfile = async () => {
  loading.value = true
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('users')
    .update({
      first_name: profile.value.first_name,
      middle_name: profile.value.middle_name,
      last_name: profile.value.last_name,
    })
    .eq('id', user.id)

  if (error) {
    alert('Error: ' + error.message)
  } else {
    alert('Profile updated successfully!')
    await sendNotification(
      'Profile Updated',
      'Your profile details were successfully updated.',
      user.id,
    )
  }
  loading.value = false
}

const updatePassword = async () => {
  if (!newPassword.value) return alert('Enter a new password')
  loading.value = true
  const { error } = await supabase.auth.updateUser({ password: newPassword.value })
  if (error) {
    alert('Error: ' + error.message)
  } else {
    alert('Password updated!')
    newPassword.value = ''
  }
  loading.value = false
}

onMounted(fetchProfile)
</script>

<style scoped>
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
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  gap: 18px;
  margin-bottom: 24px;
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

/* Full-width cards */
.wide-card {
  max-width: 100%;
  margin-top: 10px;
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
}

input:disabled {
  background: #f1f5f9;
  color: #64748b;
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
}

.btn[disabled] {
  cursor: default;
  opacity: 0.7;
}

.btn.primary {
  background: #1e3a8a;
  color: #ffffff;
}

.btn.danger {
  background: #dc2626;
  color: #ffffff;
}
</style>
