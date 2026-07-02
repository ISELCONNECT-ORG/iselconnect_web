<template>
  <div class="dashboard-root">
    <Sidebar />
    <main class="content">
      <h1>System Settings</h1>

      <!-- Profile Management -->
      <section class="card">
        <h3>Profile Settings</h3>
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
        <button @click="updateProfile" :disabled="loading" class="btn-save">
          {{ loading ? 'Saving...' : 'Update Profile' }}
        </button>
      </section>

      <!-- Security Settings -->
      <section class="card">
        <h3>Security</h3>
        <div class="form-group">
          <label>New Password</label>
          <input type="password" v-model="newPassword" placeholder="••••••••" />
        </div>
        <button @click="updatePassword" :disabled="loading" class="btn-danger">
          Update Password
        </button>
      </section>

      <!-- Integrated Management Components -->
      <UserManagement />
      <AuditLog />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
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

  const { data, error } = await supabase
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

  if (error) alert('Error: ' + error.message)
  else alert('Profile updated successfully!')
  loading.value = false
}

const updatePassword = async () => {
  if (!newPassword.value) return alert('Enter a new password')
  loading.value = true
  const { error } = await supabase.auth.updateUser({ password: newPassword.value })
  if (error) alert('Error: ' + error.message)
  else alert('Password updated!')
  newPassword.value = ''
  loading.value = false
}

onMounted(fetchProfile)
</script>

<style scoped>
.dashboard-root {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
  color: #000;
  font-family: sans-serif;
}
.content {
  flex-grow: 1;
  padding: 40px;
}
.card {
  background: #fff;
  padding: 25px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  margin-bottom: 20px;
  max-width: 600px;
}
.form-group {
  margin-bottom: 15px;
}
.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
}
input {
  width: 100%;
  padding: 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
}
.btn-save {
  background: #1e3a8a;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
.btn-danger {
  background: #dc2626;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 10px;
}
</style>
