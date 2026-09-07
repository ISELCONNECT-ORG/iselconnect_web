<template>
  <div class="dashboard-root">
    <BranchSidebar />

    <main class="main-content">
      <!-- Centered Profile Content with HomeBackground and bannerdashboard header -->
      <div class="content-wrapper">
        <div class="profile-card">
          <!-- Image Banner -->
          <div class="card-banner">
            <div class="banner-overlay"></div>
            <div class="banner-content">
              <h2 class="banner-name">{{ formattedName }}</h2>
              <p class="banner-email">{{ profile.email || 'Loading...' }}</p>
            </div>
          </div>

          <!-- Card Body -->
          <div class="card-body">
            <!-- Form Section (Left) -->
            <div class="form-section">
              <div class="input-group">
                <label>FULL NAME</label>
                <div class="input-wrapper">
                  <span class="input-text">{{ formattedName }}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94a3b8"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
              </div>

              <div class="input-group">
                <label>EMAIL ADDRESS</label>
                <div class="input-wrapper">
                  <span class="input-text">{{ profile.email || 'Loading...' }}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94a3b8"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                  </svg>
                </div>
              </div>

              <div class="input-group">
                <label>ROLE</label>
                <div class="input-wrapper">
                  <span class="input-text">Branch Account</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94a3b8"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Status Section (Right) -->
            <div class="status-section">
              <div class="status-card">
                <h3 class="status-label">ACCOUNT STATUS</h3>
                <div class="status-indicator">
                  <span
                    class="status-dot"
                    :class="{ 'inactive-dot': profile.is_active === false }"
                  ></span>
                  <span class="status-text">{{
                    profile.is_active === false ? 'Inactive' : 'Active Account'
                  }}</span>
                </div>
                <p class="status-desc">
                  This branch account is authenticated and currently holds system access permissions
                  based on its active state.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import BranchSidebar from '@/components/BranchSidebar.vue'

const profile = ref({
  first_name: '',
  middle_name: '',
  last_name: '',
  email: '',
  is_active: true,
})

// Computes the full name cleanly, ignoring string literals like "NULL" or "EMPTY"
const formattedName = computed(() => {
  if (!profile.value.first_name) return 'Echague Branch'

  const first = profile.value.first_name
  const middle =
    profile.value.middle_name && profile.value.middle_name !== 'NULL'
      ? `${profile.value.middle_name} `
      : ''
  const last =
    profile.value.last_name && profile.value.last_name !== 'EMPTY' ? profile.value.last_name : ''

  return `${first} ${middle}${last}`.trim()
})

const fetchProfile = async () => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return

  profile.value.email = user.email

  // Automatically updates is_active to TRUE in the database when online
  await supabase.from('users').update({ is_active: true }).eq('email', user.email)

  const { data } = await supabase
    .from('users')
    .select('first_name, middle_name, last_name, is_active')
    .eq('email', user.email)
    .maybeSingle()

  if (data) {
    profile.value = { ...profile.value, ...data }
  }
}

onMounted(fetchProfile)
</script>

<style scoped>
/* Base Layout with HomeBackground.jpg */
.dashboard-root {
  display: flex;
  min-height: 100vh;
  background-image: url('@/assets/Background/HomeBackground.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
}

.main-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

/* Center Layout */
.content-wrapper {
  padding: 40px;
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Profile Card */
.profile-card {
  width: 100%;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  max-width: 1100px;
}

/* Image Banner using bannerdashboard.jpg */
.card-banner {
  position: relative;
  background-image: url('@/assets/Background/bannerdashboard.jpg');
  background-size: cover;
  background-position: center;
  padding: 40px 32px 32px 32px;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  color: #ffffff;
}

/* Gradient overlay for banner text readability */
.banner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.4) 100%);
  z-index: 1;
}

.banner-content {
  position: relative;
  z-index: 2;
}

.banner-name {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 4px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.banner-email {
  font-size: 0.9rem;
  opacity: 0.95;
  margin: 0;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

/* Card Body Layout */
.card-body {
  display: flex;
  padding: 32px;
  gap: 48px;
}

.form-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Input Fields */
.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #94a3b8;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.input-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8fafc;
  border: 1px solid #f1f5f9;
  padding: 14px 16px;
  border-radius: 8px;
}

.input-text {
  font-size: 0.95rem;
  font-weight: 500;
  color: #1e293b;
}

/* Status Section */
.status-section {
  width: 320px;
  flex-shrink: 0;
}

.status-card {
  background-color: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  padding: 24px;
}

.status-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #94a3b8;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin: 0 0 16px 0;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  background-color: #10b981;
  border-radius: 50%;
  display: inline-block;
}

.inactive-dot {
  background-color: #ef4444;
}

.status-text {
  font-size: 0.95rem;
  font-weight: 600;
  color: #0f172a;
}

.status-desc {
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0;
}

/* Responsive adjustments */
@media (max-width: 868px) {
  .card-body {
    flex-direction: column;
  }
  .status-section {
    width: 100%;
  }
}
</style>
