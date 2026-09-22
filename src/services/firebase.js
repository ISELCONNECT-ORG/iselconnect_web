// src/services/firebase.js

import { initializeApp } from 'firebase/app'
import { getMessaging } from 'firebase/messaging'
// 1. App Check imports disabled to prevent 403 errors with placeholder keys
// import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check'

// ============================================================
// FIREBASE CONFIGURATION
// ============================================================

const firebaseConfig = {
  apiKey: 'AIzaSyChu-9AwYfZCaChLq1OwJlbc36xjLIJ6lk',
  authDomain: 'iselconnect.firebaseapp.com',
  projectId: 'iselconnect',
  storageBucket: 'iselconnect.firebasestorage.app',
  messagingSenderId: '858799312641',
  appId: '1:858799312641:web:81c04ee617863f20d71500',
}

// ============================================================
// FIREBASE
// ============================================================

const app = initializeApp(firebaseConfig)

console.log('✅ Firebase app initialized')

// ============================================================
// APP CHECK DEBUG MODE & APP CHECK (TEMPORARILY DISABLED)
// ============================================================
/*
if (import.meta.env.DEV) {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true
}

const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY

let appCheck = null

if (recaptchaSiteKey) {
  try {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    })

    console.log('✅ Firebase App Check initialized')
  } catch (error) {
    console.error('❌ Firebase App Check initialization failed:', error)
  }
} else {
  console.warn('⚠️ VITE_RECAPTCHA_SITE_KEY is missing.')
}
*/

// ============================================================
// FIREBASE MESSAGING
// ============================================================

const messaging = getMessaging(app)

console.log('✅ Firebase Cloud Messaging initialized')

// ============================================================
// EXPORT
// ============================================================

// Export without appCheck
export { app, messaging }
