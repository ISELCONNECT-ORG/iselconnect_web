<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import BranchSidebar from '@/components/BranchSidebar.vue'
import Topbar from '@/components/Topbar.vue'

const reports = ref([])
const branchName = ref('Loading...')
const showAssignModal = ref(false)
const selectedReport = ref(null)
const selectedLineman = ref('')

const fetchBranchReports = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  // 1. Get branch info
  const { data: userData } = await supabase
    .from('users')
    .select('branch_id, iselco_branch(branch_name)')
    .eq('email', user.email)
    .single()

  branchName.value = userData?.iselco_branch?.branch_name || 'Branch'

  // 2. Fetch reports
  const { data } = await supabase
    .from('reports')
    .select('*, report_types(name), report_statuses(name)')
    .eq('branch_id', userData.branch_id)
    .order('created_at', { ascending: false })

  reports.value = data || []
}

// Helper to handle modal opening
const openAssignModal = (report) => {
  selectedReport.value = report
  showAssignModal.value = true
}

const updateStatus = async (reportId, newStatusId) => {
  await supabase.from('reports').update({ status_id: newStatusId }).eq('id', reportId)
  fetchBranchReports()
}

const assignLineman = async () => {
  if (!selectedReport.value) return
  await supabase
    .from('reports')
    .update({ lineman_id: selectedLineman.value })
    .eq('id', selectedReport.value.id)

  showAssignModal.value = false
  fetchBranchReports()
}

onMounted(fetchBranchReports)
</script>

<template>
  <div class="dashboard-root">
    <BranchSidebar />
    <div class="main-wrapper">
      <Topbar />
      <main class="content">
        <h1>{{ branchName }} Active Reports</h1>

        <table class="data-table">
          <thead>
            <tr>
              <th>Report</th>
              <th>Location</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in reports" :key="r.id">
              <td>{{ r.report_types?.name }}</td>
              <td>{{ r.landmark }}</td>
              <td>{{ r.description }}</td>
              <td>
                <select @change="updateStatus(r.id, $event.target.value)" :value="r.status_id">
                  <option value="1">Pending</option>
                  <option value="2">In Progress</option>
                  <option value="3">Resolved</option>
                </select>
              </td>
              <td>
                <button class="assign-btn" @click="openAssignModal(r)">Assign</button>
              </td>
            </tr>
          </tbody>
        </table>
      </main>
    </div>

    <div v-if="showAssignModal" class="modal-overlay">
      <div class="modal-box">
        <h3>Assign Lineman</h3>
        <select v-model="selectedLineman">
          <option value="" disabled>Select a Lineman</option>
          <option value="1">Mark Justin Balisacan</option>
          <option value="2">Allysa Reyes</option>
        </select>
        <div class="modal-actions">
          <button @click="showAssignModal = false">Cancel</button>
          <button @click="assignLineman">Confirm</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-root {
  display: flex;
  min-height: 100vh;
  background: #f3f4f6;
}
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.content {
  padding: 2rem;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}
.data-table th,
.data-table td {
  padding: 1rem;
  border-bottom: 1px solid #ddd;
  text-align: left;
}
.assign-btn {
  padding: 6px 12px;
  background: #ea580c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-box {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
