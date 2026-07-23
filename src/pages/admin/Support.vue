<template>
  <div class="dashboard-root">
    <Sidebar />

    <main class="content">
      <!-- Page header -->
      <header class="page-header">
        <h1>Support & About</h1>
        <p class="subtitle">Find help resources and learn more about the ISELCONNECT platform.</p>
      </header>

      <!-- Help Center -->
      <section class="card glass-card">
        <h3 class="card-title">Help Center</h3>
        <p class="card-text">
          If you encounter issues with the ISELCONNECT platform, please check our resources below:
        </p>

        <div class="support-actions">
          <button class="btn-action primary">View FAQ</button>
          <button class="btn-action secondary">Download User Manual</button>
        </div>

        <p class="contact-info">
          For urgent technical concerns, contact us at:
          <strong> support@iselconnect.com</strong>
        </p>
      </section>

      <!-- System Credits -->
      <section class="card glass-card">
        <h3 class="card-title">System Credits</h3>
        <p class="card-text">
          ISELCONNECT is a capstone project developed by the senior IT students of Isabela State
          University.
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
      </section>
    </main>
  </div>
</template>

<script setup>
import Sidebar from '@/components/Sidebar.vue'
</script>

<style scoped>
.dashboard-root {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Inter',
    sans-serif;
}

.content {
  flex-grow: 1;
  padding: 32px 40px 40px;
  max-width: 900px;
}

/* Page header */
.page-header h1 {
  margin: 0;
  font-size: 1.6rem;
  color: #0f172a;
}

.page-header .subtitle {
  margin: 4px 0 18px;
  font-size: 0.9rem;
  color: #64748b;
}

/* Glass cards */
.card {
  margin-bottom: 20px;
}

.glass-card {
  background: rgba(255, 255, 255, 0.9);
  padding: 22px 24px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  box-shadow: 0 8px 22px rgba(148, 163, 184, 0.35);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* Card content */
.card-title {
  margin: 0;
  font-size: 1rem;
  color: #0f172a;
}

.card-text {
  margin: 8px 0 14px;
  font-size: 0.9rem;
  color: #4b5563;
}

/* Support actions buttons */
.support-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 12px 0 14px;
}

.btn-action {
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid #cbd5e1;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.85rem;
  background: #ffffff;
  color: #1f2933;
}

.btn-action.primary {
  background: #1e3a8a;
  border-color: #1e3a8a;
  color: #ffffff;
}

.btn-action.secondary {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1e3a8a;
}

/* Contact info */
.contact-info {
  margin-top: 4px;
  font-size: 0.9rem;
  color: #4b5563;
}

/* Developers */
.developers-list {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin-top: 14px;
}

.dev-item {
  display: flex;
  flex-direction: column;
}

.dev-item strong {
  font-size: 0.95rem;
  color: #111827;
}

.dev-item span {
  font-size: 0.85rem;
  color: #6b7280;
}

/* Footer text */
.copyright {
  font-size: 0.8rem;
  margin-top: 18px;
  color: #9ca3af;
}
</style>
