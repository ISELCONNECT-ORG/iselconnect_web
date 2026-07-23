<template>
  <aside class="sidebar">
    <div class="logo-area">
      <img src="@/assets/Background/iselconnectlogo.png" alt="ISELCONNECT Logo" class="logo-img" />
    </div>

    <nav class="nav-menu">
      <router-link to="/admin/dashboard" class="nav-link" active-class="active">
        <LayoutDashboard :size="20" /> Dashboard
      </router-link>
      <router-link to="/admin/incident" class="nav-link" active-class="active">
        <AlertTriangle :size="20" /> Incident List
      </router-link>
      <router-link to="/admin/analytics" class="nav-link" active-class="active">
        <LayoutDashboard :size="20" /> Analytics
      </router-link>
      <router-link to="/admin/map" class="nav-link" active-class="active">
        <Map :size="20" /> Map View
      </router-link>
      <router-link to="/admin/linemen" class="nav-link" active-class="active">
        <Users :size="20" /> Lineman Monitoring
      </router-link>
      <router-link to="/admin/advisory" class="nav-link" active-class="active">
        <Megaphone :size="20" /> Power Advisory
      </router-link>
    </nav>

    <div class="footer-nav">
      <router-link to="/admin/settings" class="nav-link">
        <Settings :size="20" /> Settings
      </router-link>
      <router-link to="/admin/support" class="nav-link">
        <HelpCircle :size="20" /> Support
      </router-link>
      <button @click="confirmLogout" class="logout-btn"><LogOut :size="20" /> Logout</button>
    </div>
  </aside>
</template>

<script setup>
import {
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
    router.push('/')
  } else {
    alert('Error logging out: ' + error.message)
  }
}

const confirmLogout = () => {
  const ok = window.confirm('Are you sure you want to log out?')
  if (ok) {
    handleLogout()
  }
}
</script>

<style scoped>
.sidebar {
  width: 240px;
  background-color: rgba(255, 255, 255, 0.92);
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 0 20px 20px; /* remove top padding */
  position: sticky;
  top: 0;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* Minimal fade-in, no big slide */
.sidebar {
  animation: fadeInSidebar 0.25s ease-out;
}

@keyframes fadeInSidebar {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.logo-area {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0rem;
}

.logo-img {
  width: 100px; /* visible size */
  height: 100px;
  object-fit: contain;
  border-radius: 0; /* no rounded box look */
  box-shadow: none; /* remove shadow */
}

/* No pulsing animation anymore */

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
  padding: 10px 12px;
  border-radius: 10px;
  font-weight: 500;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
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
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 500;
  border-radius: 10px;
  transition: background-color 0.2s ease;
}

.logout-btn:hover {
  background-color: #fee2e2;
}
</style>
