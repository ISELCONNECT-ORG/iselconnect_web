<template>
  <div class="metrics-grid">
    <div class="metric-card">
      <span class="label">Pending Reports</span>
      <span class="value accent-yellow">{{ metrics.pending }}</span>
    </div>
    <div class="metric-card">
      <span class="label">Ongoing Repairs</span>
      <span class="value accent-blue">{{ metrics.ongoing }}</span>
    </div>
    <div class="metric-card">
      <span class="label">Resolved in Period</span>
      <span class="value accent-green">{{ metrics.resolvedCount }}</span>
    </div>
    <div class="metric-card">
      <span class="label">Avg. Resolution (Hours)</span>
      <span class="value accent-purple">{{ metrics.avgResolutionTime }}h</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { supabase } from '@/services/supabase'

const props = defineProps(['period', 'branchId'])
const metrics = ref({ pending: 0, ongoing: 0, resolvedCount: 0, avgResolutionTime: 0 })

const fetchMetrics = async () => {
  const now = new Date()
  let startDate = new Date()

  if (props.period === 'Day') startDate.setDate(now.getDate() - 1)
  else if (props.period === 'Week') startDate.setDate(now.getDate() - 7)
  else if (props.period === 'Month') startDate.setMonth(now.getMonth() - 1)
  else if (props.period === 'Year') startDate.setFullYear(now.getFullYear() - 1)

  let query = supabase
    .from('reports')
    .select('status_id,created_at,updated_at')
    .gte('created_at', startDate.toISOString())

  if (props.branchId) query = query.eq('branch_id', props.branchId)

  const { data, error } = await query
  if (!error && data) {
    metrics.value.pending = data.filter((i) => i.status_id === 1).length
    metrics.value.ongoing = data.filter((i) => i.status_id === 2).length
    metrics.value.resolvedCount = data.filter((i) => i.status_id === 3).length
  }

  const { data: assignData } = await supabase
    .from('assignments')
    .select('inprogress_at,completion_at')

  if (assignData && assignData.length > 0) {
    const completedItems = assignData.filter((i) => i.inprogress_at && i.completion_at)
    if (completedItems.length > 0) {
      const totalHours = completedItems.reduce((acc, curr) => {
        return (
          acc + (new Date(curr.completion_at) - new Date(curr.inprogress_at)) / (1000 * 60 * 60)
        )
      }, 0)
      metrics.value.avgResolutionTime = (totalHours / completedItems.length).toFixed(1)
    }
  }
}

watch(() => [props.period, props.branchId], fetchMetrics)
onMounted(fetchMetrics)
</script>

<style scoped>
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
.metric-card {
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  padding: 20px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}
.label {
  color: #475569;
  font-size: 0.8rem;
  font-weight: 600;
}
.value {
  font-size: 1.8rem;
  font-weight: 700;
}
.accent-yellow {
  color: #ca8a04;
}
.accent-blue {
  color: #0284c7;
}
.accent-green {
  color: #16a34a;
}
.accent-purple {
  color: #9333ea;
}
</style>
