<template>
  <div class="dashboard-root">
    <aside class="sidebar">
      <div class="logo">ISELCONNECT</div>
      <nav>
        <router-link to="/admin/dashboard">DASHBOARD</router-link>
        <router-link to="/admin/analytics" class="active">ANALYTICS</router-link>
        <router-link to="/admin/incident">INCIDENT</router-link>
        <router-link to="/admin/map">MAP VIEW</router-link>
        <router-link to="/admin/advisory">POWER ADVISORY</router-link>
      </nav>
      <button @click="logout" class="logout-btn">LOG OUT</button>
    </aside>

    <main class="content">
      <h1>SYSTEM ANALYTICS</h1>
      <div class="analytics-wrapper">
        <IncidentChart />
      </div>
    </main>
  </div>
</template>

<script setup>
import IncidentChart from '@/components/analytics/IncidentChart.vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/services/supabase'
const router = useRouter()
const logout = async () => {
  await supabase.auth.signOut()
  router.push('/admin/login')
}
</script>

<style scoped>
.dashboard-root {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
  font-family: sans-serif;
}
.sidebar {
  width: 280px;
  background: #1e3a8a;
  color: white;
  padding: 20px;
}
.content {
  flex-grow: 1;
  padding: 30px;
}
.analytics-wrapper {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #ddd;
}
</style>
