<template>
  <div class="dashboard-root">
    <Sidebar />
    <main class="content">
      <h1>Admin Profile</h1>
      <section class="card">
        <div class="avatar-large"></div>
        <div class="info-group">
          <label>Full Name</label>
          <p>{{ profile.first_name }} {{ profile.middle_name }} {{ profile.last_name }}</p>
        </div>
        <div class="info-group">
          <label>Email Address</label>
          <p>{{ profile.email }}</p>
        </div>
        <div class="info-group">
          <label>Role</label>
          <p>Main Supervisor</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import Sidebar from '@/components/Sidebar.vue'

const profile = ref({ first_name: '', middle_name: '', last_name: '', email: '' })

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

  if (data) profile.value = { ...profile.value, ...data }
}

onMounted(fetchProfile)
</script>

<style scoped>
.dashboard-root {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
}
.content {
  flex-grow: 1;
  padding: 40px;
}
.card {
  background: #fff;
  padding: 30px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  max-width: 500px;
}
.avatar-large {
  width: 100px;
  height: 100px;
  background: #cbd5e1;
  border-radius: 50%;
  margin-bottom: 20px;
}
.info-group {
  margin-bottom: 20px;
}
.info-group label {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 600;
}
.info-group p {
  font-size: 1.1rem;
  color: #1e293b;
  margin: 5px 0 0;
}
</style>
