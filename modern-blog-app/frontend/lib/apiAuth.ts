import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Middleware to verify admin authentication on API routes
 * Checks for valid Supabase session and admin role
 */
export async function verifyAdminAuth(request: NextRequest): Promise<{ isValid: boolean; userId?: string; error?: string }> {
  try {
    // Get auth token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return { isValid: false, error: 'Missing authorization header' };
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return { isValid: false, error: 'Invalid authorization format' };
    }

    // Create Supabase client with token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    // Verify token and get user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return { isValid: false, error: 'Invalid or expired token' };
    }

    // Check if user is admin
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || roleData?.role !== 'admin') {
      return { isValid: false, error: 'Insufficient permissions' };
    }

    return { isValid: true, userId: user.id };
  } catch (err) {
    console.error('Auth verification error:', err);
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
