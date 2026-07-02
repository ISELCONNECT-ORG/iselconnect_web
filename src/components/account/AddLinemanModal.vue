<template>
  <div class="modal-overlay">
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

// Fetch branches from Supabase on mount
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
  // Simple validation
  if (!form.branchId) {
    alert('Please select a branch.')
    return
  }

  try {
    // 1. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })
    if (authError) throw authError

    const userId = authData.user.id

    // 2. Insert into public.users with branch_id
    const { error: userError } = await supabase.from('users').insert({
      id: userId,
      first_name: form.firstName,
      middle_name: form.middleName,
      last_name: form.lastName,
      email: form.email,
      mobile_number: form.mobileNumber,
      role_id: 9,
      branch_id: form.branchId, // Link user to branch
    })
    if (userError) throw userError

    // 3. Insert into public.employees
    const { error: empError } = await supabase.from('employees').insert({
      user_id: userId,
      employee_id_no: form.employeeId,
      designation: 'Lineman',
      is_available: true,
    })
    if (empError) throw empError

    alert('Lineman account created successfully!')
    emit('refresh')
    emit('close')
  } catch (err) {
    alert('Error: ' + err.message)
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  padding: 20px;
  border-radius: 12px;
  width: 400px;
  color: #000;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}
.input-field {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.btn-confirm {
  background: #2563eb;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
.btn-cancel {
  background: #e2e8f0;
  color: #475569;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
</style>
