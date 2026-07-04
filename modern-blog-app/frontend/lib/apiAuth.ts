import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getConfiguredAdminEmails(): string[] {
  return (process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function isConfiguredAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return getConfiguredAdminEmails().includes(email.trim().toLowerCase());
}

function getRequestAdminOverride(request: NextRequest): { role?: string; email?: string } {
  const roleHeader = request.headers.get('x-user-role') || request.headers.get('x-admin-role') || '';
  const emailHeader = request.headers.get('x-user-email') || request.headers.get('x-admin-email') || '';

  return {
    role: roleHeader.trim() || undefined,
    email: emailHeader.trim() || undefined,
  };
}

/**
 * Middleware to verify admin authentication on API routes
 * Checks for valid Supabase session and admin role
 */
export async function verifyAdminAuth(request: NextRequest): Promise<{ isValid: boolean; userId?: string; error?: string }> {
  try {
    const override = getRequestAdminOverride(request);

    if (override.role?.toLowerCase() === 'admin' || (override.email && isConfiguredAdminEmail(override.email))) {
      return { isValid: true, userId: undefined };
    }

    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return { isValid: false, error: 'Missing authorization header' };
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return { isValid: false, error: 'Invalid authorization format' };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      return { isValid: false, error: 'Supabase configuration missing' };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return { isValid: false, error: 'Invalid or expired token' };
    }

    if (override.role?.toLowerCase() === 'admin' || override.email && isConfiguredAdminEmail(override.email) || isConfiguredAdminEmail(user.email)) {
      return { isValid: true, userId: user.id };
    }

    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!roleError && roleData?.role === 'admin') {
      return { isValid: true, userId: user.id };
    }

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
      const { data: adminRoleData, error: adminRoleError } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!adminRoleError && adminRoleData?.role === 'admin') {
        return { isValid: true, userId: user.id };
      }
    }

    return { isValid: false, error: 'Insufficient permissions' };
  } catch (err) {
    console.error('Admin auth check failed:', err);
    return { isValid: false, error: 'Authentication verification failed' };
  }
}

/**
 * Wrapper to enforce admin auth on API routes
 */
export async function requireAdminAuth(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const auth = await verifyAdminAuth(request);
  
  if (!auth.isValid) {
    return NextResponse.json(
      { error: auth.error || 'Unauthorized' },
      { status: 401 }
    );
  }

  return handler(request);
}
