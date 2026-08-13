<template>
  <header class="topbar">
    <div class="user-area">
      <!-- Notification Bell -->
      <router-link to="/notifications" class="icon-btn">
        <Bell :size="20" />
      </router-link>

      <!-- Profile Dropdown Button -->
      <button class="profile-btn">
        <CircleUser :size="18" />
        <span class="profile-text">Profile</span>
        <ChevronDown :size="16" />
      </button>
    </div>
  </header>
</template>

<script setup>
import { Bell, CircleUser, ChevronDown } from 'lucide-vue-next'
</script>

<style scoped>
/* Topbar Container */
.topbar {
  height: 64px;
  background-color: #283593;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 24px;
  /*
    REDUCED MARGINS:
    12px top, 12px right, 16px bottom (to leave space for the banner), 12px left
  */
  margin: 1px 1px 1px 1px;
  border-radius: 8px; /* Slightly sharper corners to look better with tight spacing */
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* User Area Wrapper */
.user-area {
  display: flex;
  align-items: center;
  gap: 24px;
}

/* Notification Bell */
.icon-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
  text-decoration: none;
}

.icon-btn:hover {
  color: #ffffff;
}

/* Profile Pill Button */
.profile-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 9999px;
  padding: 8px 16px 8px 12px;
  color: #ffffff;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.profile-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.4);
}

.profile-text {
  margin: 0 4px;
}
</style>
