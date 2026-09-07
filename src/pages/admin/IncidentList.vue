<!-- IncidentList.vue -->
<template>
  <div class="dashboard-root">
    <Sidebar />
    <div class="main-wrapper">
      <Topbar />

      <div class="content-padding" style="padding: 24px">
        <section class="table-container">
          <h2 style="margin: 0 0 4px 0">Incident QUEUE</h2>
          <p style="margin: 0 0 12px 0; font-size: 0.8rem; color: #475569">
            Review new incoming reports before pushing them to the active queue or archive.
          </p>

          <div v-if="incidentReports.length === 0" style="text-align: center; padding: 16px">
            <p>No new incident reports waiting for review.</p>
          </div>

          <table v-else class="data-table">
            <thead>
              <tr>
                <th style="width: 40px">No.</th>
                <th>Priority</th>
                <th>Report Details</th>
                <th>Location</th>
                <th>Description</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(report, index) in incidentReports" :key="report.id">
                <td style="font-weight: 600; color: #64748b">
                  {{ index + 1 }}
                </td>
                <td>
                  <span
                    :class="[
                      'priority-badge',
                      report.status_id === 1 ? 'badge-pending' : 'badge-progress',
                    ]"
                  >
                    {{ report.status_id === 1 ? 'Pending' : 'Active' }}
                  </span>
                </td>
                <td style="font-weight: 700">
                  {{ report.report_types?.name ?? 'General Incident' }}
                  <div
                    style="font-weight: normal; font-size: 0.7rem; color: #64748b"
                    v-if="report.users"
                  >
                    Reporter: {{ report.users.first_name }} {{ report.users.last_name }}
                  </div>
                </td>
                <td>
                  {{ report.landmark || 'N/A' }}
                  <div style="font-size: 0.7rem; color: #64748b">
                    Barangay: {{ report.barangays?.name ?? 'Unknown Barangay' }}
                  </div>
                </td>
                <td>
                  <router-link
                    :to="`/admin/reports/${report.id}`"
                    style="
                      background-color: #f8fafc;
                      color: #3b82f6;
                      padding: 6px 12px;
                      border-radius: 6px;
                      font-size: 0.75rem;
                      font-weight: 600;
                      text-decoration: none;
                      display: inline-block;
                      border: 1px solid #e2e8f0;
                      cursor: pointer;
                    "
                  >
                    View Details
                  </router-link>
                </td>
                <td style="color: #64748b; font-size: 0.8rem">
                  {{ formatDateTime(report.created_at) }}
                </td>
                <td>
                  <div class="table-action-buttons">
                    <button class="btn-accept" @click="promptAccept(report)">Accept</button>
                    <button class="btn-reject" @click="rejectReport(report)">Reject</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div v-if="showConfirmModal" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Confirm Approval</h3>
        </div>
        <div class="modal-body">
          <p><strong>Are you sure you want to verify?</strong></p>
          <p>
            This action will officially verify the report, mark the resolved evidence as validated,
            and close the incident ticket.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showConfirmModal = false">Cancel</button>
          <button class="btn-approve" @click="confirmAccept">Approve</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'
import { supabase } from '@/services/supabase'
import { useSystemAlerts } from '@/composables/useSystemAlerts'
import '@/assets/style/Dashboard.css'

const { addAlert } = useSystemAlerts()
const incidentReports = ref([])
const showConfirmModal = ref(false)
const selectedReport = ref(null)

const loadIncidentReports = async () => {
  const { data, error } = await supabase
    .from('reports')
    .select(
      `id, landmark, description, created_at, status_id, report_types(name), barangays(name), users:residents_id(first_name, last_name)`,
    )
    .neq('landmark', 'Walk-in Report')
    .eq('status_id', 1)
    .order('created_at', { ascending: false })
  if (!error) incidentReports.value = data || []
}

const formatDateTime = (dateString) => (dateString ? new Date(dateString).toLocaleDateString() : '')

const promptAccept = (report) => {
  selectedReport.value = report
  showConfirmModal.value = true
}

const confirmAccept = async () => {
  if (!selectedReport.value) return

  const { error } = await supabase
    .from('reports')
    .update({ status_id: 2 })
    .eq('id', selectedReport.value.id)

  if (!error) {
    addAlert({
      title: 'System Confirmation',
      message: `Report in ${selectedReport.value.barangays?.name || 'the area'} accepted and moved to active queue.`,
      severity: 'low',
    })
  }

  showConfirmModal.value = false
  selectedReport.value = null
  loadIncidentReports()
}

const rejectReport = async (report) => {
  const { error } = await supabase.from('reports').update({ status_id: 5 }).eq('id', report.id)

  if (!error) {
    addAlert({
      title: 'System Confirmation',
      message: 'Report was rejected and removed from pending.',
      severity: 'low',
    })
  }

  loadIncidentReports()
}

onMounted(() => {
  loadIncidentReports()
})
</script>

<style scoped>
.table-container {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-card {
  background: white;
  width: 420px;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.modal-header h3 {
  margin: 0 0 12px 0;
  font-size: 1.1rem;
  color: #1e293b;
}

.modal-body p {
  margin: 0 0 8px 0;
  font-size: 0.9rem;
  color: #475569;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn-cancel {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #334155;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn-approve {
  background: #1e1b4b;
  border: none;
  color: white;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}
</style>
