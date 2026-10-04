<!-- ReportRatingsReport.vue -->
<template>
  <div class="dashboard-layout">
    <!-- Sidebar Component -->
    <Sidebar class="no-print" />

    <!-- Main Content Area -->
    <div class="main-content">
      <!-- TOPBAR -->
      <Topbar class="no-print" />

      <!-- Top Banner Matching Design -->
      <div class="banner-container no-print">
        <div class="banner-text">
          <h1>Report Ratings Summary</h1>
          <p>Review customer feedback and overall satisfaction ratings</p>
        </div>
        <button class="print-btn-banner" @click="printPage">
          <Printer :size="16" style="margin-right: 6px; vertical-align: middle" /> Print Report /
          Save PDF
        </button>
      </div>

      <div class="print-layout">
        <!-- Printable Paper Sheet -->
        <div class="sheet">
          <!-- PROFESSIONAL PRINT HEADER (Matched Design) -->
          <div class="doc-header">
            <img
              src="@/assets/Background/iselconnectlogo.png"
              alt="ISELCONNECT Logo"
              class="print-logo"
            />
            <div class="doc-titles">
              <h1>REPORT RATINGS SUMMARY</h1>
              <p>Customer Feedback & Satisfaction Overview</p>
              <p>Generated on: {{ generatedDate }}</p>
            </div>
          </div>

          <div v-if="loading" class="loading-state">Loading ratings from database...</div>

          <div v-else-if="errorMsg" class="error-state">
            {{ errorMsg }}
          </div>

          <div v-else>
            <!-- Top Rated Highlight Card -->
            <div class="top-badge-card">
              <div class="top-left">
                <div class="trophy-icon-container">
                  <Star :size="24" class="trophy-icon" />
                </div>
                <div>
                  <div class="badge-title">OVERALL AVERAGE RATING</div>
                  <div class="name">{{ averageRating }} / 5.0</div>
                </div>
              </div>
              <div style="text-align: right">
                <div class="stat">
                  Total Ratings Received: <strong>{{ reportRatings.length }}</strong>
                </div>
                <div class="stat">
                  Perfect 5-Star Ratings: <strong>{{ fiveStarCount }}</strong>
                </div>
              </div>
            </div>

            <!-- Ratings Table -->
            <table>
              <thead>
                <tr>
                  <th style="width: 80px; text-align: center">RATING ID</th>
                  <th style="width: 100px; text-align: center">REPORT ID</th>
                  <th style="width: 80px; text-align: center">RATING</th>
                  <th>FEEDBACK</th>
                  <th style="width: 180px">DATE RATED</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in reportRatings" :key="index">
                  <td style="text-align: center">
                    <strong>#{{ item.id }}</strong>
                  </td>
                  <td style="text-align: center">
                    <strong>#{{ item.report_id }}</strong>
                  </td>
                  <td style="text-align: center">
                    <strong
                      >{{ item.rating }}
                      <Star
                        :size="12"
                        style="vertical-align: middle; fill: #fbbf24; color: #fbbf24"
                    /></strong>
                  </td>
                  <td>{{ item.feedback || 'No feedback provided' }}</td>
                  <td>
                    {{ formatDate(item.created_at) }}
                  </td>
                </tr>
                <tr v-if="reportRatings.length === 0">
                  <td colspan="5" style="text-align: center">No ratings found in the database.</td>
                </tr>
              </tbody>
            </table>

            <!-- Signature Footer -->
            <div class="signatures">
              <div class="sign-box">
                <div class="sign-line"></div>
                <p><strong>Prepared By:</strong></p>
                <p>Customer Relations Officer</p>
              </div>
              <div class="sign-box">
                <div class="sign-line"></div>
                <p><strong>Noted By:</strong></p>
                <p>Branch Manager</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/services/supabase'
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'
import { Printer, Star } from 'lucide-vue-next'

const loading = ref(true)
const errorMsg = ref(null)
const generatedDate = ref(new Date().toLocaleString())
const reportRatings = ref([])

// Computed properties for the top badge
const averageRating = computed(() => {
  if (reportRatings.value.length === 0) return '0.0'
  const sum = reportRatings.value.reduce((acc, curr) => acc + curr.rating, 0)
  return (sum / reportRatings.value.length).toFixed(1)
})

const fiveStarCount = computed(() => {
  return reportRatings.value.filter((r) => r.rating === 5).length
})

const printPage = () => {
  generatedDate.value = new Date().toLocaleString()
  window.print()
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
  return new Date(dateString).toLocaleDateString('en-US', options)
}

const fetchData = async () => {
  try {
    const { data, error } = await supabase
      .from('report_ratings')
      .select('id, report_id, rating, feedback, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error

    reportRatings.value = data || []
  } catch (err) {
    console.error('Error fetching ratings data:', err)
    errorMsg.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
  generatedDate.value = new Date().toLocaleString()
})
</script>

<style scoped>
/* Layout Alignment */
.dashboard-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f8fafc;
}

.main-content {
  flex-grow: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Matching Banner Style */
.banner-container {
  background: linear-gradient(135deg, #1e1b4b 0%, #3b82f6 100%);
  margin: 24px;
  padding: 32px;
  border-radius: 12px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  white-space: nowrap;
}

.banner-text h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.banner-text p {
  margin: 6px 0 0 0;
  font-size: 14px;
  opacity: 0.9;
}

.print-btn-banner {
  background-color: #b45309;
  color: white;
  border: none;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: background 0.2s ease;
  flex-shrink: 0;
}

.print-btn-banner:hover {
  background-color: #92400e;
}

/* Printable Paper Sheet */
.print-layout {
  padding: 0 24px 24px 24px;
  color: #1f2937;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 40px;
  font-size: 16px;
}
.error-state {
  color: #b91c1c;
  background: #fef2f2;
  border-radius: 8px;
  border: 1px solid #fca5a5;
  padding: 20px;
}

.sheet {
  max-width: 1000px;
  margin: 0 auto;
  background: white;
  padding: 45px;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

/* PROFESSIONAL PRINT HEADER STYLES */
.doc-header {
  display: flex;
  align-items: center;
  gap: 20px;
  border-bottom: 2px solid #1e1b4b;
  padding-bottom: 20px;
  margin-bottom: 30px;
}
.print-logo {
  height: 60px;
  object-fit: contain;
}
.doc-titles h1 {
  margin: 0 0 4px 0;
  font-size: 1.8rem;
  font-weight: 900;
  color: #1e1b4b;
  text-transform: uppercase;
}
.doc-titles p {
  margin: 0;
  font-size: 0.85rem;
  color: #475569;
}

/* Top Performer Badge Card */
.top-badge-card {
  border: 1px solid #e5e7eb;
  background-color: #f8fafc;
  border-radius: 8px;
  padding: 20px 24px;
  margin-bottom: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.top-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.trophy-icon-container {
  color: #fbbf24;
  display: flex;
  align-items: center;
}
.badge-title {
  font-size: 11px;
  font-weight: 700;
  color: #1e1b4b;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}
.top-badge-card .name {
  font-size: 22px;
  font-weight: bold;
  color: #1e1b4b;
}
.top-badge-card .stat {
  font-size: 13px;
  color: #4b5563;
}
.top-badge-card .stat strong {
  color: #1e1b4b;
}

/* Table Design */
table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 50px;
}
th,
td {
  border: 1px solid #e5e7eb;
  padding: 12px 16px;
  text-align: left;
  font-size: 13px;
}
th {
  background-color: #f1f5f9 !important;
  color: #1e1b4b !important;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.5px;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
tr:nth-child(even) {
  background-color: #fdfdfd;
}

.signatures {
  display: flex;
  justify-content: space-between;
  margin-top: 50px;
  padding: 0 10px;
}
.sign-box {
  text-align: center;
  width: 240px;
}
.sign-line {
  border-bottom: 1px solid #d1d5db;
  margin-bottom: 8px;
  height: 40px;
}
.sign-box p {
  margin: 2px 0;
  font-size: 12px;
  color: #4b5563;
}

/* ================= PRINT MEDIA QUERY ================= */
@media print {
  @page {
    size: A4 portrait;
    margin: 1.5cm;
  }

  body {
    background: white !important;
  }

  .no-print {
    display: none !important;
  }

  .dashboard-layout {
    background: none;
    display: block;
  }

  .main-content {
    overflow: visible;
    width: 100%;
    padding: 0 !important;
  }

  .print-layout {
    background: none;
    padding: 0;
    margin: 0;
  }

  .sheet {
    box-shadow: none;
    padding: 0;
    margin: 0;
    max-width: 100%;
    border: none;
  }

  th {
    background-color: #f1f5f9 !important;
    color: #1e1b4b !important;
  }

  .top-badge-card {
    border: 1px solid #d1d5db;
    background-color: #f8fafc !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
</style>
