<template>
  <div class="main-container">
    <div class="content-wrapper">
      <h1 class="title">ISELCONNECT</h1>
      <p class="subtitle">Please select your portal to continue:</p>

      <div class="cards-grid">
        <router-link to="/login?role=admin" class="card admin-card">
          <div class="icon">🛡️</div>
          <h3>Admin Portal</h3>
          <p>System-wide management access.</p>
        </router-link>

        <router-link to="/login?role=branch" class="card branch-card">
          <div class="icon">🏢</div>
          <h3>Branch Portal</h3>
          <p>Manage your specific municipality.</p>
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  padding: 20px;
}

.content-wrapper {
  text-align: center;
  width: 100%;
  max-width: 800px;
}
.title {
  font-size: 2.5rem;
  color: #1e3a8a;
  margin-bottom: 0.5rem;
}
.subtitle {
  color: #64748b;
  margin-bottom: 3rem;
}

/* Responsive Grid */
.cards-grid {
  display: flex;
  gap: 2rem;
  justify-content: center;
}

.card {
  background: white;
  padding: 2.5rem;
  border-radius: 16px;
  text-decoration: none;
  color: #334155;
  width: 100%;
  max-width: 300px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 1px solid #e2e8f0;
}

.card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
.icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

/* Mobile Optimization */
@media (max-width: 600px) {
  .cards-grid {
    flex-direction: column;
    align-items: center;
  }
  .card {
    width: 90%;
  }
}
</style>
