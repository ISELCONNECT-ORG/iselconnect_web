<!-- src/components/SystemAlertsPopup.vue -->
<template>
  <div v-if="activeAlerts && activeAlerts.length > 0" class="dark-toast-container">
    <div
      v-for="alert in activeAlerts"
      :key="alert?.id || Math.random()"
      class="dark-toast-card"
      :class="`type-${alert?.severity || 'normal'}`"
      @click="removeAlert(alert?.id)"
      title="Click to dismiss"
    >
      <!-- Status Icon Badge -->
      <div class="toast-icon-wrapper" :class="`icon-${alert?.severity || 'normal'}`">
        <span class="icon-symbol">{{ getIconSymbol(alert?.severity) }}</span>
      </div>

      <!-- Content Area -->
      <div class="toast-content">
        <h4 class="toast-title">{{ alert?.title || 'Notification' }}</h4>
        <p class="toast-message">{{ alert?.message || '' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useSystemAlerts } from '@/composables/useSystemAlerts'

const { activeAlerts, removeAlert } = useSystemAlerts()

const getIconSymbol = (severity) => {
  switch ((severity || '').toLowerCase()) {
    case 'low':
    case 'resolved':
      return '✓'
    case 'high':
    case 'advisory':
      return '!'
    case 'critical':
    case 'incident':
      return '✕'
    default:
      return 'i'
  }
}
</script>

<style scoped>
.dark-toast-container {
  position: fixed;
  top: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 99999;
  width: 100%;
  max-width: 420px;
  pointer-events: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.dark-toast-card {
  pointer-events: auto;
  background: #191c24;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  padding: 16px 20px;
  border-radius: 16px;
  box-shadow:
    0 16px 40px rgba(0, 0, 0, 0.5),
    0 4px 12px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  animation: slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.dark-toast-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.6);
  border-color: rgba(255, 255, 255, 0.12);
}

.toast-icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-weight: 700;
  font-size: 0.95rem;
}

.icon-low,
.icon-resolved {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.icon-high,
.icon-advisory {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.icon-critical,
.icon-incident {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.icon-normal,
.icon-assignment {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.toast-content {
  flex-grow: 1;
  overflow: hidden;
}

.toast-title {
  margin: 0 0 3px 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #f8fafc;
  letter-spacing: -0.01em;
}

.toast-message {
  margin: 0;
  font-size: 0.85rem;
  color: #94a3b8;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(40px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
