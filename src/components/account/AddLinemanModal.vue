<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <h3>Add New Lineman</h3>

      <div class="form-group">
        <input
          v-model="form.firstName"
          placeholder="First Name"
          class="input-field"
          autocomplete="off"
        />
        <input
          v-model="form.middleName"
          placeholder="Middle Name"
          class="input-field"
          autocomplete="off"
        />
        <input
          v-model="form.lastName"
          placeholder="Last Name"
          class="input-field"
          autocomplete="off"
        />
        <input
          v-model="form.email"
          type="email"
          placeholder="Email"
          class="input-field"
          autocomplete="off"
        />
        <input
          v-model="form.mobileNumber"
          placeholder="Mobile Number"
          class="input-field"
          autocomplete="off"
        />
        <input
          v-model="form.password"
          type="password"
          placeholder="Password"
          class="input-field"
          autocomplete="new-password"
        />
        <input
          v-model="form.employeeId"
          placeholder="Employee ID No."
          class="input-field"
          autocomplete="off"
        />

        <select v-model="form.branchId" class="input-field">
          <option value="" disabled selected>Select Branch</option>
          <option v-for="branch in branches" :key="branch.branch_id" :value="branch.branch_id">
            {{ branch.branch_name }}
          </option>
        </select>
      </div>

      <div class="modal-actions">
        <button @click="$emit('close')" class="btn-cancel">Cancel</button>
        <button @click="createLinemanAccount" class="btn-confirm">Create Account</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import { sendNotification } from '@/utils/notifications.js'

const emit = defineEmits(['close', 'refresh'])

const form = reactive({
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  mobileNumber: '',
  password: '',
  employeeId: '',
  branchId: '',
})

const branches = ref([])

const fetchBranches = async () => {
  const { data, error } = await supabase
    .from('iselco_branch')
    .select('branch_id, branch_name')
    .order('branch_name')

  if (error) {
    console.error('Error fetching branches:', error)
  } else {
    branches.value = data
  }
}

onMounted(() => {
  fetchBranches()
})

const createLinemanAccount = async () => {
  if (!form.branchId) {
    alert('Please select a branch.')
    return
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })
    if (authError) throw authError

    const userId = authData.user.id

    const { error: userError } = await supabase.from('users').insert({
      id: userId,
      first_name: form.firstName,
      middle_name: form.middleName,
      last_name: form.lastName,
      email: form.email,
      mobile_number: form.mobileNumber,
      role_id: 9,
      branch_id: form.branchId,
    })
    if (userError) throw userError

    const { error: empError } = await supabase.from('employees').insert({
      user_id: userId,
      employee_id_no: form.employeeId,
      designation: 'Lineman',
      is_available: true,
    })
    if (empError) throw empError

    alert('Lineman account created successfully!')
    await sendNotification(
      'Welcome, Lineman',
      'Your lineman account has been created and is ready for assignments.',
      userId,
    )
    emit('refresh')
    emit('close')
  } catch (err) {
    alert('Error: ' + err.message)
  }
}
</script>

<style scoped>
/* Dark overlay behind the glass modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55); /* darker backdrop so blur is visible */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

/* Glassmorphism modal card */
.modal-content {
  width: min(420px, 90vw);
  padding: 22px 24px;
  border-radius: 20px;

  /* GLASS EFFECT */
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.45);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.35);

  color: #0f172a;
}

.modal-content h3 {
  margin: 0 0 8px;
  font-size: 1.2rem;
  color: #0f172a;
}

/* Form layout inside glass card */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 12px 0 20px;
}

.input-field {
  padding: 10px;
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  font-size: 0.9rem;
  outline: none;
  background: rgba(255, 255, 255, 0.9);
}

/* Actions */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-confirm {
  background: #1f3056;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: 0 4px 10px rgba(31, 48, 86, 0.35);
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.85);
  color: #475569;
  padding: 10px 20px;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
}
</style>
