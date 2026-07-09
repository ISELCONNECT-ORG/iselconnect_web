<template>
  <div class="dashboard-root">
    <Sidebar />

    <main class="content">
      <Topbar />

      <!-- HEADER BAR: #1f3056 background, white text -->
      <header class="header">
        <div class="header-text">
          <h1>Workforce Directory</h1>
          <p>Comprehensive profile management for the ISELCONNECT field engineering team.</p>
        </div>
        <button @click="showModal = true" class="btn-add">+ Add Lineman</button>
      </header>

      <!-- STATS: dashboard-style cards (TOTAL / ON ROUTE / READY) -->
      <section class="stats-container stats-grid">
        <div class="stat-card">
          <div class="card-header">
            <Users class="stat-icon" />
            <span class="trend-badge">All Linemen</span>
          </div>
          <h3>TOTAL</h3>
          <p class="stat-value">{{ stats.total }}</p>
        </div>

        <div class="stat-card">
          <div class="card-header">
            <Route class="stat-icon" />
            <span class="trend-badge">In Field</span>
          </div>
          <h3>ON ROUTE</h3>
          <p class="stat-value">{{ stats.onRoute }}</p>
        </div>

        <div class="stat-card">
          <div class="card-header">
            <CheckCircle2 class="stat-icon" />
            <span class="trend-badge">Available</span>
          </div>
          <h3>READY</h3>
          <p class="stat-value">{{ stats.ready }}</p>
        </div>
      </section>

      <!-- LINEMAN PROFILES -->
      <section class="directory-grid">
        <div v-for="lineman in linemen" :key="lineman.id" class="lineman-card">
          <h4>{{ lineman.users?.first_name }} {{ lineman.users?.last_name }}</h4>
          <p class="emp-id">ID: {{ lineman.employee_id_no }}</p>
          <p class="status" :class="lineman.is_available ? 'ready-status' : 'route-status'">
            {{ lineman.is_available ? 'Ready' : 'On Route' }}
          </p>

          <router-link :to="`/admin/lineman/${lineman.id}`" class="btn-primary">
            View Profile
          </router-link>
        </div>
      </section>

      <!-- Add Lineman glass-effect modal -->
      <AddLinemanModal v-if="showModal" @close="showModal = false" @refresh="fetchAllData" />
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'
import AddLinemanModal from '@/components/account/AddLinemanModal.vue'

import { Users, Route, CheckCircle2 } from 'lucide-vue-next' // or '@lucide/vue' [web:218][web:245]

const linemen = ref([])
const showModal = ref(false)

// stats: total, onRoute, ready (no active)
const stats = reactive({ total: 0, onRoute: 0, ready: 0 })

const fetchAllData = async () => {
  const { data } = await supabase
    .from('employees')
    .select(
      `id, user_id, employee_id_no, is_available, users!inner(first_name, last_name, role_id)`,
    )
    .eq('users.role_id', 9)

  linemen.value = data || []

  const { count: total } = await supabase
    .from('employees')
    .select('*, users!inner(role_id)', { count: 'exact', head: true })
    .eq('users.role_id', 9)

  const { count: ready } = await supabase
    .from('employees')
    .select('*, users!inner(role_id)', { count: 'exact', head: true })
    .eq('users.role_id', 9)
    .eq('is_available', true)

  const { count: route } = await supabase
    .from('assignments')
    .select('*', { count: 'exact', head: true })
    .is('arrival_at', null)

  stats.total = total || 0
  stats.ready = ready || 0
  stats.onRoute = route || 0
}

onMounted(fetchAllData)
</script>

<style scoped>
/* White background and subtle overall shadow */
.dashboard-root {
  display: flex;
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Inter',
    sans-serif;
  background: #ffffff;
  min-height: 100vh;
  color: #0f172a;
}

.content {
  flex-grow: 1;
  padding: 16px 24px 24px;
}

/* Header: dark blue background, white text */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;

  padding: 18px 22px;
  border-radius: 16px;
  background: #1f3056;
  border: none;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
}

/* Explicit white text for header */
.header .header-text h1 {
  margin: 0 0 6px;
  font-size: 1.6rem;
  color: #ffffff !important;
}

.header .header-text p {
  margin: 0;
  font-size: 0.9rem;
  color: #ffffff !important;
}

/* Stats row – dashboard-style cards */
.stats-container.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 12px 14px;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 6px 18px rgba(148, 163, 184, 0.25);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.stat-icon {
  width: 20px;
  height: 20px;
  color: #0f172a;
}

.trend-badge {
  font-size: 0.7rem;
  padding: 4px 8px;
  border-radius: 999px;
  background: #e0f2fe;
  color: #1d4ed8;
  font-weight: 600;
}

.stat-card h3 {
  margin: 0 0 4px;
  font-size: 0.9rem;
  color: #0f172a;
}

.stat-value {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
}

/* Profile cards – white, minimal shadow */
.directory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.lineman-card {
  padding: 18px 20px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  text-align: center;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
}

.lineman-card h4 {
  margin: 0 0 4px;
  font-size: 1rem;
  color: #0f172a;
}

.emp-id {
  margin: 0 0 4px;
  font-size: 0.8rem;
  color: #64748b;
}

.status {
  margin: 0 0 10px;
  font-size: 0.8rem;
}

/* Buttons */
.btn-add {
  background: #ffffff;
  color: #1f3056;
  padding: 10px 20px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  border: 1px solid #cbd5e1;
  box-shadow: 0 3px 8px rgba(15, 23, 42, 0.12);
}

.btn-add:hover {
  background: #f8fafc;
}

.btn-primary {
  display: inline-block;
  background: #1f3056;
  color: #ffffff;
  padding: 8px 16px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  border: none;
  box-shadow: 0 3px 8px rgba(15, 23, 42, 0.18);
}

/* Status colors: Ready / On Route */
.ready-status {
  color: #22c55e;
  font-weight: 700;
}

.route-status {
  color: #f97316;
  font-weight: 700;
}
</style>
