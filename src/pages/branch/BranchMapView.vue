<template>
  <div class="dashboard-shell">
    <BranchSidebar />
    <div class="main-area">
      <Topbar />
      <main class="content-area">
        <div class="map-stage">
          <IncidentMap :reports="reports" :filter="currentFilter" />

          <div class="overlay-stack">
            <div class="glass-card legend-card">
              <h4>LEGEND</h4>
              <div class="legend-row">
                <span class="legend-dot resolved"></span>
                <span class="legend-label">Resolved</span>
              </div>
              <div class="legend-row">
                <span class="legend-dot pending"></span>
                <span class="legend-label">Pending</span>
              </div>
              <div class="legend-row">
                <span class="legend-dot inprogress"></span>
                <span class="legend-label">In Progress</span>
              </div>
            </div>

            <div class="glass-card ops-card">
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

            <div class="glass-card reports-card">
              <div class="list-header">
                <span>REPORT</span>
                <span>STATUS</span>
              </div>

              <div class="reports-list">
                <div v-for="r in filteredReports" :key="r.id" class="report-item">
                  <div class="report-info">
                    <strong>{{ r.landmark }}</strong>
                  </div>
                  <span :class="['badge', r.statusClass]">{{ r.statusLabel }}</span>
                </div>
              </div>
            </div>
          </div>
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
import Topbar from '@/components/BranchTopbar.vue'

const branchId = ref(null)
const stats = ref({ resolved: 0, pending: 0, inProgress: 0 })
const reports = ref([])
const currentFilter = ref('all')

const fetchBranchInfo = async () => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Unable to get branch user for map view:', userError)
    return
  }

  const { data, error } = await supabase
    .from('users')
    .select('branch_id')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error loading branch map data:', error)
    return
  }

  branchId.value = data?.branch_id || null

  if (!branchId.value) return

  const { data: branchReports = [] } = await supabase
    .from('reports')
    .select('*')
    .eq('branch_id', branchId.value)
    .order('created_at', { ascending: false })

  stats.value = {
    pending: branchReports.filter((r) => r.status_id === 1).length,
    inProgress: branchReports.filter((r) => r.status_id === 2).length,
    resolved: branchReports.filter((r) => r.status_id === 3).length,
  }

  reports.value = branchReports.map((r) => ({
    ...r,
    statusLabel: r.status_id === 3 ? 'RESOLVED' : r.status_id === 2 ? 'IN PROGRESS' : 'PENDING',
    statusClass: r.status_id === 3 ? 'blue' : r.status_id === 2 ? 'orange' : 'red',
  }))
}

onMounted(fetchBranchInfo)

const filteredReports = computed(() => {
  if (currentFilter.value === 'all') return reports.value
  return reports.value.filter((r) => r.statusLabel === currentFilter.value)
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
.dashboard-shell {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #ffffff;
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 0 16px 16px;
  gap: 16px;
}

.content-area {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

:deep(.topbar-container) {
  margin-bottom: 0;
}

.page-header {
  margin-bottom: 18px;
}

.page-header h1 {
  margin: 0;
  font-size: 1.75rem;
  color: #0f172a;
}

.page-header p {
  margin: 8px 0 0;
  color: #475569;
}

.map-stage {
  position: relative;
  width: 100%;
  height: calc(100vh - 96px);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.12);
  background: #0f172a;
}

.map-stage .map-wrapper,
.map-stage #map,
.map-stage .map-component {
  width: 100%;
  height: 100%;
}

.overlay-stack {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 500;
}

.glass-card {
  background: rgba(71, 116, 174, 0.26);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 14px 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(53, 47, 130, 0.524);
}

.glass-card h3,
.glass-card h4 {
  margin: 0 0 8px;
  font-size: 0.85rem;
  color: #ffffff;
  letter-spacing: 0.3px;
}

.legend-card {
  padding-top: 10px;
  padding-bottom: 12px;
}

.legend-card h4 {
  font-size: 0.78rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.92);
}

.legend-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.legend-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
}

.legend-dot.resolved {
  background: #22c55e;
}

.legend-dot.pending {
  background: #eab308;
}

.legend-dot.inprogress {
  background: #3b82f6;
}

.legend-label {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.9);
}

.health-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.health-card .health-val {
  font-size: 2rem;
  font-weight: 800;
  color: #ffffff;
}

.health-card .progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  overflow: hidden;
}

.health-card .fill {
  height: 100%;
  background: #fbbf24;
  transition: width 0.4s ease;
}

.ops-card .stats-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.stat-box {
  flex: 1;
  text-align: center;
  background: rgba(68, 112, 213, 0.32);
  border-radius: 10px;
  padding: 8px 6px;
}

.stat-box span {
  display: block;
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.78);
  font-weight: 600;
}

.stat-box p {
  margin: 6px 0 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: #ffffff;
}

.filter-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.filter-bar button {
  padding: 7px 6px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  font-size: 0.7rem;
  font-weight: 700;
  cursor: pointer;
  color: #0f172a;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
}

.filter-bar button:hover {
  background: #e5edf5;
}

.filter-bar button.active {
  background: #2563eb;
  color: #ffffff;
  border-color: #2563eb;
}

.reports-card {
  padding-top: 12px;
  padding-bottom: 12px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 6px;
}

.reports-list {
  max-height: 220px;
  overflow-y: auto;
  padding-right: 3px;
}

.reports-list::-webkit-scrollbar {
  width: 6px;
}

.reports-list::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 999px;
}

.report-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 6px;
  border-radius: 8px;
  margin-bottom: 4px;
  background: rgba(48, 60, 87, 0.32);
}

.report-info strong {
  color: #ffffff;
  font-size: 0.86rem;
}

.badge {
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 0.62rem;
  font-weight: 800;
}

.blue {
  background: #dbeafe;
  color: #1d4ed8;
}

.red {
  background: #fee2e2;
  color: #b91c1c;
}

.orange {
  background: #fef3c7;
  color: #92400e;
}
</style>
