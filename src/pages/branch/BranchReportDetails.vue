<!-- BranchReportDetails.vue -->
<template>
  <div class="dashboard-root">
    <BranchSidebar />

    <main class="content">
      <!-- Top Hero Banner -->
      <div class="hero-banner">
        <div class="hero-left">
          <router-link to="/branch/incident" class="back-btn">
            &larr; BACK TO INCIDENT QUEUE
          </router-link>
          <div class="hero-titles">
            <h1>BRANCH REPORT DETAILS</h1>
            <p>
              Comprehensive view and live LocationIQ road-snapped route tracking for ticket #{{
                report?.id || '---'
              }}
            </p>
          </div>
        </div>
        <div class="hero-right">
          <span class="status-pill">{{ getStatusName(report?.status_id) }}</span>
        </div>
      </div>

      <!-- Loading / empty states -->
      <div v-if="loading" class="info-card">
        <p>Loading report details...</p>
      </div>

      <div v-else-if="!report" class="info-card">
        <p>Report not found, invalid ID, or unauthorized access to this branch.</p>
      </div>

      <!-- Main Layout -->
      <div v-else class="details-container">
        <!-- ROW 1: Details, Reporter, Remarks -->
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
          </div>

          <div class="info-card">
            <h3>Reporter Information</h3>
            <div class="data-group" style="margin-bottom: 16px">
              <label>FULL NAME</label>
              <div class="gray-box">
                {{
                  report.users?.first_name
                    ? `${report.users.first_name} ${report.users.last_name}`
                    : 'Walk-in or anonymous'
                }}
              </div>
            </div>
            <div class="data-group">
              <label>CONTACT NUMBER</label>
              <div class="gray-box">{{ report.contact_number || 'Not available' }}</div>
            </div>
          </div>

          <div class="info-card">
            <div class="remarks-header">
              <h3>Remarks</h3>
              <div class="res-time">RESOLUTION TIME<br /><b>42m 15s</b></div>
            </div>
            <textarea
              class="remarks-input"
              placeholder="Enter remarks here..."
              v-model="report.remarks"
            ></textarea>
          </div>
        </div>

        <!-- ROW 2: Evidence -->
        <div class="evidence-row">
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

          <div class="info-card">
            <h3>Resolved Evidence</h3>
            <img
              v-if="resolvedPhotoUrl"
              :src="resolvedPhotoUrl"
              alt="Resolved Evidence"
              class="img-box"
              @click="openImage(resolvedPhotoUrl)"
            />
            <div v-else class="no-img-box">
              <ImageOff :size="32" style="margin-bottom: 8px" /> No Resolved Image Yet
            </div>

            <button
              v-if="(!assignment || !assignment.is_verified_by_admin) && report?.status_id !== 6"
              :disabled="!resolvedPhotoUrl"
              @click="validateResolution"
              class="verify-btn"
              :style="{
                opacity: !resolvedPhotoUrl ? 0.6 : 1,
                cursor: !resolvedPhotoUrl ? 'not-allowed' : 'pointer',
              }"
            >
              <CheckCircle :size="16" /> VERIFY EVIDENCE
            </button>
            <button v-else class="verify-btn verified" disabled>
              <CheckCircle :size="16" /> VERIFIED
            </button>
          </div>
        </div>

        <!-- ROW 3: Map & Timeline -->
        <div class="map-timeline-row">
          <div class="info-card map-card">
            <h3>Live Location Map</h3>
            <div class="map-wrapper">
              <div id="liveTrackingMap" class="map-box"></div>
            </div>
            <div class="map-legend">
              <span
                ><div class="dot yellow-dot"></div>
                ISSUE</span
              >
              <span
                ><div class="dot blue-dot"></div>
                LINEMAN</span
              >
            </div>
          </div>

          <div class="timeline-card">
            <h3>Timeline</h3>
            <div class="timeline-tree">
              <div
                v-for="(milestone, idx) in lifecycleMilestones"
                :key="idx"
                class="timeline-node-row"
              >
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
                <div class="timeline-content-col">
                  <div class="t-title-row">
                    <span class="t-title" :class="{ 'text-muted': !milestone.done }">{{
                      milestone.title
                    }}</span>
                    <span class="t-time">{{ milestone.time || '--:--' }}</span>
                  </div>
                  <p class="t-desc">{{ milestone.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/services/supabase'
import BranchSidebar from '@/components/BranchSidebar.vue'
import { CheckCircle, ImageOff } from 'lucide-vue-next'

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
const branchId = ref(null)

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

  // Validate Branch Account User Session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Unauthorized user session')
    loading.value = false
    return
  }

  const { data: userData, error: branchError } = await supabase
    .from('users')
    .select('branch_id')
    .eq('id', user.id)
    .single()

  if (branchError || !userData?.branch_id) {
    console.error('Failed to resolve branch account ID')
    loading.value = false
    return
  }

  branchId.value = userData.branch_id

  // Fetch Report restricted strictly to this branch account
  const { data, error } = await supabase
    .from('reports')
    .select('*, users(first_name, last_name), municipalities(name)')
    .eq('id', reportId)
    .eq('branch_id', branchId.value)
    .single()

  if (error || !data) {
    console.error('Error fetching branch report details:', error?.message)
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
      if (assignPhotoPath) await fetchResolvedPhoto(assignPhotoPath)
    }
  }

  loading.value = false
  await nextTick()
  initLiveMap()
  setupRealtimeTracking()
}

const refreshLinemanLocation = async () => {
  const reportId = route.params.id
  if (!reportId) return

  const { data: latestReport, error: repError } = await supabase
    .from('reports')
    .select('latitude, longitude')
    .eq('id', reportId)
    .single()

  if (!repError && latestReport && report.value) {
    report.value.latitude = latestReport.latitude
    report.value.longitude = latestReport.longitude
  }

  const { data: assignData, error: assignError } = await supabase
    .from('assignments')
    .select('id, current_lat, current_lon')
    .eq('report_id', reportId)
    .order('assigned_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!assignError && assignData && mapInstance) {
    if (assignment.value) {
      assignment.value.current_lat = assignData.current_lat
      assignment.value.current_lon = assignData.current_lon
    }

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

    if (issueMarker) issueMarker.setLatLng([reportLat, reportLon])

    if (linemanMarker) {
      linemanMarker.setLatLng([linemanLat, linemanLon])
    } else {
      const linemanIcon = L.divIcon({
        className: 'custom-lineman-marker',
        html: `<div style="background-color: #2563eb; width: 16px; height: 16px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      })
      linemanMarker = L.marker([linemanLat, linemanLon], { icon: linemanIcon, zIndexOffset: 1000 })
        .addTo(mapInstance)
        .bindPopup('<b>Lineman Location</b>')
    }

    try {
      if (linemanLat === reportLat && linemanLon === reportLon) throw new Error('Same coordinates')
      const response = await fetch(
        `https://us1.locationiq.com/v1/directions/driving/${linemanLon},${linemanLat};${reportLon},${reportLat}?key=${LOCATIONIQ_TOKEN}&geometries=geojson`,
      )
      const data = await response.json()
      if (data.routes && data.routes[0]) {
        const routeCoords = data.routes[0].geometry.coordinates.map((c) => [c[1], c[0]])
        if (routePolyline) routePolyline.setLatLngs(routeCoords)
        else
          routePolyline = L.polyline(routeCoords, {
            color: '#2563eb',
            weight: 4,
            opacity: 0.8,
          }).addTo(mapInstance)
      } else {
        throw new Error('No route')
      }
    } catch (err) {
      const fallbackCoords = [
        [linemanLat, linemanLon],
        [reportLat, reportLon],
      ]
      if (routePolyline) routePolyline.setLatLngs(fallbackCoords)
      else
        routePolyline = L.polyline(fallbackCoords, {
          color: '#2563eb',
          weight: 4,
          dashArray: '5, 5',
          opacity: 0.8,
        }).addTo(mapInstance)
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
      { event: 'UPDATE', schema: 'public', table: 'assignments', filter: `id=eq.${assignmentId}` },
      (payload) => {
        if (payload.new.current_lat !== undefined && payload.new.current_lon !== undefined)
          refreshLinemanLocation()
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
      { maxZoom: 19 },
    ).addTo(mapInstance)

    const issueIcon = L.divIcon({
      className: 'custom-leaflet-marker',
      html: `<div style="background-color: #facc15; width: 16px; height: 16px; border-radius: 50%; border: 2px solid #1e1b4b; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    })

    issueMarker = L.marker([reportLat, reportLon], { icon: issueIcon })
      .addTo(mapInstance)
      .bindPopup('<b>Issue Location</b>')
  }

  await refreshLinemanLocation()
  if (issueMarker && linemanMarker) {
    const bounds = L.latLngBounds([issueMarker.getLatLng(), linemanMarker.getLatLng()])
    mapInstance.fitBounds(bounds, { padding: [30, 30], maxZoom: 17 })
  }
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
      description: 'Incident ticket submitted.',
      done: hasCreated,
      active: hasCreated && !hasAssigned,
      time: formatTime(rep?.created_at),
    },
    {
      title: 'REVIEW STATUS',
      description: hasReviewed ? 'Admin evaluated report.' : 'Awaiting admin action.',
      done: hasReviewed,
      active: hasCreated && !hasReviewed,
      time: formatTime(rep?.updated_at || rep?.created_at),
    },
    {
      title: 'ASSIGNED',
      description: hasAssigned ? 'Ticket dispatched to team.' : 'Pending allocation.',
      done: hasAssigned,
      active: hasReviewed && !hasAssigned,
      time: formatTime(assign?.assigned_at || fallbackTime),
    },
    {
      title: 'IN PROGRESS',
      description: hasInProgress ? 'Lineman on-site.' : 'Pending work start.',
      done: hasInProgress,
      active: hasAssigned && !hasInProgress,
      time: formatTime(assign?.inprogress_at || assign?.assigned_at || fallbackTime),
    },
    {
      title: 'RESOLVED',
      description: hasResolved ? 'Repair finished, photo uploaded.' : 'Repair ongoing.',
      done: hasResolved,
      active: hasInProgress && !hasResolved,
      time: formatTime(assign?.completion_at || fallbackTime),
    },
    {
      title: 'VALIDATED',
      description: hasVerified ? 'Admin verified resolution.' : 'Awaiting sign-off.',
      done: hasVerified,
      active: hasResolved && !hasVerified,
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
      if (item.startsWith('http')) evidenceUrls.value.push(item)
      else {
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

  if (assignError || repError)
    alert('Failed to validate: ' + (assignError?.message || repError?.message))
  else fetchReportDetails()
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
  return 'IN PROGRESS'
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
  if (refreshInterval) clearInterval(refreshInterval)
  if (realtimeChannel) supabase.removeChannel(realtimeChannel)
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
  padding: 24px 30px 40px;
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

/* DETAILS TOP ROW */
.details-top-row {
  display: grid;
  grid-template-columns: 1.2fr 1.2fr 1.5fr;
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
.remarks-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}
.res-time {
  text-align: right;
  font-size: 0.65rem;
  color: #64748b;
  font-weight: 600;
}
.res-time b {
  font-size: 1rem;
  color: #1e1b4b;
}
.remarks-input {
  width: 100%;
  height: 100px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 12px;
  font-size: 0.85rem;
  resize: none;
  outline: none;
  box-sizing: border-box;
}

/* EVIDENCE ROW */
.evidence-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}
.img-box {
  width: 100%;
  height: 280px;
  border-radius: 8px;
  object-fit: cover;
  cursor: pointer;
}
.no-img-box {
  width: 100%;
  height: 280px;
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
.verify-btn {
  background: #1e1b4b;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.85rem;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
  float: right;
  margin-top: 16px;
}
.verify-btn.verified {
  background: #10b981;
}

/* MAP & TIMELINE ROW */
.map-timeline-row {
  display: grid;
  grid-template-columns: 2.5fr 1fr;
  gap: 20px;
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
  margin-bottom: 12px;
}
.map-box {
  width: 100%;
  height: 100%;
}
.map-legend {
  display: flex;
  gap: 24px;
  justify-content: flex-start;
  padding-left: 8px;
}
.map-legend span {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  color: #1e1b4b;
}
.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
.yellow-dot {
  background: #facc15;
}
.blue-dot {
  background: #2563eb;
}

/* TIMELINE */
.timeline-card {
  background: white;
  border: 2px solid #facc15;
  border-radius: 12px;
  padding: 24px;
}
.timeline-card h3 {
  color: #1e1b4b;
  font-size: 1.1rem;
  margin: 0 0 24px 0;
  text-align: center;
}
.timeline-tree {
  display: flex;
  flex-direction: column;
}
.timeline-node-row {
  display: flex;
  gap: 16px;
  position: relative;
  padding-bottom: 24px;
}
.timeline-center-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
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
  background: #1e1b4b;
  box-shadow: 0 0 0 2px #ffffff;
}
.node-bullet.active {
  background: #fde047;
  border: 2px solid #1e1b4b;
  box-shadow: 0 0 0 2px #ffffff;
}
.node-connector {
  width: 2px;
  background: #cbd5e1;
  position: absolute;
  top: 14px;
  bottom: -24px;
  z-index: 1;
}
.node-connector.connector-active {
  background: #1e1b4b;
}
.timeline-content-col {
  flex-grow: 1;
  margin-top: -2px;
}
.t-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.t-title {
  font-weight: 700;
  color: #1e1b4b;
  font-size: 0.85rem;
}
.t-title.text-muted {
  color: #64748b;
}
.t-time {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
}
.t-desc {
  font-size: 0.8rem;
  color: #475569;
  margin: 0;
  line-height: 1.4;
}
</style>
