<template>
  <div class="pie-container">
    <div class="filter-controls">
      <button
        v-for="filter in ['Day', 'Week', 'Month', 'Year']"
        :key="filter"
        :class="{ active: currentFilter === filter }"
        @click="setFilter(filter)"
      >
        {{ filter }}
      </button>
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
  datasets: [{ data: [0, 0, 0], backgroundColor: ['#eab308', '#0284c7', '#22c55e'] }],
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
      { data: [pending, ongoing, resolved], backgroundColor: ['#eab308', '#0284c7', '#22c55e'] },
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
.filter-controls {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  margin-bottom: 4px;
}
.filter-controls button {
  background-color: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 2px 6px;
  font-size: 0.65rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}
.filter-controls button.active {
  background-color: #fbbf24;
  color: #0f172a;
  border-color: #f59e0b;
}

/* GREATLY REDUCED CANVAS HEIGHT */
.canvas-box {
  position: relative;
  flex: 1;
  height: 130px;
}
</style>
