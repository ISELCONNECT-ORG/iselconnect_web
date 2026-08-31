<!-- src/pages/branch/BranchLinemanMonitoring.vue -->
<template>
  <div class="dashboard-root">
    <BranchSidebar />

    <main class="content">
      <BranchTopbar />

      <header class="hero-banner">
        <div class="hero-overlay-content">
          <h1>LINEMAN MONITORING</h1>
          <p>Comprehensive profile management for the {{ branchName }} field engineering team.</p>
        </div>
      </header>

      <div class="stats-card-container">
        <div class="stat-item">
          <span class="label">TOTAL LINEMAN</span>
          <h2>{{ stats.total }}</h2>
        </div>
        <div class="divider"></div>
        <div class="stat-item">
          <span class="label">ON ROUTE</span>
          <h2>{{ stats.onRoute }}</h2>
        </div>
        <div class="divider"></div>
        <div class="stat-item">
          <span class="label">READY</span>
          <h2>{{ stats.ready }}</h2>
        </div>
      </div>

      <div class="table-panel">
        <div class="panel-header">
          <div class="tabs">
            <button :class="{ active: activeTab === 'ALL' }" @click="activeTab = 'ALL'">ALL</button>
            <button :class="{ active: activeTab === 'ACTIVE' }" @click="activeTab = 'ACTIVE'">
              ACTIVE
            </button>
            <button :class="{ active: activeTab === 'INACTIVE' }" @click="activeTab = 'INACTIVE'">
              INACTIVE
            </button>
          </div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>NAME</th>
              <th>BRANCH</th>
              <th>EMPLOYEE ID</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="lineman in filteredLinemen" :key="lineman.id">
              <td class="font-bold">
                {{ lineman.users?.first_name }} {{ lineman.users?.last_name }}
              </td>
              <td class="muted">
                {{ lineman.users?.iselco_branch?.branch_name || branchName }}
              </td>
              <td class="muted">{{ lineman.employee_id_no }}</td>
              <td>
                <router-link :to="`/branch/lineman/${lineman.id}`" class="btn-view-profile">
                  View Profile
                </router-link>
              </td>
            </tr>
            <tr v-if="filteredLinemen.length === 0">
              <td colspan="4" style="text-align: center; padding: 24px; color: #64748b">
                No linemen found matching the current filters.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { supabase } from '@/services/supabase'
import BranchSidebar from '@/components/BranchSidebar.vue'
import BranchTopbar from '@/components/BranchTopbar.vue'

const linemen = ref([])
const branchName = ref('Branch')
const branchId = ref(null)
const stats = reactive({ total: 0, onRoute: 0, ready: 0 })

// Filter States
const activeTab = ref('ALL')

const fetchAllData = async () => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) return

  const { data: userData, error: branchError } = await supabase
    .from('users')
    .select('branch_id, iselco_branch(branch_name)')
    .eq('id', user.id)
    .single()

  if (branchError) {
    console.error('Error loading branch data:', branchError)
    return
  }

  branchId.value = userData?.branch_id ?? null
  branchName.value = userData?.iselco_branch?.branch_name || 'Branch'

  if (!branchId.value) return

  const { data } = await supabase
    .from('employees')
    .select(
      `id, user_id, employee_id_no, is_available, users!inner(first_name, last_name, role_id, branch_id, iselco_branch(branch_name))`,
    )
    .eq('users.role_id', 9)
    .eq('users.branch_id', branchId.value)

  linemen.value = data || []

  const { count: total } = await supabase
    .from('employees')
    .select('*, users!inner(role_id, branch_id)', { count: 'exact', head: true })
    .eq('users.role_id', 9)
    .eq('users.branch_id', branchId.value)

  const { count: ready } = await supabase
    .from('employees')
    .select('*, users!inner(role_id, branch_id)', { count: 'exact', head: true })
    .eq('users.role_id', 9)
    .eq('users.branch_id', branchId.value)
    .eq('is_available', true)

  const { count: route } = await supabase
    .from('assignments')
    .select('*', { count: 'exact', head: true })
    .is('arrival_at', null)
    .in(
      'report_id',
      (await supabase.from('reports').select('id').eq('branch_id', branchId.value)).data?.map(
        (report) => report.id,
      ) || [],
    )

  stats.total = total || 0
  stats.ready = ready || 0
  stats.onRoute = route || 0
}

// Filter Logic
const filteredLinemen = computed(() => {
  return linemen.value.filter((lineman) => {
    const isReady = lineman.is_available === true
    const isInactive = lineman.is_available === false

    return (
      activeTab.value === 'ALL' ||
      (activeTab.value === 'ACTIVE' && isReady) ||
      (activeTab.value === 'INACTIVE' && isInactive)
    )
  })
})

onMounted(fetchAllData)
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

.hero-banner {
  position: relative;
  background: url('@/assets/Background/bannerdashboard.jpg') no-repeat center center;
  background-size: cover;
  padding: 24px 32px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
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

.stats-card-container {
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  display: flex;
  align-items: center;
  padding: 20px 24px;
  margin-bottom: 24px;
}

.divider {
  width: 1px;
  height: 40px;
  background: #e2e8f0;
  margin: 0 32px;
}
.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.stat-item .label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #475569;
  margin-bottom: 4px;
}
.stat-item h2 {
  font-size: 2rem;
  font-weight: 800;
  color: #1e1b4b;
  margin: 0;
}

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
.tabs {
  display: flex;
  background: #f1f5f9;
  border-radius: 6px;
  padding: 4px;
}
.tabs button {
  background: transparent;
  border: none;
  padding: 6px 16px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}
.tabs button.active {
  background: #1e1b4b;
  color: white;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th {
  text-align: left;
  font-weight: 700;
  font-size: 0.7rem;
  color: #64748b;
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
}
.data-table td {
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.85rem;
}
.font-bold {
  font-weight: 600;
  color: #0f172a;
}
.muted {
  color: #475569;
}

.btn-view-profile {
  background: #283593;
  color: white;
  padding: 6px 16px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  text-decoration: none;
  transition: background 0.2s;
}
.btn-view-profile:hover {
  background: #1e1b4b;
}
</style>
