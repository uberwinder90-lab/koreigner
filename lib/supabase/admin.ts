import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Pure admin client — bypasses ALL RLS policies.
 * Use only in API routes after manually verifying user auth.
 */
export function getAdminSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
