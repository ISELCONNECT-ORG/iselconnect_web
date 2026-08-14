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
          <FileText :size="24" class="icon" />
          <span>PENDING REPORTS</span>
        </div>
        <span class="value">{{ metrics.pending }}</span>
      </div>

      <!-- Ongoing Repairs -->
      <div class="metric-card">
        <div class="card-title">
          <Wrench :size="24" class="icon" />
          <span>ONGOING REPAIRS</span>
        </div>
        <span class="value">{{ metrics.ongoing }}</span>
      </div>

      <!-- Resolved In Period -->
      <div class="metric-card">
        <div class="card-title">
          <CheckCircle2 :size="24" class="icon" />
          <span>RESOLVED IN PERIOD</span>
        </div>
        <span class="value">{{ metrics.totalResolved }}</span>
      </div>

      <!-- Avg Resolution -->
      <div class="metric-card">
        <div class="card-title">
          <Timer :size="24" class="icon" />
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
    .gte('created_at', startDate)

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
    fetchMetrics()
  },
)
onMounted(fetchMetrics)
</script>

<style scoped>
.metrics-overview-container {
  background-color: #1a1a40;
  border: none;
  padding: 16px;
  border-radius: 8px;
  width: 100%;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}

.metrics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.timeframe-tabs {
  display: flex;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 99px;
  overflow: hidden;
  padding: 2px;
}

.timeframe-tabs button {
  background: transparent;
  color: #ffffff;
  border: none;
  padding: 4px 12px;
  font-size: 0.65rem;
  font-weight: 700;
  cursor: pointer;
  border-radius: 99px;
  transition: all 0.2s;
}

.timeframe-tabs button.active {
  background: #fbbf24;
  color: #1e1b4b;
}

.timeframe-tabs button:hover:not(.active) {
  background: rgba(255, 255, 255, 0.15);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.metric-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80px;
  box-shadow:
    inset 0 0 10px rgba(255, 255, 255, 0.02),
    0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Forced White and Bold */
.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  justify-content: flex-start;
  text-transform: uppercase;
}

.card-title span {
  color: #ffffff !important;
  font-size: 0.7rem;
  font-weight: 900 !important;
}

.icon {
  color: #ffffff;
}

.value {
  font-size: 1.8rem;
  font-weight: 800;
  color: #93c5fd;
  line-height: 1;
  margin-top: 8px;
}
</style>
