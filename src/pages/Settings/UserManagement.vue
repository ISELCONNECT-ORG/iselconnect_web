<template>
  <div class="user-management-container">
    <h3>User & Grid Management</h3>

    <!-- Registration Section -->
    <section class="sub-card">
      <h4>Register Admin/Branch Account</h4>
      <div class="form-grid">
        <input v-model="newUser.email" placeholder="Email Address" />
        <input type="password" v-model="newUser.password" placeholder="Password" />
        <select v-model="newUser.role_id">
          <option value="8">Admin</option>
          <option value="6">Branch</option>
        </select>
        <button @click="registerAccount" :disabled="loading" class="btn-save">
          {{ loading ? 'Registering...' : 'Register Account' }}
        </button>
      </div>
    </section>
    <!-- REMOVED: Audit logs section from here -->
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '@/services/supabase'

const loading = ref(false)
const newUser = ref({ email: '', password: '', role_id: 6 })

const registerAccount = async () => {
  loading.value = true
  const { data, error } = await supabase.auth.signUp({
    email: newUser.value.email,
    password: newUser.value.password,
  })

  if (error) {
    alert(error.message)
    loading.value = false
    return
  }

  await supabase.from('users').insert({
    id: data.user.id,
    email: newUser.value.email,
    role_id: newUser.value.role_id,
  })

  await supabase.from('system_logs').insert({
    action_type: 'USER_REGISTRATION',
    action_details: `Registered new account: ${newUser.value.email}`,
  })

  alert('Account created successfully!')
  newUser.value = { email: '', password: '', role_id: 6 }
  loading.value = false
}
</script>

<style scoped>
.user-management-container {
  margin-top: 20px;
}
.sub-card {
  background: #f9fafb;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  margin-bottom: 15px;
}
.form-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 400px;
}
input,
select {
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}
.btn-save {
  background: #1e3a8a;
  color: white;
  padding: 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
.log-container {
  max-height: 200px;
  overflow-y: auto;
  font-size: 0.9em;
}
.log-item {
  border-bottom: 1px solid #eee;
  padding: 8px 0;
}
</style>
