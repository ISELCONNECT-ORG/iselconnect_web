<template>
  <div class="dashboard-root">
    <Sidebar />

    <main class="content">
      <Topbar />

      <!-- Centered Container with Blurred Background -->
      <div class="wizard-page-wrapper">
        <div class="wizard-card">
          <!-- Wizard Left Panel (Yellow) -->
          <div class="wizard-left">
            <h3>CREATE BRANCH ACCOUNT</h3>
            <div class="stepper">
              <div class="step" :class="{ active: step === 1, done: step > 1 }">
                <div class="circle"><Check v-if="step > 1" :size="12" /></div>
                BRANCH
              </div>
              <div class="line"></div>
              <div class="step" :class="{ active: step === 2, done: step > 2 }">
                <div class="circle"><Check v-if="step > 2" :size="12" /></div>
                BRANCH INFORMATION
              </div>
              <div class="line"></div>
              <div class="step" :class="{ active: step === 3, done: step > 3 }">
                <div class="circle"><Check v-if="step > 3" :size="12" /></div>
                SECURITY
              </div>
            </div>
          </div>

          <!-- Wizard Right Panel (White) -->
          <div class="wizard-right">
            <!-- STEP 1: Branch -->
            <div v-if="step === 1" class="step-content">
              <h4>ACCOUNT TYPE</h4>
              <p class="subtitle">This account is strictly designated for Branch Management.</p>

              <!-- Displayed as static readonly text instead of a dropdown -->
              <input
                type="text"
                value="Branch"
                class="std-input readonly-input"
                style="margin-bottom: 20px"
                readonly
              />

              <div>
                <h4>SELECT BRANCH</h4>
                <!-- Standard downward select -->
                <select v-model="form.branchId" class="std-input">
                  <option value="" disabled>Select a branch...</option>
                  <option v-for="b in branches" :key="b.branch_id" :value="b.branch_id">
                    {{ b.branch_name }}
                  </option>
                </select>
                <div class="info-note" style="margin-top: 16px">
                  <Info :size="14" /> Please assign this Branch Account to a specific district.
                </div>
              </div>
            </div>

            <!-- STEP 2: Branch Info -->
            <div v-if="step === 2" class="step-content">
              <h4>BRANCH INFORMATION</h4>
              <p class="subtitle">Please provide the branch's primary contact details.</p>

              <div class="grid-2">
                <div>
                  <label>BRANCH NAME</label>
                  <input
                    v-model="form.firstName"
                    class="std-input"
                    placeholder="e.g. North District"
                  />
                </div>
                <div>
                  <!-- Pre-filled and readonly Branch suffix -->
                  <label>BRANCH NAME</label>
                  <input v-model="form.lastName" class="std-input readonly-input" readonly />
                </div>
              </div>
              <div class="grid-2" style="margin-top: 16px">
                <div>
                  <label>EMAIL</label>
                  <input
                    v-model="form.email"
                    type="email"
                    class="std-input"
                    placeholder="name@example.com"
                  />
                </div>
                <div>
                  <label>MOBILE NUMBER</label>
                  <input
                    v-model="form.mobileNumber"
                    class="std-input"
                    placeholder="09XX XXX XXXX"
                  />
                </div>
              </div>
            </div>

            <!-- STEP 3: Security -->
            <div v-if="step === 3" class="step-content">
              <h4>ACCOUNT SECURITY</h4>
              <p class="subtitle">Set up the login credentials for this account.</p>

              <div style="margin-bottom: 16px">
                <label>PASSWORD</label>
                <input
                  v-model="form.password"
                  type="password"
                  placeholder="Enter password"
                  class="std-input"
                />
              </div>
              <div>
                <label>TYPE AGAIN THE PASSWORD</label>
                <input
                  v-model="form.confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  class="std-input"
                  :class="{ 'input-error': passwordMismatch }"
                />
                <div v-if="passwordMismatch" class="error-text">Passwords do not match.</div>
              </div>

              <!-- Dynamic Password Validation Requirements -->
              <div class="password-reqs">
                <div class="req-item" :class="{ met: pwdReqs.length }">
                  <div class="req-bar"></div>
                  <span>At least 6<br />characters.</span>
                </div>
                <div class="req-item" :class="{ met: pwdReqs.upper }">
                  <div class="req-bar"></div>
                  <span>At least one<br />capital letter.</span>
                </div>
                <div class="req-item" :class="{ met: pwdReqs.lower }">
                  <div class="req-bar"></div>
                  <span>At least one<br />small letter.</span>
                </div>
                <div class="req-item" :class="{ met: pwdReqs.number }">
                  <div class="req-bar"></div>
                  <span>At least one<br />number.</span>
                </div>
              </div>
            </div>

            <!-- Wizard Footer Buttons -->
            <div class="wizard-footer">
              <button v-if="step > 1" @click="step--" class="btn-back">BACK</button>

              <!-- Next Button (Step 1 & 2) -->
              <button v-if="step === 1" @click="step++" class="btn-next" :disabled="!form.branchId">
                NEXT
              </button>
              <button
                v-if="step === 2"
                @click="step++"
                class="btn-next"
                :disabled="!form.firstName || !form.lastName || !form.email || !form.mobileNumber"
              >
                NEXT
              </button>

              <!-- Create Button (Step 3) -->
              <button
                v-if="step === 3"
                @click="handleRegister"
                class="btn-next"
                :disabled="!isFormValid || loading"
              >
                {{ loading ? 'CREATING...' : 'CREATE ACCOUNT' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import Sidebar from '@/components/Sidebar.vue'
import { Check, Info } from 'lucide-vue-next'

const loading = ref(false)
const step = ref(1)
const branches = ref([])

// Form Reactive State
const form = reactive({
  role: '6', // Locked to Branch Admin (6) in backend logic
  branchId: '',
  firstName: '',
  lastName: 'Branch', // Pre-filled with "Branch"
  email: '',
  mobileNumber: '',
  password: '',
  confirmPassword: '',
})

// Password Validation logic
const pwdReqs = computed(() => {
  const p = form.password
  return {
    length: p.length >= 6,
    upper: /[A-Z]/.test(p),
    lower: /[a-z]/.test(p),
    number: /[0-9]/.test(p),
  }
})

const isPasswordValid = computed(() => {
  return Object.values(pwdReqs.value).every((val) => val)
})

const passwordMismatch = computed(() => {
  return form.confirmPassword.length > 0 && form.password !== form.confirmPassword
})

const isFormValid = computed(() => {
  return isPasswordValid.value && !passwordMismatch.value && form.password.length > 0
})

// Reset Wizard Function
const resetWizard = () => {
  step.value = 1
  form.branchId = ''
  form.firstName = ''
  form.lastName = 'Branch' // Keep as Branch
  form.email = ''
  form.mobileNumber = ''
  form.password = ''
  form.confirmPassword = ''
}

// Fetch Branches on component mount
onMounted(async () => {
  const { data } = await supabase
    .from('iselco_branch')
    .select('branch_id, branch_name')
    .order('branch_name')
  if (data) branches.value = data
})

// Main Registration Logic
const handleRegister = async () => {
  if (!isFormValid.value) {
    alert('Please ensure all password requirements are met.')
    return
  }

  loading.value = true

  try {
    // 1. Auth Sign Up via Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        throw new Error('Account already exists.')
      }
      throw authError
    }

    const userId = authData.user.id

    // 2. Insert into Users Table
    const { error: userError } = await supabase.from('users').insert([
      {
        id: userId,
        email: form.email,
        mobile_number: form.mobileNumber,
        role_id: parseInt(form.role),
        branch_id: form.branchId,
        first_name: form.firstName,
        last_name: form.lastName,
        is_active: true,
      },
    ])

    if (userError) throw userError

    // Complete Process
    alert('Branch account registration successful!')
    resetWizard()
  } catch (err) {
    alert('Registration Error: ' + err.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.dashboard-root {
  display: flex;
  background: #f8fafc;
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
  color: #0f172a;
}

.content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

/* Centering wrapper with blurred background image */
.wizard-page-wrapper {
  position: relative;
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  overflow: hidden;
}

.wizard-page-wrapper::before {
  content: '';
  position: absolute;
  top: -20px;
  left: -20px;
  right: -20px;
  bottom: -20px;
  background: url('@/assets/Background/HomeBackground.jpg') no-repeat center center;
  background-size: cover;
  filter: blur(12px) brightness(0.65);
  z-index: 0;
}

/* Base Wizard Card */
.wizard-card {
  position: relative;
  z-index: 1;
  display: flex;
  width: 100%;
  max-width: 800px;
  height: 500px;
  background: white;
  border-radius: 8px;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

/* Left Wizard Panel (Yellow) */
.wizard-left {
  background: #fde047;
  width: 250px;
  padding: 40px 24px;
  color: #1e1b4b;
}

.wizard-left h3 {
  margin: 0 0 40px 0;
  font-size: 1rem;
  font-weight: 800;
}

.stepper {
  display: flex;
  flex-direction: column;
}

.step {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #a16207;
  transition: color 0.3s;
}

.step.active,
.step.done {
  color: #1e1b4b;
}

.circle {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #ca8a04;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.step.active .circle {
  background: #1e1b4b;
  border-color: #1e1b4b;
}

.step.done .circle {
  background: #1e1b4b;
  border-color: #1e1b4b;
  color: white;
}

.line {
  width: 2px;
  height: 40px;
  background: #fef08a;
  margin-left: 8px;
}

/* Right Wizard Panel (White Forms) */
.wizard-right {
  flex-grow: 1;
  padding: 40px;
  display: flex;
  flex-direction: column;
}

.step-content {
  flex-grow: 1;
}

.step-content h4 {
  margin: 0 0 8px 0;
  font-size: 1rem;
  color: #1e1b4b;
}

.subtitle {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0 0 20px 0;
}

.std-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 0.85rem;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.2s;
}

.std-input:focus:not(.readonly-input) {
  border-color: #1e1b4b;
}

/* Style for readonly inputs (Account Type & Last Name) */
.readonly-input {
  background-color: #f1f5f9;
  color: #475569;
  font-weight: 600;
  cursor: default;
  border-color: #e2e8f0;
}

.input-error {
  border-color: #ef4444 !important;
}

.error-text {
  color: #ef4444;
  font-size: 0.7rem;
  margin-top: 4px;
  font-weight: 600;
}

label {
  display: block;
  font-size: 0.65rem;
  font-weight: 700;
  color: #1e1b4b;
  margin-bottom: 4px;
}

/* Grids */
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-note {
  background: #fef9c3;
  padding: 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #854d0e;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Dynamic Password Requirements Styling */
.password-reqs {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  gap: 8px;
}

.req-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 6px;
}

.req-bar {
  width: 100%;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  transition: background 0.3s;
}

.req-item.met .req-bar {
  background: #1e1b4b;
}

.req-item span {
  font-size: 0.6rem;
  color: #94a3b8;
  line-height: 1.2;
  transition:
    color 0.3s,
    font-weight 0.3s;
}

.req-item.met span {
  color: #1e1b4b;
  font-weight: 700;
}

/* Wizard Footer Controls */
.wizard-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.btn-back {
  background: #e2e8f0;
  color: #475569;
  border: none;
  padding: 8px 24px;
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-back:hover {
  background: #cbd5e1;
}

.btn-next {
  background: #1e1b4b;
  color: white;
  border: none;
  padding: 8px 24px;
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-next:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.btn-next:not(:disabled):hover {
  opacity: 0.9;
}

@media (max-width: 768px) {
  .wizard-card {
    flex-direction: column;
    height: auto;
  }
  .wizard-left {
    width: 100%;
    padding: 24px;
  }
  .stepper {
    flex-direction: row;
    justify-content: space-between;
  }
  .line {
    width: 40px;
    height: 2px;
    margin: 0;
  }
  .grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>
