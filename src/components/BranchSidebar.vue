<!-- src/components/BranchSidebar.vue -->
<template>
  <aside class="sidebar">
    <div class="logo-area">
      <img src="@/assets/Background/iselconnectlogo.png" alt="ISELCONNECT Logo" class="logo-img" />
    </div>

    <!-- MAIN TOP NAVIGATION -->
    <nav class="nav-menu">
      <div class="section-title">OVERVIEW</div>
      <router-link to="/branch/dashboard" class="nav-link" active-class="active">
        <div class="dropdown-label"><LayoutDashboard :size="20" /> Dashboard</div>
      </router-link>
      <router-link to="/branch/incident" class="nav-link" active-class="active">
        <div class="dropdown-label"><AlertTriangle :size="20" /> Incident Queue</div>
      </router-link>
      <router-link to="/branch/map" class="nav-link" active-class="active">
        <div class="dropdown-label"><MapIcon :size="20" /> Map View</div>
      </router-link>
      <router-link to="/branch/linemen" class="nav-link" active-class="active">
        <div class="dropdown-label"><Users :size="20" /> Lineman Monitoring</div>
      </router-link>
    </nav>

    <!-- BOTTOM FOOTER NAVIGATION -->
    <div class="footer-nav">
      <!-- SETTINGS FLYOUT (NEW UI) -->
      <div class="nav-item-container">
        <button
          class="nav-link"
          :class="{ 'active-flyout': activeMenu === 'settings' }"
          @click="toggleMenu('settings', $event)"
        >
          <div class="dropdown-label"><Settings :size="20" /> Settings</div>
          <div class="nav-right-icons">
            <span v-if="activeMenu === 'settings'" class="active-dot"></span>
            <ChevronRight :size="16" />
          </div>
        </button>

        <!-- Flyout Menu Overlay (Bottom-aligned) -->
        <div v-if="activeMenu === 'settings'" class="flyout-menu dark-theme bottom-aligned">
          <div class="flyout-header">
            <div class="flyout-icon-box"><Settings :size="20" /></div>
            <div class="flyout-titles">
              <span class="flyout-title">System Settings</span>
              <span class="flyout-subtitle">Preferences & Config</span>
            </div>
          </div>
          <div class="flyout-links scrollable">
            <router-link to="/branch/profile" class="flyout-link" active-class="active">
              <User :size="16" /> Profile
            </router-link>
            <router-link to="/branch/security" class="flyout-link" active-class="active">
              <Shield :size="16" /> Security
            </router-link>
            <router-link to="/branch/audit-log" class="flyout-link" active-class="active">
              <FileText :size="16" /> Audit Log
            </router-link>
            <router-link to="/branch/about" class="flyout-link" active-class="active">
              <Info :size="16" /> About Us
            </router-link>
          </div>
        </div>
      </div>

      <!-- LOGOUT BUTTON -->
      <button @click="confirmLogout" class="logout-btn mt-4"><LogOut :size="20" /> Logout</button>
    </div>

    <!-- CUSTOM LOGOUT MODAL TELEPORTED TO BODY -->
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
import { ref, onMounted, onUnmounted } from 'vue'
import {
  LayoutDashboard,
  AlertTriangle,
  Map as MapIcon,
  Users,
  Settings,
  User,
  Shield,
  FileText,
  Info,
  LogOut,
  ChevronRight,
} from 'lucide-vue-next'
import { supabase } from '@/services/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()

// Flyout State
const activeMenu = ref(null)

const toggleMenu = (menu, event) => {
  if (event) event.stopPropagation()
  activeMenu.value = activeMenu.value === menu ? null : menu
}

// Close menus when clicking outside
const closeMenus = (e) => {
  if (!e.target.closest('.nav-item-container')) {
    activeMenu.value = null
  }
}

onMounted(() => {
  document.addEventListener('click', closeMenus)
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenus)
})

// Modal States
const showLogoutModal = ref(false)

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
  overflow: visible; /* Required for flyouts to render outside */
  z-index: 9999;
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
  font-weight: 700;
  color: #64748b;
  padding: 16px 12px 8px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* Base Nav Links */
.nav-link {
  color: #64748b;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid transparent;
  background: transparent;
  width: 100%;
}

.dropdown-label {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-link:hover {
  background-color: #f1f5f9;
  color: #1e293b;
}

.nav-link.active {
  background-color: #f1f5f9;
  color: #1e293b;
  font-weight: 600;
}

/* Active Flyout State Trigger */
.nav-link.active-flyout {
  background-color: #eff6ff;
  color: #1e3a8a;
  border: 1px solid #dbeafe;
  font-weight: 600;
}

.nav-right-icons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.active-dot {
  width: 6px;
  height: 6px;
  background-color: #1e3a8a;
  border-radius: 50%;
}

/* Flyout Container & Menu */
.nav-item-container {
  position: relative;
  margin-bottom: 2px;
}

.flyout-menu.dark-theme {
  position: absolute;
  left: 100%;
  margin-left: 16px;
  width: 260px;
  background-color: #0f172a;
  border-radius: 12px;
  padding: 16px;
  z-index: 99999;
  box-shadow:
    0 10px 25px -5px rgba(0, 0, 0, 0.4),
    0 8px 10px -6px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: 1px solid #1e293b;
}

/* Layer & Alignment Fixes */
.flyout-menu.dark-theme.top-aligned {
  top: -8px;
}

.flyout-menu.dark-theme.bottom-aligned {
  top: auto;
  bottom: 0;
}

.flyout-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #1f2937;
}

.flyout-icon-box {
  background-color: #1e293b;
  padding: 8px;
  border-radius: 8px;
  color: #60a5fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.flyout-titles {
  display: flex;
  flex-direction: column;
}

.flyout-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: white;
}

.flyout-subtitle {
  font-size: 0.75rem;
  color: #94a3b8;
}

/* SCROLLABLE LINKS BOX */
.flyout-links.scrollable {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 240px;
  overflow-y: auto;
  padding-right: 6px;
}

/* Custom Scrollbar for Flyout */
.flyout-links.scrollable::-webkit-scrollbar {
  width: 4px;
}
.flyout-links.scrollable::-webkit-scrollbar-track {
  background: transparent;
}
.flyout-links.scrollable::-webkit-scrollbar-thumb {
  background-color: #334155;
  border-radius: 10px;
}

.flyout-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  color: #94a3b8;
  text-decoration: none;
  border-radius: 8px;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.flyout-link:hover {
  background-color: #1f2937;
  color: #e2e8f0;
}

.flyout-link.active {
  background-color: #1e3a8a;
  color: #93c5fd;
  font-weight: 500;
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

.mt-4 {
  margin-top: 16px;
}
</style>

<style>
/* Global Modal Styles for Teleported Elements */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999999;
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
