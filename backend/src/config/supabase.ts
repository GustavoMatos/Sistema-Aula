import { createClient, SupabaseClient } from '@supabase/supabase-js'
import ws from 'ws'
import { config } from './index.js'

const supabaseOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: {
    transport: ws as unknown as typeof globalThis.WebSocket,
  },
}

let supabase: SupabaseClient

if (config.supabase.url && config.supabase.serviceKey) {
  supabase = createClient(
    config.supabase.url,
    config.supabase.serviceKey,
    supabaseOptions
  )
} else {
  console.warn('Warning: Supabase credentials not configured - using placeholder')
  supabase = createClient(
    'https://placeholder.supabase.co',
    'placeholder-key',
    supabaseOptions
  )
}

export { supabase }
