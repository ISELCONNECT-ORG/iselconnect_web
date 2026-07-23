<template>
  <div class="audit-log-container">
    <h3>System Audit Logs</h3>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Action Type</th>
            <th>Details</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.id">
            <td>{{ log.action_type }}</td>
            <td>{{ log.action_details }}</td>
            <td>{{ new Date(log.created_at).toLocaleString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/services/supabase'

const logs = ref([])

const fetchLogs = async () => {
  const localLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]')

  try {
    const { data, error } = await supabase
      .from('system_logs')
      .select('id, action_type, action_details, created_at')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error fetching logs:', error.message)
      logs.value = localLogs || []
      return
    }

    const normalizedSupabaseLogs = (data || []).map((log) => ({
      id: log.id,
      action_type: log.action_type,
      action_details: log.action_details,
      created_at: log.created_at,
    }))

    logs.value = [...(localLogs || []), ...normalizedSupabaseLogs].filter(
      (log, index, all) => all.findIndex((item) => item.id === log.id) === index,
    )
  } catch (error) {
    console.error('Error fetching logs:', error)
    logs.value = localLogs || []
  }
}

onMounted(fetchLogs)
</script>

<style scoped>
.audit-log-container {
  margin-top: 20px;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}
.table-wrapper {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}
th,
td {
  text-align: left;
  padding: 12px;
  border-bottom: 1px solid #eee;
  font-size: 0.9em;
}
th {
  color: #6b7280;
  background: #f9fafb;
}
</style>
