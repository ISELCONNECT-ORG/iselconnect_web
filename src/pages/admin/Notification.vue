<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/services/supabase'

const notifications = ref([])
const selectedFilter = ref('All')
const filterTabs = ['All', 'Incident', 'Advisory', 'Assignment', 'Resolved', 'System', 'Signup']

let realtimeChannel = null

// Time ago formatter
const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Unknown'
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now - date) / 1000)

  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const fetchNotifications = async () => {
  // 1. Fetch normal notifications
  const { data: notesData, error: notesError } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })

  if (notesError) {
    console.error('❌ Error fetching notifications:', notesError.message)
  }

  // 2. Fetch USER_SIGNUP actions from system_logs
  const { data: logsData, error: logsError } = await supabase
    .from('system_logs')
    .select('*')
    .ilike('action_type', '%SIGNUP%') // Handles exact 'USER_SIGNUP' or case variations
    .order('created_at', { ascending: false })

  if (logsError) {
    console.error('❌ Error fetching system_logs:', logsError.message)
  } else {
    console.log('✅ Fetched USER_SIGNUP logs:', logsData)
  }

  let allData = []

  if (!notesError && notesData) {
    allData = [...notesData]
  }

  const loggedUserIds = new Set()

  if (!logsError && logsData) {
    const signupLogs = logsData.map((log) => {
      if (log.user_id) loggedUserIds.add(log.user_id)
      return {
        id: `log-${log.id}`,
        title: 'Account Created',
        message: log.action_details || 'A new user account has been registered.',
        created_at: log.created_at,
      }
    })
    allData = [...allData, ...signupLogs]
  }

  // 3. Fallback: Also check 'users' table for newly created accounts that missed system_logs
  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (!usersError && usersData) {
    const unloggedUsers = usersData
      .filter((u) => u.created_at && !loggedUserIds.has(u.id))
      .map((u) => ({
        id: `user-${u.id}`,
        title: 'Account Created',
        message: `New user account created (${u.full_name || u.name || u.email || 'New User'}).`,
        created_at: u.created_at,
      }))
    allData = [...allData, ...unloggedUsers]
  }

  // Sort combined array by newest first
  allData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  notifications.value = allData
}

const setupRealtimeSubscription = () => {
  realtimeChannel = supabase
    .channel('admin-notifications-page')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () =>
      fetchNotifications(),
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'system_logs' },
      (payload) => {
        if (payload.new?.action_type === 'USER_SIGNUP') {
          fetchNotifications()
        }
      },
    )
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, () =>
      fetchNotifications(),
    )
    .subscribe()
}

const deleteNotification = async (id) => {
  // If dismissing a system_log or user fallback card, only remove it from UI
  if (typeof id === 'string' && (id.startsWith('log-') || id.startsWith('user-'))) {
    notifications.value = notifications.value.filter((n) => n.id !== id)
    return
  }

  const { error } = await supabase.from('notifications').delete().eq('id', id)
  if (!error) {
    notifications.value = notifications.value.filter((n) => n.id !== id)
  }
}

const handleAcknowledge = (id) => {
  deleteNotification(id)
}

const handleDecline = (id) => {
  deleteNotification(id)
}

const getType = (note) => {
  const t = (note.title || '').toLowerCase()
  if (t.includes('account created') || t.includes('user_signup') || t.includes('signup'))
    return 'SIGNUP'
  if (t.includes('resolved') || t.includes('completed')) return 'RESOLVED'
  if (t.includes('system') || t.includes('deployed')) return 'SYSTEM'
  if (t.includes('assign') || t.includes('dispatch') || t.includes('lineman')) return 'ASSIGNMENT'
  if (t.includes('advisory') || t.includes('scheduled')) return 'ADVISORY'
  return 'INCIDENT'
}

const getSeverity = (note) => {
  const type = getType(note)
  if (type === 'INCIDENT') return 'critical'
  if (type === 'ADVISORY') return 'high'
  if (type === 'ASSIGNMENT' || type === 'SIGNUP') return 'normal'
  return 'low'
}

const getIconSymbol = (type) => {
  switch (type) {
    case 'INCIDENT':
      return '⚠'
    case 'ASSIGNMENT':
      return '🚗'
    case 'ADVISORY':
      return '⚡'
    case 'RESOLVED':
      return '✓'
    case 'SIGNUP':
      return '👤'
    default:
      return 'i'
  }
}

const getActionText = (note) => {
  const type = getType(note)
  if (type === 'INCIDENT') return 'View Details'
  if (type === 'ADVISORY') return 'Review Advisory'
  if (type === 'RESOLVED') return 'View Report'
  if (type === 'SYSTEM') return 'Read Release Notes'
  if (type === 'SIGNUP') return 'Review Account'
  return ''
}

const filteredGroupedNotifications = computed(() => {
  const now = new Date()
  const todayItems = []
  const yesterdayItems = []
  const olderItems = []

  const filtered = notifications.value.filter((note) => {
    if (selectedFilter.value === 'All') return true
    return getType(note).toLowerCase() === selectedFilter.value.toLowerCase()
  })

  filtered.forEach((note) => {
    const noteDate = new Date(note.created_at)
    const diffInDays = Math.floor((now - noteDate) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) todayItems.push(note)
    else if (diffInDays === 1) yesterdayItems.push(note)
    else olderItems.push(note)
  })

  const groups = []
  if (todayItems.length) groups.push({ label: 'TODAY', items: todayItems })
  if (yesterdayItems.length) groups.push({ label: 'YESTERDAY', items: yesterdayItems })
  if (olderItems.length) groups.push({ label: 'OLDER', items: olderItems })

  return groups
})

onMounted(() => {
  fetchNotifications()
  setupRealtimeSubscription()
})

onUnmounted(() => {
  if (realtimeChannel) supabase.removeChannel(realtimeChannel)
})
</script>
