import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Check if this is first deployment and trigger AI generation
 */
async function checkAndTriggerFirstRun(): Promise<boolean> {
  try {
    console.log('[DEPLOYMENT-CHECK] Checking if first run...');

    // Check if any posts exist
    const { count, error } = await supabase
      .from('ai_generated_posts')
      .select('id', { count: 'exact' })
      .limit(1);

    if (error) {
      console.error('[DEPLOYMENT-CHECK] Database error:', error);
      return false;
    }

    const hasNoPosts = !count || count === 0;

    if (hasNoPosts) {
      console.log('[DEPLOYMENT-CHECK] ✅ First deployment detected! Triggering AI generation...');

      // Get Vercel deployment URL from environment
      const vercelUrl = process.env.VERCEL_URL || 'localhost:3000';
      const protocol = process.env.VERCEL_ENV === 'production' ? 'https' : 'http';
      const apiUrl = `${protocol}://${vercelUrl}/api/ai-agent/generate-post`;

      console.log(`[DEPLOYMENT-CHECK] Calling: ${apiUrl}`);

      // Trigger AI generation with internal call (no auth needed for first run)
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Vercel-Internal-Cron',
        },
        body: JSON.stringify({}),
      });

      const result = await response.json();
      console.log('[DEPLOYMENT-CHECK] Generation trigger response:', {
        status: response.status,
        success: result.success,
        message: result.message,
      });

      return result.success || false;
    } else {
      console.log(`[DEPLOYMENT-CHECK] Posts already exist (${count}). Skipping auto-trigger.`);
      return false;
    }
  } catch (err) {
    console.error('[DEPLOYMENT-CHECK] Error:', err);
    return false;
  }
}

/**
 * Main handler for deployment check cron
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const triggered = await checkAndTriggerFirstRun();

    return NextResponse.json(
      {
        status: 'ok',
        checked_at: new Date().toISOString(),
        ai_generation_triggered: triggered,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[DEPLOYMENT-CHECK] Fatal error:', err);
    return NextResponse.json(
      {
        status: 'error',
        message: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Also support POST for manual testing
  return GET(request);
}
