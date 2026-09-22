// ============================================================
// ISEL CONNECT
// Supabase Edge Function
// send-push-notification
// ============================================================

import { createClient } from 'npm:@supabase/supabase-js@2'
import { cert, getApps, initializeApp } from 'npm:firebase-admin/app'
import { getMessaging } from 'npm:firebase-admin/messaging'

// ============================================================
// ENVIRONMENT VARIABLES
// ============================================================

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const firebaseServiceAccountKey = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_KEY')

// ============================================================
// VALIDATE ENVIRONMENT
// ============================================================

if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL is missing.')
}

if (!supabaseServiceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is missing.')
}

if (!firebaseServiceAccountKey) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY is missing.')
}

// ============================================================
// SUPABASE CLIENT
// ============================================================

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

console.log('✅ Supabase admin client initialized.')

// ============================================================
// FIREBASE ADMIN INITIALIZATION
// ============================================================

let firebaseReady = false

try {
  if (!firebaseServiceAccountKey) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not configured.')
  }

  const serviceAccount = JSON.parse(firebaseServiceAccountKey)

  if (getApps().length === 0) {
    initializeApp({
      credential: cert(serviceAccount),
    })
    console.log('✅ Firebase Admin initialized.')
  } else {
    console.log('✅ Firebase Admin already initialized.')
  }

  firebaseReady = true
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error)
}

// ============================================================
// TYPES
// ============================================================

type NotificationRecord = {
  id?: string | number | null
  residents_id?: string | null
  lineman_id?: string | null
  target_role?: string | null
  title?: string | null
  message?: string | null
  is_read?: boolean | null
  created_at?: string | null
}

type WebhookPayload = {
  type?: string
  table?: string
  schema?: string
  record?: NotificationRecord
  old_record?: NotificationRecord | null
}

type NotificationTarget = {
  role: 'resident' | 'lineman'
  residentId?: string | null
  linemanId?: string | null
  allRole: boolean
}

// ============================================================
// DETERMINE NOTIFICATION TARGET
// ============================================================

const determineTarget = (notification: NotificationRecord): NotificationTarget | null => {
  const title = (notification.title ?? '').toLowerCase()

  if (notification.residents_id) {
    return {
      role: 'resident',
      residentId: notification.residents_id,
      allRole: false,
    }
  }

  if (notification.lineman_id) {
    return {
      role: 'lineman',
      linemanId: notification.lineman_id,
      allRole: false,
    }
  }

  if (notification.target_role === 'resident') {
    return {
      role: 'resident',
      allRole: true,
    }
  }

  if (notification.target_role === 'lineman') {
    return {
      role: 'lineman',
      allRole: true,
    }
  }

  const isPowerAdvisory =
    title.includes('power advisory') ||
    title.includes('power outage') ||
    (title.includes('advisory') && title.includes('power'))

  if (isPowerAdvisory) {
    return {
      role: 'resident',
      allRole: true,
    }
  }

  const isLinemanNotification =
    title.includes('dispatch') ||
    title.includes('assignment') ||
    title.includes('assigned') ||
    title.includes('lineman')

  if (isLinemanNotification) {
    return {
      role: 'lineman',
      allRole: true,
    }
  }

  return null
}

// ============================================================
// GET USERS & TOKENS FROM USERS TABLE
// ============================================================

const getTargetDevices = async (target: NotificationTarget) => {
  let query = supabase.from('users').select('id, fcm_token').not('fcm_token', 'is', null)

  if (target.role === 'resident' && !target.allRole && target.residentId) {
    query = query.eq('id', target.residentId)
  }

  if (target.role === 'lineman' && !target.allRole && target.linemanId) {
    query = query.eq('id', target.linemanId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to get users: ${error.message}`)
  }

  return data ?? []
}

// ============================================================
// REMOVE INVALID TOKEN FROM USERS TABLE
// ============================================================

const removeInvalidToken = async (token: string) => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ fcm_token: null })
      .eq('fcm_token', token)

    if (error) {
      console.error('⚠️ Failed to clear invalid token:', error.message)
      return
    }

    console.log('🧹 Cleared invalid FCM token from users table.')
  } catch (error) {
    console.error('⚠️ Error clearing invalid token:', error)
  }
}

// ============================================================
// SEND FCM MESSAGES IN CHUNKS
// ============================================================

const sendToTokens = async (
  tokens: string[],
  notification: NotificationRecord,
  target: NotificationTarget,
) => {
  const messaging = getMessaging()
  const title = notification.title || 'ISEL Connect Notification'
  const body = notification.message || 'You have a new notification.'
  const notificationId = String(notification.id ?? '')
  const chunkSize = 500

  let successCount = 0
  let failureCount = 0

  for (let i = 0; i < tokens.length; i += chunkSize) {
    const chunk = tokens.slice(i, i + chunkSize)

    console.log(`📤 Sending FCM batch ${Math.floor(i / chunkSize) + 1} (${chunk.length} tokens)...`)

    const response = await messaging.sendEachForMulticast({
      tokens: chunk,
      notification: {
        title,
        body,
      },
      data: {
        notification_id: notificationId,
        target_role: target.role,
        url: '/notifications',
      },
      webpush: {
        headers: {
          TTL: '86400',
        },
        notification: {
          title,
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
        },
      },
    })

    successCount += response.successCount
    failureCount += response.failureCount

    for (let index = 0; index < response.responses.length; index++) {
      const result = response.responses[index]

      if (result.success) {
        continue
      }

      const failedToken = chunk[index]
      const errorCode = result.error?.code ?? ''

      console.error('❌ FCM send failed:', errorCode, result.error?.message ?? '')

      if (
        errorCode === 'messaging/registration-token-not-registered' ||
        errorCode === 'messaging/invalid-registration-token'
      ) {
        await removeInvalidToken(failedToken)
      }
    }
  }

  return {
    successCount,
    failureCount,
  }
}

// ============================================================
// CORS
// ============================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ============================================================
// EDGE FUNCTION
// ============================================================

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Method not allowed.',
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }

  try {
    console.log('================================================')
    console.log('🚀 send-push-notification started')
    console.log('================================================')

    if (!firebaseReady) {
      throw new Error('Firebase Admin is not initialized. Check FIREBASE_SERVICE_ACCOUNT_KEY.')
    }

    const payload = (await req.json()) as WebhookPayload
    const notification = payload.record

    if (!notification) {
      throw new Error('Webhook payload.record is missing.')
    }

    const target = determineTarget(notification)

    if (!target) {
      console.log('ℹ️ No recognized target. No push notification sent.')
      return new Response(
        JSON.stringify({
          success: true,
          sent: 0,
          message: 'No recognized notification target.',
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      )
    }

    const devices = await getTargetDevices(target)

    console.log(`📱 Active users found: ${devices.length}`)

    if (devices.length === 0) {
      console.log('ℹ️ No active users found.')
      return new Response(
        JSON.stringify({
          success: true,
          sent: 0,
          message: 'No active users found for this target.',
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      )
    }

    const tokens = [
      ...new Set(
        devices
          .map((device) => device.fcm_token)
          .filter((token): token is string => typeof token === 'string' && token.trim().length > 0),
      ),
    ]

    console.log(`📲 Valid FCM tokens: ${tokens.length}`)

    if (tokens.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          sent: 0,
          message: 'No valid FCM tokens found.',
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      )
    }

    const result = await sendToTokens(tokens, notification, target)

    console.log('================================================')
    console.log('📤 FCM SEND RESULT')
    console.log(`✅ Successful: ${result.successCount}`)
    console.log(`❌ Failed: ${result.failureCount}`)
    console.log('================================================')

    return new Response(
      JSON.stringify({
        success: true,
        sent: result.successCount,
        failed: result.failureCount,
        target,
        tokenCount: tokens.length,
        notificationId: notification.id ?? null,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    console.error('================================================')
    console.error('❌ CRITICAL EDGE FUNCTION ERROR')
    console.error(message)
    console.error('================================================')

    return new Response(
      JSON.stringify({
        success: false,
        error: message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }
})
