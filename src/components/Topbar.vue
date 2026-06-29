<template>
  <header class="topbar">
    <div class="search-container">
      <Search :size="18" color="#94a3b8" />
      <input type="text" placeholder="Search reports, grids, or linemen..." class="search-input" />
    </div>

    <div class="user-area">
      <button class="icon-btn"><Bell :size="20" /></button>
      <button class="icon-btn"><Settings :size="20" /></button>
      <div class="profile-box">
        <div class="profile-text">
          <span class="name">Admin Profile</span>
          <span class="role">Main Supervisor</span>
        </div>
        <div class="avatar"></div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { Search, Bell, Settings } from 'lucide-vue-next'
</script>

<style scoped>
.topbar {
  height: 70px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
  border-bottom: 1px solid #e5e7eb;
}
.search-container {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f8fafc;
  padding: 8px 15px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}
.search-input {
  border: none;
  background: transparent;
  width: 300px;
  outline: none;
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
}
</style>
