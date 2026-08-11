<template>
  <div class="dashboard-root">
    <Sidebar />

    <main class="content">
      <!-- Top Hero Banner -->
      <div class="hero-section">
        <div class="hero-top-row">
          <router-link to="/admin/incident" class="back-pill-btn">
            &larr; BACK TO INCIDENT QUEUE
          </router-link>
        </div>
        <div class="hero-content-row">
          <div class="hero-texts">
            <h1>REPORT DETAILS</h1>
            <p>Comprehensive view and live LocationIQ road-snapped route tracking</p>
          </div>
          <div class="hero-actions-right">
            <span class="hero-status-pill">{{ getStatusName(report?.status_id) }}</span>
          </div>
        </div>
      </div>

      <!-- Loading / empty states -->
      <div v-if="loading" class="state-card">
        <p>Loading report details...</p>
      </div>

      <div v-else-if="!report" class="state-card">
        <p>Report not found or invalid ID.</p>
      </div>

      <!-- Main Layout: 3 Explicit Rows for Perfect Height Matching -->
      <div v-else class="page-rows-container">
        <!-- ROW 1: Report Details (Left) | Personal Info (Right) -->
        <div class="grid-row">
          <section class="card-box flex-col">
            <h2 class="section-title">REPORT DETAILS</h2>

            <div class="form-row-2">
              <div class="field-group">
                <label>ISSUE TYPE</label>
                <div class="field-value">{{ getReportTypeName(report.report_type_id) }}</div>
              </div>
              <div class="field-group">
                <label>DATE</label>
                <div class="field-value">{{ formatDateOnly(report.created_at) }}</div>
              </div>
            </div>

            <div class="form-row-2">
              <div class="field-group">
                <label>MUNICIPALITY</label>
                <div class="field-value">{{ getMunicipalityName(report.municipality_id) }}</div>
              </div>
              <div class="field-group">
                <label>TIME</label>
                <div class="field-value">{{ formatTimeOnly(report.created_at) }}</div>
              </div>
            </div>

            <div class="form-row-split">
              <div class="field-group">
                <label>BARANGAY</label>
                <div class="field-value">{{ getBarangayName(report.barangay_id) }}</div>
              </div>
              <div class="field-group flex-grow-desc">
                <label>DESCRIPTION</label>
                <div class="field-value desc-value">{{ report.description || 'N/A' }}</div>
              </div>
            </div>

            <div class="field-group" style="margin-top: 10px">
              <label>LANDMARK</label>
              <div class="field-value">
                {{ report.landmark || 'N/A' }} (Purok: {{ report.purok_sitio || 'N/A' }})
              </div>
            </div>
          </section>

          <section class="card-box consumer-dark-card flex-col">
            <h2 class="section-title white-title center-title">PERSONAL INFORMATION</h2>
            <div class="divider-line"></div>
            <div class="consumer-block flex-grow-block">
              <label class="center-label">FULL NAME</label>
              <div class="consumer-name-box">{{ report.customer_name || 'JOHN LLOYD BINUYA' }}</div>
            </div>
            <div class="consumer-block flex-grow-block">
              <label class="center-label">CONTACT NUMBER</label>
              <div class="consumer-name-box">0917-888-1234</div>
            </div>
          </section>
        </div>

        <!-- ROW 2: Evidence (Left) | Remarks & Button (Right) -->
        <div class="grid-row">
          <div class="evidence-split">
            <section class="card-box evidence-card-box">
              <h2 class="section-title center-title">INCIDENT EVIDENCE</h2>
              <div class="image-wrapper">
                <div
                  v-if="evidenceUrls.length > 0"
                  class="image-container"
                  @click="openImage(evidenceUrls[0])"
                >
                  <img :src="evidenceUrls[0]" alt="Incident Evidence" class="actual-img" />
                </div>
                <div v-else class="image-container placeholder-container">
                  <span class="watermark-text">No Image Yet</span>
                </div>
              </div>
            </section>

            <section class="card-box evidence-card-box">
              <h2 class="section-title center-title">RESOLVED EVIDENCE</h2>
              <div class="image-wrapper">
                <div
                  v-if="resolvedPhotoUrl"
                  class="image-container"
                  @click="openImage(resolvedPhotoUrl)"
                >
                  <img :src="resolvedPhotoUrl" alt="Resolved Evidence" class="actual-img" />
                </div>
                <div v-else class="image-container placeholder-container">
                  <span class="watermark-text">No Resolved Image Yet</span>
                </div>
              </div>
            </section>
          </div>

          <div class="remarks-split">
            <section class="card-box remarks-card-box">
              <h2 class="section-title center-title">REMARKS</h2>
              <div class="remarks-container">
                <p class="remarks-text">{{ report?.remarks || '' }}</p>
              </div>
            </section>

            <button
              v-if="(!assignment || !assignment.is_verified_by_admin) && report?.status_id !== 6"
              :disabled="!resolvedPhotoUrl"
              @click="validateResolution"
              class="verify-report-bottom-btn"
              :class="{ 'disabled-btn': !resolvedPhotoUrl }"
            >
              VERIFY REPORT
            </button>
            <div v-else class="verify-report-bottom-btn verified-state">VERIFIED REPORT</div>
          </div>
        </div>

        <!-- ROW 3: Map (Left) | Timeline (Right) -->
        <div class="grid-row">
          <section class="card-box map-card flex-col">
            <h2 class="section-title">LIVE LOCATIN MAP</h2>
            <div class="map-wrapper flex-grow-block">
              <div id="liveTrackingMap" class="map-box"></div>
            </div>
            <div class="map-legend-row">
              <span class="legend-pill"><span class="circle-dot issue-dot"></span></span>
              <span class="legend-pill"><span class="circle-dot lineman-dot"></span></span>
            </div>
          </section>

          <section class="timeline-outer-card">
            <h2 class="timeline-main-title center-title">TIMELINE</h2>
            <div class="timeline-inner-card">
              <div class="timeline-tree">
                <div
                  v-for="(milestone, idx) in lifecycleMilestones"
                  :key="idx"
                  class="timeline-node-row"
                >
                  <div class="timeline-time-col">
                    <span class="t-date">{{ milestone.date || 'PENDING' }}</span>
                    <span class="t-time">{{ milestone.time || '--:--' }}</span>
                  </div>
                  <div class="timeline-center-col">
                    <div
                      class="node-bullet"
                      :class="{ completed: milestone.done, active: milestone.active }"
                    ></div>
                    <div
                      v-if="idx !== lifecycleMilestones.length - 1"
                      class="node-connector"
                      :class="{ 'connector-active': milestone.done }"
                    ></div>
                  </div>
                  <div class="timeline-text-col">
                    <h4 class="t-title" :class="{ 'text-muted': !milestone.done }">
                      {{ milestone.title }}
                    </h4>
                    <p class="t-desc">{{ milestone.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/services/supabase'
import Sidebar from '@/components/Sidebar.vue'

import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const route = useRoute()
const report = ref(null)
const assignment = ref(null)
const loading = ref(true)
const barangayList = ref([])
const reportTypes = ref([])
const evidenceUrls = ref([])
const resolvedPhotoUrl = ref(null)

const LOCATIONIQ_TOKEN = import.meta.env.VITE_LOCATIONIQ_TOKEN
let mapInstance = null
let issueMarker = null
let linemanMarker = null
let routePolyline = null
let refreshInterval = null
let realtimeChannel = null

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

    const resolvedPhotoPath =
      data.resolved_photo_url || data.resolved_evidence || data.resolved_photo_path
    await fetchResolvedPhoto(resolvedPhotoPath)
  }

  const { data: assignData, error: assignError } = await supabase
    .from('assignments')
    .select('*')
    .eq('report_id', reportId)
    .order('assigned_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!assignError && assignData) {
    assignment.value = assignData
    if (!resolvedPhotoUrl.value) {
      const assignPhotoPath =
        assignData.resolved_photo_url || assignData.resolved_evidence || assignData.photo_url
      if (assignPhotoPath) {
        await fetchResolvedPhoto(assignPhotoPath)
      }
    }
  }

  loading.value = false
  await nextTick()
  initLiveMap()
  setupRealtimeTracking()
}

const refreshLinemanLocation = async () => {
  if (!report.value) return
  const reportId = route.params.id
  if (!reportId) return

  const { data: assignData, error: assignError } = await supabase
    .from('assignments')
    .select('*')
    .eq('report_id', reportId)
    .order('assigned_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!assignError && assignData && mapInstance) {
    assignment.value = assignData

    const reportLat = report.value.latitude ? parseFloat(report.value.latitude) : 16.716173
    const reportLon = report.value.longitude ? parseFloat(report.value.longitude) : 121.678825

    const linemanLat =
      assignData.current_lat !== null && assignData.current_lat !== undefined
        ? parseFloat(assignData.current_lat)
        : reportLat

    const linemanLon =
      assignData.current_lon !== null && assignData.current_lon !== undefined
        ? parseFloat(assignData.current_lon)
        : reportLon

    if (issueMarker) {
      issueMarker.setLatLng([reportLat, reportLon])
    }

    if (linemanMarker) {
      linemanMarker.setLatLng([linemanLat, linemanLon])
    } else {
      const linemanIcon = L.divIcon({
        className: 'custom-lineman-marker',
        html: `<div style="background:#2e3192;width:20px;height:20px;border-radius:50%;border:2px solid #ffffff;box-shadow:0 0 8px rgba(0,0,0,0.4);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      })
      linemanMarker = L.marker([linemanLat, linemanLon], {
        icon: linemanIcon,
        zIndexOffset: 1000,
      })
        .addTo(mapInstance)
        .bindPopup('<b>Lineman Current Location</b>')
    }

    try {
      if (linemanLat === reportLat && linemanLon === reportLon) throw new Error('Same coordinates')

      const response = await fetch(
        `https://us1.locationiq.com/v1/directions/driving/${linemanLon},${linemanLat};${reportLon},${reportLat}?key=${LOCATIONIQ_TOKEN}&geometries=geojson`,
      )
      const data = await response.json()
      if (data.routes && data.routes[0]) {
        const routeCoords = data.routes[0].geometry.coordinates.map((c) => [c[1], c[0]])
        if (routePolyline) {
          routePolyline.setLatLngs(routeCoords)
        } else {
          routePolyline = L.polyline(routeCoords, {
            color: '#2e3192',
            weight: 5,
            opacity: 0.8,
          }).addTo(mapInstance)
        }
      } else {
        const fallbackCoords = [
          [linemanLat, linemanLon],
          [reportLat, reportLon],
        ]
        if (routePolyline) {
          routePolyline.setLatLngs(fallbackCoords)
        } else {
          routePolyline = L.polyline(fallbackCoords, {
            color: '#2e3192',
            weight: 5,
            dashArray: '10, 10',
            opacity: 0.8,
          }).addTo(mapInstance)
        }
      }
    } catch (err) {
      const fallbackCoords = [
        [linemanLat, linemanLon],
        [reportLat, reportLon],
      ]
      if (routePolyline) {
        routePolyline.setLatLngs(fallbackCoords)
      } else {
        routePolyline = L.polyline(fallbackCoords, {
          color: '#2e3192',
          weight: 5,
          dashArray: '10, 10',
          opacity: 0.8,
        }).addTo(mapInstance)
      }
    }
  }
}

const setupRealtimeTracking = () => {
  if (!assignment.value?.id) return
  const assignmentId = assignment.value.id

  realtimeChannel = supabase
    .channel(`tracking_${assignmentId}_${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'assignments',
        filter: `id=eq.${assignmentId}`,
      },
      (payload) => {
        if (payload.new.current_lat !== undefined && payload.new.current_lon !== undefined) {
          refreshLinemanLocation()
        }
      },
    )
    .subscribe()
}

const initLiveMap = async () => {
  const mapElement = document.getElementById('liveTrackingMap')
  if (!mapElement || !report.value) return

  const reportLat = report.value.latitude ? parseFloat(report.value.latitude) : 16.716173
  const reportLon = report.value.longitude ? parseFloat(report.value.longitude) : 121.678825

  if (!mapInstance) {
    mapInstance = L.map('liveTrackingMap', { zoomControl: false }).setView(
      [reportLat, reportLon],
      16,
    )

    L.tileLayer(
      `https://{s}-tiles.locationiq.com/v3/streets/r/{z}/{x}/{y}.png?key=${LOCATIONIQ_TOKEN}`,
      {
        maxZoom: 19,
        attribution: '&copy; LocationIQ & OpenStreetMap',
      },
    ).addTo(mapInstance)

    const issueIcon = L.divIcon({
      className: 'custom-leaflet-marker',
      html: `<div style="background-color: #fde047; width: 20px; height: 20px; border-radius: 50%; border: 2px solid #1e1b4b; box-shadow: 0 4px 8px rgba(0,0,0,0.4);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    })
    issueMarker = L.marker([reportLat, reportLon], { icon: issueIcon })
      .addTo(mapInstance)
      .bindPopup('<b>Issue Location</b>')
  }

  await refreshLinemanLocation()
}

const lifecycleMilestones = computed(() => {
  const rep = report.value
  const assign = assignment.value

  const hasCreated = !!rep?.created_at
  const hasReviewed = rep?.status_id > 1 || hasCreated
  const hasAssigned = !!assign?.assigned_at || hasReviewed
  const hasInProgress = !!assign?.inprogress_at || hasAssigned
  const hasResolved = !!assign?.completion_at || !!resolvedPhotoUrl.value || rep?.status_id >= 4
  const hasVerified =
    !!assign?.is_verified_by_admin || !!assign?.verified_at || rep?.status_id === 6

  const fallbackTime = rep?.updated_at || rep?.created_at

  return [
    {
      title: 'REPORT CREATED',
      description: 'Incident ticket initially submitted by resident.',
      done: hasCreated,
      active: hasCreated && !hasAssigned,
      date: formatDate(rep?.created_at),
      time: formatTime(rep?.created_at),
    },
    {
      title: 'REVIEW STATUS',
      description: hasReviewed
        ? 'Admin evaluated and processed the report.'
        : 'Awaiting administrative action.',
      done: hasReviewed,
      active: hasCreated && !hasReviewed,
      date: formatDate(rep?.updated_at || rep?.created_at),
      time: formatTime(rep?.updated_at || rep?.created_at),
    },
    {
      title: 'ASSIGNED LINEMAN',
      description: hasAssigned
        ? 'Outage ticket dispatched to field team.'
        : 'Pending lineman allocation.',
      done: hasAssigned,
      active: hasReviewed && !hasAssigned,
      date: formatDate(assign?.assigned_at || fallbackTime),
      time: formatTime(assign?.assigned_at || fallbackTime),
    },
    {
      title: 'IN PROGRESS LINEMAN',
      description: hasInProgress
        ? 'Lineman is currently on-site or working.'
        : 'Pending field work start.',
      done: hasInProgress,
      active: hasAssigned && !hasInProgress,
      date: formatDate(assign?.inprogress_at || assign?.assigned_at || fallbackTime),
      time: formatTime(assign?.inprogress_at || assign?.assigned_at || fallbackTime),
    },
    {
      title: 'RESOLVED REPORT',
      description: hasResolved
        ? 'Repair work finished and photo uploaded.'
        : 'Repair work currently ongoing.',
      done: hasResolved,
      active: hasInProgress && !hasResolved,
      date: formatDate(assign?.completion_at || fallbackTime),
      time: formatTime(assign?.completion_at || fallbackTime),
    },
    {
      title: 'VALIDATED BY ADMIN',
      description: hasVerified
        ? 'Admin verified resolution and officially closed ticket.'
        : 'Drafting final administrative sign-off.',
      done: hasVerified,
      active: hasResolved && !hasVerified,
      date: formatDate(assign?.verified_at || fallbackTime),
      time: formatTime(assign?.verified_at || fallbackTime),
    },
  ]
})

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
        if (data?.publicUrl) evidenceUrls.value.push(data.publicUrl)
      }
    }
  }
}

const fetchResolvedPhoto = async (fieldValue) => {
  if (!fieldValue) {
    resolvedPhotoUrl.value = null
    return
  }
  if (typeof fieldValue === 'string' && fieldValue.startsWith('http')) {
    resolvedPhotoUrl.value = fieldValue
  } else {
    const { data } = supabase.storage.from('report_photos').getPublicUrl(fieldValue)
    resolvedPhotoUrl.value = data?.publicUrl || null
  }
}

const validateResolution = async () => {
  if (!report.value || !resolvedPhotoUrl.value) return
  const currentTime = new Date().toISOString()

  let assignError = null
  if (assignment.value) {
    const { error } = await supabase
      .from('assignments')
      .update({ is_verified_by_admin: true, verified_at: currentTime })
      .eq('id', assignment.value.id)
    assignError = error
  }

  const { error: repError } = await supabase
    .from('reports')
    .update({ status_id: 6, updated_at: currentTime })
    .eq('id', report.value.id)

  if (assignError || repError) {
    alert('Failed to validate report: ' + (assignError?.message || repError?.message))
  } else {
    alert('Report successfully validated by admin!')
    fetchReportDetails()
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
  return mId === 6 ? 'Echague, Isabela' : 'Alicia, Isabela'
}

const getStatusName = (statusId) => {
  if (statusId === 1) return 'PENDING'
  if (statusId === 2) return 'IN PROGRESS'
  if (statusId === 4) return 'PENDING VERIFICATION'
  if (statusId === 5) return 'REJECTED'
  if (statusId === 6) return 'RESOLVED'
  return 'IN PROGRESS'
}

const formatDateOnly = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase()
}

const formatTimeOnly = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

const formatDate = (dateStr) => {
  if (!dateStr) return null
  return new Date(dateStr)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase()
}

const formatTime = (dateStr) => {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

onMounted(() => {
  fetchLookups()
  fetchReportDetails()

  refreshInterval = setInterval(() => {
    refreshLinemanLocation()
  }, 5000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel)
  }
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
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Inter',
    sans-serif;
  color: #1e1b4b;
}

.content {
  flex-grow: 1;
  padding: 24px 30px 40px;
  overflow-x: hidden;
}

/* Hero Section */
.hero-section {
  background:
    linear-gradient(135deg, rgba(30, 27, 75, 0.85) 0%, rgba(30, 27, 75, 0.95) 100%),
    url('@/assets/Background/bannerdashboard.jpg') no-repeat center center;
  background-size: cover;
  padding: 24px 32px;
  border-radius: 12px;
  border: 1px solid #cbd5e1;
  margin-bottom: 24px;
  box-shadow: 0 8px 20px rgba(30, 27, 75, 0.15);
}

.hero-top-row {
  margin-bottom: 12px;
}

.back-pill-btn {
  display: inline-block;
  background: #fde047;
  color: #1e1b4b;
  font-weight: 800;
  text-decoration: none;
  font-size: 0.75rem;
  padding: 6px 16px;
  border-radius: 999px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.hero-content-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hero-texts h1 {
  margin: 0 0 4px;
  font-size: 1.8rem;
  color: #ffffff;
  font-weight: 900;
  letter-spacing: 0.5px;
}

.hero-texts p {
  margin: 0;
  font-size: 0.85rem;
  color: #cbd5e1;
}

.hero-actions-right {
  display: flex;
  align-items: center;
}

.hero-status-pill {
  background: #fde047;
  color: #1e1b4b;
  padding: 8px 20px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 900;
  letter-spacing: 0.5px;
}

.state-card {
  background: #ffffff;
  padding: 30px;
  border-radius: 12px;
  text-align: center;
  border: 1px solid #cbd5e1;
  color: #475569;
  font-weight: 600;
}

/* Page Rows Setup - Grid to match equal heights */
.page-rows-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.grid-row {
  display: grid;
  grid-template-columns: 1.85fr 1fr;
  gap: 20px;
  align-items: stretch;
}

/* Universal Card Box styling */
.card-box {
  background: #f1f5f9;
  border-radius: 8px;
  border: 2px solid #a5b4fc;
  padding: 20px;
}

.flex-col {
  display: flex;
  flex-direction: column;
}

.flex-grow-block {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.flex-grow-desc {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 1rem;
  color: #2e3192;
  font-weight: 900;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.center-title {
  text-align: center;
}

.white-title {
  color: #ffffff;
}

/* Form Layout */
.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.form-row-split {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 12px;
  margin-bottom: 12px;
  flex-grow: 1;
}

.field-group {
  display: flex;
  flex-direction: column;
}

.field-group label {
  font-size: 0.65rem;
  font-weight: 900;
  color: #2e3192;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.field-value {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 10px 12px;
  font-size: 0.85rem;
  font-weight: 800;
  color: #1e1b4b;
  min-height: 20px;
  flex-grow: 1;
}

.desc-value {
  white-space: pre-wrap;
}

/* Evidence Row Split */
.evidence-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.remarks-split {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.evidence-card-box {
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.remarks-card-box {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.image-wrapper {
  flex-grow: 1;
  display: flex;
}

.image-container {
  width: 100%;
  min-height: 220px;
  border-radius: 4px;
  border: 2px solid #cbd5e1;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  cursor: pointer;
}

.actual-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder-container {
  cursor: default;
}

.watermark-text {
  font-size: 2.2rem;
  font-weight: 900;
  color: #000000;
  letter-spacing: 2px;
  line-height: 1.1;
  text-align: center;
}

.remarks-container {
  flex-grow: 1;
  width: 100%;
  border-radius: 4px;
  border: 2px solid #cbd5e1;
  background: #ffffff;
  padding: 12px;
  overflow-y: auto;
}

.remarks-text {
  margin: 0;
  font-size: 0.85rem;
  color: #1e1b4b;
  font-weight: 700;
  white-space: pre-wrap;
}

/* Bottom Button */
.verify-report-bottom-btn {
  width: 100%;
  background: #2e3192;
  color: #ffffff;
  border: none;
  padding: 14px 10px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 900;
  cursor: pointer;
  text-align: center;
  text-transform: uppercase;
  transition: all 0.2s ease;
}

.verify-report-bottom-btn:hover:not(:disabled) {
  background: #1e1b4b;
}

.verify-report-bottom-btn:disabled,
.verify-report-bottom-btn.disabled-btn {
  background: #94a3b8;
  color: #f8fafc;
  cursor: not-allowed;
  opacity: 0.8;
}

.verify-report-bottom-btn.verified-state {
  background: #10b981;
  cursor: default;
}

/* Map specific styling */
.map-card {
  padding: 16px;
}

.map-wrapper {
  border-radius: 4px;
  border: 2px solid #cbd5e1;
  padding: 2px;
  background: white;
}

.map-box {
  width: 100%;
  height: 100%;
  min-height: 350px;
  border-radius: 2px;
  z-index: 1;
}

.map-legend-row {
  display: flex;
  gap: 30px;
  margin-top: 14px;
  justify-content: center;
}

.legend-pill {
  display: flex;
  align-items: center;
  justify-content: center;
}

.circle-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.issue-dot {
  background: #fde047;
  border: 2px solid #1e1b4b;
}

.lineman-dot {
  background: #2e3192;
  border: 2px solid #ffffff;
}

/* Consumer Info styling */
.consumer-dark-card {
  background: #2e3192;
  border-color: #2e3192;
  padding: 24px;
}

.divider-line {
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  margin: 0 0 20px 0;
}

.center-label {
  text-align: center;
  font-size: 0.75rem;
  font-weight: 900;
  color: #ffffff;
  text-transform: uppercase;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.consumer-name-box {
  background: #f1f5f9;
  border-radius: 4px;
  padding: 14px 12px;
  font-size: 1rem;
  font-weight: 900;
  color: #2e3192;
  text-align: center;
}

/* Timeline Layout */
.timeline-outer-card {
  background: #facc15;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.timeline-main-title {
  margin: 0 0 16px 0;
  font-size: 1.1rem;
  color: #1e1b4b;
  font-weight: 900;
  letter-spacing: 0.5px;
}

.timeline-inner-card {
  background: #ffffff;
  border-radius: 6px;
  padding: 24px 16px;
  flex-grow: 1;
}

.timeline-tree {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.timeline-node-row {
  display: flex;
  gap: 12px;
  position: relative;
  padding-bottom: 24px;
}

.timeline-time-col {
  width: 75px;
  text-align: right;
  display: flex;
  flex-direction: column;
  margin-top: -2px;
}

.t-date {
  font-size: 0.65rem;
  font-weight: 900;
  color: #1e1b4b;
}

.t-time {
  font-size: 0.6rem;
  color: #1e1b4b;
  font-weight: 800;
}

.timeline-center-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.node-bullet {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #cbd5e1;
  border: 2px solid #fff;
  box-shadow: 0 0 0 2px #cbd5e1;
  z-index: 2;
}

.node-bullet.completed {
  background: #2e3192;
  box-shadow: 0 0 0 2px #ffffff;
}

.node-bullet.active {
  background: #fde047;
  border: 2px solid #2e3192;
  box-shadow: 0 0 0 2px #ffffff;
}

.node-connector {
  width: 3px;
  background: #cbd5e1;
  flex-grow: 1;
  position: absolute;
  top: 12px;
  bottom: -24px;
}

.node-connector.connector-active {
  background: #2e3192;
}

.timeline-text-col {
  flex-grow: 1;
  margin-top: -3px;
}

.t-title {
  margin: 0 0 2px 0;
  font-size: 0.8rem;
  color: #1e1b4b;
  font-weight: 900;
}

.t-title.text-muted {
  color: #64748b;
}

.t-desc {
  margin: 0;
  font-size: 0.7rem;
  color: #475569;
  font-weight: 700;
  line-height: 1.2;
}
</style>
