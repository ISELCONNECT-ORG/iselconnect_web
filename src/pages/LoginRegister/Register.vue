<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/services/supabase'

const email = ref('')
const password = ref('')
const mobile = ref('')
const role = ref('8')
const branchId = ref('')
const branches = ref([])
const loading = ref(false)
const errorMsg = ref('')
const router = useRouter()

onMounted(async () => {
  const { data } = await supabase.from('iselco_branch').select('branch_id, branch_name')
  branches.value = data || []
})

const handleRegister = async () => {
  // 1. Validation Logic
  if (password.value.length < 6) {
    errorMsg.value = 'Password must be at least 6 characters.'
    return
  }
  if (!email.value.includes('@')) {
    errorMsg.value = 'Please enter a valid email.'
    return
  }

  loading.value = true
  errorMsg.value = ''

  try {
    // 2. Auth Sign Up
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        throw new Error('Account already exists. Please log in.')
      }
      throw authError
    }

    // 3. Database Insert
    const { error: userError } = await supabase.from('users').insert([
      {
        id: authData.user.id,
        email: email.value,
        mobile_number: mobile.value,
        role_id: parseInt(role.value),
        branch_id: role.value === '6' ? branchId.value : null,
        first_name: 'New',
        last_name: 'User',
        is_active: true,
      },
    ])
    if (userError) throw userError

    alert('Registration successful! Please login.')
    router.push('/login')
  } catch (err) {
    errorMsg.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="register-page-wrapper">
    <div class="register-box">
      <h2>Create Account</h2>
      <form @submit.prevent="handleRegister">
        <div class="field">
          <label>Account Type</label>
          <select v-model="role" class="select-input">
            <option value="8">Admin</option>
            <option value="6">Branch Admin</option>
          </select>
        </div>

        <div v-if="role === '6'" class="field">
          <label>Select Branch</label>
          <select v-model="branchId" required class="select-input">
            <option disabled value="">-- Select Branch --</option>
            <option v-for="b in branches" :key="b.branch_id" :value="b.branch_id">
              {{ b.branch_name }}
            </option>
          </select>
        </div>

        <div class="field">
          <label>Email</label>
          <input v-model="email" type="email" required />
        </div>

        <div class="field">
          <label>Mobile Number</label>
          <input v-model="mobile" type="text" required />
        </div>

        <div class="field">
          <label>Password</label>
          <input v-model="password" type="password" required />
        </div>

        <button type="submit" :disabled="loading" class="submit-btn">
          {{ loading ? 'Processing...' : 'Register Account' }}
        </button>
      </form>

      <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
    </div>
  </div>
</template>

<style scoped>
.register-page-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
}
.register-box {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
.field {
  margin-bottom: 1rem;
}
.select-input,
input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}
.submit-btn {
  width: 100%;
  padding: 0.75rem;
  background: #1e3a8a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.error {
  color: red;
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
}
</style>
