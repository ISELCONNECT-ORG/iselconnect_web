<template>
  <header class="branch-topbar">
    <div class="logo">
      <h3>ISELCONNECT</h3>
    </div>

    <div class="user-area">
      <router-link to="/branch/notification" class="icon-btn">
        <Bell :size="20" />
      </router-link>

      <router-link to="/branch/profile" class="profile-box">
        <div class="profile-text">
          <span class="name">Branch Account</span>
          <span class="role">Branch Supervisor</span>
        </div>
        <div class="avatar"></div>
      </router-link>
    </div>
  </header>
</template>

<script setup>
import { Bell } from 'lucide-vue-next'
</script>

<style scoped>
.branch-topbar {
  height: 70px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
  border-bottom: 1px solid #e5e7eb;
}
.user-area {
  display: flex;
  align-items: center;
  gap: 20px;
}
.profile-box {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  cursor: pointer;
}
.profile-text {
  display: flex;
  flex-direction: column;
  text-align: right;
}
.name {
  font-weight: 600;
  font-size: 0.9rem;
  color: #1e293b;
}
.role {
  font-size: 0.75rem;
  color: #64748b;
}
.avatar {
  width: 36px;
  height: 36px;
  background: #cbd5e1;
  border-radius: 50%;
}
.icon-btn {
  border: none;
  background: none;
  cursor: pointer;
  color: #64748b;
  display: flex;
  align-items: center;
}
</style>
