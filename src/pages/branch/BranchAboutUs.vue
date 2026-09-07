<template>
  <div class="dashboard-root">
    <Sidebar />

    <main class="main-content">
      <!-- Centered Content Wrapper with Profile UI Layout -->
      <div class="content-wrapper">
        <div class="profile-card">
          <!-- Image Banner -->
          <div class="card-banner">
            <div class="banner-overlay"></div>
            <div class="banner-content">
              <h2 class="banner-name">Support & About</h2>
              <p class="banner-email">
                Find help resources and learn more about the ISELCONNECT platform.
              </p>
            </div>
          </div>

          <!-- Card Body Layout -->
          <div class="card-body">
            <!-- Platform Overview Section (Left) -->
            <div class="form-section">
              <div class="inner-card-section">
                <h3 class="section-title">Platform Overview</h3>
                <p class="section-text">
                  ISELCONNECT is an integrated real-time reporting and monitoring platform
                  engineered specifically for electric cooperatives to streamline incident queues
                  and field operations. The application bridges communication between field teams
                  and branch dispatchers through specialized modules including live map views,
                  incident tracking, and lineman monitoring, and is designed to optimize electricity
                  distribution workflows, service outage management, and rapid response times for
                  cooperative service areas. Built as a dedicated capstone project by information
                  technology students from Isabela State University, it serves as a modern tool to
                  elevate cooperative utility management and operational efficiency.
                </p>

                <p class="contact-info">
                  For urgent technical concerns, contact us at:
                  <strong>support@iselconnect.com</strong>
                </p>
              </div>
            </div>

            <!-- System Credits Section (Right) -->
            <div class="status-section">
              <div class="status-card">
                <h3 class="status-label">SYSTEM CREDITS</h3>
                <p class="status-desc">
                  ISELCONNECT is a capstone project developed by the senior IT students of Isabela
                  State University.
                </p>

                <div class="developers-list">
                  <div class="dev-item">
                    <strong>Allysa B. Reyes</strong>
                    <span>Developer</span>
                  </div>
                  <div class="dev-item">
                    <strong>Mark Justin F. Balisacan</strong>
                    <span>Web Developer</span>
                  </div>
                  <div class="dev-item">
                    <strong>John Lloyd A. Binuya</strong>
                    <span>Mobile Developer</span>
                  </div>
                </div>

                <p class="copyright">
                  © 2026 Isabela State University - Web and Mobile Application Development
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import Sidebar from '@/components/BranchSidebar.vue'
</script>

<style scoped>
/* Base Layout with HomeBackground.jpg */
.dashboard-root {
  display: flex;
  min-height: 100vh;
  background-image: url('@/assets/Background/HomeBackground.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
}

.main-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

/* Center Layout */
.content-wrapper {
  padding: 40px;
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Profile Card */
.profile-card {
  width: 100%;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  max-width: 1100px;
}

/* Image Banner using bannerdashboard.jpg */
.card-banner {
  position: relative;
  background-image: url('@/assets/Background/bannerdashboard.jpg');
  background-size: cover;
  background-position: center;
  padding: 40px 32px 32px 32px;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  color: #ffffff;
}

/* Gradient overlay for banner text readability */
.banner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.4) 100%);
  z-index: 1;
}

.banner-content {
  position: relative;
  z-index: 2;
}

.banner-name {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 4px 0;
  color: #ffffff !important;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.banner-email {
  font-size: 0.9rem;
  opacity: 0.95;
  margin: 0;
  color: #ffffff !important;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

/* Card Body Layout */
.card-body {
  display: flex;
  padding: 32px;
  gap: 48px;
}

.form-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Inner section styling */
.inner-card-section {
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
}

.section-title {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
}

.section-text {
  margin: 0 0 16px 0;
  font-size: 0.9rem;
  line-height: 1.6;
  color: #4b5563;
  text-align: justify;
}

/* Contact info */
.contact-info {
  margin-top: 16px;
  font-size: 0.9rem;
  color: #4b5563;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.contact-info strong {
  color: #1e3a8a;
}

/* Status Section (Right side card matching Profile UI) */
.status-section {
  width: 360px;
  flex-shrink: 0;
}

.status-card {
  background-color: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-sizing: border-box;
}

.status-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #94a3b8;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin: 0 0 12px 0;
}

.status-desc {
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0 0 16px 0;
}

/* Developers List */
.developers-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.dev-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dev-item strong {
  font-size: 0.9rem;
  color: #111827;
}

.dev-item span {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Footer text */
.copyright {
  font-size: 0.75rem;
  color: #94a3b8;
  border-top: 1px solid #e2e8f0;
  padding-top: 12px;
  margin: 0;
  text-align: left;
}

/* Responsive adjustments */
@media (max-width: 868px) {
  .card-body {
    flex-direction: column;
  }
  .status-section {
    width: 100%;
  }
}
</style>
