<template>
  <div class="pie-container">
    <div class="card-header">
      <h3 class="card-title">Outage Status Breakdown</h3>
      <div class="timeframe-tabs">
        <button
          v-for="filter in ['Day', 'Week', 'Month', 'Year']"
          :key="filter"
          :class="{ active: currentFilter === filter }"
          @click="setFilter(filter)"
        >
          {{ filter }}
        </button>
      </div>
    </div>

    <div class="canvas-box">
      <Doughnut :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { supabase } from '@/services/supabase'

ChartJS.register(ArcElement, Tooltip, Legend)

const currentFilter = ref('Month')

const chartData = ref({
  labels: ['Pending', 'Ongoing', 'Resolved'],
  // Updated Ongoing color to #283593 to match the IncidentChart bars
  datasets: [{ data: [0, 0, 0], backgroundColor: ['#eab308', '#283593', '#22c55e'] }],
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } },
}

const getStartDate = (filter) => {
  const now = new Date()
  if (filter === 'Day') now.setHours(0, 0, 0, 0)
  else if (filter === 'Week') now.setDate(now.getDate() - 7)
  else if (filter === 'Month') now.setMonth(now.getMonth() - 1)
  else if (filter === 'Year') now.setFullYear(now.getFullYear() - 1)
  return now.toISOString()
}

const fetchStatusCounts = async () => {
  const startDate = getStartDate(currentFilter.value)
  const { data, error } = await supabase
    .from('reports')
    .select('status_id, created_at')
    .gte('created_at', startDate)

  if (error || !data) return

  let pending = data.filter((r) => r.status_id === 1).length
  let ongoing = data.filter((r) => r.status_id === 2).length
  let resolved = data.filter((r) => r.status_id === 3 || r.status_id === 6).length

  chartData.value = {
    labels: ['Pending', 'Ongoing', 'Resolved'],
    datasets: [
      // Updated Ongoing color to #283593 to match the IncidentChart bars
      { data: [pending, ongoing, resolved], backgroundColor: ['#eab308', '#283593', '#22c55e'] },
    ],
  }
}

const setFilter = (filter) => {
  currentFilter.value = filter
  fetchStatusCounts()
}

onMounted(() => fetchStatusCounts())
</script>

<style scoped>
.pie-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-title {
  font-size: 1rem;
  color: #0f172a;
  margin: 0;
  font-weight: 800;
}

.timeframe-tabs {
  display: flex;
  gap: 4px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 99px;
  padding: 2px;
}

.timeframe-tabs button {
  background: transparent;
  color: #475569;
  border: none;
  padding: 4px 12px;
  font-size: 0.65rem;
  border-radius: 99px;
  cursor: pointer;
  font-weight: 700;
  transition:
    background-color 0.2s,
    color 0.2s;
}

.timeframe-tabs button.active {
  background-color: #fbbf24;
  color: #1e1b4b;
}

.timeframe-tabs button:hover:not(.active) {
  background-color: #e2e8f0;
}

.canvas-box {
  position: relative;
  flex: 1;
  height: 130px;
}
</style>
