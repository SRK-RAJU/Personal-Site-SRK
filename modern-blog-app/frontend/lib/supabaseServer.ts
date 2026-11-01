import { createClient } from '@supabase/supabase-js';

/** Server-side Supabase client (service role). Returns null when the environment still has placeholder values. */
export function getServiceClient() {
  const url = process.env.DIRECT_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!url || !key || /placeholder|YOUR_|your_project_id|your-project|yourdomain\.com|your_service_role/i.test(url + key)) {
    return null;
  }

  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export type ServiceClient = NonNullable<ReturnType<typeof getServiceClient>>;
