<template>
  <aside class="sidebar">
    <div class="logo-area">
      <img src="@/assets/Background/iselconnectlogo.png" alt="ISELCONNECT Logo" class="logo-img" />
    </div>

    <nav class="nav-menu">
      <div class="section-title">OVERVIEW</div>
      <router-link to="/admin/dashboard" class="nav-link" active-class="active">
        <LayoutDashboard :size="20" /> Dashboard
      </router-link>
      <router-link to="/admin/incident" class="nav-link" active-class="active">
        <AlertTriangle :size="20" /> Incident Queue
      </router-link>
      <router-link to="/admin/map" class="nav-link" active-class="active">
        <MapIcon :size="20" /> Map View
      </router-link>

      <div class="section-title mt-4">FIELD OPS</div>
      <router-link to="/admin/linemen" class="nav-link" active-class="active">
        <Users :size="20" /> Lineman Monitoring
      </router-link>
      <router-link to="/admin/advisory" class="nav-link" active-class="active">
        <Megaphone :size="20" /> Power Advisory
      </router-link>
    </nav>

    <div class="footer-nav">
      <div class="dropdown-container">
        <button class="nav-link dropdown-toggle" @click="toggleUserMgmt">
          <div class="dropdown-label"><Users :size="20" /> User Management</div>
          <ChevronUp v-if="isUserMgmtOpen" :size="16" />
          <ChevronDown v-else :size="16" />
        </button>
        <div v-if="isUserMgmtOpen" class="dropdown-menu">
          <router-link to="/user-management" class="nav-link sub-link" active-class="active">
            <Users :size="18" /> All Users
          </router-link>
          <router-link
            to="/admin/account-verification"
            class="nav-link sub-link"
            active-class="active"
          >
            <ShieldCheck :size="18" /> Account Verification
          </router-link>
          <router-link to="/admin/create-lineman" class="nav-link sub-link" active-class="active">
            <UserPlus :size="18" /> Create Lineman Account
          </router-link>
          <router-link to="/admin/create-branch" class="nav-link sub-link" active-class="active">
            <Landmark :size="18" /> Create Branch Account
          </router-link>
          <router-link to="/admin/archive" class="nav-link sub-link" active-class="active">
            <Archive :size="18" /> Archive
          </router-link>
        </div>
      </div>

      <div class="dropdown-container">
        <button class="nav-link dropdown-toggle" @click="toggleSettings">
          <div class="dropdown-label"><Settings :size="20" /> Settings</div>
          <ChevronUp v-if="isSettingsOpen" :size="16" />
          <ChevronDown v-else :size="16" />
        </button>
        <div v-if="isSettingsOpen" class="dropdown-menu">
          <router-link to="/admin/profile" class="nav-link sub-link" active-class="active">
            <User :size="18" /> Profile
          </router-link>
          <router-link to="/admin/security" class="nav-link sub-link" active-class="active">
            <Shield :size="18" /> Security
          </router-link>
          <router-link to="/admin/audit-log" class="nav-link sub-link" active-class="active">
            <FileText :size="18" /> Audit Log
          </router-link>
          <router-link to="/admin/about" class="nav-link sub-link" active-class="active">
            <Info :size="18" /> About Us
          </router-link>
        </div>
      </div>

      <button @click="confirmLogout" class="logout-btn mt-4"><LogOut :size="20" /> Logout</button>
    </div>

    <Teleport to="body">
      <div v-if="showLogoutModal" class="modal-overlay" @click.self="cancelLogout">
        <div class="modal-content">
          <div class="modal-icon-container">
            <LogOut :size="28" class="modal-icon" />
          </div>
          <h3 class="modal-title">Logout Confirmation</h3>
          <p class="modal-text">Are you sure you want to log out of<br />ISELCONNECT?</p>
          <div class="modal-actions">
            <button @click="cancelLogout" class="btn-cancel">Cancel</button>
            <button @click="handleLogout" class="btn-logout">Logout</button>
          </div>
        </div>
      </div>
    </Teleport>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import {
  LayoutDashboard,
  AlertTriangle,
  Map as MapIcon,
  Users,
  Megaphone,
  ShieldCheck,
  UserPlus,
  Landmark,
  Archive,
  Settings,
  User,
  Shield,
  FileText,
  Info,
  LogOut,
  ChevronDown,
  ChevronUp,
} from 'lucide-vue-next'
import { supabase } from '@/services/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()

// Dropdown and Modal States
const isUserMgmtOpen = ref(false)
const isSettingsOpen = ref(false)
const showLogoutModal = ref(false)

const toggleUserMgmt = () => {
  isUserMgmtOpen.value = !isUserMgmtOpen.value
}

const toggleSettings = () => {
  isSettingsOpen.value = !isSettingsOpen.value
}

const handleLogout = async () => {
  const { error } = await supabase.auth.signOut()
  if (!error) {
    router.push('/')
  } else {
    alert('Error logging out: ' + error.message)
  }
}

const confirmLogout = () => {
  showLogoutModal.value = true
}

const cancelLogout = () => {
  showLogoutModal.value = false
}
</script>

<style scoped>
/* Sidebar Container */
.sidebar {
  width: 250px;
  min-width: 250px;
  flex-shrink: 0;
  background-color: #f8fafc;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 0 16px 20px;
  position: sticky;
  top: 0;
  overflow-y: auto;
}

/* Logo Area */
.logo-area {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 8px 16px;
}

.logo-img {
  width: 140px;
  height: auto;
  object-fit: contain;
}

/* Navigation Menu */
.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-grow: 1;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  padding: 12px 12px 4px;
  letter-spacing: 0.05em;
}

.mt-4 {
  margin-top: 16px;
}

/* Links and Buttons */
.nav-link {
  color: #64748b;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
  background: transparent;
  width: 100%;
}

.nav-link:hover {
  background-color: #f1f5f9;
  color: #1e293b;
}

.nav-link.active {
  background-color: #eef2ff;
  color: #283593;
  font-weight: 600;
}

/* Dropdown specific styles */
.dropdown-container {
  display: flex;
  flex-direction: column;
  margin-bottom: 4px;
}

.dropdown-toggle {
  justify-content: space-between;
}

.dropdown-label {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dropdown-menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 2px;
}

.sub-link {
  padding-left: 40px;
  font-size: 0.9rem;
}

/* Footer & Logout Button */
.footer-nav {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  border-top: 1px solid #e2e8f0;
  padding-top: 16px;
}

.logout-btn {
  background-color: #283593;
  border: none;
  width: 100%;
  cursor: pointer;
  color: white;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 500;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.logout-btn:hover {
  background-color: #1e2a78;
}
</style>

<style>
/* GLOBAL MODAL STYLES */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 32px 24px;
  width: 90%;
  max-width: 400px;
  text-align: center;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: modalIn 0.2s ease-out;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-icon-container {
  background-color: #fee2e2;
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.modal-icon {
  color: #b91c1c;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
}

.modal-text {
  color: #64748b;
  font-size: 0.95rem;
  margin-bottom: 24px;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-cancel {
  background-color: #f1f5f9;
  color: #475569;
  border: none;
  padding: 10px 0;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  flex: 1;
  transition: background-color 0.2s;
}

.btn-cancel:hover {
  background-color: #e2e8f0;
}

.btn-logout {
  background-color: #1e1b4b;
  color: white;
  border: none;
  padding: 10px 0;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  flex: 1;
  transition: background-color 0.2s;
}

.btn-logout:hover {
  background-color: #151336;
}
</style>
