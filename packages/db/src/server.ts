import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Instantiate an admin-level Supabase client using the service role key to bypass Row-Level Security (RLS)
export const createAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Supabase admin variables are missing in env.')
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

