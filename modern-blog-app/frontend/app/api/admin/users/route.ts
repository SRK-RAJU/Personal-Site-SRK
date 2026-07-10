import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

function getAdminSupabaseClient() {
  const url = process.env.DIRECT_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!url || !key || url.includes('YOUR_PROJECT_ID') || key.includes('YOUR_SERVICE_ROLE_KEY_HERE')) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function GET(request: NextRequest) {
  return requireAdminAuth(request, async () => {
    const supabase = getAdminSupabaseClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase admin configuration missing' }, { status: 503 });
    }

    const { data, error } = await supabase
      .from('user_roles')
      .select('user_id, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  });
}