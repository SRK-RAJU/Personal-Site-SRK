import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.DIRECT_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

function isTrustedDeploymentCheck(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization') || '';
  const hasValidSecret = authHeader === `Bearer ${process.env.CRON_SECRET || ''}`;
  const isVercelSystemRequest =
    request.headers.has('x-vercel-id') ||
    request.headers.get('user-agent')?.includes('vercel-cron') ||
    request.headers.get('x-vercel-cron') === '1';

  return hasValidSecret || isVercelSystemRequest;
}

function getTodayDateKey(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function getTodaySlug(): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const year = today.getFullYear();
  return `devops-report-${month}-${day}-${year}`;
}

async function checkAndTriggerFirstRun(): Promise<boolean> {
  try {
    console.log('[DEPLOYMENT-CHECK] Checking if generation is needed for today...');

    const todaySlug = getTodaySlug();
    const { data, error } = await supabase
      .from('ai_generated_posts')
      .select('slug')
      .eq('slug', todaySlug)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[DEPLOYMENT-CHECK] Database error:', error);
      return false;
    }

    if (data?.slug) {
      console.log(`[DEPLOYMENT-CHECK] Post already exists for ${todaySlug}. Skipping trigger.`);
      return false;
    }

    const apiUrl = `${process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL || process.env.NEXT_PUBLIC_SITE_URL}` : 'http://localhost:3000'}/api/ai-agent/generate-post`;

    console.log(`[DEPLOYMENT-CHECK] Triggering AI generation at: ${apiUrl}`);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Vercel-Deploy-Check/1.0',
      'x-trigger-source': 'deployment-check',
    };

    if (process.env.CRON_SECRET) {
      headers.Authorization = `Bearer ${process.env.CRON_SECRET}`;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ source: 'deployment-check' }),
    });

    const result = await response.json().catch(() => ({}));
    console.log('[DEPLOYMENT-CHECK] Generation trigger response:', {
      status: response.status,
      success: result.success,
      skipped: result.skipped,
    });

    return result.success || result.skipped || false;
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
    if (!isTrustedDeploymentCheck(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
  return GET(request);
}
