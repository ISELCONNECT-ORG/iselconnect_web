<template>
  <div class="dashboard-wrapper">
    <BranchSidebar />
    <div class="main-container">
      <Topbar />
      <main class="content-area">
        <div class="layout-grid">
          <section class="map-wrapper">
            <IncidentMap :reports="reports" :filter="currentFilter" />
          </section>

          <aside class="sidebar-panels">
            <div class="glass-card">
              <h3>GRID HEALTH</h3>
              <div class="health-val">{{ gridHealth }}%</div>
              <div class="progress-bar">
                <div class="fill" :style="{ width: gridHealth + '%' }"></div>
              </div>
            </div>

            <div class="glass-card">
              <h3>GRID OPERATIONS STATUS</h3>
              <div class="stats-row">
                <div class="stat-box">
                  <span>RESOLVED</span>
                  <p>{{ stats?.resolved || 0 }}</p>
                </div>
                <div class="stat-box">
                  <span>PENDING</span>
                  <p>{{ stats?.pending || 0 }}</p>
                </div>
                <div class="stat-box">
                  <span>IN PROGRESS</span>
                  <p>{{ stats?.inProgress || 0 }}</p>
                </div>
              </div>
            </div>

            <div class="filter-bar">
              <button @click="currentFilter = 'all'" :class="{ active: currentFilter === 'all' }">
                All
              </button>
              <button
                @click="currentFilter = 'RESOLVED'"
                :class="{ active: currentFilter === 'RESOLVED' }"
              >
                Resolved
              </button>
              <button
                @click="currentFilter = 'IN PROGRESS'"
                :class="{ active: currentFilter === 'IN PROGRESS' }"
              >
                In Progress
              </button>
              <button
                @click="currentFilter = 'PENDING'"
                :class="{ active: currentFilter === 'PENDING' }"
              >
                Pending
              </button>
            </div>

            <div class="glass-card reports-list">
              <div class="list-header"><span>REPORT</span><span>STATUS</span></div>
              <div v-for="r in filteredReports" :key="r.id" class="report-item">
                <div class="report-info">
                  <strong>{{ r.landmark }}</strong>
                </div>
                <span :class="['badge', r.statusClass]">{{ r.statusLabel }}</span>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/services/supabase'
import IncidentMap from '@/components/map/IncidentMap.vue'
import BranchSidebar from '@/components/BranchSidebar.vue'
import Topbar from '@/components/Topbar.vue'

const stats = ref({ resolved: 0, pending: 0, inProgress: 0 })
const reports = ref([])
const currentFilter = ref('all')

onMounted(async () => {
  const { data: all } = await supabase.from('reports').select('*')

  stats.value = {
    pending: all.filter((r) => r.status_id === 1).length,
    inProgress: all.filter((r) => r.status_id === 2).length,
    resolved: all.filter((r) => r.status_id === 3).length,
  }

  reports.value = all.map((r) => ({
    ...r,
    statusLabel: r.status_id === 3 ? 'RESOLVED' : r.status_id === 2 ? 'IN PROGRESS' : 'PENDING',
    statusClass: r.status_id === 3 ? 'blue' : r.status_id === 2 ? 'orange' : 'red',
  }))
})

const filteredReports = computed(() => {
  if (currentFilter.value === 'all') return reports.value
  return reports.value.filter((r) => r.statusLabel === currentFilter.value)
})

const gridHealth = computed(() => {
  const total = stats.value.resolved + stats.value.pending + stats.value.inProgress
  return total === 0 ? 0 : ((stats.value.resolved / total) * 100).toFixed(1)
})
</script>

<style scoped>
.dashboard-wrapper {
  display: flex;
  width: 100vw;
  height: 100vh;
  background: #f8fafc;
  color: #000;
  overflow: hidden;
}
.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.content-area {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}
.layout-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 20px;
  align-items: start;
  height: calc(100vh - 100px);
}
.map-wrapper {
  background: #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  height: 100%;
}
.sidebar-panels {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 360px;
}
.glass-card {
  background: #ffffff;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
.reports-list {
  max-height: 400px;
  overflow-y: auto;
}
.filter-bar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.filter-bar button {
  flex: 1;
  padding: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.7rem;
  font-weight: bold;
}
.filter-bar button.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}
.stats-row {
  display: flex;
  justify-content: space-between;
  text-align: center;
  margin-top: 15px;
}
.stat-box span {
  font-size: 0.6rem;
  color: #64748b;
}
.stat-box p {
  font-size: 1.2rem;
  font-weight: bold;
  margin: 5px 0 0 0;
}
</style>
