<!-- src/pages/admin/MapView.vue -->
<template>
  <div class="dashboard-shell">
    <Sidebar />

    <div class="main-area">
      <Topbar />

      <main class="content-area">
        <div class="map-stage">
          <!-- FULL MAP -->
          <IncidentMap
            :reports="reports"
            :filter="currentFilter"
            :mapMode="mapMode"
            :focusedReport="focusedReport"
          />

          <!-- FLOATING REPORT DETAILS CARD (Appears when a report is clicked) -->
          <div v-if="focusedReport" class="floating-detail-card">
            <div class="fd-header">
              <div class="fd-title-row">
                <span class="fd-title">{{
                  focusedReport.report_types?.name || 'General Incident'
                }}</span>
                <span :class="['badge', focusedReport.statusClass]">{{
                  focusedReport.statusLabel
                }}</span>
              </div>
              <button class="btn-close-fd" @click="focusedReport = null"><X :size="18" /></button>
            </div>
            <div class="fd-body">
              <div class="fd-row">
                <span class="fd-label">Date Submitted:</span>
                <span class="fd-val">{{ formatDateTime(focusedReport.created_at) }}</span>
              </div>
              <div class="fd-row">
                <span class="fd-label">Priority:</span>
                <span class="fd-val" style="font-weight: bold">
                  {{ focusedReport.priorityLevel || 'Normal' }}
                </span>
              </div>
              <div class="fd-row">
                <span class="fd-label">Reporter:</span>
                <span class="fd-val">
                  {{
                    focusedReport.users?.first_name
                      ? `${focusedReport.users.first_name} ${focusedReport.users.last_name}`
                      : 'Walk-in / Anonymous'
                  }}
                </span>
              </div>
              <div class="fd-row">
                <span class="fd-label">Location:</span>
                <span class="fd-val"
                  >{{ focusedReport.landmark }} ({{
                    focusedReport.barangays?.name || 'Unknown'
                  }})</span
                >
              </div>
              <div class="fd-row">
                <span class="fd-label">Description:</span>
                <span class="fd-val">{{
                  focusedReport.description || 'No additional details provided.'
                }}</span>
              </div>
            </div>
            <div class="fd-footer">
              <router-link :to="`/admin/reports/${focusedReport.id}`" class="btn-view-full">
                View Full Report
              </router-link>
            </div>
          </div>

          <!-- RIGHT OVERLAY PANEL STACK -->
          <div class="overlay-stack">
            <!-- VIEW MODE TOGGLE (Markers vs Heatmap) -->
            <div class="glass-card toggle-card">
              <div class="view-toggle">
                <button @click="mapMode = 'markers'" :class="{ active: mapMode === 'markers' }">
                  Markers
                </button>
                <button @click="mapMode = 'heatmap'" :class="{ active: mapMode === 'heatmap' }">
                  Heat Map
                </button>
              </div>
            </div>

            <!-- MARKERS LEGEND (PRIORITY BASED) -->
            <div class="glass-card legend-card" v-if="mapMode === 'markers'">
              <h4>PRIORITY LEGEND</h4>
              <div class="legend-row">
                <span class="legend-dot critical"></span>
                <span class="legend-label">Critical</span>
              </div>
              <div class="legend-row">
                <span class="legend-dot high"></span>
                <span class="legend-label">High</span>
              </div>
              <div class="legend-row">
                <span class="legend-dot normal"></span>
                <span class="legend-label">Normal</span>
              </div>
              <div class="legend-row">
                <span class="legend-dot low"></span>
                <span class="legend-label">Low</span>
              </div>
            </div>

            <!-- HEATMAP LEGEND -->
            <div class="glass-card legend-card" v-else-if="mapMode === 'heatmap'">
              <h4>INCIDENT DENSITY</h4>
              <div class="heatmap-gradient-bar"></div>
              <div class="heatmap-labels">
                <span>Low (1)</span>
                <span>High (4+)</span>
              </div>
            </div>

            <!-- GRID OPERATIONS STATUS -->
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

            <!-- FILTER BAR -->
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

            <!-- REPORTS LIST -->
            <div class="glass-card reports-card">
              <div class="list-header">
                <span>REPORT</span>
                <span>STATUS</span>
              </div>

              <div class="reports-list">
                <div
                  v-for="r in tableReports"
                  :key="r.id"
                  class="report-item clickable"
                  @click="focusOnReport(r)"
                >
                  <div class="report-info">
                    <strong>{{ r.landmark || 'Incident Report' }}</strong>
                  </div>
                  <span :class="['badge', r.statusClass]">
                    {{ r.statusLabel }}
                  </span>
                </div>
                <div v-if="tableReports.length === 0" class="empty-list-text">
                  No active reports in list.
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
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'
import { X } from 'lucide-vue-next'

const stats = ref({ resolved: 0, pending: 0, inProgress: 0 })
const reports = ref([])
const currentFilter = ref('all')
const mapMode = ref('markers')
const focusedReport = ref(null)

const focusOnReport = (report) => {
  focusedReport.value = report
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(async () => {
  // Added priority_level to the report_types extraction
  const { data: all = [] } = await supabase
    .from('reports')
    .select(
      '*, report_types(name, priority_level), barangays(name), municipalities(name), users:residents_id(first_name, last_name)',
    )
    .neq('status_id', 5)

  reports.value = all.map((r) => {
    let label = 'PENDING'
    let cssClass = 'red'

    if (r.status_id >= 4 && r.status_id !== 5) {
      label = 'RESOLVED'
      cssClass = 'blue'
    } else if (r.status_id === 2 || r.status_id === 7) {
      label = 'IN PROGRESS'
      cssClass = 'orange'
    }

    const priority = r.report_types?.priority_level || 'Normal'

    return { ...r, statusLabel: label, statusClass: cssClass, priorityLevel: priority }
  })

  stats.value = {
    pending: reports.value.filter((r) => r.statusLabel === 'PENDING').length,
    inProgress: reports.value.filter((r) => r.statusLabel === 'IN PROGRESS').length,
    resolved: reports.value.filter((r) => r.statusLabel === 'RESOLVED').length,
  }
})

const filteredReports = computed(() => {
  if (currentFilter.value === 'all') return reports.value
  return reports.value.filter((r) => r.statusLabel === currentFilter.value)
})

// Specifically filters out Walk-in reports for the right-side list ONLY
const tableReports = computed(() => {
  return filteredReports.value.filter((r) => r.landmark !== 'Walk-in Report')
})
</script>

<style scoped>
.dashboard-shell {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #f3f4f6;
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

/* FLOATING DETAILS CARD */
.floating-detail-card {
  position: absolute;
  bottom: 24px;
  left: 24px;
  width: 320px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  border: 1px solid #e2e8f0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
  overflow: hidden;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fd-header {
  padding: 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.fd-title-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
}

.fd-title {
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
}

.btn-close-fd {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}
.btn-close-fd:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.fd-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 250px;
  overflow-y: auto;
}

.fd-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.fd-label {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  color: #64748b;
}

.fd-val {
  font-size: 0.85rem;
  color: #334155;
  line-height: 1.4;
}

.fd-footer {
  padding: 12px 16px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.btn-view-full {
  display: block;
  text-align: center;
  background: #2563eb;
  color: white;
  padding: 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  text-decoration: none;
  transition: background 0.2s;
}
.btn-view-full:hover {
  background: #1d4ed8;
}

/* TOGGLE CARD FOR HEATMAP */
.toggle-card {
  padding: 8px;
}
.view-toggle {
  display: flex;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 8px;
  padding: 4px;
  gap: 4px;
}
.view-toggle button {
  flex: 1;
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 8px 0;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.view-toggle button:hover {
  color: #ffffff;
}
.view-toggle button.active {
  background: #3b82f6;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* LEGENDS */
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

/* Priority Marker Colors */
.legend-dot.critical {
  background: #ef4444; /* Red */
}
.legend-dot.high {
  background: #f97316; /* Orange */
}
.legend-dot.normal {
  background: #3b82f6; /* Blue */
}
.legend-dot.low {
  background: #eab308; /* Yellow */
}

.legend-label {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.9);
}

/* Heatmap specific legend styles */
.heatmap-gradient-bar {
  height: 10px;
  border-radius: 4px;
  background: linear-gradient(to right, blue, cyan, lime, yellow, red);
  margin-top: 10px;
  margin-bottom: 6px;
}
.heatmap-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.65rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
}

/* GRID OPS STATS */
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
  margin: 4px 0 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: #ffffff;
}

/* FILTER BAR */
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

/* REPORTS LIST CARD */
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
.empty-list-text {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  padding: 16px 0;
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
.report-item.clickable {
  cursor: pointer;
  transition:
    background 0.2s,
    transform 0.1s;
}
.report-item.clickable:hover {
  background: rgba(71, 116, 174, 0.5);
  transform: translateY(-1px);
}
.report-item.clickable:active {
  transform: translateY(0);
}

.report-info strong {
  color: #ffffff;
  font-size: 0.86rem;
  display: block;
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* STATUS BADGES */
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
