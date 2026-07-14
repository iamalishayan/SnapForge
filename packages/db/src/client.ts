import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Instantiate a standard Supabase client for client-side components using public variables
export const createBrowserClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Supabase client variables are missing in env.')
  }

  return createClient<Database>(url, anonKey)
}

