<template>
  <div class="dashboard-wrapper">
    <Sidebar />
    <div class="main-container">
      <Topbar />
      <main class="content-area">
        <div class="layout-grid">
          <section class="map-wrapper">
            <IncidentMap />
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
              <div class="card-header">
                <h3>GRID OPERATIONS STATUS</h3>
              </div>
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

            <div class="glass-card reports-list">
              <div class="list-header"><span>REPORT</span><span>STATUS</span></div>
              <div v-for="r in reports" :key="r.id" class="report-item">
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

// Ensure these paths match your folder structure exactly
import IncidentMap from '@/components/map/IncidentMap.vue'
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'

const stats = ref({ resolved: 0, pending: 0, inProgress: 0 })
const reports = ref([])

onMounted(async () => {
  const { data: all, error } = await supabase.from('reports').select('id, landmark, status_id')

  if (error) {
    console.error('Error fetching reports:', error)
    return
  }

  // Calculate Stats
  stats.value = {
    pending: all.filter((r) => r.status_id === 1).length,
    inProgress: all.filter((r) => r.status_id === 2).length,
    resolved: all.filter((r) => r.status_id === 3).length,
  }

  // Format Reports List
  reports.value = all.slice(0, 6).map((r) => ({
    ...r,
    statusLabel: r.status_id === 3 ? 'RESOLVED' : r.status_id === 2 ? 'IN PROGRESS' : 'PENDING',
    statusClass: r.status_id === 3 ? 'blue' : r.status_id === 2 ? 'orange' : 'red',
  }))
})

// Dynamic Grid Health Calculation
const gridHealth = computed(() => {
  const total = stats.value.resolved + stats.value.pending + stats.value.inProgress
  if (total === 0) return 0
  return ((stats.value.resolved / total) * 100).toFixed(1)
})
</script>

<style scoped>
/* 1. LAYOUT & GRID */
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

/* 2. MAP & SIDEBAR */
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

/* 3. CARDS */
.glass-card {
  background: #ffffff;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 4. DATA DISPLAY */
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
.report-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
}
.badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.65rem;
  font-weight: bold;
}
.blue {
  background: #dcfce7;
  color: #166534;
}
.red {
  background: #fef3c7;
  color: #92400e;
}
.orange {
  background: #dbeafe;
  color: #1e40af;
}
.progress-bar {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  margin-top: 8px;
}
.fill {
  height: 100%;
  background: #3b82f6;
  border-radius: 3px;
  transition: width 0.3s ease;
}
</style>
