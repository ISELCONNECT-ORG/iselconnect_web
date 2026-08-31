<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/services/supabase'

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMsg = ref('')

const router = useRouter()

// --- Rate Limiting State ---
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION = 30 // seconds
const failedAttempts = ref(0)
const isLockedOut = ref(false)
const lockoutTimer = ref(0)
let intervalId = null

// Handles the countdown timer
const startLockoutTimer = (duration) => {
  isLockedOut.value = true
  lockoutTimer.value = duration
  errorMsg.value = `Too many attempts. Try again in ${lockoutTimer.value}s.`

  intervalId = setInterval(() => {
    lockoutTimer.value--
    if (lockoutTimer.value > 0) {
      errorMsg.value = `Too many attempts. Try again in ${lockoutTimer.value}s.`
    } else {
      // Reset after timer finishes
      clearInterval(intervalId)
      isLockedOut.value = false
      failedAttempts.value = 0
      errorMsg.value = ''
      localStorage.removeItem('loginLockoutUntil')
    }
  }, 1000)
}

// Check for existing lockout on page load
onMounted(() => {
  const lockoutUntil = localStorage.getItem('loginLockoutUntil')
  if (lockoutUntil) {
    const remainingTime = Math.ceil((parseInt(lockoutUntil) - Date.now()) / 1000)
    if (remainingTime > 0) {
      startLockoutTimer(remainingTime)
    } else {
      localStorage.removeItem('loginLockoutUntil')
    }
  }
})

// Cleanup interval when component is destroyed
onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})

const handleLogin = async () => {
  if (isLockedOut.value) return // Guard clause to prevent bypass

  loading.value = true
  errorMsg.value = ''

  const { error: authError } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })

  // Handle Failed Auth
  if (authError) {
    failedAttempts.value++
    loading.value = false

    if (failedAttempts.value >= MAX_FAILED_ATTEMPTS) {
      const lockoutEndTime = Date.now() + LOCKOUT_DURATION * 1000
      localStorage.setItem('loginLockoutUntil', lockoutEndTime.toString())
      startLockoutTimer(LOCKOUT_DURATION)
    } else {
      const attemptsLeft = MAX_FAILED_ATTEMPTS - failedAttempts.value
      errorMsg.value = `Invalid email or password. ${attemptsLeft} attempts remaining.`
    }
    return
  }

  // Handle Successful Auth
  failedAttempts.value = 0
  localStorage.removeItem('loginLockoutUntil')

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role_id')
    .eq('email', email.value)
    .single()

  if (userError || !userData) {
    errorMsg.value = 'User profile not found.'
    await supabase.auth.signOut()
    loading.value = false
    return
  }

  if (userData.role_id === 8) {
    router.push('/admin/dashboard')
  } else if (userData.role_id === 6) {
    router.push('/branch/dashboard')
  } else {
    errorMsg.value = 'Access denied.'
    await supabase.auth.signOut()
  }

  loading.value = false
}
</script>

<template>
  <div class="login-page">
    <div class="overlay"></div>

    <div v-if="errorMsg" class="access-banner">
      <h3>Access Denied</h3>
      <p>{{ errorMsg }}</p>
    </div>

    <div class="brand-wrap">
      <img
        src="@/assets/Background/iselconnectlogo.png"
        alt="ISEL Connect Logo"
        class="brand-logo"
      />
    </div>

    <div class="login-card">
      <h2>LOGIN</h2>

      <form @submit.prevent="handleLogin">
        <div class="field">
          <label>Email</label>
          <input v-model="email" type="email" placeholder="username@gmail.com" required />
        </div>

        <div class="field">
          <label>Password</label>
          <div class="password-wrapper">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Password"
              required
            />
            <button type="button" class="toggle-btn" @click="showPassword = !showPassword">
              {{ showPassword ? 'Hide' : 'Show' }}
            </button>
          </div>
        </div>

        <button type="submit" class="submit-btn" :disabled="loading || isLockedOut">
          {{ loading ? 'Verifying...' : isLockedOut ? 'Locked Out' : 'Sign in' }}
        </button>
      </form>
    </div>

    <router-link to="/" class="home-btn">BACK TO HOME</router-link>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: url('@/assets/Background/HomeBackground.jpg') center/cover no-repeat;
  overflow: hidden;
  padding: 24px;
}

.overlay {
  position: absolute;
  inset: 0;
  background: rgba(20, 30, 50, 0.35);
  backdrop-filter: blur(3px);
}

.access-banner {
  position: absolute;
  top: 30px;
  z-index: 3;
  width: min(520px, 90%);
  padding: 18px 24px;
  border-radius: 24px;
  text-align: center;
  background: rgba(90, 120, 170, 0.45);
  color: #fff;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(8px);
}

.access-banner h3 {
  margin: 0 0 6px;
  font-size: 1.3rem;
}

.access-banner p {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 500;
}

.brand-wrap {
  position: relative;
  z-index: 2;
  margin-bottom: 26px;
}

.brand-logo {
  width: 280px;
  max-width: 75vw;
  object-fit: contain;
}

.login-card {
  position: relative;
  z-index: 2;
  width: min(520px, 92%);
  padding: 34px 42px;
  border-radius: 26px;
  background: rgba(140, 170, 210, 0.34);
  border: 1px solid rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(12px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
}

.login-card h2 {
  margin: 0 0 28px;
  text-align: center;
  color: #fff;
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.field {
  margin-bottom: 18px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.85rem;
}

input {
  width: 100%;
  padding: 12px 14px;
  border: none;
  border-radius: 6px;
  outline: none;
  background: rgba(255, 255, 255, 0.95);
  font-size: 0.95rem;
  box-sizing: border-box;
}

.password-wrapper {
  position: relative;
}

.toggle-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 0.75rem;
  cursor: pointer;
}

.submit-btn {
  width: 100%;
  margin-top: 10px;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: #083a6d;
  color: white;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s;
}

.submit-btn:hover {
  background: #0b4a88;
}

.submit-btn:disabled {
  opacity: 0.75;
  cursor: not-allowed;
}

.home-btn {
  position: relative;
  z-index: 2;
  margin-top: 34px;
  padding: 10px 20px;
  border-radius: 20px;
  background: rgba(120, 120, 120, 0.45);
  color: #fff;
  text-decoration: none;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.3px;
  backdrop-filter: blur(8px);
}

.home-btn:hover {
  background: rgba(120, 120, 120, 0.6);
}
</style>
