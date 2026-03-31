import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { config } from './index.js'

let supabase: SupabaseClient

if (config.supabase.url && config.supabase.serviceKey) {
  supabase = createClient(
    config.supabase.url,
    config.supabase.serviceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
} else {
  console.warn('Warning: Supabase credentials not configured - using placeholder')
  // Create a placeholder that will fail gracefully
  supabase = createClient(
    'https://placeholder.supabase.co',
    'placeholder-key',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

export { supabase }
