<template>
  <div id="app">
    <router-view />
    <SystemAlertsPopup />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { getToken, onMessage } from 'firebase/messaging'
import { messaging } from '@/services/firebase'
import { supabase } from '@/services/supabase'
import { useSystemAlerts } from '@/composables/useSystemAlerts'
import SystemAlertsPopup from '@/components/SystemAlertsPopup.vue'
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'

// ============================================================
// SYSTEM ALERTS
// ============================================================
const { addAlert } = useSystemAlerts()

let notificationChannel = null
let unsubscribeFCM = null
let authSubscription = null
let currentFCMToken = null
let serviceWorkerRegistration = null

// ============================================================
// NOTIFICATION SEVERITY
// ============================================================
const analyzeNotification = (title) => {
  const text = (title || '').toLowerCase()
  if (text.includes('resolved') || text.includes('completed')) return 'low'
  if (text.includes('system') || text.includes('deployed')) return 'low'
  if (text.includes('assign') || text.includes('dispatch') || text.includes('lineman'))
    return 'normal'
  if (text.includes('advisory') || text.includes('scheduled')) return 'high'
  return 'critical'
}

// ============================================================
// GET USER PUSH INFORMATION
// ============================================================
const getPushUserInfo = async (user) => {
  if (!user) return null

  const metadata = user.user_metadata || {}
  const appMetadata = user.app_metadata || {}

  const role = metadata.role || appMetadata.role || localStorage.getItem('user_role') || null
  const residentId =
    metadata.resident_id || appMetadata.resident_id || localStorage.getItem('resident_id') || null
  const linemanId =
    metadata.lineman_id || appMetadata.lineman_id || localStorage.getItem('lineman_id') || null

  if (role !== 'resident' && role !== 'lineman') {
    console.warn('⚠️ Push notification role is not resident or lineman:', role)
    return null
  }

  return { userId: user.id, role, residentId, linemanId }
}

// ============================================================
// SAVE FCM TOKEN TO SUPABASE
// ============================================================
const saveFCMTokenToSupabase = async (user) => {
  try {
    if (!user || !currentFCMToken) return

    const pushUser = await getPushUserInfo(user)
    if (!pushUser) return

    const { userId, role, residentId, linemanId } = pushUser
    const platform = Capacitor.isNativePlatform() ? Capacitor.getPlatform() : 'web'

    const payload = {
      user_id: userId,
      role: role,
      resident_id: role === 'resident' ? residentId || null : null,
      lineman_id: role === 'lineman' ? linemanId || null : null,
      fcm_token: currentFCMToken,
      platform: platform,
      is_active: true,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('push_devices').upsert(payload, {
      onConflict: 'fcm_token',
    })

    if (error) console.error('❌ Failed to save FCM token:', error)
    else console.log(`✅ FCM token saved for ${role} on ${platform}`)
  } catch (error) {
    console.error('❌ Error saving FCM token:', error)
  }
}

// ============================================================
// SETUP PUSH NOTIFICATIONS (CROSS-PLATFORM)
// ============================================================
const setupFirebaseNotifications = async () => {
  try {
    const { data: authData } = await supabase.auth.getUser()

    // --------------------------------------------------------
    // NATIVE MOBILE (iOS / Android)
    // --------------------------------------------------------
    if (Capacitor.isNativePlatform()) {
      let permStatus = await PushNotifications.checkPermissions()

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions()
      }

      if (permStatus.receive !== 'granted') {
        console.warn('⚠️ Mobile push permissions denied.')
        return
      }

      await PushNotifications.register()

      PushNotifications.addListener('registration', async (token) => {
        currentFCMToken = token.value
        localStorage.setItem('fcm_token', token.value)
        if (authData?.user) await saveFCMTokenToSupabase(authData.user)
      })

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        addAlert({
          id: Date.now(),
          title: notification.title || 'System Notification',
          message: notification.body || '',
          severity: analyzeNotification(notification.title),
        })
      })

      return
    }

    // --------------------------------------------------------
    // WEB / PWA
    // --------------------------------------------------------
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return

    let permission = Notification.permission
    if (permission === 'default') permission = await Notification.requestPermission()
    if (permission !== 'granted') return

    const registrations = await navigator.serviceWorker.getRegistrations()
    for (const registration of registrations) {
      if (registration.scope.includes('firebase-cloud-messaging-push-scope')) {
        await registration.unregister()
      }
    }

    serviceWorkerRegistration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js',
      { scope: '/' },
    )
    await navigator.serviceWorker.ready

    const token = await getToken(messaging, {
      vapidKey:
        'BIjuadbc5e4p-euenbE9bAYaZbMLU3SrOF2vWbX2WaipvB-nfAQBLVB5Qm-oqPemzpIHJUif4afi8i9Hnjr6Ljo',
      serviceWorkerRegistration: serviceWorkerRegistration,
    })

    if (!token) return

    currentFCMToken = token
    localStorage.setItem('fcm_token', token)
    if (authData?.user) await saveFCMTokenToSupabase(authData.user)

    if (!unsubscribeFCM) {
      unsubscribeFCM = onMessage(messaging, (payload) => {
        const title = payload.notification?.title || payload.data?.title || 'System Notification'
        const body = payload.notification?.body || payload.data?.body || ''
        addAlert({
          id: Date.now(),
          title,
          message: body,
          severity: analyzeNotification(title),
        })
      })
    }
  } catch (error) {
    console.error('❌ Notification setup failed:', error)
  }
}

// ============================================================
// SUPABASE REALTIME & AUTH LISTENER
// ============================================================
const setupAuthListener = () => {
  const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user && currentFCMToken) {
      await saveFCMTokenToSupabase(session.user)
    }
  })
  authSubscription = data.subscription
}

const setupSupabaseNotifications = () => {
  notificationChannel = supabase
    .channel('public:global_notifications_popup')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications' },
      (payload) => {
        const newNote = payload.new

        // Do not show global popups for targeted resident notifications
        if (!newNote || newNote.residents_id !== null) return

        const title = newNote.title || 'System Notification'
        addAlert({
          id: newNote.id || Date.now(),
          title,
          message: newNote.message || '',
          severity: analyzeNotification(title),
        })
      },
    )
    .subscribe()
}

// ============================================================
// LIFECYCLE
// ============================================================
onMounted(async () => {
  setupAuthListener()
  await setupFirebaseNotifications()
  setupSupabaseNotifications()
})

onUnmounted(() => {
  if (notificationChannel) supabase.removeChannel(notificationChannel)
  if (unsubscribeFCM) unsubscribeFCM()
  if (authSubscription) authSubscription.unsubscribe()
  if (Capacitor.isNativePlatform()) PushNotifications.removeAllListeners()
})
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>
