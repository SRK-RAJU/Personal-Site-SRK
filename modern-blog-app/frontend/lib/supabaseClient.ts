import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseConfigErrorMessage = 'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'

export const isSupabaseConfigured = Boolean(
  url &&
  anonKey &&
  !url.includes('YOUR_PROJECT_ID') &&
  !anonKey.includes('YOUR_ANON_KEY_HERE')
)

// Note: Supabase credentials should be configured via environment variables

// Singleton pattern to avoid multiple GoTrueClient instances
let supabaseInstance: ReturnType<typeof createClient> | null = null;

function createUnconfiguredClient(): ReturnType<typeof createClient> {
  return new Proxy(
    {},
    {
      get() {
        throw new Error(supabaseConfigErrorMessage)
      },
    }
  ) as ReturnType<typeof createClient>
}

function getSupabaseClient(): ReturnType<typeof createClient> {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  if (!isSupabaseConfigured) {
    supabaseInstance = createUnconfiguredClient();
    return supabaseInstance;
  }

  supabaseInstance = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return supabaseInstance as ReturnType<typeof createClient>;
}

// Export singleton instance
export const supabase = getSupabaseClient();
