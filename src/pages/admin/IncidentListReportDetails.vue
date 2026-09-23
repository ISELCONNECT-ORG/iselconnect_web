<!-- IncidentListReportDetails.vue -->
<template>
  <div class="dashboard-root">
    <Sidebar />

    <main class="content">
      <Topbar />
      <!-- Top Hero Banner -->
      <div class="hero-banner">
        <div class="hero-left">
          <router-link to="/admin/incident-list" class="back-btn">
            &larr; BACK TO INCIDENT QUEUE
          </router-link>
          <div class="hero-titles">
            <h1>PENDING REPORT DETAILS</h1>
            <p>Review incident information before accepting to active queue</p>
          </div>
        </div>
        <div class="hero-right" style="display: flex; gap: 12px; align-items: center">
          <button
            v-if="report && report.status_id === 1"
            @click="promptAccept"
            class="hero-accept-btn"
          >
            <CheckCircle :size="16" /> ACCEPT REPORT
          </button>
          <button
            v-if="report && report.status_id === 1"
            @click="promptReject"
            class="hero-reject-btn"
          >
            <XCircle :size="16" /> REJECT
          </button>
          <span class="status-pill">{{ getStatusName(report?.status_id) }}</span>
        </div>
      </div>

      <!-- Loading / empty states -->
      <div v-if="loading" class="info-card">
        <p>Loading report details...</p>
      </div>

      <div v-else-if="!report" class="info-card">
        <p>Report not found or invalid ID.</p>
      </div>

      <!-- Main Layout -->
      <div v-else class="details-container">
        <!-- ROW 1: Details & Reporter -->
        <div class="details-top-row">
          <div class="info-card">
            <h3>Report Details</h3>
            <div class="grid-2-col">
              <div class="data-group">
                <label>ISSUE TYPE</label>
                <p>{{ getReportTypeName(report.report_type_id) }}</p>
              </div>
              <div class="data-group">
                <label>DATE & TIME</label>
                <p>{{ formatDateTime(report.created_at) }}</p>
              </div>
              <div class="data-group">
                <label>MUNICIPALITY</label>
                <p>{{ getMunicipalityName(report.municipality_id) }}</p>
              </div>
              <div class="data-group">
                <label>BARANGAY</label>
                <p>{{ getBarangayName(report.barangay_id) }}</p>
              </div>
            </div>
            <div class="data-group">
              <label>LANDMARK</label>
              <p>{{ report.landmark || 'N/A' }} (Purok: {{ report.purok_sitio || 'N/A' }})</p>
            </div>
            <div class="data-group" style="margin-top: 16px">
              <label>DESCRIPTION</label>
              <p>{{ report.description || 'No description provided' }}</p>
            </div>
          </div>

          <div class="info-card">
            <h3>Reporter Information</h3>
            <div class="data-group" style="margin-bottom: 16px">
              <label>FULL NAME</label>
              <div class="gray-box">{{ reporterName }}</div>
            </div>
            <div class="data-group">
              <label>CONTACT NUMBER</label>
              <div class="gray-box">{{ reporterContact }}</div>
            </div>
          </div>
        </div>

        <!-- ROW 2: Evidence & Map -->
        <div class="evidence-map-row">
          <div class="info-card">
            <h3>Incident Evidence</h3>
            <img
              v-if="evidenceUrls.length > 0"
              :src="evidenceUrls[0]"
              alt="Incident Evidence"
              class="img-box"
              @click="openImage(evidenceUrls[0])"
            />
            <div v-else class="no-img-box">No Image Provided</div>
          </div>

          <div class="info-card map-card">
            <h3>Location Map</h3>
            <div class="map-wrapper">
              <div id="staticLocationMap" class="map-box"></div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Dynamic Confirmation Modal (Handles both Accept and Reject) -->
    <div v-if="showConfirmModal" class="modal-overlay" @click.self="showConfirmModal = false">
      <div class="confirm-modal">
        <div class="modal-header">
          <h2>{{ modalActionType === 'accept' ? 'Confirm Approval' : 'Confirm Rejection' }}</h2>
        </div>
        <div class="modal-body">
          <div class="modal-text-content">
            <h3>
              {{
                modalActionType === 'accept'
                  ? 'Are you sure you want to accept this report?'
                  : 'Are you sure you want to reject this report?'
              }}
            </h3>
            <p>
              {{
                modalActionType === 'accept'
                  ? 'This action will officially accept the report and move it to the "On Queue" status for dispatching.'
                  : 'This action will reject the report and remove it from the pending queue.'
              }}
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showConfirmModal = false">Cancel</button>
          <button
            :class="modalActionType === 'accept' ? 'btn-verify' : 'btn-reject-modal'"
            @click="executeAction"
          >
            {{ modalActionType === 'accept' ? 'Approve' : 'Reject' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/services/supabase'
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'
import { CheckCircle, XCircle } from 'lucide-vue-next'
import { useSystemAlerts } from '@/composables/useSystemAlerts'

import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const route = useRoute()
const router = useRouter()
const { addAlert } = useSystemAlerts()

const report = ref(null)
const loading = ref(true)
const barangayList = ref([])
const reportTypes = ref([])
const evidenceUrls = ref([])
const showConfirmModal = ref(false)
const modalActionType = ref('') // 'accept' or 'reject'
const reporterName = ref('JOHN LLOYD BINUYA')
const reporterContact = ref('0917-888-1234')

let mapInstance = null

const fetchReportDetails = async () => {
  const reportId = route.params.id
  if (!reportId) {
    loading.value = false
    return
  }

  const { data, error } = await supabase
    .from('reports')
    .select(
      `
      *,
      users:residents_id(first_name, last_name, mobile_number)
    `,
    )
    .eq('id', reportId)
    .single()

  if (error) {
    console.error('Error fetching details:', error.message)
  } else {
    report.value = data
    if (data.users) {
      reporterName.value = `${data.users.first_name} ${data.users.last_name}`
      reporterContact.value = data.users.mobile_number || 'N/A'
    } else if (data.customer_name) {
      reporterName.value = data.customer_name
    }

    const rawEvidence =
      data.evidence || data.image_url || data.photo_url || data.file_path || data.photo_path
    await fetchEvidenceFiles(rawEvidence)
  }

  loading.value = false
  await nextTick()
  initStaticMap()
}

const fetchEvidenceFiles = async (fieldValue) => {
  if (!fieldValue) return
  evidenceUrls.value = []
  const paths = Array.isArray(fieldValue) ? fieldValue : [fieldValue]
  for (const item of paths) {
    if (typeof item === 'string' && item.trim() !== '') {
      if (item.startsWith('http')) evidenceUrls.value.push(item)
      else {
        const { data } = supabase.storage.from('report_photos').getPublicUrl(item)
        if (data?.publicUrl) evidenceUrls.value.push(data.publicUrl)
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
  return found ? found.name : 'Unknown'
}

const getReportTypeName = (id) => {
  const found = reportTypes.value.find((t) => t.id === id)
  return found ? found.name : 'General Maintenance'
}

const getMunicipalityName = (mId) => {
  return mId === 6 ? 'Echague' : 'Alicia'
}

const getStatusName = (statusId) => {
  if (statusId === 1) return 'PENDING'
  if (statusId === 2) return 'IN PROGRESS'
  if (statusId === 4) return 'VERIFICATION'
  if (statusId === 5) return 'REJECTED'
  if (statusId === 6) return 'RESOLVED'
  if (statusId === 7) return 'ON QUEUE'
  return 'UNKNOWN'
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Map Initialization (Static Location Only)
const initStaticMap = () => {
  const mapElement = document.getElementById('staticLocationMap')
  if (!mapElement || !report.value) return

  const reportLat = report.value.latitude ? parseFloat(report.value.latitude) : 16.716173
  const reportLon = report.value.longitude ? parseFloat(report.value.longitude) : 121.678825

  if (!mapInstance) {
    mapInstance = L.map('staticLocationMap').setView([reportLat, reportLon], 16)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(mapInstance)

    const issueIcon = L.divIcon({
      className: 'custom-leaflet-marker',
      html: `<div style="background-color: #facc15; width: 16px; height: 16px; border-radius: 50%; border: 2px solid #1e1b4b; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    })

    L.marker([reportLat, reportLon], { icon: issueIcon })
      .addTo(mapInstance)
      .bindPopup('<b>Issue Location</b>')
      .openPopup()
  }
}

// Action Trigger Methods
const promptAccept = () => {
  modalActionType.value = 'accept'
  showConfirmModal.value = true
}

const promptReject = () => {
  modalActionType.value = 'reject'
  showConfirmModal.value = true
}

// Unified Action Execution
const executeAction = async () => {
  if (!report.value) return

  if (modalActionType.value === 'accept') {
    const { error } = await supabase
      .from('reports')
      .update({ status_id: 7 })
      .eq('id', report.value.id)

    if (!error) {
      addAlert({
        title: 'System Confirmation',
        message: `Report in ${getBarangayName(report.value.barangay_id)} accepted and moved to On Queue.`,
        severity: 'low',
      })
      router.push('/admin/incident-list')
    } else {
      alert('Failed to accept report: ' + error.message)
    }
  } else if (modalActionType.value === 'reject') {
    const { error } = await supabase
      .from('reports')
      .update({ status_id: 5 })
      .eq('id', report.value.id)

    if (!error) {
      addAlert({
        title: 'System Confirmation',
        message: 'Report was rejected and removed from pending.',
        severity: 'low',
      })
      router.push('/admin/incident-list')
    } else {
      alert('Failed to reject report: ' + error.message)
    }
  }
}

onMounted(() => {
  fetchLookups()
  fetchReportDetails()
})

onUnmounted(() => {
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }
})
</script>

<style scoped>
.dashboard-root {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
  font-family: 'Inter', sans-serif;
  color: #0f172a;
}

.content {
  flex-grow: 1;
  padding: 0 30px 40px;
}

/* HERO BANNER */
.hero-banner {
  background: #1e1b4b;
  border-radius: 12px;
  padding: 24px 32px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}
.hero-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}
.back-btn {
  background: #fde047;
  color: #1e1b4b;
  padding: 6px 16px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-decoration: none;
}
.hero-titles h1 {
  color: white;
  margin: 0 0 4px 0;
  font-size: 1.8rem;
  text-transform: uppercase;
}
.hero-titles p {
  color: #cbd5e1;
  margin: 0;
  font-size: 0.9rem;
}
.status-pill {
  background: #fde047;
  color: #1e1b4b;
  padding: 8px 20px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
}
.hero-accept-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.2s;
}
.hero-accept-btn:hover {
  background: #059669;
}

.hero-reject-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.2s;
}
.hero-reject-btn:hover {
  background: #dc2626;
}

/* DETAILS TOP ROW */
.details-top-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}
.info-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e2e8f0;
}
.info-card h3 {
  color: #1e1b4b;
  font-size: 1.1rem;
  margin: 0 0 20px 0;
}
.grid-2-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}
.data-group label {
  display: block;
  font-size: 0.65rem;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 700;
  margin-bottom: 4px;
}
.data-group p {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #0f172a;
}
.gray-box {
  background: #f1f5f9;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #0f172a;
}

/* EVIDENCE & MAP ROW */
.evidence-map-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}
.img-box {
  width: 100%;
  height: 350px;
  border-radius: 8px;
  object-fit: cover;
  cursor: pointer;
}
.no-img-box {
  width: 100%;
  height: 350px;
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 16px;
  background: #f8fafc;
}
.map-card {
  display: flex;
  flex-direction: column;
}
.map-wrapper {
  flex-grow: 1;
  min-height: 350px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}
.map-box {
  width: 100%;
  height: 100%;
}

/* CONFIRMATION MODAL */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.confirm-modal {
  background: white;
  width: 100%;
  max-width: 420px;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.modal-header {
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #f1f5f9;
}
.modal-header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e1b4b;
}
.modal-body {
  padding: 24px;
  background: #f8fafc;
}
.modal-text-content h3 {
  margin: 0 0 8px 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
}
.modal-text-content p {
  margin: 0;
  font-size: 0.9rem;
  color: #475569;
  line-height: 1.5;
}
.modal-footer {
  padding: 16px 24px;
  background: white;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid #e2e8f0;
}
.btn-cancel {
  background: white;
  border: 1px solid #cbd5e1;
  color: #1e1b4b;
  font-weight: 600;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-cancel:hover {
  background: #f1f5f9;
}
.btn-verify {
  background: #1e1b4b;
  border: none;
  color: white;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-verify:hover {
  background: #312e81;
}

.btn-reject-modal {
  background: #ef4444;
  border: none;
  color: white;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-reject-modal:hover {
  background: #dc2626;
}
</style>
