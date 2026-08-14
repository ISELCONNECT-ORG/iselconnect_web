<!-- src/pages/admin/Advisory.vue -->
<template>
  <div class="dashboard-root">
    <Sidebar />
    <main class="content">
      <Topbar />

      <!-- HERO BANNER -->
      <header class="hero-banner">
        <div class="hero-overlay-content">
          <h1>POWER ADVISORY</h1>
          <p>Create and broadcast scheduled or emergency power interruptions.</p>
        </div>
      </header>

      <!-- MAIN ADVISORY TWO-COLUMN LAYOUT -->
      <div class="advisory-main-grid">
        <!-- LEFT COLUMN: Advisory Details Form -->
        <section class="card advisory-form-card">
          <div class="card-title-row">
            <Megaphone :size="18" class="title-icon" />
            <h3>Advisory Details</h3>
          </div>

          <div class="form-row-3">
            <div class="field-group">
              <label class="field-label">Outage Date</label>
              <input type="date" v-model="outageDate" class="input-field" />
            </div>
            <div class="field-group">
              <label class="field-label">Start Time</label>
              <input type="time" v-model="startTime" class="input-field" />
            </div>
            <div class="field-group">
              <label class="field-label">End Time (Est.)</label>
              <input type="time" v-model="endTime" class="input-field" />
            </div>
          </div>

          <div class="field-group" style="margin-top: 16px">
            <label class="field-label">Affected Areas</label>
            <span class="sub-label">Select municipalities and barangays</span>

            <div class="affected-areas-box">
              <div class="search-box-wrapper">
                <Search :size="14" class="search-ico" />
                <input
                  type="text"
                  v-model="areaSearchQuery"
                  placeholder="Search location..."
                  class="search-location-input"
                />
              </div>

              <div class="municipalities-tree">
                <div v-for="mun in filteredMunicipalities" :key="mun.id" class="mun-group">
                  <label class="mun-checkbox-label">
                    <input
                      type="checkbox"
                      @change="toggleMunicipality(mun)"
                      :checked="isMunSelected(mun)"
                    />
                    <strong>Municipality of {{ mun.name }}</strong>
                  </label>

                  <div class="brgy-sub-list">
                    <label
                      v-for="b in getBarangaysByMun(mun.id)"
                      :key="b.id"
                      class="brgy-checkbox-label"
                    >
                      <input type="checkbox" :value="b.id" v-model="selectedBarangays" />
                      <span>{{ b.name }}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="field-group" style="margin-top: 16px">
            <label class="field-label">Outage Type / Reason</label>
            <select v-model="outageReason" class="input-field">
              <option value="Scheduled Maintenance">Scheduled Maintenance</option>
              <option value="Line Clearing">Line Clearing</option>
              <option value="Emergency Repair">Emergency Repair</option>
              <option value="Transformer Replacement">Transformer Replacement</option>
            </select>
          </div>
        </section>

        <!-- RIGHT COLUMN: Broadcast Preview & Submit -->
        <div class="right-column-stack">
          <section class="card preview-card">
            <div class="preview-header-row">
              <h3>BROADCAST PREVIEW</h3>
              <RefreshCw :size="14" class="refresh-ico" />
            </div>

            <div class="preview-box">
              <div class="preview-inner-title">NOTICE OF SCHEDULED POWER INTERRUPTION</div>
              <p class="preview-text">To our valued member-consumers:</p>
              <p class="preview-text">
                Please be informed of a scheduled power interruption on
                <strong>{{ outageDate || '[Date]' }}</strong> from
                <strong>{{ startTime || '[Start Time]' }}</strong> to
                <strong>{{ endTime || '[End Time]' }}</strong
                >.
              </p>
              <p class="preview-text">
                <strong>AFFECTED AREAS:</strong><br />
                {{ previewAffectedAreasText }}
              </p>
              <p class="preview-text" style="margin-bottom: 0">
                <strong>REASON:</strong> {{ outageReason }} and Line Clearing operations.
              </p>
            </div>

            <div class="warning-banner">
              <AlertCircle :size="16" class="warn-icon" />
              <span>Double-check dates and affected areas before broadcasting.</span>
            </div>

            <button @click="broadcastOutage" :disabled="loading" class="btn-broadcast">
              <Radio :size="16" /> {{ loading ? 'BROADCASTING...' : 'Submit Advisory' }}
            </button>
          </section>
        </div>
      </div>

      <!-- RECENT ADVISORIES TABLE SECTION -->
      <section class="card recent-advisories-card">
        <div class="recent-header-row">
          <div class="title-with-icon">
            <History :size="16" />
            <h3>Recent Advisories</h3>
          </div>
          <button class="view-all-link">View All</button>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>DATE</th>
              <th>TYPE</th>
              <th>AREAS AFFECTED</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="adv in recentAdvisories" :key="adv.id">
              <td>
                <div class="adv-date">{{ formatDateDisplay(adv.schedule_start) }}</div>
                <div class="adv-time">
                  {{ formatTimeDisplay(adv.schedule_start) }} -
                  {{ formatTimeDisplay(adv.schedule_end) }}
                </div>
              </td>
              <td class="font-bold">{{ adv.title }}</td>
              <td>Selected Areas</td>
              <td>
                <span class="status-badge status-scheduled">Scheduled</span>
              </td>
            </tr>
            <tr v-if="recentAdvisories.length === 0">
              <td colspan="4" class="text-center">No recent advisories found.</td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import { sendNotification } from '@/utils/notifications.js'
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'
import { Megaphone, Search, RefreshCw, AlertCircle, Radio, History } from 'lucide-vue-next'

const loading = ref(false)
const municipalities = ref([])
const barangays = ref([])
const selectedBarangays = ref([])
const outageDate = ref('')
const startTime = ref('')
const endTime = ref('')
const outageReason = ref('Scheduled Maintenance')
const areaSearchQuery = ref('')
const recentAdvisories = ref([])

const fetchData = async () => {
  const { data: mData } = await supabase.from('municipalities').select('id, name')
  const { data: bData } = await supabase.from('barangays').select('id, municipality_id, name')
  municipalities.value = mData || []
  barangays.value = bData || []

  const { data: advData } = await supabase
    .from('power_advisories')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  recentAdvisories.value = advData || []
}

const getBarangaysByMun = (munId) => {
  const q = areaSearchQuery.value.toLowerCase().trim()
  const list = barangays.value.filter((b) => b.municipality_id === munId)
  if (!q) return list
  return list.filter((b) => b.name.toLowerCase().includes(q))
}

const filteredMunicipalities = computed(() => {
  const q = areaSearchQuery.value.toLowerCase().trim()
  if (!q) return municipalities.value
  return municipalities.value.filter((mun) => {
    const matchesMun = mun.name.toLowerCase().includes(q)
    const hasMatchingBrgy = barangays.value.some(
      (b) => b.municipality_id === mun.id && b.name.toLowerCase().includes(q),
    )
    return matchesMun || hasMatchingBrgy
  })
})

const isMunSelected = (mun) => {
  const munBrgys = barangays.value.filter((b) => b.municipality_id === mun.id)
  if (munBrgys.length === 0) return false
  return munBrgys.every((b) => selectedBarangays.value.includes(b.id))
}

const toggleMunicipality = (mun) => {
  const munBrgyIds = barangays.value.filter((b) => b.municipality_id === mun.id).map((b) => b.id)
  const allSelected = munBrgyIds.every((id) => selectedBarangays.value.includes(id))

  if (allSelected) {
    selectedBarangays.value = selectedBarangays.value.filter((id) => !munBrgyIds.includes(id))
  } else {
    const merged = new Set([...selectedBarangays.value, ...munBrgyIds])
    selectedBarangays.value = Array.from(merged)
  }
}

const previewAffectedAreasText = computed(() => {
  if (selectedBarangays.value.length === 0) return '[List of Areas]'

  const map = {}
  selectedBarangays.value.forEach((bId) => {
    const brgy = barangays.value.find((b) => b.id === bId)
    if (brgy) {
      const mun = municipalities.value.find((m) => m.id === brgy.municipality_id)
      const munName = mun ? mun.name : 'Unknown'
      if (!map[munName]) map[munName] = []
      map[munName].push(brgy.name)
    }
  })

  return Object.entries(map)
    .map(([mun, brgys]) => `${mun} (${brgys.join(', ')})`)
    .join('; ')
})

const broadcastOutage = async () => {
  if (selectedBarangays.value.length === 0) {
    return alert('Select at least one area')
  }
  if (!outageDate.value || !startTime.value || !endTime.value) {
    return alert('Please specify outage date and time.')
  }

  const firstBarangay = barangays.value.find((b) => b.id === selectedBarangays.value[0])
  const targetMunId = firstBarangay ? firstBarangay.municipality_id : null

  loading.value = true

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { data: adminProfile } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email)
      .maybeSingle()

    // Fixed: Removed missing schema columns 'affected_text' and 'status'
    const { error: advError } = await supabase.from('power_advisories').insert([
      {
        title: outageReason.value.toUpperCase(),
        content: `Power interruption scheduled for ${outageDate.value} from ${startTime.value} to ${endTime.value}`,
        affected_barangay_ids: selectedBarangays.value,
        municipality_id: targetMunId,
        schedule_start: `${outageDate.value}T${startTime.value}:00`,
        schedule_end: `${outageDate.value}T${endTime.value}:00`,
        created_by_admin_id: adminProfile?.id || null,
      },
    ])

    if (advError) throw advError

    const { data: residents } = await supabase
      .from('users')
      .select('id')
      .in('barangay_id', selectedBarangays.value)

    if (residents?.length > 0) {
      await Promise.all(
        residents.map((r) =>
          sendNotification('Power Advisory', `Scheduled maintenance on ${outageDate.value}.`, r.id),
        ),
      )
    }

    alert('Broadcast successful!')
    selectedBarangays.value = []
    fetchData()
  } catch (err) {
    alert('Broadcast failed: ' + err.message)
  }

  loading.value = false
}

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatTimeDisplay = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

onMounted(fetchData)
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
  padding: 16px 24px;
  overflow-x: hidden;
}

/* HERO BANNER */
.hero-banner {
  position: relative;
  background: url('@/assets/Background/bannerdashboard.jpg') no-repeat center center;
  background-size: cover;
  padding: 24px 32px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
.hero-banner::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(24, 24, 50, 0.9) 0%, rgba(30, 58, 138, 0.85) 100%);
  z-index: 1;
}
.hero-overlay-content {
  position: relative;
  z-index: 2;
}
.hero-overlay-content h1 {
  margin: 0 0 4px 0;
  font-size: 1.6rem;
  color: white;
  font-weight: 700;
}
.hero-overlay-content p {
  margin: 0;
  font-size: 0.85rem;
  color: #cbd5e1;
}

/* MAIN GRID LAYOUT */
.advisory-main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.card {
  background: #ffffff;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}
.title-icon {
  color: #283593;
}
.card-title-row h3 {
  margin: 0;
  font-size: 1rem;
  color: #0f172a;
  font-weight: 700;
}

.form-row-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}

.field-group {
  display: flex;
  flex-direction: column;
}
.field-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.sub-label {
  font-size: 0.7rem;
  color: #94a3b8;
  margin-bottom: 8px;
}

.input-field {
  width: 100%;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  font-size: 0.85rem;
  outline: none;
  background: #ffffff;
  box-sizing: border-box;
}

/* Affected Areas Box with Search */
.affected-areas-box {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 12px;
  background: #f8fafc;
  max-height: 250px;
  display: flex;
  flex-direction: column;
}
.search-box-wrapper {
  position: relative;
  margin-bottom: 10px;
}
.search-ico {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}
.search-location-input {
  width: 100%;
  padding: 6px 8px 6px 30px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 0.8rem;
  background: white;
  box-sizing: border-box;
  outline: none;
}
.municipalities-tree {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 180px;
}
.mun-group {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 8px;
}
.mun-checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: #0f172a;
  cursor: pointer;
}
.brgy-sub-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-top: 6px;
  padding-left: 20px;
}
.brgy-checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: #475569;
  cursor: pointer;
}

/* RIGHT COLUMN: Broadcast Preview */
.preview-card {
  display: flex;
  flex-direction: column;
}
.preview-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.preview-header-row h3 {
  margin: 0;
  font-size: 0.85rem;
  color: #475569;
  font-weight: 700;
  letter-spacing: 0.05em;
}
.refresh-ico {
  color: #94a3b8;
  cursor: pointer;
}

.preview-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 14px;
  font-size: 0.8rem;
  color: #334155;
  margin-bottom: 12px;
  flex-grow: 1;
}
.preview-inner-title {
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 8px;
  font-size: 0.85rem;
}
.preview-text {
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.warning-banner {
  background: #fef9c3;
  border: 1px solid #fde047;
  color: #854d0e;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.warn-icon {
  color: #ca8a04;
  flex-shrink: 0;
}

.btn-broadcast {
  background: #283593;
  color: #ffffff;
  padding: 10px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 10px rgba(40, 53, 147, 0.25);
  transition: background 0.2s;
}
.btn-broadcast:hover {
  background: #1e1b4b;
}
.btn-broadcast:disabled {
  opacity: 0.7;
  cursor: default;
}

/* RECENT ADVISORIES TABLE */
.recent-advisories-card {
  margin-bottom: 20px;
}
.recent-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.title-with-icon {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #0f172a;
}
.title-with-icon h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}
.view-all-link {
  background: none;
  border: none;
  color: #2563eb;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th {
  text-align: left;
  font-size: 0.65rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  padding: 10px 12px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}
.data-table td {
  padding: 12px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.8rem;
  vertical-align: middle;
}
.font-bold {
  font-weight: 700;
  color: #0f172a;
}
.adv-date {
  font-weight: 600;
  color: #0f172a;
}
.adv-time {
  font-size: 0.7rem;
  color: #64748b;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
}
.status-scheduled {
  background: #fef3c7;
  color: #b45309;
}
.status-completed {
  background: #f1f5f9;
  color: #475569;
}
.text-center {
  text-align: center;
  color: #64748b;
  padding: 24px;
}
</style>
