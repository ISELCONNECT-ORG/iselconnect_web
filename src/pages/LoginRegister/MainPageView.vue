<template>
  <div class="main-container" :style="bgStyle">
    <div class="overlay"></div>

    <div class="content-wrapper">
      <img :src="logo" alt="ISELCONNECT" class="brand-logo" />

      <p class="subtitle">Please select your portal to continue:</p>

      <div class="cards-grid">
        <router-link to="/login?role=admin" class="card admin-card">
          <Shield class="icon" />
          <h3>ADMIN</h3>
          <h4>PORTAL</h4>
          <p>Authorized Access for Global System Administrators.</p>
        </router-link>

        <router-link to="/login?role=branch" class="card branch-card">
          <Building2 class="icon" />
          <h3>BRANCH</h3>
          <h4>PORTAL</h4>
          <p>Authorized Access for Local Municipal Operators.</p>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Shield, Building2 } from 'lucide-vue-next'

const logo = new URL('@/assets/Background/iselconnectlogo.png', import.meta.url).href
const bg = new URL('@/assets/Background/HomeBackground.jpg', import.meta.url).href

const bgStyle = computed(() => ({
  backgroundImage: `url(${bg})`,
}))
</script>

<style scoped>
.main-container {
  min-height: 100vh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(3px);
}

.content-wrapper {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1100px;
  text-align: center;
}

.brand-logo {
  width: min(280px, 70vw);
  height: auto;
  margin-bottom: 12px;
  display: inline-block;
}

.subtitle {
  color: #fff;
  font-weight: 600;
  margin-bottom: 2.5rem;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem;
}

.card {
  min-height: 250px;
  padding: 2rem;
  border-radius: 22px;
  text-decoration: none;
  background: rgba(190, 210, 235, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(12px);
  color: #163b77;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.18);
  transition: 0.25s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.card:hover {
  transform: translateY(-6px);
}

.icon {
  width: 42px;
  height: 42px;
  margin-bottom: 12px;
  color: #163b77;
}

.card h3,
.card h4 {
  margin: 0;
  line-height: 1;
}

.card h3 {
  font-size: clamp(1.4rem, 3vw, 1.9rem);
  font-weight: 800;
  color: #f3e86b;
}

.card h4 {
  font-size: clamp(1rem, 2vw, 1.15rem);
  font-weight: 800;
  margin-top: 0.25rem;
}

.card p {
  margin-top: 0.9rem;
  color: rgba(255, 255, 255, 0.92);
  font-size: 0.92rem;
  text-align: center;
  max-width: 280px;
}

@media (max-width: 768px) {
  .cards-grid {
    grid-template-columns: 1fr;
  }

  .main-container {
    padding: 16px;
  }

  .card {
    min-height: 220px;
  }
}
</style>
