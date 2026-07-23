<template>
  <div class="dashboard-root">
    <BranchSidebar />

    <main class="content">
      <header class="page-header">
        <h1>Branch Profile</h1>
        <p class="subtitle">Account information for this branch user.</p>
      </header>

      <section class="card glass-card">
        <div class="avatar-large"></div>

        <div class="info-group">
          <label>Full Name</label>
          <p>
            {{ profile.first_name }}
            {{ profile.middle_name }}
            {{ profile.last_name }}
          </p>
        </div>

        <div class="info-group">
          <label>Email Address</label>
          <p>{{ profile.email }}</p>
        </div>

        <div class="info-group">
          <label>Role</label>
          <p>Branch Account</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import BranchSidebar from '@/components/BranchSidebar.vue'

const profile = ref({
  first_name: '',
  middle_name: '',
  last_name: '',
  email: '',
})

const fetchProfile = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  profile.value.email = user.email

  const { data } = await supabase
    .from('users')
    .select('first_name, middle_name, last_name')
    .eq('id', user.id)
    .maybeSingle()

  if (data) {
    profile.value = { ...profile.value, ...data }
  }
}

onMounted(fetchProfile)
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
}

.content {
  flex-grow: 1;
  padding: 32px 40px 40px;
}

/* Page header */
.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #0f172a;
}

.page-header .subtitle {
  margin: 4px 0 18px;
  font-size: 0.9rem;
  color: #64748b;
}

/* Glass profile card */
.card {
  max-width: 520px;
}

.glass-card {
  background: rgba(255, 255, 255, 0.9);
  padding: 26px 28px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  box-shadow: 0 10px 24px rgba(148, 163, 184, 0.35);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* Avatar */
.avatar-large {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #3b82f6, #22c55e);
  border-radius: 50%;
  margin-bottom: 22px;
  box-shadow: 0 8px 16px rgba(37, 99, 235, 0.35);
}

/* Info fields */
.info-group {
  margin-bottom: 18px;
}

.info-group:last-child {
  margin-bottom: 0;
}

.info-group label {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.info-group p {
  font-size: 1.05rem;
  color: #1e293b;
  margin: 6px 0 0;
}
</style>
