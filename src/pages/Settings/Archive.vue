<template>
  <div class="dashboard-root">
    <Sidebar />
    <main class="content">
      <h1>Incident Archive</h1>
      <p class="subtitle">
        View all rejected or archived incident reports and recover them if necessary.
      </p>

      <div v-if="notification.text" :class="['notification', notification.type]">
        {{ notification.text }}
      </div>

      <div v-if="archivedReports.length === 0" class="empty-state">
        <p>No rejected incidents yet.</p>
      </div>

      <div v-else class="reports-grid">
        <div v-for="report in archivedReports" :key="report.id" class="report-card">
          <div class="report-header">
            <h2>Report #{{ report.id }}</h2>
            <span class="status-badge rejected">Archived / Rejected</span>
          </div>

          <p><strong>Incident Type:</strong> {{ getReportTypeName(report.report_type_id) }}</p>
          <p><strong>Description:</strong> {{ report.description || 'EMPTY' }}</p>
          <p>
            <strong>Landmark / Purok:</strong> {{ report.landmark || 'N/A' }} (Purok:
            {{ report.purok_sitio || 'N/A' }})
          </p>
          <p><strong>Barangay:</strong> {{ getBarangayName(report.barangay_id) }}</p>
          <p><strong>Date Reported:</strong> {{ formatDateTime(report.created_at) }}</p>

          <div class="action-buttons">
            <button class="btn-recover" @click="recoverReport(report)">Recover Report</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/services/supabase'
import Sidebar from '@/components/Sidebar.vue'

const route = useRoute()
const archivedReports = ref([])
const barangayList = ref([])
const reportTypes = ref([])

const notification = ref({
  text: '',
  type: '',
})

const loadArchivedReports = async () => {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('status_id', 3) // Matches the rejected/archived status ID
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching archived reports:', error.message)
  } else {
    archivedReports.value = data || []
  }
}

const fetchLookups = async () => {
  const bRes = await supabase.from('barangays').select('id, name')
  if (bRes.data) barangayList.value = bRes.data

  const tRes = await supabase.from('report_types').select('id, name')
  if (tRes.data) reportTypes.value = tRes.data
}

const getBarangayName = (id) => {
  const found = barangayList.value.find((b) => b.id === id)
  return found ? found.name : 'Unknown Barangay'
}

const getReportTypeName = (id) => {
  const found = reportTypes.value.find((t) => t.id === id)
  return found ? found.name : 'General Incident'
}

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString()
}

const showNotification = (text, type) => {
  notification.value = { text, type }
  setTimeout(() => {
    notification.value = { text: '', type: '' }
  }, 4000)
}

// Recover Report -> Moves status_id back to 1 (Wait List / Pending Review)
const recoverReport = async (report) => {
  const bName = getBarangayName(report.barangay_id)
  const iType = getReportTypeName(report.report_type_id)

  const { error } = await supabase
    .from('reports')
    .update({ status_id: 1 }) // 1 = Pending / Wait List
    .eq('id', report.id)

  if (error) {
    alert('Error recovering report: ' + error.message)
    return
  }

  // Log recovery action to audit logs
  await supabase.from('system_logs').insert([
    {
      action_type: 'RECOVER_REPORT',
      action_details: `Recovered report #${report.id} (${iType}) for Barangay ${bName} from archive`,
      created_at: new Date().toISOString(),
    },
  ])

  showNotification(
    `Report #${report.id} has been successfully recovered to the Wait List.`,
    'success',
  )
  loadArchivedReports()
}

const checkRouteNotice = () => {
  const notice = route.query.notice
  const noticeType = route.query.noticeType
  if (notice) {
    showNotification(notice, noticeType)
  }
}

onMounted(() => {
  checkRouteNotice()
  fetchLookups()
  loadArchivedReports()
})
</script>

<style scoped>
.dashboard-root {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
  color: #000000;
}
.content {
  flex-grow: 1;
  padding: 40px;
  max-width: 900px;
  color: #000000;
}
.subtitle {
  color: #64748b;
  font-size: 0.95rem;
  margin-bottom: 25px;
}

.reports-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.report-card {
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 20px;
  background: #fff;
  color: #000000;
}
.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.report-header h2 {
  font-size: 1.2rem;
  color: #1e293b;
  margin: 0;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
}
.status-badge.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.report-card p {
  margin: 6px 0;
  font-size: 0.9rem;
  color: #334155;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}
.btn-recover {
  background: #2563eb;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}
.btn-recover:hover {
  background: #1d4ed8;
}

.notification {
  padding: 10px 14px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-weight: 500;
}
.notification.success {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}
.notification.warning {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}
.empty-state {
  text-align: center;
  color: #64748b;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}
</style>
