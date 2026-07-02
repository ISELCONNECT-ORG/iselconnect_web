<template>
  <div class="dashboard-root">
    <Sidebar />
    <div class="main-wrapper">
      <Topbar />

      <main class="content">
        <div class="hero-banner">
          <h1>Good Morning, Admin</h1>
          <p>The grid system is currently operating at {{ gridEfficiency }}% efficiency.</p>
        </div>

        <div class="stats-grid">
          <div v-for="stat in stats" :key="stat.title" class="stat-card">
            <div class="card-header">
              <component :is="stat.icon" class="stat-icon" />
              <span class="trend-badge">{{ stat.trend }}</span>
            </div>
            <h3>{{ stat.title }}</h3>
            <p class="stat-value">{{ stat.value }}</p>
          </div>
        </div>

        <div class="content-grid">
          <section class="chart-container">
            <div class="chart-header">
              <h3>System Load & Consumption</h3>
              <div class="timeframe-tabs">
                <button
                  v-for="t in ['Day', 'Week', 'Month', 'Year']"
                  :key="t"
                  :class="{ active: currentPeriod === t }"
                  @click="currentPeriod = t"
                >
                  {{ t }}
                </button>
              </div>
            </div>
            <IncidentChart :period="currentPeriod" />
          </section>

          <aside class="efficiency-card">
            <h3>Grid Efficiency</h3>
            <p class="efficiency-value">{{ gridEfficiency }}%</p>
            <div class="progress-bar">
              <div class="fill" :style="{ width: gridEfficiency + '%' }"></div>
            </div>
            <p class="efficiency-label">Current average performance across all sectors.</p>
          </aside>
        </div>

        <div class="full-width-analytics" style="margin-top: 8px">
          <TopBarangaysChart />
        </div>

        <section class="table-container">
          <h2>Active Consumer Reports</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>Report Name</th>
                <th>Location</th>
                <th>Lineman</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="report in reports" :key="report.id">
                <td class="bold-text">{{ report.report_types?.name ?? 'General' }}</td>
                <td>{{ report.landmark }}</td>
                <td>{{ report.lineman_names }}</td>
                <td class="muted-text">{{ report.description }}</td>
                <td>
                  <select
                    :value="report.status_id"
                    @change="(e) => handleStatusChange(report, e.target.value)"
                    :class="getStatusClass(report.status_id)"
                    class="status-select"
                  >
                    <option value="1">Pending</option>
                    <option value="2">In Progress</option>
                    <option value="3">Resolved</option>
                  </select>
                </td>
                <td>
                  <button @click="openReassignModal(report)" class="btn-action">Assign</button>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content">
        <h3>Assign Linemen</h3>

        <div
          class="checkbox-list"
          style="max-height: 200px; overflow-y: auto; text-align: left; margin: 1rem 0"
        >
          <p v-if="availableLinemen.length === 0">No linemen available.</p>
          <label
            v-for="l in availableLinemen"
            :key="l.user_id"
            style="display: block; padding: 0.5rem 0; cursor: pointer"
          >
            <input
              type="checkbox"
              :value="l.user_id"
              v-model="newLinemanIds"
              style="margin-right: 0.5rem"
            />
            {{ l.name }}
          </label>
        </div>

        <div class="modal-actions">
          <button @click="showModal = false" class="btn-cancel">Cancel</button>
          <button @click="confirmReassign" class="btn-confirm">Confirm</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { FileText, Zap, CheckCircle, AlertTriangle } from 'lucide-vue-next'
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'
import IncidentChart from '@/components/analytics/IncidentChart.vue'
import TopBarangaysChart from '@/components/analytics/TopBarangaysChart.vue'
import { supabase } from '@/services/supabase'

import '@/assets/style/dashboard.css'

const reports = ref([])
const availableLinemen = ref([])
const showModal = ref(false)
const selectedReport = ref(null)
const newLinemanIds = ref([])
const currentPeriod = ref('Day')

const stats = ref([
  { title: 'Total Reports', value: '0', icon: FileText, trend: 'Reports' },
  { title: 'Active Linemen', value: '0', icon: Zap, trend: 'On Duty' },
  { title: 'Resolved', value: '0', icon: CheckCircle, trend: 'Resolved' },
  { title: 'Pending', value: '0', icon: AlertTriangle, trend: 'Attention' },
])

const getStatusClass = (id) =>
  ({ 1: 'badge-pending', 2: 'badge-progress', 3: 'badge-resolved' })[id] || 'badge-pending'
const gridEfficiency = computed(() => {
  const total = parseInt(stats.value[0].value) || 0
  const resolved = parseInt(stats.value[2].value) || 0
  return total > 0 ? ((resolved / total) * 100).toFixed(1) : 0
})

const fetchReports = async () => {
  const { data, error } = await supabase
    .from('reports')
    .select(
      `id, landmark, description, status_id, report_types(name), assignments(lineman_id, users(first_name, last_name))`,
    )
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching reports:', error)
    return
  }

  reports.value = (data || []).map((r) => {
    const names =
      r.assignments?.length > 0
        ? r.assignments.map((a) => `${a.users.first_name} ${a.users.last_name}`)
        : []

    return {
      ...r,
      lineman_names: names.length > 0 ? [...new Set(names)].join(', ') : 'Unassigned',
    }
  })

  stats.value[0].value = reports.value.length.toString()
  stats.value[2].value = reports.value.filter((r) => r.status_id === 3).length.toString()
  stats.value[3].value = reports.value.filter((r) => r.status_id === 1).length.toString()
}

const fetchLinemen = async () => {
  const { data, error } = await supabase
    .from('employees')
    .select(
      `
      user_id,
      is_available,
      users!inner(first_name, last_name, role_id)
    `,
    )
    .eq('users.role_id', 9)
    .eq('is_available', true)

  if (error) {
    console.error('Error fetching linemen:', error)
    return
  }

  availableLinemen.value = (data || []).map((e) => ({
    user_id: e.user_id,
    name: `${e.users.first_name} ${e.users.last_name}`,
  }))

  const { count } = await supabase
    .from('employees')
    .select('*, users!inner(role_id)', { count: 'exact', head: true })
    .eq('users.role_id', 9)
    .eq('is_available', true)

  stats.value[1].value = (count || 0).toString()
}

const openReassignModal = (report) => {
  selectedReport.value = report
  newLinemanIds.value = report.assignments
    ? [...new Set(report.assignments.map((a) => a.lineman_id))]
    : []
  showModal.value = true
}

const confirmReassign = async () => {
  if (!selectedReport.value) return

  try {
    const { error: deleteError } = await supabase
      .from('assignments')
      .delete()
      .eq('report_id', selectedReport.value.id)

    if (deleteError) throw deleteError

    if (newLinemanIds.value.length > 0) {
      const uniqueIds = [...new Set(newLinemanIds.value)]
      const assignmentsToInsert = uniqueIds.map((id) => ({
        report_id: selectedReport.value.id,
        lineman_id: id,
      }))

      const { error: insertError } = await supabase.from('assignments').insert(assignmentsToInsert)

      if (insertError) throw insertError
    }

    showModal.value = false
    await fetchReports()
  } catch (error) {
    alert('Assignment failed: ' + error.message)
    console.error(error)
  }
}

const handleStatusChange = async (report, newStatusId) => {
  report.status_id = parseInt(newStatusId)
  await supabase.from('reports').update({ status_id: report.status_id }).eq('id', report.id)
  await fetchReports()
}

onMounted(() => {
  fetchReports()
  fetchLinemen()
})
</script>
