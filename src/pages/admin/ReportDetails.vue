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
            <p>Comprehensive view and timeline of outage ticket #{{ report?.id || '---' }}.</p>
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

        <!-- RIGHT COLUMN: consumer + evidence + resolved photo + lifecycle timeline -->
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

          <!-- Resolved Evidence Gallery (resolved_photo_url from reports table) -->
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

            <!-- Admin Validation Action Button -->
            <div
              v-if="assignment && assignment.completion_at && !assignment.is_verified_by_admin"
              style="margin-top: 15px"
            >
              <button @click="validateResolution" class="validate-btn">
                Validate & Verify Resolution
              </button>
            </div>
            <div v-else-if="assignment?.is_verified_by_admin" style="margin-top: 15px">
              <span class="verified-badge">&#10003; Verified by Admin</span>
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
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/services/supabase'
import Sidebar from '@/components/Sidebar.vue'

const route = useRoute()
const report = ref(null)
const assignment = ref(null)
const loading = ref(true)
const barangayList = ref([])
const reportTypes = ref([])
const evidenceUrls = ref([])
const resolvedPhotoUrl = ref(null)

const fetchReportDetails = async () => {
  const reportId = route.params.id
  if (!reportId) {
    loading.value = false
    return
  }

  // Fetch Report Data
  const { data, error } = await supabase.from('reports').select('*').eq('id', reportId).single()

  if (error) {
    console.error('Error fetching details:', error.message)
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
}

// Compute the 6 precise milestones with accurate timestamps mapping to table columns including verified_at
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

const validateResolution = async () => {
  if (!assignment.value || !report.value) return

  const currentTime = new Date().toISOString()

  // 1. Update assignment table with verification status and verified_at timestamp
  const { error: assignError } = await supabase
    .from('assignments')
    .update({
      is_verified_by_admin: true,
      verified_at: currentTime,
    })
    .eq('id', assignment.value.id)

  // 2. Update reports table status_id to 6 (Admin Verified) and update timestamp
  const { error: repError } = await supabase
    .from('reports')
    .update({
      status_id: 6,
      updated_at: currentTime,
    })
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
  if (statusId === 3) return 'Resolved'
  if (statusId === 4) return 'Pending Verification'
  if (statusId === 5) return 'Rejected'
  if (statusId === 6) return 'Admin Verified'
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

onMounted(() => {
  fetchLookups()
  fetchReportDetails()
})
</script>

<style scoped>
.validate-btn {
  width: 100%;
  background: #10b981;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.validate-btn:hover {
  background: #059669;
}
.verified-badge {
  display: block;
  text-align: center;
  background: #d1fae5;
  color: #065f46;
  padding: 8px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
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
