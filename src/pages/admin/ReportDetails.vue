<template>
  <div class="dashboard-root">
    <Sidebar />

    <main class="content">
      <!-- Back link -->
      <div class="header-nav">
        <router-link to="/admin/incident" class="back-link">
          &larr; Back to Incident Queue
        </router-link>
      </div>

      <!-- Hero/title bar -->
      <header class="hero-section">
        <div class="hero-header-content">
          <div class="hero-text">
            <h1>Report Details</h1>
            <p>Comprehensive view of outage ticket #{{ report?.id || '---' }}.</p>
          </div>
          <span v-if="report" class="status-badge" :class="getStatusClass(report?.status_id)">
            {{ getStatusName(report?.status_id) }}
          </span>
        </div>
      </header>

      <!-- Loading / empty -->
      <div v-if="loading" class="state-card">
        <p>Loading report details...</p>
      </div>

      <div v-else-if="!report" class="state-card">
        <p>Report not found or invalid ID.</p>
      </div>

      <!-- Main details -->
      <div v-else class="details-grid">
        <!-- LEFT COLUMN: incident + coordinates -->
        <div class="main-info-column">
          <section class="card incident-card">
            <div class="card-header-row">
              <h2>Incident Information</h2>
              <span class="card-subtitle">
                {{ getReportTypeName(report.report_type_id) }}
              </span>
            </div>

            <!-- Boxed fields -->
            <div class="form-field">
              <label>Issue Type</label>
              <div class="form-value">
                {{ getReportTypeName(report.report_type_id) }}
              </div>
            </div>

            <div class="form-field">
              <label>Municipality / City</label>
              <div class="form-value">
                {{ getMunicipalityName(report.municipality_id) }}
              </div>
            </div>

            <div class="form-field">
              <label>Date & Time Reported</label>
              <div class="form-value">
                {{ formatDateTime(report.created_at) }}
              </div>
            </div>

            <div class="form-field">
              <label>Barangay</label>
              <div class="form-value">
                {{ getBarangayName(report.barangay_id) }}
              </div>
            </div>

            <div class="form-field">
              <label>Primary Landmark / Purok</label>
              <div class="form-value">
                {{ report.landmark || 'N/A' }} (Purok: {{ report.purok_sitio || 'N/A' }})
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
              <span>Latitude: {{ report.latitude || '0.0' }}</span>
              <span>Longitude: {{ report.longitude || '0.0' }}</span>
            </div>
          </section>
        </div>

        <!-- RIGHT COLUMN: consumer + evidence -->
        <div class="side-info-column">
          <section class="card consumer-card">
            <div class="card-header-row">
              <h2>Consumer Information</h2>
            </div>

            <div class="form-field">
              <label>Full Name</label>
              <div class="form-value">
                {{ report.customer_name || 'John Lloyd Binuya' }}
              </div>
            </div>

            <div class="form-field">
              <label>Contact Number</label>
              <div class="form-value">0917-888-1234</div>
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
import Sidebar from '@/components/Sidebar.vue'

const route = useRoute()
const report = ref(null)
const loading = ref(true)
const barangayList = ref([])
const reportTypes = ref([])
const evidenceUrls = ref([])

const fetchReportDetails = async () => {
  const reportId = route.params.id
  if (!reportId) {
    loading.value = false
    return
  }

  const { data, error } = await supabase.from('reports').select('*').eq('id', reportId).single()

  if (error) {
    console.error('Error fetching details:', error.message)
  } else {
    report.value = data
    const rawEvidence =
      data.evidence || data.image_url || data.photo_url || data.file_path || data.photo_path
    await fetchEvidenceFiles(rawEvidence)
  }
  loading.value = false
}

const fetchEvidenceFiles = async (fieldValue) => {
  if (!fieldValue) return
  evidenceUrls.value = []

  const paths = Array.isArray(fieldValue) ? fieldValue : [fieldValue]

  for (const item of paths) {
    if (typeof item === 'string' && item.trim() !== '') {
      if (item.startsWith('http')) {
        evidenceUrls.value.push(item)
      } else {
        const { data } = supabase.storage.from('report_photos').getPublicUrl(item)
        if (data?.publicUrl) {
          evidenceUrls.value.push(data.publicUrl)
        }
      }
    }
  }
}

const openImage = (url) => {
  window.open(url, '_blank')
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
  return found ? found.name : 'General Maintenance'
}

const getMunicipalityName = (mId) => {
  return mId === 6 ? 'Echague, Isabela' : 'Alicia, Isabela'
}

const getStatusName = (statusId) => {
  if (statusId === 1) return 'Pending'
  if (statusId === 2) return 'Dispatched'
  return 'Resolved'
}

const getStatusClass = (statusId) => {
  if (statusId === 1) return 'badge-pending'
  if (statusId === 2) return 'badge-dispatched'
  return 'badge-resolved'
}

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString()
}

onMounted(() => {
  fetchLookups()
  fetchReportDetails()
})
</script>

<style scoped>
.dashboard-root {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
  color: #0f172a;
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Inter',
    sans-serif;
}

.content {
  flex-grow: 1;
  padding: 24px 30px 40px;
  max-width: 1200px;
}

/* Back link */
.header-nav {
  margin-bottom: 12px;
}

.back-link {
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
}

/* Reset header defaults */
header {
  margin: 0;
  padding: 0;
  border: none;
}

/* Hero section */
.hero-section {
  margin: 0 0 18px 0;
  padding: 0;
  border-radius: 16px;
  overflow: hidden;
  border: none;
}

/* Larger blue bar */
.hero-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0;
  background: #1f3056;
  box-shadow: 0 4px 18px rgba(15, 23, 42, 0.18);
  border: none;
  min-height: 100px; /* taller header */
}

/* Bigger text */
.hero-text {
  margin: 0;
  padding: 0;
  padding-left: 22px;
}

.hero-text h1 {
  margin: 0;
  font-size: 1.6rem;
  color: #ffffff;
}

.hero-text p {
  margin: 2px 0 0;
  font-size: 0.95rem;
  color: #e2e8f0;
}

/* Bigger badge */
.status-badge {
  margin: 0;
  margin-right: 22px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
}

/* Grid layout */
.details-grid {
  display: grid;
  grid-template-columns: minmax(0, 2.2fr) minmax(0, 1.4fr);
  gap: 18px;
}

.main-info-column,
.side-info-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Cards */
.card {
  background: #ffffff;
  padding: 18px 20px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-header-row h2 {
  margin: 0;
  font-size: 0.95rem;
  color: #0f172a;
}

.card-subtitle {
  font-size: 0.8rem;
  color: #64748b;
}

/* Form-like fields */
.form-field {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}

.form-field label {
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.incident-card .form-field label {
  color: #475569;
}

.consumer-card .form-field label {
  color: #1d4ed8;
}

.form-value {
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  padding: 8px 10px;
  font-size: 0.9rem;
  color: #0f172a;
}

.form-value-long {
  min-height: 60px;
  line-height: 1.4;
}

/* Consumer card: light blue */
.consumer-card {
  background: #e0f2fe;
  border-color: #bfdbfe;
}

/* Coordinates card */
.map-card-section .coordinates-display {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #334155;
  font-family: monospace;
}

/* Evidence gallery */
.evidence-gallery {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.evidence-item {
  width: 100%;
  max-height: 220px;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  cursor: pointer;
}

.evidence-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.evidence-preview-box {
  background: #f8fafc;
  padding: 16px;
  border-radius: 10px;
  border: 1px dashed #cbd5e1;
  text-align: center;
}

.no-evidence-text {
  color: #64748b;
  font-size: 0.85rem;
  margin: 0;
}

/* Status badge colors */
.badge-pending {
  background: #fef3c7;
  color: #92400e;
}

.badge-dispatched {
  background: #dbeafe;
  color: #1e40af;
}

.badge-resolved {
  background: #d1fae5;
  color: #065f46;
}

/* Loading / empty state */
.state-card {
  margin-top: 16px;
  padding: 18px 20px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
  text-align: center;
  color: #64748b;
}
</style>
