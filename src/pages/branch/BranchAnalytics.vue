<template>
  <div class="dashboard-root">
    <BranchSidebar />
    <main class="content">
      <h1>Branch Analytics</h1>
      <div class="analytics-wrapper">
        <IncidentChart />
      </div>
    </main>
  </div>
</template>

<script setup>
import IncidentChart from '@/components/analytics/IncidentChart.vue'
import BranchSidebar from '@/components/BranchSidebar.vue'
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
