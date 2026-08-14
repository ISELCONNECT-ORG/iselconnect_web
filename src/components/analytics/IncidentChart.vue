<template>
  <div class="analytics-card">
    <div class="card-header">
      <div class="header-main">
        <h3 class="card-title">System Load & Consumption</h3>
        <p class="card-subtitle">Volume of reports categorized by issue type</p>
      </div>

      <div class="timeframe-tabs">
        <button
          v-for="t in ['Day', 'Week', 'Month', 'Year']"
          :key="t"
          :class="{ active: currentPeriod === t }"
          @click="currentPeriod = t"
        >
          {{ t }}
        </button>
      </div>
    </div>

    <div class="chart-container">
      <div v-if="loading" class="status-message">
        <div class="spinner"></div>
        <span>Retrieving filtered analytics...</span>
      </div>

      <Bar v-else-if="chartData.labels.length > 0" :data="chartData" :options="chartOptions" />

      <div v-else class="status-message empty">
        <span>No reports found for this period.</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { Bar } from 'vue-chartjs'
import { supabase } from '@/services/supabase'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const props = defineProps({
  branchId: { type: [Number, String], default: null },
})

const loading = ref(true)
const currentPeriod = ref('Day')
const chartData = ref({ labels: [], datasets: [] })

const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#0f172a',
      padding: 8,
      bodyFont: { family: 'Inter, sans-serif', size: 11 },
      callbacks: {
        title: (context) => {
          const rawLabel = context[0].label || ''
          return rawLabel.replace(/,/g, ' ')
        },
        label: (context) => ` ${context.raw} Reports`,
      },
    },
  },
  scales: {
    x: {
      ticks: {
        color: '#64748b',
        font: { size: 9 },
        maxRotation: 0,
        minRotation: 0,
        autoSkip: false,
      },
      grid: { display: false },
    },
    y: {
      beginAtZero: true,
      ticks: { precision: 0, color: '#334155', font: { weight: '500', size: 10 } },
      grid: { color: '#f1f5f9' },
    },
  },
})

const formatLabel = (str, maxLen = 14) => {
  if (!str) return ''
  const words = str.split(' ')
  const lines = []
  let currentLine = ''

  words.forEach((word) => {
    if ((currentLine + word).length > maxLen) {
      if (currentLine) lines.push(currentLine.trim())
      currentLine = word + ' '
    } else {
      currentLine += word + ' '
    }
  })
  if (currentLine) lines.push(currentLine.trim())

  return lines
}

const fetchSupabaseAnalytics = async () => {
  try {
    loading.value = true
    chartData.value = { labels: [], datasets: [] }

    const now = new Date()
    let startDate = new Date()

    if (currentPeriod.value === 'Day') startDate.setDate(now.getDate() - 1)
    else if (currentPeriod.value === 'Week') startDate.setDate(now.getDate() - 7)
    else if (currentPeriod.value === 'Month') startDate.setMonth(now.getMonth() - 1)
    else if (currentPeriod.value === 'Year') startDate.setFullYear(now.getFullYear() - 1)

    let query = supabase
      .from('reports')
      .select('created_at, report_types(name)')
      .gte('created_at', startDate.toISOString())

    if (props.branchId) query = query.eq('branch_id', props.branchId)

    const { data, error } = await query
    if (error) throw error

    const counts = {}
    if (data && data.length > 0) {
      data.forEach((item) => {
        const typeName = item.report_types?.name || 'Uncategorized'
        counts[typeName] = (counts[typeName] || 0) + 1
      })

      const sorted = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 7)

      chartData.value = {
        labels: sorted.map(([label]) => formatLabel(label)),
        datasets: [
          {
            label: 'Reports',
            backgroundColor: '#283593',
            borderRadius: 4,
            maxBarThickness: 90 /* Increased significantly to allow wider bars */,
            barPercentage: 0.65 /* Tells the bar to take up 65% of the available category space */,
            categoryPercentage: 0.9 /* Tells the category to use 90% of its available grid width */,
            data: sorted.map(([, count]) => count),
          },
        ],
      }
    }
  } catch (error) {
    console.error('Analytics load failure:', error.message)
  } finally {
    loading.value = false
  }
}

watch(currentPeriod, fetchSupabaseAnalytics)
onMounted(fetchSupabaseAnalytics)
</script>

<style scoped>
.analytics-card {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #283593;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.card-title {
  font-size: 1rem;
  color: #0f172a;
  margin: 0 0 4px 0;
  font-weight: 800;
}

.card-subtitle {
  font-size: 0.75rem;
  color: #475569;
  margin: 0;
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
  background: #fbbf24;
  color: #1e1b4b;
}

.timeframe-tabs button:hover:not(.active) {
  background-color: #e2e8f0;
}

.chart-container {
  position: relative;
  min-height: 280px; /* Increased height to better accommodate wider bars and text */
  width: 100%;
  flex-grow: 1;
}

.status-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #475569;
  font-size: 0.8rem;
  gap: 8px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e2e8f0;
  border-top-color: #283593;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
