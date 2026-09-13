<template>
  <div class="dashboard-root">
    <Sidebar />
    <main class="content">
      <Topbar />

      <!-- Hero Banner -->
      <header class="hero-banner">
        <div class="hero-overlay-content">
          <h1>LINEMAN TEAMS MANAGEMENT</h1>
          <p>
            Manage lineman teams, assigned branch offices, team leaders, and view total members.
          </p>
        </div>
      </header>

      <!-- Table Panel -->
      <div class="table-panel">
        <div class="panel-header">
          <h2 class="panel-title">Lineman Teams Management</h2>
          <button @click="openForm" class="btn-create"><Plus :size="16" /> Create Team</button>
        </div>

        <div v-if="isLoadingTeams" class="loading-state">Loading teams...</div>

        <table v-else class="data-table">
          <thead>
            <tr>
              <th>TEAM NAME</th>
              <th>BRANCH / AREA</th>
              <th>TEAM LEADER</th>
              <th>TOTAL MEMBERS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="teamsList.length === 0">
              <td colspan="5" class="no-data-cell">
                No teams found. Click "Create Team" to add one.
              </td>
            </tr>
            <tr v-for="team in teamsList" :key="team.id">
              <td class="font-bold">{{ team.team_name }}</td>
              <td class="muted">{{ team.branch_name }}</td>
              <td class="muted">{{ team.leader_name }}</td>
              <td class="muted">
                <span class="member-badge">{{ team.member_count }}</span>
              </td>
              <td>
                <div class="action-buttons">
                  <button @click="openDetails(team)" class="btn-action">Details</button>
                  <button @click="openEditForm(team)" class="btn-action edit-btn">Edit</button>
                  <button @click="confirmDelete(team)" class="btn-action delete-btn">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pop-up Team Details Modal -->
      <Teleport to="body">
        <div v-if="showDetailsModal" class="modal-overlay" @click.self="closeDetails">
          <div class="modal-content details-card">
            <div class="modal-header-simple">
              <h2 class="page-title">Team Details</h2>
              <button class="btn-close" @click="closeDetails"><X :size="24" /></button>
            </div>

            <div class="details-body" v-if="selectedTeamDetails">
              <div class="detail-row">
                <span class="detail-label">Team Name:</span>
                <span class="detail-value fw-bold">{{ selectedTeamDetails.team_name }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Branch:</span>
                <span class="detail-value">{{ selectedTeamDetails.branch_name }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Team Leader:</span>
                <span class="detail-value">{{ selectedTeamDetails.leader_name }}</span>
              </div>

              <div class="members-section">
                <div class="members-header-title">
                  <h3>Team Members</h3>
                  <span class="member-badge">{{ selectedTeamDetails.member_count }}</span>
                </div>

                <div v-if="selectedTeamDetails.members_list.length === 0" class="no-data">
                  No members assigned to this team.
                </div>
                <ul v-else class="members-list">
                  <li v-for="(member, idx) in selectedTeamDetails.members_list" :key="idx">
                    <span class="bullet-point"></span>
                    {{ member }}
                  </li>
                </ul>
              </div>
            </div>

            <div class="form-actions">
              <button class="btn-cancel" @click="closeDetails">Close</button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- Pop-up Create / Edit Form Modal -->
      <Teleport to="body">
        <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
          <div class="modal-content form-card">
            <div class="modal-header-simple">
              <h2 class="page-title">
                {{ isEditMode ? 'Edit Lineman Team' : 'Create Lineman Team' }}
              </h2>
              <button class="btn-close" @click="closeForm"><X :size="24" /></button>
            </div>

            <form @submit.prevent="handleFormSubmit" class="team-form">
              <!-- Team Name -->
              <div class="form-group">
                <label for="teamName">Team Name</label>
                <input
                  type="text"
                  id="teamName"
                  v-model="form.team_name"
                  required
                  placeholder="e.g. Team Alpha"
                  class="form-control"
                />
              </div>

              <!-- Assigned Service Area (Branch Selection) -->
              <div class="form-group">
                <label for="serviceArea">Assigned Branch Office</label>
                <select
                  id="serviceArea"
                  v-model="form.assigned_service_area_id"
                  required
                  class="form-control"
                  :disabled="isEditMode"
                >
                  <option value="" disabled>Select a branch</option>
                  <option
                    v-for="branch in availableBranches"
                    :key="branch.branch_id"
                    :value="branch.branch_id"
                  >
                    {{ branch.branch_name }}
                  </option>
                </select>
                <small v-if="isEditMode" class="help-text"
                  >Branch assignment cannot be changed during edit.</small
                >
              </div>

              <!-- Team Leader -->
              <div class="form-group">
                <label for="teamLeader">Team Leader</label>
                <select
                  id="teamLeader"
                  v-model="form.team_leader"
                  required
                  class="form-control"
                  :disabled="!form.assigned_service_area_id"
                >
                  <option value="" disabled>Select a team leader</option>
                  <option
                    v-for="user in availableLeaders"
                    :key="user.user_id"
                    :value="user.user_id"
                  >
                    {{ user.employee_id_no }}
                  </option>
                </select>
              </div>

              <!-- Team Members with Filter -->
              <div class="form-group">
                <div class="members-header">
                  <label>Team Members</label>
                  <div class="filter-controls" v-if="form.assigned_service_area_id">
                    <label class="filter-radio">
                      <input type="radio" value="all" v-model="memberFilter" /> All
                    </label>
                    <label class="filter-radio">
                      <input type="radio" value="available" v-model="memberFilter" /> Available
                    </label>
                    <label class="filter-radio">
                      <input type="radio" value="assigned" v-model="memberFilter" /> Assigned
                    </label>
                  </div>
                </div>

                <div
                  class="checkbox-group"
                  :class="{ 'disabled-group': !form.assigned_service_area_id }"
                >
                  <div v-if="branchLinemen.length === 0" class="no-data">
                    {{
                      form.assigned_service_area_id
                        ? 'No linemen found for this branch.'
                        : 'Select a branch first.'
                    }}
                  </div>
                  <div v-else-if="displayedMembers.length === 0" class="no-data">
                    No linemen match the selected filter.
                  </div>

                  <label
                    v-for="user in displayedMembers"
                    :key="user.user_id"
                    class="checkbox-label"
                    :class="{ 'is-disabled': isUserDisabled(user) }"
                  >
                    <input
                      type="checkbox"
                      :value="user.user_id"
                      v-model="form.team_members"
                      :disabled="isUserDisabled(user) || !form.assigned_service_area_id"
                    />
                    {{ user.employee_id_no }}
                    <span
                      v-if="
                        assignedLinemenMap[user.user_id] &&
                        assignedLinemenMap[user.user_id] !== editingTeamId
                      "
                      class="badge-assigned"
                      >Assigned</span
                    >
                    <span
                      v-else-if="assignedLinemenMap[user.user_id] === editingTeamId"
                      class="badge-assigned badge-current"
                      >Current</span
                    >
                  </label>
                </div>
                <small class="help-text">Select one or more available team members.</small>
              </div>

              <div class="form-actions">
                <button type="button" class="btn-cancel" @click="closeForm">Cancel</button>
                <button type="submit" class="btn-submit" :disabled="isSubmitting">
                  {{ isSubmitting ? 'Processing...' : isEditMode ? 'Update Team' : 'Save Team' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Teleport>

      <!-- Update Confirmation Modal -->
      <Teleport to="body">
        <div v-if="showUpdateModal" class="modal-overlay" @click.self="showUpdateModal = false">
          <div class="confirm-modal">
            <div class="modal-header">
              <ShieldCheck :size="20" class="header-icon" />
              <h2>Confirm Update</h2>
            </div>
            <div class="modal-body">
              <div class="modal-icon-box">
                <CheckCircle :size="24" class="body-icon" style="color: #2563eb" />
              </div>
              <div class="modal-text-content">
                <h3>Update {{ form.team_name }}?</h3>
                <p>
                  Are you sure you want to save these changes? Members removed from the list will be
                  unassigned from this team.
                </p>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" @click="showUpdateModal = false">Cancel</button>
              <button class="btn-verify" @click="executeSubmit">Save Changes</button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- Delete Confirmation Modal -->
      <Teleport to="body">
        <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
          <div class="confirm-modal">
            <div class="modal-header">
              <ShieldCheck :size="20" class="header-icon" />
              <h2>Confirm Deletion</h2>
            </div>
            <div class="modal-body">
              <div class="modal-icon-box" style="border-color: #fca5a5">
                <AlertTriangle :size="24" class="body-icon" style="color: #dc2626" />
              </div>
              <div class="modal-text-content">
                <h3>Delete {{ teamToDelete?.team_name }}?</h3>
                <p>
                  Are you sure you want to delete this team? This action is permanent and will
                  immediately unassign all its current members.
                </p>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" @click="showDeleteModal = false">Cancel</button>
              <button class="btn-danger" @click="executeDelete">Delete Team</button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- Custom Validation Alert Modal -->
      <Teleport to="body">
        <div v-if="showValidationModal" class="validation-overlay" @click.self="closeValidation">
          <div class="validation-card">
            <div class="validation-header">
              <Info :size="18" class="validation-icon" />
              <h3>{{ validationTitle }}</h3>
            </div>
            <div class="validation-body">
              <p>{{ validationMessage }}</p>
            </div>
            <div class="validation-footer">
              <button class="btn-ok" @click="closeValidation">OK</button>
            </div>
          </div>
        </div>
      </Teleport>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'
import { Plus, X, Info, ShieldCheck, CheckCircle, AlertTriangle } from 'lucide-vue-next'
import { supabase } from '@/services/supabase'
import { useSystemAlerts } from '@/composables/useSystemAlerts'

const { addAlert } = useSystemAlerts()

// --- View State ---
const showForm = ref(false)
const showDetailsModal = ref(false)
const isLoadingTeams = ref(true)
const teamsList = ref([])
const selectedTeamDetails = ref(null)

// --- Edit/Delete/Update Validation State ---
const isEditMode = ref(false)
const editingTeamId = ref(null)
const isSettingUpEdit = ref(false)

const showDeleteModal = ref(false)
const showUpdateModal = ref(false)
const teamToDelete = ref(null)

// --- Empty-field Validation State ---
const showValidationModal = ref(false)
const validationTitle = ref('')
const validationMessage = ref('')

// --- Form State ---
const form = reactive({
  team_name: '',
  assigned_service_area_id: '',
  team_leader: '',
  team_members: [],
})

const availableBranches = ref([])
const branchLinemen = ref([])
const isSubmitting = ref(false)
const memberFilter = ref('all')

// --- Dynamic Map of Assigned Linemen ---
const assignedLinemenMap = computed(() => {
  const map = {}
  teamsList.value.forEach((team) => {
    if (team.leader_id) map[team.leader_id] = team.id
    if (team.raw_members) {
      team.raw_members.forEach((memberId) => (map[memberId] = team.id))
    }
  })
  return map
})

// --- Fetch Data on Mount ---
onMounted(async () => {
  const { data: branchData } = await supabase.from('iselco_branch').select('branch_id, branch_name')
  if (branchData) availableBranches.value = branchData
  await fetchAllTeams()
})

// --- Fetch & Format Teams for the Table ---
const fetchAllTeams = async () => {
  isLoadingTeams.value = true
  try {
    const [teamsRes, branchesRes, employeesRes] = await Promise.all([
      supabase.from('lineman_teams').select('*').order('id', { ascending: false }),
      supabase.from('iselco_branch').select('branch_id, branch_name'),
      supabase.from('employees').select('user_id, employee_id_no'),
    ])

    if (teamsRes.error) throw teamsRes.error

    const teams = teamsRes.data || []
    const branches = branchesRes.data || []
    const employees = employeesRes.data || []

    teamsList.value = teams.map((team) => {
      const branch = branches.find((b) => b.branch_id === team.assigned_service_area_id)

      const leaderId =
        team.team_leader ||
        (team.team_members && team.team_members.length > 0 ? team.team_members[0] : null)
      const leader = employees.find((e) => e.user_id === leaderId)

      const rawMembers = team.team_members || []
      const mappedMembers = rawMembers.map((id) => {
        const emp = employees.find((e) => e.user_id === id)
        return emp ? emp.employee_id_no : 'Unknown Member'
      })

      return {
        id: team.id,
        team_name: team.team_name,
        branch_name: branch ? branch.branch_name : 'Unknown Branch',
        assigned_service_area_id: team.assigned_service_area_id,
        leader_id: leaderId,
        leader_name: leader ? leader.employee_id_no : 'Unknown',
        member_count: rawMembers.length,
        raw_members: rawMembers,
        members_list: mappedMembers,
      }
    })
  } catch (error) {
    console.error('Error fetching teams data:', error)
  } finally {
    isLoadingTeams.value = false
  }
}

// --- Details Modal Handlers ---
const openDetails = (team) => {
  selectedTeamDetails.value = team
  showDetailsModal.value = true
}

const closeDetails = () => {
  showDetailsModal.value = false
  selectedTeamDetails.value = null
}

// --- Delete Modal Handlers ---
const confirmDelete = (team) => {
  teamToDelete.value = team
  showDeleteModal.value = true
}

const executeDelete = async () => {
  if (!teamToDelete.value) return

  try {
    const { data, error } = await supabase
      .from('lineman_teams')
      .delete()
      .eq('id', teamToDelete.value.id)
      .select()

    if (error) throw error
    if (!data || data.length === 0) {
      throw new Error('Database blocked the deletion. Please check your RLS policies.')
    }

    addAlert({
      title: 'System Confirmation',
      message: 'Team successfully deleted.',
      severity: 'low',
    })
    showDeleteModal.value = false
    teamToDelete.value = null
    await fetchAllTeams()
  } catch (err) {
    console.error(err)
    openValidation('System Error', 'Failed to delete team. ' + err.message)
  }
}

// --- Empty Fields Validation Handlers ---
const openValidation = (title, message) => {
  validationTitle.value = title
  validationMessage.value = message
  showValidationModal.value = true
}

const closeValidation = () => {
  showValidationModal.value = false
}

// --- Form Modal Handlers ---
const openForm = () => {
  isEditMode.value = false
  editingTeamId.value = null
  showForm.value = true
}

const openEditForm = async (team) => {
  isSettingUpEdit.value = true
  isEditMode.value = true
  editingTeamId.value = team.id

  form.team_name = team.team_name
  form.assigned_service_area_id = team.assigned_service_area_id

  await fetchBranchLinemen(team.assigned_service_area_id)

  form.team_leader = team.leader_id || ''

  let currentMembers = team.raw_members ? [...team.raw_members] : []

  if (form.team_leader) {
    currentMembers = currentMembers.filter((id) => id !== form.team_leader)
  }

  form.team_members = currentMembers

  showForm.value = true

  setTimeout(() => {
    isSettingUpEdit.value = false
  }, 100)
}

const closeForm = () => {
  showForm.value = false
  isEditMode.value = false
  editingTeamId.value = null
  form.team_name = ''
  form.assigned_service_area_id = ''
  form.team_leader = ''
  form.team_members = []
  branchLinemen.value = []
  memberFilter.value = 'all'
}

// --- Form Logic ---
const fetchBranchLinemen = async (branchId) => {
  if (!branchId || branchId === 'undefined') return

  const { data, error } = await supabase
    .from('employees')
    .select('user_id, employee_id_no')
    .eq('branch_id', branchId)
    .eq('designation', 'Lineman')

  if (!error && data) {
    branchLinemen.value = data
  } else {
    console.error('Fetch Linemen Error:', error)
  }
}

watch(
  () => form.assigned_service_area_id,
  async (newBranchId) => {
    if (isSettingUpEdit.value) return

    form.team_leader = ''
    form.team_members = []
    branchLinemen.value = []
    memberFilter.value = 'all'

    if (newBranchId) await fetchBranchLinemen(newBranchId)
  },
)

watch(
  () => form.team_leader,
  (newLeaderId) => {
    if (newLeaderId) form.team_members = form.team_members.filter((id) => id !== newLeaderId)
  },
)

const isUserDisabled = (user) => {
  const userTeamId = assignedLinemenMap.value[user.user_id]
  if (!userTeamId) return false
  if (isEditMode.value && userTeamId === editingTeamId.value) return false
  return true
}

const availableLeaders = computed(() => branchLinemen.value.filter((user) => !isUserDisabled(user)))

const displayedMembers = computed(() => {
  let filteredList = branchLinemen.value
  if (memberFilter.value === 'available')
    filteredList = filteredList.filter((user) => !isUserDisabled(user))
  else if (memberFilter.value === 'assigned')
    filteredList = filteredList.filter((user) => !!assignedLinemenMap.value[user.user_id])
  return filteredList.filter((user) => user.user_id !== form.team_leader)
})

const handleFormSubmit = () => {
  if (
    !form.team_name ||
    !form.assigned_service_area_id ||
    !form.team_leader ||
    form.team_members.length === 0
  ) {
    openValidation(
      isEditMode.value ? 'Editing Team' : 'Creating Team',
      'Please fill out all required fields. Teams must have at least one member.',
    )
    return
  }

  // Intercept the submission if it's an Edit to show the Confirmation Modal
  if (isEditMode.value) {
    showUpdateModal.value = true
  } else {
    executeSubmit()
  }
}

const executeSubmit = async () => {
  showUpdateModal.value = false
  isSubmitting.value = true

  try {
    const allMembers = [form.team_leader, ...form.team_members]
    const uniqueMembersArray = [...new Set(allMembers)].filter(Boolean)

    if (isEditMode.value) {
      const { error: teamError } = await supabase
        .from('lineman_teams')
        .update({
          team_name: form.team_name,
          team_leader: form.team_leader,
          team_members: uniqueMembersArray,
        })
        .eq('id', editingTeamId.value)

      if (teamError) throw teamError
      addAlert({
        title: 'System Confirmation',
        message: 'Team successfully updated.',
        severity: 'low',
      })
    } else {
      const { error: teamError } = await supabase.from('lineman_teams').insert([
        {
          team_name: form.team_name,
          assigned_service_area_id: form.assigned_service_area_id,
          team_leader: form.team_leader,
          team_members: uniqueMembersArray,
        },
      ])

      if (teamError) throw teamError
      addAlert({
        title: 'System Confirmation',
        message: 'New lineman team has been successfully created.',
        severity: 'low',
      })
    }

    closeForm()
    await fetchAllTeams()
  } catch (error) {
    console.error('Error saving team:', error)
    openValidation('System Error', 'Failed to save team. Please try again.')
  } finally {
    isSubmitting.value = false
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
  padding: 0 16px 16px;
}

:deep(.topbar-container) {
  margin-bottom: 16px;
}

/* Hero Banner */
.hero-banner {
  position: relative;
  background: url('@/assets/Background/bannerdashboard.jpg') no-repeat center center;
  background-size: cover;
  padding: 24px 32px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
.hero-banner::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(24, 24, 50, 0.9) 0%, rgba(30, 58, 138, 0.85) 100%);
  z-index: 1;
}
.hero-overlay-content {
  position: relative;
  z-index: 2;
  text-align: left;
  width: 100%;
}
.hero-overlay-content h1 {
  margin: 0 0 4px 0;
  font-size: 1.6rem;
  color: white;
  font-weight: 700;
}
.hero-overlay-content p {
  margin: 0;
  font-size: 0.85rem;
  color: #cbd5e1;
}

/* Table Panel */
.table-panel {
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 20px;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.panel-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}
.btn-create {
  background: #2b6cb0;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: 0.2s;
}
.btn-create:hover {
  background: #235a97;
}

/* Data Table */
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th {
  text-align: left;
  font-weight: 700;
  font-size: 0.75rem;
  color: #64748b;
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  text-transform: uppercase;
}
.data-table td {
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.85rem;
  vertical-align: middle;
}
.font-bold {
  font-weight: 600;
  color: #0f172a;
}
.muted {
  color: #475569;
}
.member-badge {
  background-color: #e0e7ff;
  color: #3730a3;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.8rem;
}
.no-data-cell {
  text-align: center;
  color: #94a3b8;
  font-style: italic;
  padding: 30px !important;
}
.loading-state {
  text-align: center;
  padding: 40px;
  color: #64748b;
}

/* Action Buttons Grid */
.action-buttons {
  display: flex;
  gap: 8px;
}
.btn-action {
  background: #f1f5f9;
  color: #2b6cb0;
  border: 1px solid #cbd5e1;
  padding: 6px 14px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-action:hover {
  background: #e2e8f0;
  color: #1e40af;
}
.edit-btn {
  background: #fef08a;
  color: #854d0e;
  border-color: #fde047;
}
.edit-btn:hover {
  background: #fde047;
}
.delete-btn {
  background: #fee2e2;
  color: #991b1b;
  border-color: #fca5a5;
}
.delete-btn:hover {
  background: #fca5a5;
}

/* Base Modal Overlays */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 99999;
  backdrop-filter: blur(2px);
}
.modal-content {
  background: #ffffff;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 550px;
  max-height: 90vh;
  overflow-y: auto;
}

/* Standard Header for forms/details */
.modal-header-simple {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}
.btn-close {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}
.btn-close:hover {
  color: #0f172a;
}

/* Details Modal Specific Styles */
.details-card {
  max-width: 480px;
}
.details-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}
.detail-row {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 0.95rem;
}
.detail-label {
  color: #64748b;
  font-weight: 500;
  min-width: 110px;
}
.detail-value {
  color: #1e293b;
}
.fw-bold {
  font-weight: 700;
}

.members-section {
  margin-top: 12px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}
.members-header-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.members-header-title h3 {
  margin: 0;
  font-size: 1rem;
  color: #334155;
  font-weight: 600;
}
.members-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.members-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #475569;
  background: #f8fafc;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #f1f5f9;
}
.bullet-point {
  width: 6px;
  height: 6px;
  background-color: #2b6cb0;
  border-radius: 50%;
}

/* Form Fields */
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  color: #475569;
}
.form-control {
  width: 100%;
  padding: 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.95rem;
  color: #0f172a;
  outline: none;
  transition: border-color 0.2s;
}
.form-control:focus {
  border-color: #2b6cb0;
}
.form-control:disabled {
  background-color: #f1f5f9;
  cursor: not-allowed;
}

/* Filters inside Form */
.members-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.members-header label {
  margin-bottom: 0;
}
.filter-controls {
  display: flex;
  gap: 8px;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
}
.filter-radio {
  display: flex !important;
  align-items: center;
  gap: 4px;
  margin-bottom: 0 !important;
  font-weight: 500 !important;
  color: #475569 !important;
  cursor: pointer;
}
.filter-radio input {
  cursor: pointer;
}

/* Checkboxes */
.checkbox-group {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 10px;
  max-height: 180px;
  overflow-y: auto;
  background-color: #ffffff;
}
.checkbox-group.disabled-group {
  background-color: #f1f5f9;
  cursor: not-allowed;
}
.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 10px;
  padding: 8px 6px;
  margin-bottom: 2px !important;
  font-size: 0.9rem;
  font-weight: 400 !important;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}
.checkbox-label:hover:not(.is-disabled) {
  background-color: #f8fafc;
}
.checkbox-label.is-disabled {
  color: #94a3b8;
  cursor: not-allowed;
}
.checkbox-label input[type='checkbox'] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}
.checkbox-label.is-disabled input[type='checkbox'] {
  cursor: not-allowed;
}
.badge-assigned {
  margin-left: auto;
  background-color: #e2e8f0;
  color: #475569;
  font-size: 0.65rem;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
  text-transform: uppercase;
}
.badge-current {
  background-color: #dcfce7;
  color: #166534;
}
.no-data {
  color: #64748b;
  font-size: 0.85rem;
  font-style: italic;
  text-align: center;
  padding: 15px 0;
}
.help-text {
  display: block;
  margin-top: 5px;
  font-size: 0.8rem;
  color: #64748b;
}

/* Form Actions */
.form-actions {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.btn-cancel {
  background-color: #f1f5f9;
  color: #475569;
  padding: 10px 18px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}
.btn-cancel:hover {
  background-color: #e2e8f0;
}
.btn-submit {
  background-color: #2b6cb0;
  color: #fff;
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}
.btn-submit:hover:not(:disabled) {
  background-color: #235a97;
}
.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.gap-actions {
  gap: 12px;
}

/* CONFIRMATION / VERIFICATION MODAL DESIGN */
.confirm-modal {
  background: white;
  width: 100%;
  max-width: 500px;
  border-radius: 8px;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #f1f5f9;
}
.modal-header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e1b4b;
}
.header-icon {
  color: #1e1b4b;
}
.modal-body {
  padding: 24px;
  background: #f8fafc;
  display: flex;
  align-items: flex-start;
  gap: 20px;
}
.modal-icon-box {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
.modal-text-content h3 {
  margin: 0 0 8px 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
}
.modal-text-content p {
  margin: 0;
  font-size: 0.9rem;
  color: #475569;
  line-height: 1.5;
}
.modal-footer {
  padding: 16px 24px;
  background: white;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid #e2e8f0;
}
.btn-verify {
  background: #1e1b4b;
  border: none;
  color: white;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-verify:hover {
  background: #312e81;
}
.btn-danger {
  background: #dc2626;
  color: white;
  border: none;
  padding: 8px 24px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-danger:hover {
  background: #b91c1c;
}

/* CUSTOM VALIDATION ALERT MODAL (The Info Alert) */
.validation-card {
  background: white;
  border: 1px solid #93c5fd;
  border-radius: 6px;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}
.validation-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
}
.validation-icon {
  color: #3b82f6;
}
.validation-header h3 {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}
.validation-body {
  padding: 24px 16px;
  border-bottom: 1px solid #f1f5f9;
}
.validation-body p {
  font-size: 0.9rem;
  color: #475569;
  margin: 0;
  line-height: 1.5;
}
.validation-footer {
  padding: 12px 16px;
  display: flex;
  justify-content: flex-end;
  background: #ffffff;
}
.btn-ok {
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 24px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-ok:hover {
  background: #1d4ed8;
}
</style>
