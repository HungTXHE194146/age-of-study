import { createClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client using service_role key.
 * 
 * WHY: The browser client uses the anon key which is restricted by RLS (Row Level Security).
 * API routes need to read questions/documents across all classes to build AI context,
 * so we need the service_role key which bypasses RLS.
 * 
 * SECURITY: This file must ONLY be imported in server-side code (API routes, server actions).
 * The SUPABASE_SERVICE_ROLE_KEY env var has no NEXT_PUBLIC_ prefix, so it's never exposed to the browser.
 */

let serverClient: ReturnType<typeof createClient> | null = null

export function getSupabaseServerClient() {
  if (!serverClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceKey) {
      throw new Error(
        'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables. ' +
        'Add SUPABASE_SERVICE_ROLE_KEY to .env.local (server-only, no NEXT_PUBLIC_ prefix).'
      )
    }

    serverClient = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return serverClient
}
