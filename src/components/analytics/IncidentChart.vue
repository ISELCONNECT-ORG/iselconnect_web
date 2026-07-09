<template>
  <div class="chart-wrapper">
    <canvas ref="chartRef"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { Chart, registerables } from 'chart.js'
import { supabase } from '@/services/supabase'

Chart.register(...registerables)

const props = defineProps(['period', 'branchId'])
const chartRef = ref(null)
let chartInstance = null

const fetchData = async () => {
  const now = new Date()
  let startDate = new Date()

  if (props.period === 'Day') startDate.setDate(now.getDate() - 1)
  else if (props.period === 'Week') startDate.setDate(now.getDate() - 7)
  else if (props.period === 'Month') startDate.setMonth(now.getMonth() - 1)
  else if (props.period === 'Year') startDate.setFullYear(now.getFullYear() - 1)

  let query = supabase
    .from('reports')
    .select(`created_at, report_types(name)`)
    .gte('created_at', startDate.toISOString())

  if (props.branchId) {
    query = query.eq('branch_id', props.branchId)
  }

  const { data, error } = await query
  if (error) return

  const counts = {
    'Leaning Pole': 0,
    'Fallen Wire': 0,
    'Sparking Transformer': 0,
    'Overgrown Grass': 0,
    'Insect Infestations': 0,
  }

  data.forEach((item) => {
    const typeName = item.report_types?.name
    if (typeName && counts.hasOwnProperty(typeName)) counts[typeName]++
  })

  updateChart(counts)
}

const updateChart = (counts) => {
  if (chartInstance) chartInstance.destroy()

  chartInstance = new Chart(chartRef.value, {
    type: 'bar',
    data: {
      labels: Object.keys(counts),
      datasets: [
        {
          label: 'Reports',
          data: Object.values(counts),
          backgroundColor: '#1f3056', // dark blue bar color
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } },
      },
    },
  })
}

watch(() => [props.period, props.branchId], fetchData)
onMounted(fetchData)
</script>

<style scoped>
.chart-wrapper {
  position: relative;
  width: 100%;
  height: 200px;
}
</style>
