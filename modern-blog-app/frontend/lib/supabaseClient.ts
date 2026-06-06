import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Note: Supabase credentials should be configured via environment variables

// Singleton pattern to avoid multiple GoTrueClient instances
let supabaseInstance: ReturnType<typeof createClient> | null = null;

function getSupabaseClient(): ReturnType<typeof createClient> {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  try {
    if (url && anonKey) {
      supabaseInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } else {
      // Return a real client even if credentials are missing (will fail at runtime with proper error)
      supabaseInstance = createClient(url || 'https://placeholder.supabase.co', anonKey || 'placeholder');
    }
  } catch (err) {
    // Failed to initialize Supabase client - create placeholder
    supabaseInstance = createClient('https://placeholder.supabase.co', 'placeholder');
  }

  return supabaseInstance as ReturnType<typeof createClient>;
}

// Export singleton instance
export const supabase = getSupabaseClient();
