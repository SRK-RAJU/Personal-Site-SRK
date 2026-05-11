import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!url || !anonKey) {
  console.warn('Supabase URL or ANON KEY is not set. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Singleton pattern to avoid multiple GoTrueClient instances
let supabaseInstance: any = null;

function getSupabaseClient() {
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
      // Return a minimal mock client for build time
      supabaseInstance = {
        from: () => ({
          select: () => ({ data: null, error: { message: 'Not configured' } }),
          insert: async () => ({ data: null, error: { message: 'Not configured' } }),
          update: async () => ({ data: null, error: { message: 'Not configured' } }),
          delete: async () => ({ data: null, error: { message: 'Not configured' } }),
          eq: () => ({
            single: async () => ({ data: null, error: { message: 'Not configured' } }),
          }),
          order: () => ({ limit: () => ({ data: [], error: null }) }),
        }),
        storage: {
          from: () => ({
            list: async () => ({ data: [], error: null }),
            getPublicUrl: () => ({ data: { publicUrl: '' } }),
            upload: async () => ({ data: null, error: { message: 'Not configured' } }),
            remove: async () => ({ error: null }),
          }),
        },
      };
    }
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    // Return mock client
    supabaseInstance = {
      from: () => ({
        select: () => ({ data: null, error: { message: 'Failed to initialize' } }),
      }),
    };
  }

  return supabaseInstance;
}

// Export singleton instance
export const supabase = getSupabaseClient();

export default supabase
