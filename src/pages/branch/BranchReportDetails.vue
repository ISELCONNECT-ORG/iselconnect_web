<template>
  <div class="dashboard-root">
    <BranchSidebar />
    <main class="content">
      <Topbar />

      <div class="header-nav">
        <router-link to="/branch/incident" class="back-link">← Back to Incident Queue</router-link>
      </div>

      <div v-if="loading" class="state-card">
        <p>Loading report details...</p>
      </div>

      <div v-else-if="!report" class="state-card">
        <p>Report not found or invalid ID.</p>
      </div>

      <div v-else class="details-grid">
        <div class="main-info-column">
          <section class="card incident-card">
            <div class="card-header-row">
              <div>
                <h2>Incident Information</h2>
                <p class="card-subtitle">{{ report.report_types?.name || 'General Report' }}</p>
              </div>
              <span class="status-pill">{{ report.report_statuses?.name || 'Unknown' }}</span>
            </div>

            <div class="form-field">
              <label>Issue Type</label>
              <div class="form-value">{{ report.report_types?.name || 'General Maintenance' }}</div>
            </div>

            <div class="form-field">
              <label>Municipality / City</label>
              <div class="form-value">{{ report.municipalities?.name || 'Unknown' }}</div>
            </div>

            <div class="form-field">
              <label>Date & Time Reported</label>
              <div class="form-value">{{ formatDateTime(report.created_at) }}</div>
            </div>

            <div class="form-field">
              <label>Barangay</label>
              <div class="form-value">{{ report.barangays?.name || 'Unknown Barangay' }}</div>
            </div>

            <div class="form-field">
              <label>Primary Landmark / Purok</label>
              <div class="form-value">
                {{ report.landmark || 'N/A' }} ({{ report.purok_sitio || 'No purok specified' }})
              </div>
            </div>

            <div class="form-field">
              <label>Technical Description</label>
              <div class="form-value form-value-long">
                {{ report.description || 'No additional details provided.' }}
              </div>
            </div>
          </section>

          <section class="card map-card-section">
            <div class="card-header-row">
              <h2>Location Coordinates</h2>
            </div>
            <div class="coordinates-display">
              <span>Latitude: {{ report.latitude || 'N/A' }}</span>
              <span>Longitude: {{ report.longitude || 'N/A' }}</span>
            </div>
          </section>
        </div>

        <div class="side-info-column">
          <section class="card consumer-card">
            <div class="card-header-row">
              <h2>Consumer Information</h2>
            </div>

            <div class="form-field">
              <label>Full Name</label>
              <div class="form-value">
                {{
                  report.users?.first_name
                    ? `${report.users.first_name} ${report.users.last_name}`
                    : 'Walk-in or anonymous'
                }}
              </div>
            </div>

            <div class="form-field">
              <label>Contact Number</label>
              <div class="form-value">{{ report.contact_number || 'Not available' }}</div>
            </div>
          </section>

          <section class="card evidence-card">
            <div class="card-header-row">
              <h2>Evidence</h2>
            </div>
            <div v-if="evidenceUrls.length > 0" class="evidence-gallery">
              <div v-for="(url, index) in evidenceUrls" :key="index" class="evidence-item">
                <img
                  :src="url"
                  alt="Report Evidence"
                  class="evidence-img"
                  @click="openImage(url)"
                />
              </div>
            </div>
            <div v-else class="evidence-preview-box">
              <p class="no-evidence-text">No uploaded media attachments found.</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/services/supabase'
import BranchSidebar from '@/components/BranchSidebar.vue'

const route = useRoute()
const report = ref(null)
const loading = ref(true)
const evidenceUrls = ref([])

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }
  return new Date(dateString).toLocaleString(undefined, options)
}

const fetchEvidenceFiles = async (rawValue) => {
  if (!rawValue) return

  const values = Array.isArray(rawValue) ? rawValue : [rawValue]
  evidenceUrls.value = []

  for (const item of values) {
    if (typeof item !== 'string' || !item.trim()) continue
    if (item.startsWith('http')) {
      evidenceUrls.value.push(item)
      continue
    }
    const { data } = supabase.storage.from('report_photos').getPublicUrl(item)
    if (data?.publicUrl) {
      evidenceUrls.value.push(data.publicUrl)
    }
  }
}

const fetchReportDetails = async () => {
  const reportId = route.params.id
  loading.value = true

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    console.error('Unable to load branch user for report details:', userError)
    loading.value = false
    return
  }

  const { data: userData, error: branchError } = await supabase
    .from('users')
    .select('branch_id')
    .eq('id', user.id)
    .single()

  if (branchError || !userData?.branch_id) {
    console.error('Unable to load current branch data:', branchError)
    loading.value = false
    return
  }

  const { data, error } = await supabase
    .from('reports')
    .select(
      '*, users(first_name, last_name), report_statuses(name), report_types(name), barangays(name), municipalities(name)',
    )
    .eq('id', reportId)
    .eq('branch_id', userData.branch_id)
    .single()

  if (error || !data) {
    console.error('Error fetching branch report details:', error?.message)
    loading.value = false
    return
  }

  report.value = data
  await fetchEvidenceFiles(data.photo_url || data.evidence || data.image_url)
  loading.value = false
}

const openImage = (url) => {
  window.open(url, '_blank')
}

onMounted(fetchReportDetails)
</script>

<style scoped>
.dashboard-root {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
  color: #0f172a;
}
.content {
  flex-grow: 1;
  padding: 24px 30px 40px;
  max-width: 1200px;
}
.header-nav {
  margin-bottom: 20px;
}
.back-link {
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
}
.state-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}
.details-grid {
  display: grid;
  grid-template-columns: 1.7fr 1fr;
  gap: 24px;
}
.card {
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  padding: 22px;
}
.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 18px;
}
.card-subtitle {
  color: #64748b;
  font-size: 0.9rem;
}
.status-pill {
  background: #e0f2fe;
  color: #0369a1;
  padding: 8px 12px;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 600;
}
.form-field {
  margin-bottom: 18px;
}
.form-field label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
}
.form-value {
  color: #0f172a;
  font-size: 0.95rem;
  line-height: 1.7;
}
.form-value-long {
  white-space: pre-wrap;
}
.coordinates-display {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 12px 0 0;
}
.evidence-gallery {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.evidence-item {
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
}
.evidence-img {
  width: 100%;
  height: 140px;
  object-fit: cover;
}
.no-evidence-text {
  margin: 0;
  color: #64748b;
}
</style>
