<!-- src/components/account/AddLinemanModal.vue -->
<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="wizard-card">
      <!-- DYNAMIC LEFT SIDEBAR -->
      <div class="wizard-left" :class="{ 'auth-sidebar': step === 4 }">
        <template v-if="step < 4">
          <h3>CREATE LINEMAN ACCOUNT</h3>
          <div class="stepper">
            <div class="step" :class="{ active: step === 1, done: step > 1 }">
              <div class="circle"><Check v-if="step > 1" :size="12" /></div>
              BRANCH
            </div>
            <div class="line"></div>
            <div class="step" :class="{ active: step === 2, done: step > 2 }">
              <div class="circle"><Check v-if="step > 2" :size="12" /></div>
              PERSONAL INFORMATION
            </div>
            <div class="line"></div>
            <div class="step" :class="{ active: step === 3, done: step > 3 }">
              <div class="circle"><Check v-if="step > 3" :size="12" /></div>
              SECURITY
            </div>
          </div>
        </template>

        <!-- STEP 4 SIDEBAR -->
        <template v-else>
          <div class="auth-brand">
            <h2>ISELCONNECT</h2>
            <p>Utility Management Platform</p>
          </div>
          <div class="auth-info">
            <h4>Secure Authentication</h4>
            <p>
              Verify your identity to access critical infrastructure monitoring and management
              tools.
            </p>
          </div>
        </template>
      </div>

      <div class="wizard-right">
        <!-- STEP 1: Branch -->
        <div v-if="step === 1" class="step-content">
          <h4>EMPLOYEE ID</h4>
          <input v-model="form.employeeId" placeholder="Enter ID" class="std-input" />

          <h4 style="margin-top: 20px">SELECT BRANCH</h4>
          <select v-model="form.branchId" class="std-input">
            <option value="" disabled selected>Select a branch...</option>
            <option v-for="b in branches" :key="b.branch_id" :value="b.branch_id">
              {{ b.branch_name }}
            </option>
          </select>
          <div class="info-note" style="margin-top: 16px">
            <Info :size="14" /> Please select a branch to link assignments.
          </div>
        </div>

        <!-- STEP 2: Personal Info -->
        <div v-if="step === 2" class="step-content">
          <h4>PERSONAL INFORMATION</h4>
          <p class="subtitle">
            Please provide the lineman's full name and contact details to proceed.
          </p>

          <div class="grid-3">
            <div><label>FIRST NAME</label><input v-model="form.firstName" class="std-input" /></div>
            <div>
              <label>MIDDLE NAME</label><input v-model="form.middleName" class="std-input" />
            </div>
            <div><label>LAST NAME</label><input v-model="form.lastName" class="std-input" /></div>
          </div>
          <div class="grid-2" style="margin-top: 16px">
            <div>
              <label>EMAIL</label><input v-model="form.email" type="email" class="std-input" />
            </div>
            <div>
              <label>CONTACT NUMBER</label><input v-model="form.mobileNumber" class="std-input" />
            </div>
          </div>
          <div class="grid-3" style="margin-top: 16px">
            <div><label>PUROK</label><input class="std-input" /></div>
            <div><label>BARANGAY</label><input class="std-input" /></div>
            <div><label>MUNICIPALITY</label><input class="std-input" /></div>
          </div>
        </div>

        <!-- STEP 3: Security -->
        <div v-if="step === 3" class="step-content">
          <h4>ACCOUNT SECURITY</h4>
          <p class="subtitle">Set up the login credentials for this lineman account.</p>

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

          <div class="password-reqs">
            <div class="req-item" :class="{ met: pwdReqs.length }">
              <div class="req-bar"></div>
              <span>At least 12<br />characters.</span>
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
            <div class="req-item" :class="{ met: pwdReqs.symbol }">
              <div class="req-bar"></div>
              <span>At least one<br />symbol.</span>
            </div>
          </div>
        </div>

        <!-- STEP 4: Email Verification -->
        <div v-if="step === 4" class="step-content verification-container">
          <div class="verification-header">
            <MailCheck :size="56" color="#1e1b4b" stroke-width="1.5" />
            <h2>EMAIL VERIFICATION</h2>
            <p>
              A 6-digit code has been sent to your email. Please enter it below to verify your
              account.
            </p>
          </div>

          <div class="otp-inputs">
            <input
              v-for="(digit, i) in otpValues"
              :key="i"
              :ref="
                (el) => {
                  if (el) otpRefs[i] = el
                }
              "
              v-model="otpValues[i]"
              @input="onOtpInput(i, $event)"
              @keydown="onOtpKeydown(i, $event)"
              @paste="onOtpPaste"
              type="text"
              maxlength="1"
              class="otp-box"
            />
          </div>

          <button
            @click="verifyAndCreateAccount"
            class="btn-verify-block"
            :disabled="isOtpIncomplete"
          >
            VERIFY ACCOUNT
          </button>

          <div class="verification-footer">
            <button @click="resendCode" class="btn-text">
              <RefreshCw :size="14" /> RESEND CODE
            </button>
            <button @click="step = 3" class="btn-text">
              <ArrowLeft :size="14" /> BACK TO REGISTRATION
            </button>
          </div>
        </div>

        <!-- Wizard Footer (Hidden on Step 4) -->
        <div v-if="step < 4" class="wizard-footer">
          <button v-if="step > 1" @click="step--" class="btn-back">BACK</button>
          <button v-if="step < 3" @click="step++" class="btn-next">NEXT</button>
          <button
            v-if="step === 3"
            @click="sendVerificationCode"
            class="btn-next"
            :disabled="!isFormValid"
          >
            CREATE ACCOUNT
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import { sendNotification } from '@/utils/notifications.js'
import { Check, Info, MailCheck, RefreshCw, ArrowLeft } from 'lucide-vue-next'

const emit = defineEmits(['close', 'refresh'])

const step = ref(1)
const form = reactive({
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  mobileNumber: '',
  password: '',
  confirmPassword: '',
  employeeId: '',
  branchId: '',
})

const branches = ref([])

// OTP State
const otpValues = ref(['', '', '', '', '', ''])
const otpRefs = ref([])

// Validation
const pwdReqs = computed(() => {
  const p = form.password
  return {
    length: p.length >= 12,
    upper: /[A-Z]/.test(p),
    lower: /[a-z]/.test(p),
    number: /[0-9]/.test(p),
    symbol: /[^A-Za-z0-9]/.test(p),
  }
})

const isPasswordValid = computed(() => Object.values(pwdReqs.value).every((val) => val))
const passwordMismatch = computed(
  () => form.confirmPassword.length > 0 && form.password !== form.confirmPassword,
)
const isFormValid = computed(
  () => isPasswordValid.value && !passwordMismatch.value && form.password.length > 0,
)
const isOtpIncomplete = computed(() => otpValues.value.some((val) => val === '' || val === null))

// Fetch Branches
const fetchBranches = async () => {
  const { data } = await supabase
    .from('iselco_branch')
    .select('branch_id, branch_name')
    .order('branch_name')
  if (data) branches.value = data
}
onMounted(fetchBranches)

// Robust OTP Input Handling
const onOtpInput = (index, event) => {
  // Strip non-alphanumeric characters to prevent spaces/symbols
  let val = event.target.value.replace(/[^a-zA-Z0-9]/g, '')
  otpValues.value[index] = val
  if (val && index < 5) {
    otpRefs.value[index + 1].focus()
  }
}

const onOtpKeydown = (index, event) => {
  if (event.key === 'Backspace' && !otpValues.value[index] && index > 0) {
    otpRefs.value[index - 1].focus()
  }
}

const onOtpPaste = (event) => {
  event.preventDefault()
  // Clean pasted text and extract first 6 characters
  const pastedData = event.clipboardData
    .getData('text')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 6)
    .split('')

  if (pastedData.length > 0) {
    pastedData.forEach((char, i) => {
      if (i < 6) otpValues.value[i] = char
    })
    // Auto-focus the next empty box or the last box
    const focusIndex = Math.min(pastedData.length, 5)
    if (otpRefs.value[focusIndex]) otpRefs.value[focusIndex].focus()
  }
}

// 1. Trigger Sign Up to send OTP Email
const sendVerificationCode = async () => {
  if (!form.branchId) return alert('Please select a branch.')
  if (!isPasswordValid.value) return alert('Please ensure all password requirements are met.')
  if (passwordMismatch.value) return alert('Passwords do not match.')

  try {
    const cleanEmail = form.email.trim()
    const { error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: form.password,
    })
    if (authError) throw authError

    // Transition to Verification Step
    step.value = 4
  } catch (err) {
    alert('Registration Error: ' + err.message)
  }
}

// 2. Verify OTP Code and Insert to Custom Tables
const verifyAndCreateAccount = async () => {
  // Ensure the token has no hidden spaces and matches exact email
  const token = otpValues.value.join('').trim()
  const cleanEmail = form.email.trim()

  try {
    // Verify the OTP string
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: token,
      type: 'signup',
    })
    if (verifyError) throw verifyError

    const userId = verifyData.user?.id || verifyData.session?.user?.id
    if (!userId) throw new Error('Could not retrieve user context after verification.')

    // Proceed with inserting public data
    const { error: userError } = await supabase.from('users').insert({
      id: userId,
      first_name: form.firstName,
      middle_name: form.middleName,
      last_name: form.lastName,
      email: cleanEmail,
      mobile_number: form.mobileNumber,
      role_id: 9,
      branch_id: form.branchId,
      is_active: true,
    })
    if (userError) throw userError

    const { error: empError } = await supabase.from('employees').insert({
      user_id: userId,
      employee_id_no: form.employeeId,
      designation: 'Lineman',
      is_available: true,
      branch_id: form.branchId,
    })
    if (empError) throw empError

    alert('Account verified and created successfully!')
    await sendNotification('Welcome, Lineman', 'Account created and ready.', userId)
    emit('refresh')
    emit('close')
  } catch (err) {
    alert('Verification Error: ' + err.message)
  }
}

// 3. Resend OTP functionality
const resendCode = async () => {
  try {
    const cleanEmail = form.email.trim()
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
    })
    if (error) throw error
    alert('A new verification code has been sent to your email.')
  } catch (err) {
    alert('Error resending code: ' + err.message)
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.wizard-card {
  display: flex;
  width: 800px;
  height: 500px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.wizard-left {
  background: #fde047;
  width: 250px;
  padding: 40px 24px;
  color: #1e1b4b;
  display: flex;
  flex-direction: column;
}

/* Authentication Sidebar Specific Styles */
.auth-sidebar {
  justify-content: space-between;
}

.auth-brand h2 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 800;
}
.auth-brand p {
  margin: 4px 0 0 0;
  font-size: 0.8rem;
  font-weight: 500;
}

.auth-info h4 {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
}
.auth-info p {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.4;
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

.step.active .circle,
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
.std-input:focus {
  border-color: #1e1b4b;
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

.grid-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}
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

/* Password Requirements */
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
}
.req-item.met span {
  color: #1e1b4b;
  font-weight: 700;
}

/* Verification Step Styles */
.verification-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 20px;
}

.verification-header {
  text-align: center;
  margin-bottom: 32px;
}

.verification-header h2 {
  color: #1e1b4b;
  font-weight: 800;
  margin: 16px 0 8px 0;
}

.verification-header p {
  color: #64748b;
  font-size: 0.85rem;
  max-width: 320px;
  margin: 0 auto;
}

.otp-inputs {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
}

.otp-box {
  width: 46px;
  height: 52px;
  border: 1px solid #1e1b4b;
  border-radius: 4px;
  text-align: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e1b4b;
  outline: none;
}
.otp-box:focus {
  box-shadow: 0 0 0 2px rgba(30, 27, 75, 0.2);
}

.btn-verify-block {
  width: 100%;
  max-width: 380px;
  background: #1e1b4b;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: opacity 0.2s;
  margin-bottom: 24px;
}
.btn-verify-block:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}
.btn-verify-block:not(:disabled):hover {
  opacity: 0.9;
}

.verification-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.btn-text {
  background: none;
  border: none;
  color: #1e1b4b;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  text-decoration: none;
}
.btn-text:hover {
  text-decoration: underline;
}

/* Wizard Footer */
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
}
.btn-next:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}
.btn-next:not(:disabled):hover {
  opacity: 0.9;
}
</style>
