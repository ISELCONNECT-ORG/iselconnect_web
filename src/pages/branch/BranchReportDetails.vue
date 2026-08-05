<template>
  <div class="dashboard-root">
    <BranchSidebar />
    <main class="content">
      <!-- Back link -->
      <div class="header-nav">
        <router-link to="/branch/incident" class="back-link">
          &larr; Back to Incident Queue
        </router-link>
      </div>

      <!-- Hero/title bar -->
      <header class="hero-section">
        <div class="hero-header-content">
          <div class="hero-text">
            <h1>Branch Report Details & Live Tracking</h1>
            <p>
              Comprehensive view and live LocationIQ road-snapped route tracking for ticket #{{
                report?.id || '---'
              }}.
            </p>
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
        <p>Report not found, invalid ID, or unauthorized access to this branch.</p>
      </div>

      <!-- Main details -->
      <div v-else class="details-grid">
        <!-- LEFT COLUMN: incident + live tracking map -->
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

          <!-- Live Tracking Map Section -->
          <section class="card map-card-section">
            <div class="card-header-row">
              <h2>Live Location Map</h2>
              <span class="card-subtitle">LocationIQ Road-Snapped Routing</span>
            </div>
            <div id="liveTrackingMap" class="map-container"></div>
            <div class="map-legend">
              <span class="legend-item"><span class="dot issue-dot"></span> Issue Location</span>
              <span class="legend-item"
                ><span class="dot lineman-dot"></span> Lineman Position</span
              >
            </div>
          </section>
        </div>

        <!-- RIGHT COLUMN: consumer + evidence + resolved photo + lifecycle timeline -->
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

          <!-- Initial Evidence Gallery -->
          <section class="card evidence-card">
            <div class="card-header-row">
              <h2>Incident Evidence</h2>
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

          <!-- Resolved Evidence Gallery -->
          <section class="card evidence-card">
            <div class="card-header-row">
              <h2>Resolved Evidence (Lineman Upload)</h2>
            </div>
            <div v-if="resolvedPhotoUrl" class="evidence-gallery">
              <div class="evidence-item">
                <img
                  :src="resolvedPhotoUrl"
                  alt="Resolved Evidence"
                  class="evidence-img"
                  @click="openImage(resolvedPhotoUrl)"
                />
              </div>
            </div>
            <div v-else class="evidence-preview-box">
              <p class="no-evidence-text">No resolved photo uploaded by lineman yet.</p>
            </div>
          </section>

          <!-- Ticket Lifecycle Timeline Tracker -->
          <section class="card timeline-card">
            <div class="card-header-row">
              <h2>Ticket Lifecycle Timeline</h2>
              <span class="card-subtitle">Database Timestamp Tracker</span>
            </div>

            <div class="jnt-timeline">
              <div
                v-for="(milestone, index) in lifecycleMilestones"
                :key="index"
                class="timeline-item"
              >
                <div class="timeline-left">
                  <span class="timeline-date">{{ milestone.date || 'Pending' }}</span>
                  <span class="timeline-time">{{ milestone.time || '--:--' }}</span>
                </div>

                <div class="timeline-node">
                  <div
                    class="node-dot"
                    :class="{ active: milestone.active, completed: milestone.done }"
                  ></div>
                  <div
                    v-if="index !== lifecycleMilestones.length - 1"
                    class="node-line"
                    :class="{ 'line-active': milestone.done }"
                  ></div>
                </div>

                <div class="timeline-right">
                  <h4 class="timeline-title" :class="{ 'text-muted': !milestone.done }">
                    {{ milestone.title }}
                  </h4>
                  <p class="timeline-location">{{ milestone.description }}</p>
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
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/services/supabase'
import BranchSidebar from '@/components/BranchSidebar.vue'
import Topbar from '@/components/BranchTopbar.vue'

// Leaflet for LocationIQ map rendering
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

const fetchReportDetails = async () => {
  const reportId = route.params.id
  if (!reportId) {
    loading.value = false
    return
  }

  // Validate Branch Account User
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

  // Fetch Report Data restricted to this branch and verified by admin (status_id > 1)
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
    await fetchResolvedPhoto(data.resolved_photo_url)
  }

  // Fetch Assignment Data
  const { data: assignData, error: assignError } = await supabase
    .from('assignments')
    .select('*')
    .eq('report_id', reportId)
    .maybeSingle()

  if (!assignError) {
    assignment.value = assignData
  }

  loading.value = false
  await nextTick()
  initLiveMap()
}

// Initialize LocationIQ Live Map and Fetch Road Directions
const initLiveMap = async () => {
  const mapElement = document.getElementById('liveTrackingMap')
  if (!mapElement || mapInstance || !report.value) return

  const reportLat = report.value.latitude || 16.7328
  const reportLon = report.value.longitude || 121.7161

  mapInstance = L.map('liveTrackingMap').setView([reportLat, reportLon], 14)

  L.tileLayer(
    `https://{s}-tiles.locationiq.com/v3/streets/r/{z}/{x}/{y}.png?key=${LOCATIONIQ_TOKEN}`,
    {
      maxZoom: 18,
      attribution: '&copy; LocationIQ & OpenStreetMap',
    },
  ).addTo(mapInstance)

  const issueIcon = L.divIcon({
    className: 'custom-issue-marker',
    html: '<div style="background:#1e1b4b;width:16px;height:16px;border-radius:50%;border:2px solid #fbbf24;box-shadow:0 0 6px rgba(0,0,0,0.5);"></div>',
    iconSize: [16, 16],
  })
  L.marker([reportLat, reportLon], { icon: issueIcon })
    .addTo(mapInstance)
    .bindPopup('<b>Issue Location</b><br>' + (report.value.landmark || 'Outage Spot'))

  if (assignment.value?.current_lat && assignment.value?.current_lon) {
    const linemanLat = assignment.value.current_lat
    const linemanLon = assignment.value.current_lon

    const linemanIcon = L.divIcon({
      className: 'custom-lineman-marker',
      html: '<div style="background:#10b981;width:16px;height:16px;border-radius:50%;border:2px solid #ffffff;box-shadow:0 0 6px rgba(0,0,0,0.5);"></div>',
      iconSize: [16, 16],
    })
    L.marker([linemanLat, linemanLon], { icon: linemanIcon })
      .addTo(mapInstance)
      .bindPopup('<b>Lineman Current Location</b>')

    try {
      const response = await fetch(
        `https://us1.locationiq.com/v1/directions/driving/${linemanLon},${linemanLat};${reportLon},${reportLat}?key=${LOCATIONIQ_TOKEN}&geometries=geojson`,
      )
      const data = await response.json()
      if (data.routes && data.routes.length > 0) {
        const routeCoords = data.routes[0].geometry.coordinates.map((c) => [c[1], c[0]])
        L.polyline(routeCoords, {
          color: '#3b82f6',
          weight: 4,
          opacity: 0.8,
        }).addTo(mapInstance)
      } else {
        L.polyline(
          [
            [linemanLat, linemanLon],
            [reportLat, reportLon],
          ],
          {
            color: '#3b82f6',
            weight: 4,
            opacity: 0.8,
          },
        ).addTo(mapInstance)
      }
    } catch (err) {
      console.error('Error fetching LocationIQ Directions:', err)
    }
  }
}

// Compute lifecycle milestones
const lifecycleMilestones = computed(() => {
  const rep = report.value
  const assign = assignment.value

  const isInProgressDone = !!assign?.inprogress_at || !!assign?.completion_at
  const isAdminVerified =
    !!assign?.is_verified_by_admin || !!assign?.verified_at || rep?.status_id === 6

  return [
    {
      title: 'Report Created',
      description: 'Incident ticket initially submitted by resident.',
      done: !!rep?.created_at,
      active: !!rep?.created_at && !assign?.assigned_at,
      date: formatDate(rep?.created_at),
      time: formatTime(rep?.created_at),
    },
    {
      title:
        rep?.status_id === 3
          ? 'Report Approved'
          : rep?.status_id === 5
            ? 'Report Rejected'
            : 'Review Status',
      description:
        rep?.status_id > 1
          ? 'Admin evaluated and processed the outage report.'
          : 'Awaiting administrative action.',
      done: rep?.status_id > 1,
      active: rep?.status_id === 1,
      date: rep?.status_id > 1 ? formatDate(rep?.updated_at) : null,
      time: rep?.status_id > 1 ? formatTime(rep?.updated_at) : null,
    },
    {
      title: 'Assigned Lineman',
      description: assign?.assigned_at
        ? 'Outage ticket dispatched to designated field team.'
        : 'Pending lineman allocation.',
      done: !!assign?.assigned_at,
      active: rep?.status_id > 1 && !assign?.assigned_at,
      date: formatDate(assign?.assigned_at),
      time: formatTime(assign?.assigned_at),
    },
    {
      title: 'In Progress Lineman',
      description: assign?.inprogress_at
        ? 'Lineman is currently on-site and working on the repair.'
        : 'Pending field work start.',
      done: isInProgressDone,
      active: !!assign?.assigned_at && !isInProgressDone,
      date: formatDate(assign?.inprogress_at),
      time: formatTime(assign?.inprogress_at),
    },
    {
      title: 'Resolved Report',
      description: assign?.completion_at
        ? 'Field repairs finished and power service restored.'
        : 'Repair work currently ongoing.',
      done: !!assign?.completion_at,
      active: isInProgressDone && !assign?.completion_at,
      date: formatDate(assign?.completion_at),
      time: formatTime(assign?.completion_at),
    },
    {
      title: 'Validated by Admin',
      description: isAdminVerified
        ? 'Admin verified resolution and officially closed ticket.'
        : 'Awaiting final administrative sign-off.',
      done: isAdminVerified,
      active: !!assign?.completion_at && !isAdminVerified,
      date: isAdminVerified ? formatDate(assign?.verified_at || rep?.updated_at) : null,
      time: isAdminVerified ? formatTime(assign?.verified_at || rep?.updated_at) : null,
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
        if (data?.publicUrl) {
          evidenceUrls.value.push(data.publicUrl)
        }
      }
    }
  }
}

const fetchResolvedPhoto = async (fieldValue) => {
  if (!fieldValue) {
    resolvedPhotoUrl.value = null
    return
  }
  if (fieldValue.startsWith('http')) {
    resolvedPhotoUrl.value = fieldValue
  } else {
    const { data } = supabase.storage.from('report_photos').getPublicUrl(fieldValue)
    resolvedPhotoUrl.value = data?.publicUrl || null
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
  return found ? found.name : 'General Maintenance'
}

const getMunicipalityName = (mId) => {
  return mId === 6 ? 'Echague, Isabela' : 'Alicia, Isabela'
}

const getStatusName = (statusId) => {
  if (statusId === 1) return 'Pending'
  if (statusId === 2) return 'In Progress'
  if (statusId === 4) return 'Pending Verification'
  if (statusId === 5) return 'Rejected'
  if (statusId === 6) return 'Resolved'
  return 'Resolved'
}

const getStatusClass = (statusId) => {
  if (statusId === 1) return 'badge-pending'
  if (statusId === 2) return 'badge-dispatched'
  if (statusId === 6) return 'badge-resolved'
  return 'badge-resolved'
}

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString()
}

const formatDate = (dateStr) => {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const formatTime = (dateStr) => {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

const openImage = (url) => {
  window.open(url, '_blank')
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
  margin-bottom: 24px;
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
.status-badge {
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
.map-container {
  width: 100%;
  height: 340px;
  border-radius: 8px;
  z-index: 1;
}
.map-legend {
  display: flex;
  gap: 20px;
  margin-top: 10px;
  font-size: 0.85rem;
  font-weight: 500;
  color: #475569;
  align-items: center;
  justify-content: center;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}
.issue-dot {
  background: #1e1b4b;
  border: 2px solid #fbbf24;
}
.lineman-dot {
  background: #10b981;
  border: 2px solid #fff;
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

.jnt-timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-left: 10px;
  margin-top: 10px;
}
.timeline-item {
  display: flex;
  gap: 16px;
  position: relative;
  padding-bottom: 24px;
}
.timeline-left {
  width: 85px;
  text-align: right;
  display: flex;
  flex-direction: column;
}
.timeline-date {
  font-size: 0.8rem;
  font-weight: 600;
  color: #1e293b;
}
.timeline-time {
  font-size: 0.75rem;
  color: #64748b;
}
.timeline-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}
.node-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #cbd5e1;
  border: 2px solid #fff;
  box-shadow: 0 0 0 2px #cbd5e1;
  z-index: 2;
}
.node-dot.completed {
  background: #10b981;
  box-shadow: 0 0 0 2px #d1fae5;
}
.node-dot.active {
  background: #2563eb;
  box-shadow: 0 0 0 3px #bfdbfe;
}
.node-line {
  width: 2px;
  background: #e2e8f0;
  flex-grow: 1;
  position: absolute;
  top: 12px;
  bottom: -24px;
}
.node-line.line-active {
  background: #10b981;
}
.timeline-right {
  flex-grow: 1;
}
.timeline-title {
  margin: 0 0 4px 0;
  font-size: 0.95rem;
  color: #0f172a;
  font-weight: 600;
}
.timeline-title.text-muted {
  color: #94a3b8;
}
.timeline-location {
  margin: 0;
  font-size: 0.85rem;
  color: #475569;
}
</style>
