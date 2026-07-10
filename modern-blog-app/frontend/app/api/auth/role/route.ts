import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getConfiguredAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function getSupabaseServerClient() {
  const supabaseUrl = process.env.DIRECT_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (
    !supabaseUrl ||
    !supabaseKey ||
    supabaseUrl.includes('YOUR_PROJECT_ID') ||
    supabaseKey.includes('YOUR_SERVICE_ROLE_KEY_HERE') ||
    supabaseKey.includes('YOUR_ANON_KEY_HERE')
  ) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const token = authHeader.slice('Bearer '.length).trim();
    const supabase = getSupabaseServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 503 });
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const normalizedEmail = user.email?.trim().toLowerCase() || '';
    if (normalizedEmail && getConfiguredAdminEmails().includes(normalizedEmail)) {
      return NextResponse.json({ role: 'admin', userId: user.id });
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    const role = roleData?.role === 'admin' || roleData?.role === 'author' ? roleData.role : 'user';
    return NextResponse.json({ role, userId: user.id });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to resolve role' }, { status: 500 });
  }
}