/* ============================================================
   FIREBASE CLOUD MESSAGING SERVICE WORKER
   ============================================================ */

importScripts('https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js')

importScripts('https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js')

// ============================================================
// FIREBASE CONFIG
// ============================================================

firebase.initializeApp({
  apiKey: 'AIzaSyBSpizQ1xvqzW4L_m3-sBr_ke3WE9-qhOw',

  authDomain: 'iselconnect2026.firebaseapp.com',

  projectId: 'iselconnect2026',

  storageBucket: 'iselconnect2026.appspot.com',

  messagingSenderId: '287882910526',

  appId: '1:287882910526:web:be64d5e418dd3fc2792a6f',

  measurementId: 'G-FC4XP7JVDG',
})

const messaging = firebase.messaging()

// ============================================================
// BACKGROUND MESSAGE
// ============================================================

messaging.onBackgroundMessage((payload) => {
  console.log('[FCM SW] Background message:', payload)

  const title = payload.notification?.title || payload.data?.title || 'System Notification'

  const body = payload.notification?.body || payload.data?.body || 'You have a new notification.'

  const notificationId = payload.data?.notification_id || ''

  self.registration.showNotification(title, {
    body,

    icon: '/favicon.ico',

    badge: '/favicon.ico',

    tag: notificationId || 'iselconnect-notification',

    data: {
      url: payload.data?.url || '/',

      notification_id: notificationId,
    },

    requireInteraction: false,
  })
})

// ============================================================
// NOTIFICATION CLICK
// ============================================================

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification?.data?.url || '/'

  event.waitUntil(
    clients
      .matchAll({
        type: 'window',

        includeUncontrolled: true,
      })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.navigate(url)

            return client.focus()
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(url)
        }

        return null
      }),
  )
})
