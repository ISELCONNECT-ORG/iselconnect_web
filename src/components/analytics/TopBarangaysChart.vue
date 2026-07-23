<template>
  <div class="analytics-card">
    <div class="card-header">
      <div class="header-main">
        <h3 class="card-title">Top 5 Most Affected Barangays</h3>
        <p class="card-subtitle">Distribution of reported grid infrastructure issues</p>
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
  branchId: {
    type: [Number, String],
    default: null,
  },
})

const loading = ref(true)
const currentPeriod = ref('Day')
const chartData = ref({ labels: [], datasets: [] })

const chartOptions = ref({
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#0f172a',
      padding: 12,
      bodyFont: { family: 'Inter, sans-serif', size: 13 },
      callbacks: {
        label: (context) => ` ${context.raw} Reports Filed`,
      },
    },
  },
  scales: {
    x: {
      beginAtZero: true,
      ticks: {
        precision: 0,
        color: '#64748b',
      },
      grid: { color: '#f1f5f9' },
    },
    y: {
      ticks: {
        color: '#334155',
        font: { weight: '500', size: 13 },
      },
      grid: { display: false },
    },
  },
})

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
      .select('barangay_id, barangays(name)')
      .gte('created_at', startDate.toISOString())

    if (props.branchId) {
      query = query.eq('branch_id', props.branchId)
    }

    const { data, error } = await query

    if (error) throw error

    const counts = {}
    const labels = []

    if (data && data.length > 0) {
      data.forEach((item) => {
        const name = item.barangays?.name || 'Unknown Barangay'
        counts[name] = (counts[name] || 0) + 1
      })

      const sorted = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)

      const topLabels = sorted.map(([label]) => label)
      const topCounts = sorted.map(([, count]) => count)

      chartData.value = {
        labels: topLabels,
        datasets: [
          {
            label: 'Active Reports',
            backgroundColor: '#1f3056',
            hoverBackgroundColor: '#1f3056',
            borderRadius: 6,
            barThickness: 24,
            data: topCounts,
          },
        ],
      }
    }
  } catch (error) {
    console.error('Supabase analytics load failure:', error.message)
  } finally {
    loading.value = false
  }
}

watch(currentPeriod, () => {
  fetchSupabaseAnalytics()
})

onMounted(() => {
  fetchSupabaseAnalytics()
})
</script>

<style scoped>
.analytics-card {
  background: white;
  padding: 24px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-title {
  font-size: 1.125rem;
  color: #000000;
  margin: 0 0 4px 0;
  font-weight: 600;
}

.card-subtitle {
  font-size: 0.875rem;
  color: #475569;
  margin: 0;
}

.chart-container {
  position: relative;
  height: 280px;
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
  font-size: 0.925rem;
  gap: 12px;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #e2e8f0;
  border-top-color: #1f3056; /* match bar color if you want */
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
