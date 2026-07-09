<template>
  <div class="dashboard-root">
    <BranchSidebar />
    <main class="content">
      <h1>Branch Settings</h1>

      <!-- Profile Management -->
      <section class="card">
        <h3>Profile Settings</h3>
        <p>Branch users can update their profile and password here.</p>
      </section>

      <!-- Integrated Management Components (reuse existing components) -->
      <UserManagement />
      <AuditLog />
    </main>
  </div>
</template>

<script setup>
import BranchSidebar from '@/components/BranchSidebar.vue'
import AuditLog from '@/pages/Settings/AuditLog.vue'
</script>

<style scoped>
.dashboard-root {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
}
.content {
  flex-grow: 1;
  padding: 40px;
}
.card {
  background: #fff;
  padding: 25px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  margin-bottom: 20px;
}
</style>
