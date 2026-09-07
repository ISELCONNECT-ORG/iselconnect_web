<template>
  <div class="dashboard-root">
    <Sidebar />

    <main class="content">
      <Topbar />

      <div class="page-wrapper">
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
      </div>
    </main>
  </div>
</template>

<script setup>
import Sidebar from '@/components/BranchSidebar.vue'
import Topbar from '@/components/BranchTopbar.vue'
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
  display: flex;
  flex-direction: column;
}

/* Wrapper to align the content below Topbar properly */
.page-wrapper {
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
  margin: 4px 0 24px;
  font-size: 0.9rem;
  color: #64748b;
}

/* Glass cards */
.card {
  margin-bottom: 24px;
}

.glass-card {
  background: rgba(255, 255, 255, 0.9);
  padding: 24px 28px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  box-shadow: 0 8px 22px rgba(148, 163, 184, 0.35);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* Card content */
.card-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
}

.card-text {
  margin: 8px 0 16px;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #4b5563;
}

/* Support actions buttons */
.support-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 16px 0;
}

.btn-action {
  padding: 10px 20px;
  border-radius: 999px;
  border: 1px solid #cbd5e1;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  background: #ffffff;
  color: #1f2933;
  transition: all 0.2s ease;
}

.btn-action.primary {
  background: #1e3a8a;
  border-color: #1e3a8a;
  color: #ffffff;
}

.btn-action.primary:hover {
  background: #1e2a78;
}

.btn-action.secondary {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1e3a8a;
}

.btn-action.secondary:hover {
  background: #dbeafe;
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

/* Developers */
.developers-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.dev-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dev-item strong {
  font-size: 0.95rem;
  color: #111827;
}

.dev-item span {
  font-size: 0.85rem;
  font-weight: 500;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Footer text */
.copyright {
  font-size: 0.8rem;
  margin-top: 32px;
  color: #94a3b8;
  text-align: center;
}
</style>
