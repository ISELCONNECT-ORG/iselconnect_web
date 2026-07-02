<template>
  <div class="dashboard-root">
    <BranchSidebar />
    <main class="content">
      <header class="header">
        <div>
          <h1>{{ branchName }} Workforce Directory</h1>
          <p>Comprehensive profile management for the {{ branchName }} field engineering team.</p>
        </div>
        <button @click="showModal = true" class="btn-add">+ Add Lineman</button>
      </header>

      <section class="stats-container">
        <div v-for="(value, key) in stats" :key="key" class="stat-card">
          <h3>{{ value }}</h3>
          <p>{{ key.toUpperCase() }}</p>
        </div>
      </section>

      <section class="directory-grid">
        <div v-for="lineman in linemen" :key="lineman.id" class="lineman-card">
          <div class="avatar-placeholder"></div>
          <h4>{{ lineman.users?.first_name }} {{ lineman.users?.last_name }}</h4>
          <p>ID: {{ lineman.employee_id_no }}</p>
          <p class="status" :class="lineman.is_available ? 'active' : 'deployed'">
            {{ lineman.is_available ? 'Available' : 'Deployed' }}
          </p>

          <router-link :to="`/branch/lineman/${lineman.id}`" class="btn-primary">
            View Profile
          </router-link>
        </div>
      </section>

      <AddLinemanModal v-if="showModal" @close="showModal = false" @refresh="fetchAllData" />
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import BranchSidebar from '@/components/BranchSidebar.vue'
import AddLinemanModal from '@/components/account/AddLinemanModal.vue'

const linemen = ref([])
const showModal = ref(false)
const branchName = ref('Branch')
const branchId = ref(null)
const stats = reactive({ total: 0, active: 0, onRoute: 0, ready: 0 })

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

  const { data, error } = await supabase
    .from('employees')
    .select(
      `id, user_id, employee_id_no, is_available, users!inner(first_name, last_name, role_id, branch_id)`,
    )
    .eq('users.role_id', 9)
    .eq('users.branch_id', branchId.value)

  if (!error) {
    linemen.value = data || []
  }

  const { count: total } = await supabase
    .from('employees')
    .select('*, users!inner(role_id, branch_id)', { count: 'exact', head: true })
    .eq('users.role_id', 9)
    .eq('users.branch_id', branchId.value)

  const { count: active } = await supabase
    .from('employees')
    .select('*, users!inner(role_id, branch_id)', { count: 'exact', head: true })
    .eq('users.role_id', 9)
    .eq('users.branch_id', branchId.value)
    .eq('is_available', false)

  const { count: ready } = await supabase
    .from('employees')
    .select('*, users!inner(role_id, branch_id)', { count: 'exact', head: true })
    .eq('users.role_id', 9)
    .eq('users.branch_id', branchId.value)
    .eq('is_available', true)

  const { count: onRoute } = await supabase
    .from('assignments')
    .select('*', { count: 'exact', head: true })
    .in(
      'report_id',
      (await supabase.from('reports').select('id').eq('branch_id', branchId.value)).data?.map(
        (report) => report.id,
      ) || [],
    )

  stats.total = total || 0
  stats.active = active || 0
  stats.ready = ready || 0
  stats.onRoute = onRoute || 0
}

onMounted(fetchAllData)
</script>

<style scoped>
.dashboard-root {
  display: flex;
  font-family: sans-serif;
  background: #ffffff;
  min-height: 100vh;
  color: #000;
}
.content {
  flex-grow: 1;
  padding: 30px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}
.stats-container {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}
.stat-card {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  flex: 1;
  border: 1px solid #ddd;
  text-align: center;
}
.directory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}
.lineman-card {
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #ddd;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.btn-add {
  background: #2563eb;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
.btn-primary {
  background: #000;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.active {
  color: #006400;
  font-weight: bold;
}
.deployed {
  color: #cc5500;
  font-weight: bold;
}
</style>
