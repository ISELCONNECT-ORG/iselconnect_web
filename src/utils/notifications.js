import { supabase } from '@/services/supabase'

export const sendNotification = async (title, message, residentId = null) => {
  const { error } = await supabase.from('notifications').insert([
    {
      title: title,
      message: message,
      residents_id: residentId,
      is_read: false,
      created_at: new Date().toISOString(),
    },
  ])

  if (error) console.error('Error sending notification:', error)
}
