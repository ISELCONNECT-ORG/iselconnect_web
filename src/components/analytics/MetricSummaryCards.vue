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
      <span class="label">Total Reports</span>
      <span class="value accent-green">{{ metrics.totalReports }}</span>
    </div>
    <div class="metric-card">
      <span class="label">Total Resolved</span>
      <span class="value accent-purple">{{ metrics.totalResolved }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { supabase } from '@/services/supabase'

const props = defineProps({
  branchId: {
    type: String,
    default: null,
  },
})

const metrics = ref({ pending: 0, ongoing: 0, totalReports: 0, totalResolved: 0 })

const fetchMetrics = async () => {
  let query = supabase.from('reports').select('status_id,created_at,updated_at')

  if (props.branchId) query = query.eq('branch_id', props.branchId)

  const { data, error } = await query
  if (!error && data) {
    metrics.value.pending = data.filter((i) => i.status_id === 1).length
    metrics.value.ongoing = data.filter((i) => i.status_id === 2).length
    metrics.value.totalReports = data.length
    metrics.value.totalResolved = data.filter((i) => i.status_id === 6).length
  }
}

watch(() => props.branchId, fetchMetrics)
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
