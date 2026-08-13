<template>
  <div class="metrics-overview-container">
    <div class="metrics-header">
      <h3 class="section-title">REAL-TIME OPERATIONS OVERVIEW</h3>
      <div class="timeframe-tabs">
        <button
          v-for="t in ['DAY', 'WEEK', 'MONTH', 'YEAR']"
          :key="t"
          :class="{ active: localPeriod === t }"
          @click="setPeriod(t)"
        >
          {{ t }}
        </button>
      </div>
    </div>

    <div class="metrics-grid">
      <!-- Pending Reports -->
      <div class="metric-card">
        <div class="card-title">
          <FileText :size="14" class="icon" />
          <span>PENDING REPORTS</span>
        </div>
        <span class="value">{{ metrics.pending }}</span>
      </div>

      <!-- Ongoing Repairs -->
      <div class="metric-card">
        <div class="card-title">
          <Wrench :size="14" class="icon" />
          <span>ONGOING REPAIRS</span>
        </div>
        <span class="value">{{ metrics.ongoing }}</span>
      </div>

      <!-- Resolved In Period -->
      <div class="metric-card">
        <div class="card-title">
          <CheckCircle2 :size="14" class="icon" />
          <span>RESOLVED IN PERIOD</span>
        </div>
        <span class="value">{{ metrics.totalResolved }}</span>
      </div>

      <!-- Avg Resolution -->
      <div class="metric-card">
        <div class="card-title">
          <Timer :size="14" class="icon" />
          <span>AVG. RESOLUTION</span>
        </div>
        <span class="value">0</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { FileText, Wrench, CheckCircle2, Timer } from 'lucide-vue-next'
import { supabase } from '@/services/supabase'

const props = defineProps({
  period: { type: String, default: 'Day' },
  branchId: { type: String, default: null },
})

const emit = defineEmits(['update:period', 'metricsUpdated'])

const localPeriod = ref(props.period.toUpperCase())
const metrics = ref({ pending: 0, ongoing: 0, totalReports: 0, totalResolved: 0 })

const getStartDate = (filter) => {
  const now = new Date()
  if (filter === 'DAY') now.setHours(0, 0, 0, 0)
  else if (filter === 'WEEK') now.setDate(now.getDate() - 7)
  else if (filter === 'MONTH') now.setMonth(now.getMonth() - 1)
  else if (filter === 'YEAR') now.setFullYear(now.getFullYear() - 1)
  return now.toISOString()
}

const setPeriod = (p) => {
  localPeriod.value = p
  emit('update:period', p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
}

const fetchMetrics = async () => {
  const startDate = getStartDate(localPeriod.value)

  let query = supabase
    .from('reports')
    .select('status_id,created_at,updated_at')
    .gte('created_at', startDate) // Applies the selected time filter

  if (props.branchId) query = query.eq('branch_id', props.branchId)

  const { data, error } = await query
  if (!error && data) {
    metrics.value.pending = data.filter((i) => i.status_id === 1).length
    metrics.value.ongoing = data.filter((i) => i.status_id === 2).length
    metrics.value.totalReports = data.length
    metrics.value.totalResolved = data.filter((i) => i.status_id === 3 || i.status_id === 6).length

    emit('metricsUpdated', metrics.value)
  }
}

watch(() => props.branchId, fetchMetrics)
watch(
  () => props.period,
  (newVal) => {
    localPeriod.value = newVal.toUpperCase()
    fetchMetrics() // Refresh metrics when period changes
  },
)
onMounted(fetchMetrics)
</script>

<style scoped>
.metrics-overview-container {
  background-color: #f8fafc;
  border: 1px solid #283593;
  padding: 16px;
  border-radius: 8px;
  width: 100%;
}

.metrics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  color: #1e1b4b;
  font-size: 0.8rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: 0.5px;
}

.timeframe-tabs {
  display: flex;
  background: #e2e8f0;
  border: 1px solid #283593;
  border-radius: 6px;
  overflow: hidden;
  padding: 2px;
}

.timeframe-tabs button {
  background: transparent;
  color: #283593;
  border: none;
  padding: 4px 12px;
  font-size: 0.65rem;
  font-weight: 700;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.timeframe-tabs button.active {
  background: #1e1b4b;
  color: #ffffff;
}

.timeframe-tabs button:hover:not(.active) {
  background: rgba(40, 53, 147, 0.1);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.metric-card {
  background-color: #ffffff;
  border: 1px solid #283593;
  padding: 12px 16px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #475569;
  font-size: 0.65rem;
  font-weight: 800;
  width: 100%;
  justify-content: flex-start;
}

.icon {
  color: #283593;
}

.value {
  font-size: 1.8rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1;
  margin-top: 8px;
}
</style>
