<!-- IncidentList.vue -->
<template>
  <div class="dashboard-root">
    <Sidebar />
    <div class="main-wrapper">
      <Topbar />

      <div class="content-padding" style="padding: 24px">
        <section class="table-container">
          <h2 style="margin: 0 0 4px 0">Incident List</h2>
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
                    <button class="btn-accept" @click="acceptReport(report)">Accept</button>
                    <button class="btn-reject" @click="rejectReport(report)">Reject</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
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

const acceptReport = async (report) => {
  const { error } = await supabase.from('reports').update({ status_id: 2 }).eq('id', report.id)

  if (!error) {
    addAlert({
      title: 'System Confirmation',
      message: `Report in ${report.barangays?.name || 'the area'} accepted and moved to active queue.`,
      severity: 'low',
    })
  }

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
</style>
