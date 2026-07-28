<template>
  <div class="dashboard-root">
    <Sidebar />
    <main class="content">
      <h1>Incident Wait List</h1>
      <p class="subtitle">
        Review new incoming reports before pushing them to the active queue or archive.
      </p>

      <div v-if="notification.text" :class="['notification', notification.type]">
        {{ notification.text }}
      </div>

      <div v-if="incidentReports.length === 0" class="empty-state">
        <p>No new incident reports waiting for review.</p>
      </div>

      <div v-else class="reports-grid">
        <div v-for="report in incidentReports" :key="report.id" class="report-card">
          <div class="report-header">
            <h2>Report #{{ report.id }}</h2>
            <span class="status-badge pending">New / Pending</span>
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
            <button class="accept" @click="acceptReport(report)">Accept</button>
            <button class="reject" @click="rejectReport(report)">Reject</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/services/supabase'
import { sendNotification } from '@/utils/notifications.js'
import Sidebar from '@/components/Sidebar.vue'

const router = useRouter()
const incidentReports = ref([])
const barangayList = ref([])
const reportTypes = ref([])

const notification = ref({
  text: '',
  type: '',
})

const loadIncidentReports = async () => {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .neq('landmark', 'Walk-in Report')
    .eq('status_id', 1) // 1 = Pending
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching new reports:', error.message)
  } else {
    incidentReports.value = data || []
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
  }, 3500)
}

const acceptReport = async (report) => {
  const bName = getBarangayName(report.barangay_id)
  const iType = getReportTypeName(report.report_type_id)

  const { error } = await supabase.from('reports').update({ status_id: 2 }).eq('id', report.id)

  if (error) {
    alert('Error accepting report: ' + error.message)
    return
  }

  await supabase.from('system_logs').insert([
    {
      action_type: 'CONFIRM_REPORT',
      action_details: `Accepted report #${report.id} (${iType}) for Barangay ${bName}`,
      created_at: new Date().toISOString(),
    },
  ])

  await sendNotification(
    'Report Confirmed',
    `Your report for ${iType} at Barangay ${bName} has been accepted and queued.`,
  )

  showNotification('Report accepted and moved to Incident Queue and Dashboard.', 'success')
  loadIncidentReports()

  setTimeout(() => {
    router
      .push({
        name: 'IncidentQueue',
        query: {
          notice: 'Report accepted and moved to Incident Queue and Dashboard.',
          noticeType: 'success',
        },
      })
      .catch(() => {})
  }, 1000)
}

const rejectReport = async (report) => {
  const bName = getBarangayName(report.barangay_id)
  const iType = getReportTypeName(report.report_type_id)

  // Updated status_id to 5 based on your report_statuses table configuration for 'Rejected'
  const { error } = await supabase.from('reports').update({ status_id: 5 }).eq('id', report.id)

  if (error) {
    alert('Error rejecting report: ' + error.message)
    return
  }

  await supabase.from('system_logs').insert([
    {
      action_type: 'REJECT_REPORT',
      action_details: `Rejected report #${report.id} (${iType}) for Barangay ${bName}`,
      created_at: new Date().toISOString(),
    },
  ])

  await sendNotification(
    'Report Rejected',
    `Your report for ${iType} at Barangay ${bName} has been rejected and archived.`,
  )

  showNotification('Report rejected and moved to Archive. Audit log updated.', 'warning')
  loadIncidentReports()

  setTimeout(() => {
    router
      .push({
        name: 'Archive',
        query: {
          notice: 'Report rejected and moved to Archive. Audit log updated.',
          noticeType: 'warning',
        },
      })
      .catch(() => {})
  }, 1000)
}

onMounted(() => {
  fetchLookups()
  loadIncidentReports()
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
.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
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
button.accept {
  background: #10b981;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}
button.accept:hover {
  background: #059669;
}

button.reject {
  background: #ef4444;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}
button.reject:hover {
  background: #dc2626;
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
