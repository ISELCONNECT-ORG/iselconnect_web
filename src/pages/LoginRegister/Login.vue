<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/services/supabase'

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMsg = ref('')

const router = useRouter()
const route = useRoute()
// Determines which portal is being accessed
const portalRole = route.query.role || 'admin'

const handleLogin = async () => {
  loading.value = true
  errorMsg.value = ''

  // 1. Authenticate with Supabase Auth
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })

  if (authError) {
    errorMsg.value = 'Invalid email or password.'
    loading.value = false
    return
  }

  // 2. Fetch User Profile and Role from 'users' table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('roles(name)')
    .eq('email', email.value)
    .single()

  if (userError || !userData) {
    errorMsg.value = 'User profile not found.'
    await supabase.auth.signOut()
    loading.value = false
    return
  }

  const userRole = userData.roles.name // Expected: 'admin' or 'branch'

  // 3. Strict Portal Validation
  if (portalRole === 'admin' && userRole === 'admin') {
    router.push('/admin/dashboard')
  } else if (portalRole === 'branch' && userRole === 'branch') {
    router.push('/branch/dashboard')
  } else {
    errorMsg.value = `Access Denied: Your account is '${userRole}', not authorized for '${portalRole}' portal.`
    await supabase.auth.signOut()
  }

  loading.value = false
}
</script>

<template>
  <div class="login-container">
    <div class="login-box">
      <h2>{{ portalRole === 'admin' ? 'Admin' : 'Branch' }} Login</h2>
      <p class="subtitle">Secure authentication portal</p>

      <form @submit.prevent="handleLogin">
        <div class="field">
          <label>Email Address</label>
          <input v-model="email" type="email" placeholder="user@iselconnect.com" required />
        </div>

        <div class="field">
          <label>Password</label>
          <div class="password-wrapper">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              required
            />
            <button type="button" class="toggle-btn" @click="showPassword = !showPassword">
              {{ showPassword ? 'Hide' : 'Show' }}
            </button>
          </div>
        </div>

        <button type="submit" :disabled="loading" class="submit-btn">
          {{ loading ? 'Verifying...' : 'Sign In' }}
        </button>
      </form>

      <div class="footer-links">
        <p>
          Don't have an account?
          <router-link to="/register">Create an account</router-link>
        </p>
        <router-link to="/">Back to Home</router-link>
      </div>

      <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8fafc;
  padding: 20px;
}

.login-box {
  background: white;
  padding: 2.5rem;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}

h2 {
  color: #1e3a8a;
  text-align: center;
  margin-bottom: 0.5rem;
}
.subtitle {
  color: #64748b;
  text-align: center;
  margin-bottom: 2rem;
}

.field {
  margin-bottom: 1.25rem;
}
label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.5rem;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-sizing: border-box;
  font-size: 1rem;
}

.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.toggle-btn {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  font-size: 0.75rem;
  color: #64748b;
  cursor: pointer;
}

.submit-btn {
  width: 100%;
  padding: 0.75rem;
  background: #1e3a8a;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
  transition: background 0.2s;
}

.submit-btn:hover {
  background: #1e40af;
}

.footer-links {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.85rem;
}

.footer-links a {
  color: #1e3a8a;
  text-decoration: none;
  font-weight: 600;
  display: block;
  margin-top: 8px;
}
.error-msg {
  color: #dc2626;
  font-size: 0.85rem;
  text-align: center;
  margin-top: 1rem;
}
</style>
