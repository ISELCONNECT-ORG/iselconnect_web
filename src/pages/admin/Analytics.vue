<template>
  <div class="dashboard-root">
    <Sidebar />
    <div class="main-container">
      <Topbar />
      <main class="content">
        <header class="content-header">
          <div class="header-titles">
            <h1>System Analytics & Reports</h1>
            <p class="subtitle">
              Real-time performance, spatial distribution, and outage monitoring metrics
            </p>
          </div>
          <div class="filter-controls">
            <button
              v-for="p in ['Day', 'Week', 'Month', 'Year']"
              :key="p"
              :class="{ active: selectedPeriod === p }"
              @click="selectedPeriod = p"
            >
              {{ p }}
            </button>
          </div>
        </header>

        <MetricSummaryCards :period="selectedPeriod" :branchId="branchId" />

        <div class="analytics-grid">
          <div class="chart-card wide">
            <h3>Incident Reports Trend & Temporal Patterns</h3>
            <div class="chart-wrapper">
              <IncidentChart :period="selectedPeriod" :branchId="branchId" />
            </div>
          </div>

          <div class="chart-card">
            <h3>Top Affected Barangays (Problem-Prone Areas)</h3>
            <div class="chart-wrapper">
              <TopBarangaysChart :period="selectedPeriod" :branchId="branchId" />
            </div>
          </div>

          <div class="chart-card">
            <h3>Outage Status Breakdown</h3>
            <div class="chart-wrapper">
              <OutageStatusPie :period="selectedPeriod" :branchId="branchId" />
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'
import MetricSummaryCards from '@/components/analytics/MetricSummaryCards.vue'
import IncidentChart from '@/components/analytics/IncidentChart.vue'
import TopBarangaysChart from '@/components/analytics/TopBarangaysChart.vue'
import OutageStatusPie from '@/components/analytics/OutageStatusPie.vue'

const selectedPeriod = ref('Month')
const branchId = ref(null) // Pass or bind specific branch ID here depending on account type session
</script>

<style scoped>
.dashboard-root {
  display: flex;
  height: 100vh;
  background-color: #f8fafc;
  color: #1e293b;
  font-family: 'Inter', sans-serif;
  overflow: hidden;
}
.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  background-color: #f8fafc;
}
.content-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}
.content-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
}
.subtitle {
  color: #64748b;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}
.filter-controls {
  display: flex;
  gap: 0.25rem;
  background: #f1f5f9;
  padding: 0.25rem;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
}
.filter-controls button {
  background: transparent;
  border: none;
  color: #475569;
  padding: 0.35rem 0.75rem;
  font-size: 0.8rem;
  border-radius: 0.35rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}
.filter-controls button.active {
  background-color: #0284c7;
  color: #ffffff;
}
.analytics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}
.chart-card {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.25rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
}
.chart-card.wide {
  grid-column: span 2;
}
.chart-card h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #0f172a;
}
.chart-wrapper {
  position: relative;
  height: 220px;
  width: 100%;
}
</style>
