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
    .select('status_id, created_at, updated_at')
    .gte('created_at', startDate.toISOString())

  if (props.branchId) query = query.eq('branch_id', props.branchId)

  const { data, error } = await query
  if (error || !data) return

  metrics.value.pending = data.filter((i) => i.status_id === 1).length
  metrics.value.ongoing = data.filter((i) => i.status_id === 2).length
  metrics.value.resolvedCount = data.filter((i) => i.status_id === 3).length

  let assignQuery = supabase.from('assignments').select('arrival_at, completion_at')
  const { data: assignData } = await assignQuery
  if (assignData && assignData.length > 0) {
    const completedItems = assignData.filter((i) => i.arrival_at && i.completion_at)
    if (completedItems.length > 0) {
      const totalHours = completedItems.reduce((acc, curr) => {
        return acc + (new Date(curr.completion_at) - new Date(curr.arrival_at)) / (1000 * 60 * 60)
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
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.metric-card {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  padding: 1.25rem;
  border-radius: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
}
.label {
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 500;
}
.value {
  font-size: 1.75rem;
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
