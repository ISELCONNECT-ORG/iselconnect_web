<template>
  <div class="dashboard-root">
    <BranchSidebar />
    <main class="content">
      <h1>Support & About</h1>

      <section class="card">
        <h3>Help Center</h3>
        <p>
          If you encounter issues with the ISELCONNECT platform, please check our resources below:
        </p>
        <div class="support-actions">
          <button class="btn-action">View FAQ</button>
          <button class="btn-action">Download User Manual</button>
        </div>
        <p class="contact-info">
          For urgent technical concerns, contact us at: <strong>support@iselconnect.com</strong>
        </p>
      </section>

      <section class="card">
        <h3>System Credits</h3>
        <p>ISELCONNECT is developed by the Isabela State University team.</p>
      </section>
    </main>
  </div>
</template>

<script setup>
import BranchSidebar from '@/components/BranchSidebar.vue'
</script>

<style scoped>
.content,
.card,
h1,
h3,
p,
strong,
span,
button,
.copyright {
  color: #000000 !important;
}

.dashboard-root {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
}
.content {
  flex-grow: 1;
  padding: 40px;
  max-width: 800px;
}
.card {
  background: #fff;
  padding: 25px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  margin-bottom: 20px;
}
.support-actions {
  display: flex;
  gap: 10px;
  margin: 15px 0;
}
.btn-action {
  padding: 10px 20px;
  background: #eff6ff;
  border: 1px solid #ccc;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}
.developers-list {
  display: flex;
  gap: 20px;
  margin-top: 15px;
}
.dev-item {
  display: flex;
  flex-direction: column;
}
.copyright {
  font-size: 0.8rem;
  margin-top: 20px;
}
</style>
