<!-- ReportDetails.vue -->
<template>
  <div class="dashboard-root">
    <Sidebar />

    <main class="content">
      <!-- Top Hero Banner -->
      <div class="hero-banner">
        <div class="hero-left">
          <router-link to="/admin/incident" class="back-btn">
            &larr; BACK TO INCIDENT QUEUE
          </router-link>
          <div class="hero-titles">
            <h1>REPORT DETAILS</h1>
            <p>Comprehensive view and live LocationIQ road-snapped route tracking</p>
          </div>
        </div>
        <div class="hero-right" style="display: flex; gap: 12px; align-items: center">
          <!-- Changed logic to ensure it shows for ALL active reports, including walk-ins -->
          <button
            v-if="report && report.status_id !== 6 && report.status_id !== 5"
            @click="openAssign"
            class="hero-assign-btn"
          >
            <UserPlus :size="16" /> ASSIGN DISPATCH
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
              <div class="gray-box">{{ report.customer_name || 'JOHN LLOYD BINUYA' }}</div>
            </div>
            <div class="data-group">
              <label>CONTACT NUMBER</label>
              <div class="gray-box">0917-888-1234</div>
            </div>
          </div>

          <!-- Stacked Right Column for Assigned Personnel & Remarks -->
          <div class="right-col-stack">
            <!-- ASSIGNED PERSONNEL BOX -->
            <div class="info-card" style="padding-bottom: 20px">
              <h3>Assigned Personnel</h3>
              <div
                class="gray-box"
                :class="{ 'unassigned-box': assignedLinemenDisplay === 'Not Assigned' }"
              >
                <span v-if="assignedLinemenDisplay !== 'Not Assigned'" class="assigned-text">
                  <Users :size="16" />
                  {{ assignedLinemenDisplay }}
                </span>
                <span v-else class="unassigned-text"> Not Assigned </span>
              </div>
            </div>

            <!-- REMARKS BOX -->
            <div class="info-card flex-grow-card">
              <div class="remarks-header">
                <h3>Remarks</h3>
                <div class="res-time">
                  RESOLUTION TIME<br />
                  <b
                    :style="{
                      color:
                        !assignment?.completion_at && assignment?.assigned_at
                          ? '#2563eb'
                          : '#1e1b4b',
                    }"
                  >
                    {{ resolutionDuration }}
                  </b>
                </div>
              </div>
              <div class="remarks-box">
                {{ report.remarks || 'No remarks provided by lineman yet.' }}
              </div>
            </div>
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
              @click="handleVerifyClick"
              class="verify-btn"
              :style="{
                opacity: !resolvedPhotoUrl ? 0.6 : 1,
                cursor: !resolvedPhotoUrl ? 'not-allowed' : 'pointer',
              }"
            >
              <CheckCircle :size="16" /> VERIFY EVIDENCE
            </button>
            <button v-else class="verify-btn verified" disabled>
              <CheckCircle :size="16" /> MARKED AS COMPLETE
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

    <!-- Verification Confirmation Modal -->
    <div v-if="showVerifyModal" class="modal-overlay" @click.self="showVerifyModal = false">
      <div class="confirm-modal">
        <div class="modal-header">
          <ShieldCheck :size="20" class="header-icon" />
          <h2>Confirm Report Verification</h2>
        </div>
        <div class="modal-body">
          <div class="modal-icon-box">
            <CheckCircle :size="24" class="body-icon" />
          </div>
          <div class="modal-text-content">
            <h3>Are you sure you want to verify this report?</h3>
            <p>
              This action will officially mark the incident resolution and repair evidence as
              validated, compute total resolution duration, and close the incident ticket.
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showVerifyModal = false">Cancel</button>
          <button class="btn-verify" @click="executeVerification">Verify Report</button>
        </div>
      </div>
    </div>

    <!-- DISPATCH TIME VALIDATION MODAL (ADMIN LOCK) -->
    <div
      v-if="showTimeLockModal"
      class="modal-overlay"
      style="z-index: 1050"
      @click.self="showTimeLockModal = false"
    >
      <div class="time-lock-card">
        <div class="time-lock-header">
          <Info class="info-icon" :size="20" />
          <h3>Dispatch Time</h3>
        </div>
        <div class="time-lock-body">
          <p>
            Admin assigning is locked right now. 8:00 AM to 5:00 PM is reserved for Branch Only to
            dispatch.
          </p>
          <p>Please wait for the Admin dispatch window (5:01 PM - 7:59 AM).</p>
        </div>
        <div class="time-lock-footer">
          <button @click="showTimeLockModal = false" class="btn-primary-ok">OK</button>
        </div>
      </div>
    </div>

    <!-- ASSIGN MODAL (TEAMS & LINEMEN) -->
    <div v-if="showAssignModal" class="modal-overlay" @click.self="showAssignModal = false">
      <div class="assign-modal-card">
        <h3>Assign Dispatch</h3>
        <p>Select an available lineman or team to dispatch to this location.</p>

        <!-- Toggle Tabs for Teams / Linemen (Teams First) -->
        <div class="assign-tabs">
          <button :class="{ active: assignTab === 'teams' }" @click="assignTab = 'teams'">
            Lineman Teams
          </button>
          <button :class="{ active: assignTab === 'linemen' }" @click="assignTab = 'linemen'">
            Individual Linemen
          </button>
        </div>

        <div class="assign-search-row">
          <div class="search-input-wrapper">
            <Search class="search-icon" :size="16" />
            <input
              v-model="assignSearchQuery"
              type="text"
              :placeholder="
                assignTab === 'teams'
                  ? 'Search teams by name or branch...'
                  : 'Search linemen by name or branch...'
              "
              class="assign-search-input"
            />
          </div>
        </div>

        <div class="table-scroll-wrapper">
          <!-- TEAMS TABLE (Shows by default) -->
          <table v-if="assignTab === 'teams'" class="lineman-table">
            <thead>
              <tr>
                <th>Team Name</th>
                <th>Branch</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in filteredTeams" :key="t.id">
                <td>
                  <strong>{{ t.team_name }}</strong>
                </td>
                <td class="muted-text">{{ t.branch }}</td>
                <td>
                  <button
                    class="assign-action-btn"
                    :disabled="isTeamAssigned(t)"
                    @click="assignTeam(t)"
                  >
                    {{ isTeamAssigned(t) ? 'Assigned' : 'Assign Team' }}
                  </button>
                </td>
              </tr>
              <tr v-if="filteredTeams.length === 0">
                <td colspan="3" class="text-center" style="padding: 24px">
                  No matching teams found.
                </td>
              </tr>
            </tbody>
          </table>

          <!-- INDIVIDUAL LINEMEN TABLE -->
          <table v-else class="lineman-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Branch</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="l in filteredLinemen" :key="l.id">
                <td>
                  <strong>{{ l.name }}</strong>
                </td>
                <td class="muted-text">{{ l.branch }}</td>
                <td>
                  <span
                    :class="[
                      'lineman-status',
                      l.status === 'Available' ? 'status-available' : 'status-on-job',
                    ]"
                  >
                    {{ l.status || 'Available' }}
                  </span>
                </td>
                <td>
                  <button
                    class="assign-action-btn"
                    :disabled="isAssigned(l.id)"
                    @click="assignSingleLineman(l.id)"
                  >
                    {{ isAssigned(l.id) ? 'Assigned' : 'Assign' }}
                  </button>
                </td>
              </tr>
              <tr v-if="filteredLinemen.length === 0">
                <td colspan="4" class="text-center" style="padding: 24px">
                  No matching linemen found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          class="modal-footer"
          style="padding: 0; background: transparent; border: none; margin-top: 16px"
        >
          <button @click="showAssignModal = false" class="btn-close-modal">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/services/supabase'
import { notifyLineman } from '@/services/smsService'
import Sidebar from '@/components/Sidebar.vue'
import { CheckCircle, ImageOff, ShieldCheck, UserPlus, Search, Info, Users } from 'lucide-vue-next'
import { useSystemAlerts } from '@/composables/useSystemAlerts'
import { sendNotification } from '@/utils/notifications.js'

import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const route = useRoute()
const { addAlert } = useSystemAlerts()

const report = ref(null)
const assignment = ref(null)
const loading = ref(true)
const barangayList = ref([])
const reportTypes = ref([])
const evidenceUrls = ref([])
const resolvedPhotoUrl = ref(null)

const showVerifyModal = ref(false)

// --- Assign State variables ---
const showAssignModal = ref(false)
const showTimeLockModal = ref(false)
const assignTab = ref('teams')
const availableLinemen = ref([])
const availableTeams = ref([])
const assignSearchQuery = ref('')

const LOCATIONIQ_TOKEN = import.meta.env.VITE_LOCATIONIQ_TOKEN
let mapInstance = null
let issueMarker = null
let linemanMarker = null
let routePolyline = null
let refreshInterval = null
let realtimeChannel = null

// Live timer for calculation
const nowTime = ref(Date.now())
let timerIntervalSec = null
const frozenResolutionTime = ref(null)

const isAdminPhase = computed(() => {
  const current = new Date(nowTime.value)
  const hour = current.getHours()
  const minute = current.getMinutes()

  if (hour >= 8 && hour < 17) {
    return false
  }
  if (hour === 17 && minute === 0) {
    return false
  }
  return true
})

// --- Format assigned linemen for the new box ---
const assignedLinemenDisplay = computed(() => {
  if (!report.value?.assignments || report.value.assignments.length === 0) return 'Not Assigned'

  const names = report.value.assignments.map((a) => {
    const f = a.users?.first_name || ''
    const l = a.users?.last_name || ''
    return `${f} ${l}`.trim() || 'Unknown Lineman'
  })

  return [...new Set(names)].join(', ')
})

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

  const { data: allAssigns, error: assignError } = await supabase
    .from('assignments')
    .select('*, users!lineman_id(first_name, last_name)')
    .eq('report_id', reportId)
    .order('assigned_at', { ascending: false })

  if (!assignError && allAssigns) {
    report.value.assignments = allAssigns
    if (allAssigns.length > 0) {
      assignment.value = allAssigns[0]

      if (!resolvedPhotoUrl.value) {
        const assignPhotoPath =
          assignment.value.resolved_photo_url ||
          assignment.value.resolved_evidence ||
          assignment.value.photo_url
        if (assignPhotoPath) await fetchResolvedPhoto(assignPhotoPath)
      }
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
  const hasReviewed = rep?.status_id > 1

  const hasAssigned = !!assign?.assigned_at || !!assign?.id
  const hasInProgress = hasAssigned && (!!assign?.inprogress_at || rep?.status_id >= 2)
  const hasResolved =
    hasInProgress && (!!assign?.completion_at || !!resolvedPhotoUrl.value || rep?.status_id >= 4)
  const hasVerified =
    hasResolved && (!!assign?.is_verified_by_admin || !!assign?.verified_at || rep?.status_id === 6)

  return [
    {
      title: 'REPORT CREATED',
      description: 'Incident ticket submitted.',
      done: hasCreated,
      active: hasCreated && !hasReviewed,
      time: hasCreated ? formatTime(rep?.created_at) : '--:--',
    },
    {
      title: 'REVIEW STATUS',
      description: hasReviewed ? 'Admin evaluated report.' : 'Awaiting admin action.',
      done: hasReviewed,
      active: hasReviewed && !hasAssigned,
      time: hasReviewed ? formatTime(rep?.updated_at || rep?.created_at) : '--:--',
    },
    {
      title: 'ASSIGNED',
      description: hasAssigned ? 'Ticket dispatched to team.' : 'Pending allocation.',
      done: hasAssigned,
      active: hasAssigned && !hasInProgress,
      time: hasAssigned ? formatTime(assign?.assigned_at) : '--:--',
    },
    {
      title: 'IN PROGRESS',
      description: hasInProgress ? 'Lineman on-site.' : 'Pending work start.',
      done: hasInProgress,
      active: hasInProgress && !hasResolved,
      time: hasInProgress ? formatTime(assign?.inprogress_at || assign?.assigned_at) : '--:--',
    },
    {
      title: 'RESOLVED',
      description: hasResolved ? 'Repair finished, photo uploaded.' : 'Repair ongoing.',
      done: hasResolved,
      active: hasResolved && !hasVerified,
      time: hasResolved ? formatTime(assign?.completion_at || rep?.updated_at) : '--:--',
    },
    {
      title: 'VALIDATED',
      description: hasVerified ? 'Admin verified resolution.' : 'Awaiting sign-off.',
      done: hasVerified,
      active: hasVerified,
      time: hasVerified ? formatTime(assign?.verified_at || rep?.updated_at) : '--:--',
    },
  ]
})

const resolutionDuration = computed(() => {
  if (report.value?.resolution_time) {
    return report.value.resolution_time
  }

  if (!assignment.value || !assignment.value.assigned_at) return 'NOT ASSIGNED'

  const start = new Date(assignment.value.assigned_at).getTime()
  let end = nowTime.value

  const rep = report.value
  const isResolved = rep && (rep.status_id >= 4 || resolvedPhotoUrl.value)

  if (isResolved) {
    let foundValidEnd = false

    if (assignment.value.completion_at) {
      const compTime = new Date(assignment.value.completion_at).getTime()
      if (compTime > start) {
        end = compTime
        foundValidEnd = true
      }
    }

    if (!foundValidEnd && assignment.value.verified_at) {
      const verTime = new Date(assignment.value.verified_at).getTime()
      if (verTime > start) {
        end = verTime
        foundValidEnd = true
      }
    }

    if (!foundValidEnd && rep?.updated_at) {
      const upTime = new Date(rep.updated_at).getTime()
      if (upTime > start) {
        end = upTime
        foundValidEnd = true
      }
    }

    if (!foundValidEnd) {
      if (!frozenResolutionTime.value) {
        frozenResolutionTime.value = nowTime.value
      }
      end = frozenResolutionTime.value
    }
  }

  const diffMs = end - start
  if (diffMs <= 0) return '00m 00s'

  const d = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const h = Math.floor((diffMs / 1000 / 60 / 60) % 24)
  const m = Math.floor((diffMs / 1000 / 60) % 60)
  const s = Math.floor((diffMs / 1000) % 60)

  let result = ''
  if (d > 0) result += `${d}d `
  if (h > 0) result += `${h}h `
  result += `${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`

  return result
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

const handleVerifyClick = () => {
  if (!report.value || !resolvedPhotoUrl.value) return

  const currentHour = new Date().getHours()
  const isAdminWindow = currentHour >= 17 || currentHour < 8

  if (!isAdminWindow) {
    alert(
      'Admin validation is locked.\n\n5:00 PM to 8:00 AM is reserved for Admin validation. (8:00 AM to 5:00 PM is Branch only).',
    )
    return
  }

  showVerifyModal.value = true
}

const executeVerification = async () => {
  showVerifyModal.value = false
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
    .update({
      status_id: 6,
      updated_at: currentTime,
      resolution_time: resolutionDuration.value,
    })
    .eq('id', report.value.id)

  if (assignError || repError) {
    alert('Failed to validate: ' + (assignError?.message || repError?.message))
  } else {
    addAlert({
      title: 'Mark as Complete',
      message: 'The report has been successfully verified and marked as complete.',
      severity: 'low',
    })
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

const filteredLinemen = computed(() => {
  if (!assignSearchQuery.value) return availableLinemen.value
  const q = assignSearchQuery.value.toLowerCase()
  return availableLinemen.value.filter(
    (l) => l.name.toLowerCase().includes(q) || l.branch.toLowerCase().includes(q),
  )
})

const filteredTeams = computed(() => {
  if (!assignSearchQuery.value) return availableTeams.value
  const q = assignSearchQuery.value.toLowerCase()
  return availableTeams.value.filter(
    (t) => t.team_name?.toLowerCase().includes(q) || t.branch?.toLowerCase().includes(q),
  )
})

const isAssigned = (uid) => {
  return report.value?.assignments?.some((a) => a.lineman_id === uid)
}

const isTeamAssigned = (team) => {
  if (!report.value) return false

  const allMembers = [team.team_leader, ...(team.team_members || [])]
  const uniqueMembers = [...new Set(allMembers)].filter((id) => id)

  if (uniqueMembers.length === 0) return true

  const existingAssigns = report.value.assignments?.map((a) => a.lineman_id) || []
  return uniqueMembers.every((uid) => existingAssigns.includes(uid))
}

const openAssign = async () => {
  if (!isAdminPhase.value) {
    showTimeLockModal.value = true
    return
  }

  assignSearchQuery.value = ''
  assignTab.value = 'teams'

  const { data: usersData } = await supabase
    .from('users')
    .select('id, first_name, last_name, is_active')
    .eq('role_id', 9)
  const { data: empData } = await supabase
    .from('employees')
    .select('user_id, branch_id, is_available')
  const { data: branchData } = await supabase.from('iselco_branch').select('branch_id, branch_name')
  const { data: teamsData } = await supabase.from('lineman_teams').select('*')

  availableLinemen.value =
    usersData?.map((user) => {
      const emp = empData?.find((e) => e.user_id === user.id)
      const branch = branchData?.find((b) => b.branch_id === emp?.branch_id)
      return {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        branch: branch?.branch_name || 'Unassigned Branch',
        status: user.is_active ? 'Available' : 'On Job',
      }
    }) || []

  availableTeams.value =
    teamsData?.map((t) => {
      const branch = branchData?.find((b) => b.branch_id === t.assigned_service_area_id)
      return {
        ...t,
        branch: branch?.branch_name || 'Unassigned Branch',
      }
    }) || []

  showAssignModal.value = true
}

const assignSingleLineman = async (uid) => {
  if (!report.value) return

  const { error } = await supabase.from('assignments').insert({
    report_id: report.value.id,
    lineman_id: uid,
    assigned_at: new Date().toISOString(),
    inprogress_at: new Date().toISOString(),
  })

  if (!error) {
    sendNotification('System: Dispatch Update', `Assigned to report ${report.value.id}`, uid)

    const { data: userData } = await supabase
      .from('users')
      .select('mobile_number')
      .eq('id', uid)
      .single()

    if (userData && userData.mobile_number) {
      let phone = userData.mobile_number
      if (phone.startsWith('0')) {
        phone = '+63' + phone.substring(1)
      }

      const issueType = getReportTypeName(report.value.report_type_id)
      const location = getBarangayName(report.value.barangay_id)
      const taskDescription = `${issueType} at ${location}`

      await notifyLineman(phone, taskDescription)
    }

    addAlert({
      title: 'Lineman Dispatched',
      message: 'The selected lineman has been successfully assigned to the incident.',
      severity: 'low',
    })

    fetchReportDetails()
  } else {
    alert('Error assigning lineman: ' + error.message)
  }
}

const assignTeam = async (team) => {
  if (!report.value) return

  const allMembers = [team.team_leader, ...(team.team_members || [])]
  let uniqueMembers = [...new Set(allMembers)].filter((id) => id)

  const existingAssigns = report.value.assignments?.map((a) => a.lineman_id) || []
  uniqueMembers = uniqueMembers.filter((uid) => !existingAssigns.includes(uid))

  if (uniqueMembers.length === 0) return

  const inserts = uniqueMembers.map((uid) => ({
    report_id: report.value.id,
    lineman_id: uid,
    assigned_at: new Date().toISOString(),
    inprogress_at: new Date().toISOString(),
  }))

  const { error } = await supabase.from('assignments').insert(inserts)

  if (!error) {
    const issueType = getReportTypeName(report.value.report_type_id)
    const location = getBarangayName(report.value.barangay_id)
    const taskDescription = `${issueType} at ${location} (Team: ${team.team_name})`

    for (const uid of uniqueMembers) {
      sendNotification('System: Dispatch Update', `Assigned to report ${report.value.id}`, uid)

      const { data: userData } = await supabase
        .from('users')
        .select('mobile_number')
        .eq('id', uid)
        .single()

      if (userData && userData.mobile_number) {
        let phone = userData.mobile_number
        if (phone.startsWith('0')) {
          phone = '+63' + phone.substring(1)
        }
        await notifyLineman(phone, taskDescription)
      }
    }

    addAlert({
      title: 'Team Dispatched',
      message: `Team '${team.team_name}' has been successfully assigned to the incident.`,
      severity: 'low',
    })

    fetchReportDetails()
  } else {
    alert('Error assigning team: ' + error.message)
  }
}

onMounted(() => {
  fetchLookups()
  fetchReportDetails()
  refreshInterval = setInterval(() => {
    refreshLinemanLocation()
  }, 5000)

  timerIntervalSec = setInterval(() => {
    nowTime.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
  if (timerIntervalSec) clearInterval(timerIntervalSec)
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
.hero-assign-btn {
  background: white;
  color: #1e1b4b;
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
.hero-assign-btn:hover {
  background: #f1f5f9;
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
}

/* STACKED RIGHT COLUMN (Assigned + Remarks) */
.right-col-stack {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.flex-grow-card {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}
.flex-grow-card .remarks-box {
  flex-grow: 1;
}

.unassigned-box {
  background-color: #f8fafc;
  border: 1px dashed #cbd5e1;
}
.assigned-text {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #2563eb;
  font-weight: 700;
}
.unassigned-text {
  color: #94a3b8;
  font-style: italic;
}

/* REMARKS TEXT BOX */
.remarks-box {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 12px;
  font-size: 0.85rem;
  background: #f8fafc;
  color: #475569;
  overflow-y: auto;
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
  max-width: 500px;
  border-radius: 8px;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
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
.header-icon {
  color: #1e1b4b;
}
.modal-body {
  padding: 24px;
  background: #f8fafc;
  display: flex;
  align-items: flex-start;
  gap: 20px;
}
.modal-icon-box {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
.body-icon {
  color: #1e1b4b;
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

/* Dispatch Time Validation Modal */
.time-lock-card {
  background: white;
  border-radius: 6px;
  border: 1px solid #a5b4fc;
  width: 460px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
}
.time-lock-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
}
.time-lock-header .info-icon {
  color: #2563eb;
}
.time-lock-header h3 {
  margin: 0;
  font-size: 1.05rem;
  color: #1e293b;
  font-weight: 600;
}
.time-lock-body {
  padding: 24px 20px;
  color: #475569;
  font-size: 0.95rem;
  line-height: 1.5;
}
.time-lock-body p {
  margin: 0 0 16px 0;
}
.time-lock-body p:last-child {
  margin-bottom: 0;
}
.time-lock-footer {
  padding: 14px 20px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
}
.btn-primary-ok {
  background: #2563eb;
  color: white;
  border: none;
  padding: 8px 24px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-primary-ok:hover {
  background: #1d4ed8;
}

/* Assign Modal Styles */
.assign-modal-card {
  background: white;
  border-radius: 8px;
  width: 600px;
  padding: 20px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}
.assign-modal-card h3 {
  margin: 0 0 4px 0;
  font-size: 1.1rem;
  color: #1e1b4b;
}
.assign-modal-card p {
  margin: 0 0 16px 0;
  font-size: 0.8rem;
  color: #64748b;
}

.assign-tabs {
  display: flex;
  background: #f1f5f9;
  border-radius: 6px;
  padding: 4px;
  margin-bottom: 12px;
  width: fit-content;
}
.assign-tabs button {
  background: transparent;
  border: none;
  padding: 6px 16px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}
.assign-tabs button.active {
  background: #1e1b4b;
  color: white;
}

.assign-search-row {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}
.search-input-wrapper {
  position: relative;
  flex: 1;
}
.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}
.assign-search-input {
  width: 100%;
  padding: 8px 10px 8px 32px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.8rem;
  box-sizing: border-box;
}
.table-scroll-wrapper {
  max-height: 220px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}
.lineman-table {
  width: 100%;
  border-collapse: collapse;
}
.lineman-table th {
  position: sticky;
  top: 0;
  background: #f8fafc;
  text-align: left;
  font-size: 0.65rem;
  color: #64748b;
  padding: 10px;
  border-bottom: 1px solid #e2e8f0;
  z-index: 10;
}
.lineman-table td {
  padding: 10px;
  font-size: 0.8rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}
.lineman-status {
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 600;
}
.status-available {
  background: #dcfce7;
  color: #166534;
}
.status-on-job {
  background: #fee2e2;
  color: #991b1b;
}
.assign-action-btn {
  background: #2563eb;
  color: white;
  border: none;
  padding: 5px 12px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.75rem;
  cursor: pointer;
}
.assign-action-btn:disabled {
  background: #e2e8f0;
  color: #94a3b8;
  cursor: not-allowed;
}
.btn-close-modal {
  background: #1e1b4b;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
}
</style>
