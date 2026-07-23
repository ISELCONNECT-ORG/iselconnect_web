<template>
  <div class="dashboard-root">
    <BranchSidebar />
    <main class="content">
      <Topbar />
      <div class="page-header">
        <h1>{{ branchName }} Analytics</h1>
        <p>Branch-only service performance and outage analytics.</p>
      </div>
      <div class="analytics-wrapper">
        <IncidentChart :branch-id="branchId" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import IncidentChart from '@/components/analytics/IncidentChart.vue'
import BranchSidebar from '@/components/BranchSidebar.vue'
import Topbar from '@/components/BranchTopbar.vue'

const branchName = ref('Branch')
const branchId = ref(null)

const fetchBranchInfo = async () => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Unable to get branch user for analytics:', userError)
    return
  }

  const { data, error } = await supabase
    .from('users')
    .select('branch_id, iselco_branch(branch_name)')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error loading branch analytics data:', error)
    return
  }

  branchId.value = data?.branch_id || null
  branchName.value = data?.iselco_branch?.branch_name || 'Branch'
}

onMounted(fetchBranchInfo)
</script>

<style scoped>
.dashboard-root {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
  font-family: sans-serif;
}
.content {
  flex-grow: 1;
  padding: 40px;
}
.analytics-wrapper {
  background: white;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #ddd;
}
</style>
