<template>
  <aside class="sidebar">
    <div class="logo-area">
      <Zap :size="24" color="#1e3a8a" class="bolt-icon" />
      <span>ISELCO-1 (Branch)</span>
    </div>

    <nav class="nav-menu">
      <router-link to="/branch/dashboard" class="nav-link" active-class="active">
        <LayoutDashboard :size="20" /> Dashboard
      </router-link>
      <router-link to="/branch/map" class="nav-link" active-class="active">
        <Map :size="20" /> Map View
      </router-link>
      <router-link to="/branch/incident" class="nav-link" active-class="active">
        <AlertTriangle :size="20" /> Incident Queue
      </router-link>
      <router-link to="/branch/linemen" class="nav-link" active-class="active">
        <Users :size="20" /> Lineman Monitoring
      </router-link>
      <router-link to="/branch/analytics" class="nav-link" active-class="active">
        <LayoutDashboard :size="20" /> Analytics
      </router-link>
    </nav>

    <div class="footer-nav">
      <router-link to="/branch/settings" class="nav-link" active-class="active">
        <Settings :size="20" /> Settings
      </router-link>
      <router-link to="/branch/support" class="nav-link" active-class="active">
        <HelpCircle :size="20" /> Support
      </router-link>
      <button @click="handleLogout" class="logout-btn"><LogOut :size="20" /> Logout</button>
    </div>
  </aside>
</template>

<script setup>
import {
  Zap,
  LayoutDashboard,
  Map,
  AlertTriangle,
  Users,
  Megaphone,
  Settings,
  HelpCircle,
  LogOut,
} from 'lucide-vue-next'
import { supabase } from '@/services/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()

const handleLogout = async () => {
  const { error } = await supabase.auth.signOut()
  if (!error) {
    router.push('/login') // Redirect to login
  } else {
    alert('Error logging out: ' + error.message)
  }
}
</script>

<style scoped>
/* You can keep your existing CSS; it will apply perfectly to this component */
.sidebar {
  width: 240px;
  background-color: #ffffff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 20px;
  position: sticky;
  top: 0;
}
.logo-area {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  color: #1e3a8a;
  margin-bottom: 2rem;
  padding-left: 10px;
}
.bolt-icon {
  background: #dbeafe;
  padding: 4px;
  border-radius: 6px;
}
.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-grow: 1;
}
.nav-link {
  color: #64748b;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  font-weight: 500;
  transition: 0.2s;
}
.nav-link:hover {
  background-color: #f1f5f9;
  color: #1e293b;
}
.nav-link.active {
  background-color: #eef2ff;
  color: #1e3a8a;
  font-weight: 600;
}
.footer-nav {
  border-top: 1px solid #f1f5f9;
  padding-top: 20px;
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.logout-btn {
  background: none;
  border: none;
  width: 100%;
  cursor: pointer;
  color: #ef4444;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 500;
  border-radius: 8px;
  transition: 0.2s;
}
.logout-btn:hover {
  background-color: #fee2e2;
}
</style>
