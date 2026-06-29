<template>
  <div class="dashboard-root">
    <Sidebar />
    <main class="content">
      <header class="top-bar">
        <div class="breadcrumb">Main / Outage Scheduler</div>
        <div class="user-profile">Admin Panel</div>
      </header>

      <section class="page-title">
        <h1>Schedule Maintenance & Outage</h1>
        <p>Create and manage power interruption schedules to broadcast to consumers.</p>
      </section>

      <div class="advisory-grid">
        <div class="left-column">
          <section class="card">
            <h3>Time & Duration</h3>
            <label>OUTAGE DATE</label>
            <input type="date" v-model="outageDate" />
            <div class="row">
              <div><label>START TIME</label><input type="time" v-model="startTime" /></div>
              <div><label>END TIME</label><input type="time" v-model="endTime" /></div>
            </div>
          </section>

          <section class="card">
            <h3>Public Notice Preview</h3>
            <div class="preview-box">
              <p>
                ISELCO-1 ALERT: Scheduled power interruption on
                {{ outageDate || 'YYYY-MM-DD' }} from {{ startTime || '--:--' }} to
                {{ endTime || '--:--' }} affecting selected areas.
              </p>
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

      <footer class="action-bar">
        <span>Draft saved automatically</span>
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
import Sidebar from '@/components/Sidebar.vue'

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

onMounted(fetchData)

const broadcastOutage = async () => {
  if (selectedBarangays.value.length === 0) return alert('Select at least one area')
  loading.value = true

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Fetch numeric ID from users table to match int8 column
    const { data: adminProfile, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email)
      .maybeSingle()

    if (userError || !adminProfile) throw new Error('Admin profile not found.')

    // Insert Advisory
    const { error: advError } = await supabase.from('power_advisories').insert([
      {
        title: 'SCHEDULED MAINTENANCE',
        content: `Power interruption scheduled for ${outageDate.value} from ${startTime.value} to ${endTime.value}`,
        affected_areas: selectedBarangays.value.join(', '),
        schedule_start: `${outageDate.value}T${startTime.value}:00`,
        schedule_end: `${outageDate.value}T${endTime.value}:00`,
        created_by_admin_id: adminProfile.id,
      },
    ])
    if (advError) throw advError

    // Notify Residents
    const { data: residents } = await supabase
      .from('users')
      .select('id')
      .in('barangay_id', selectedBarangays.value)

    if (residents?.length > 0) {
      await supabase.from('notifications').insert(
        residents.map((r) => ({
          residents_id: r.id,
          title: 'Power Advisory',
          message: `Scheduled maintenance in your area on ${outageDate.value}.`,
          is_read: false,
        })),
      )
    }
    alert('Broadcast successful!')
    selectedBarangays.value = []
  } catch (err) {
    alert('Broadcast failed: ' + err.message)
  }
  loading.value = false
}
</script>

<style scoped>
.dashboard-root {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
  color: #000;
  font-family: sans-serif;
}
.content {
  flex-grow: 1;
  padding: 20px 40px;
}
.advisory-grid {
  display: grid;
  grid-template-columns: 4fr 6fr;
  gap: 20px;
}
.card {
  background: #fff;
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 20px;
}
.mun-accordion {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  margin-bottom: 10px;
  background: #f8fafc;
}
.mun-accordion summary {
  padding: 12px;
  font-weight: 600;
  cursor: pointer;
  color: #1e3a8a;
}
.barangay-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 15px;
}
.checkbox-item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 30px;
}
.btn-broadcast {
  background: #1e3a8a;
  color: #fff;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}
input {
  width: 100%;
  padding: 8px;
  margin: 5px 0 15px 0;
  border: 1px solid #ccc;
  color: #000;
}
.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.preview-box {
  background: #f1f5f9;
  padding: 15px;
  font-size: 0.9rem;
}
</style>
