import { supabase } from './supabase'

export const notifyLineman = async (phoneNumber, taskDescription) => {
  // 1. Check if the admin toggle is ON
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'sms_enabled')
    .single()

  if (error || data?.value !== 'true') return false

  // 2. Trigger the SkySMS Edge Function
  const { error: invokeError } = await supabase.functions.invoke('send-sms', {
    body: {
      phone_number: phoneNumber, // SkySMS requires +639 format
      message: `ISELCONNECT Alert: You have been assigned to task - ${taskDescription}. Please check your portal.`,
    },
  })

  if (invokeError) {
    console.error('Failed to send SMS:', invokeError)
    return false
  }

  return true
}
