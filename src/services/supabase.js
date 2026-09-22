// src/services/supabase.js

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  console.error('❌ VITE_SUPABASE_URL is missing from .env')
}

if (!supabaseAnonKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY is missing from .env')
}

if (supabaseAnonKey === 'YOUR_EXISTING_SUPABASE_KEY') {
  console.error('❌ VITE_SUPABASE_ANON_KEY is still using the placeholder value.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('✅ Supabase client initialized')
