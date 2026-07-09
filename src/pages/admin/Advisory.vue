<template>
  <div class="dashboard-root">
    <Sidebar />
    <main class="content">
      <Topbar />

      <!-- HERO HEADER: dark blue bar, white text -->
      <header class="hero-section">
        <div class="hero-header-content">
          <div class="hero-text">
            <h1>Outage Scheduler</h1>
            <p>Create and manage power interruption schedules to broadcast to consumers.</p>
          </div>
        </div>
      </header>

      <!-- Page title / description (optional, slightly lighter) -->
      <section class="page-title">
        <h2>Schedule Maintenance & Outage</h2>
        <p>Configure time, duration, and affected areas for scheduled advisories.</p>
      </section>

      <!-- Main advisory layout: two-column cards -->
      <div class="advisory-grid">
        <div class="left-column">
          <section class="card">
            <h3>Time & Duration</h3>

            <label class="field-label">OUTAGE DATE</label>
            <input type="date" v-model="outageDate" class="input-field" />

            <div class="row">
              <div class="row-field">
                <label class="field-label">START TIME</label>
                <input type="time" v-model="startTime" class="input-field" />
              </div>
              <div class="row-field">
                <label class="field-label">END TIME</label>
                <input type="time" v-model="endTime" class="input-field" />
              </div>
            </div>
          </section>
        </div>

        <section class="card">
          <h3>Affected Areas</h3>
          <div class="municipality-list">
            <details v-for="mun in municipalities" :key="mun.id" class="mun-accordion" open>
              <summary>{{ mun.name }}</summary>
              <div class="barangay-grid">
                <label v-for="b in getBarangaysByMun(mun.id)" :key="b.id" class="checkbox-item">
                  <input type="checkbox" :value="b.id" v-model="selectedBarangays" />
                  <span class="brgy-name">{{ b.name }}</span>
                </label>
              </div>
            </details>
          </div>
        </section>
      </div>

      <!-- Action bar -->
      <footer class="action-bar">
        <button @click="broadcastOutage" :disabled="loading" class="btn-broadcast">
          {{ loading ? 'BROADCASTING...' : 'Schedule & Broadcast Notice' }}
        </button>
      </footer>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import { sendNotification } from '@/utils/notifications.js'
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'

const loading = ref(false)
const municipalities = ref([])
const barangays = ref([])
const selectedBarangays = ref([])
const outageDate = ref('')
const startTime = ref('')
const endTime = ref('')

const fetchData = async () => {
  const { data: mData } = await supabase.from('municipalities').select('id, name')
  const { data: bData } = await supabase.from('barangays').select('id, municipality_id, name')
  municipalities.value = mData || []
  barangays.value = bData || []
}

const getBarangaysByMun = (munId) => barangays.value.filter((b) => b.municipality_id === munId)

const broadcastOutage = async () => {
  if (selectedBarangays.value.length === 0) {
    return alert('Select at least one area')
  }

  const firstBarangay = barangays.value.find((b) => b.id === selectedBarangays.value[0])
  const targetMunId = firstBarangay ? firstBarangay.municipality_id : null

  if (!targetMunId) return alert('Could not determine Municipality ID')

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

    const { error: advError } = await supabase.from('power_advisories').insert([
      {
        title: 'SCHEDULED MAINTENANCE',
        content: `Power interruption scheduled for ${outageDate.value} from ${startTime.value} to ${endTime.value}`,
        affected_barangay_ids: selectedBarangays.value,
        municipality_id: targetMunId,
        schedule_start: `${outageDate.value}T${startTime.value}:00`,
        schedule_end: `${outageDate.value}T${endTime.value}:00`,
        created_by_admin_id: adminProfile.id,
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
  } catch (err) {
    alert('Broadcast failed: ' + err.message)
  }

  loading.value = false
}

onMounted(fetchData)
</script>

<style scoped>
/* Overall layout, consistent background */
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
}

/* Hero header matching IncidentQueue / LinemanMonitoring */
.hero-section {
  margin-bottom: 24px;
  padding: 0;
  border-radius: 16px;
  overflow: hidden;
}

.hero-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 22px;
  border-radius: 16px;
  background: #1f3056;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
}

.hero-text h1 {
  margin: 0 0 6px;
  font-size: 1.5rem;
  color: #ffffff;
}

.hero-text p {
  margin: 0;
  font-size: 0.9rem;
  color: #e2e8f0;
}

/* Page title under hero */
.page-title {
  margin-bottom: 20px;
}

.page-title h2 {
  margin: 0 0 4px;
  font-size: 1.1rem;
  color: #0f172a;
}

.page-title p {
  margin: 0;
  font-size: 0.85rem;
  color: #64748b;
}

/* Advisory layout: two-column cards */
.advisory-grid {
  display: grid;
  grid-template-columns: minmax(0, 4fr) minmax(0, 6fr);
  gap: 20px;
  margin-bottom: 20px;
}

.left-column {
  display: flex;
  flex-direction: column;
}

/* Card styling consistent with other pages */
.card {
  background: #ffffff;
  padding: 16px 18px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
}

.card h3 {
  margin: 0 0 10px;
  font-size: 0.95rem;
  color: #0f172a;
}

/* Form fields and labels */
.field-label {
  display: block;
  margin-bottom: 4px;
  font-size: 0.8rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #94a3b8;
}

.input-field {
  width: 100%;
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid #cbd5e1;
  font-size: 0.9rem;
  outline: none;
  background: #ffffff;
}

.row {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.row-field {
  flex: 1;
}

/* Municipality accordion + barangay grid */
.municipality-list {
  margin-top: 4px;
}

.mun-accordion {
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  margin-bottom: 8px;
  overflow: hidden;
  background: #f9fafb;
}

.mun-accordion summary {
  padding: 10px 12px;
  font-weight: 600;
  cursor: pointer;
  color: #0f172a;
  list-style: none;
}

.mun-accordion summary::-webkit-details-marker {
  display: none;
}

.mun-accordion summary::after {
  content: '▾';
  float: right;
  font-size: 0.8rem;
  color: #64748b;
}

.barangay-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
  padding: 10px 12px 12px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  font-size: 0.85rem;
  color: #0f172a;
}

.checkbox-item input[type='checkbox'] {
  width: 14px;
  height: 14px;
}

.brgy-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Action bar + primary button */
.action-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.btn-broadcast {
  background: #1f3056;
  color: #ffffff;
  padding: 10px 22px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: 0 4px 10px rgba(31, 48, 86, 0.35);
}

.btn-broadcast:disabled {
  opacity: 0.7;
  cursor: default;
}
</style>
