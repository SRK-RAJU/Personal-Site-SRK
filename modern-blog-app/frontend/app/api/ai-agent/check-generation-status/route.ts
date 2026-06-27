/**
 * ============================================================================
 * CHECK GENERATION STATUS ENDPOINT
 * ============================================================================
 * Purpose:
 * - Check if AI post generation should run
 * - Looks at ai_generated_posts table (not posts table)
 * - Returns true if no AI posts exist OR if it's Monday 3 AM
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { isTrustedAutomationRequest as isTrustedStatusRequest } from '@/lib/requestAccess';

export const dynamic = 'force-dynamic';

function getSupabaseClient() {
  const url = process.env.DIRECT_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!url || !key || url.includes('placeholder') || key.includes('placeholder')) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    if (!isTrustedStatusRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CHECK-GENERATION-STATUS] Checking if generation needed...');

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { shouldGenerate: true, reason: 'Supabase not configured - assume first run' },
        { status: 200 }
      );
    }

    // ✅ FIXED: Check ai_generated_posts table (not posts table)
    const { count, error } = await supabase
      .from('ai_generated_posts')
      .select('id', { count: 'exact' })
      .limit(1);

    if (error) {
      console.error('[CHECK-GENERATION-STATUS] Database error:', error);
      return NextResponse.json(
        { shouldGenerate: true, reason: 'Database check failed - assume first run' },
        { status: 200 }
      );
    }

    const hasNoPosts = !count || count === 0;

    if (hasNoPosts) {
      console.log('[CHECK-GENERATION-STATUS] ✅ No AI posts found - first run');
      return NextResponse.json(
        { shouldGenerate: true, reason: 'First deployment detected' },
        { status: 200 }
      );
    }

    // Check if it's Monday 3 AM UTC
    const now = new Date();
    const isMonday = now.getUTCDay() === 1;
    const is3AM = now.getUTCHours() === 3;
    const isScheduledTime = isMonday && is3AM;

    if (isScheduledTime) {
      console.log('[CHECK-GENERATION-STATUS] ⏰ Monday 3 AM detected');
      return NextResponse.json(
        { shouldGenerate: true, reason: 'Scheduled Monday 3 AM UTC' },
        { status: 200 }
      );
    }

    console.log('[CHECK-GENERATION-STATUS] No generation needed');
    return NextResponse.json(
      { 
        shouldGenerate: false, 
        reason: `Already have ${count} AI posts and not Monday 3 AM (currently ${isMonday ? 'Monday' : 'not Monday'} ${now.getUTCHours()}:00 UTC)` 
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[CHECK-GENERATION-STATUS] Error:', message);
    return NextResponse.json(
      { shouldGenerate: false, reason: `Error: ${message}` },
      { status: 500 }
    );
  }
}
