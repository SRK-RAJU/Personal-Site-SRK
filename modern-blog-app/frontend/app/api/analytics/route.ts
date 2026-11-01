import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getClientIp, getGeoInfo } from '@/lib/requestAccess';
import { getSiteStats } from '@/lib/siteStats';

// Use service role key for all operations to bypass RLS
const supabaseServiceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Fallback to anon key if service role is not available
const supabase = supabaseServiceRole;

// Rate limiting
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX = 50; // max requests per window

const fallbackPageViewCounts = new Map<string, number>();
let fallbackTotalVisits = 0;

function normalizePagePath(pageName?: string, pagePath?: string) {
  const rawValue = pagePath || pageName || '';
  if (typeof rawValue !== 'string') return '/';

  const trimmed = rawValue.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return '/';

  if (trimmed === 'homepage' || trimmed === 'home' || trimmed === '/') return '/';

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      return url.pathname || '/';
    } catch {
      return '/';
    }
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const recent = timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW);
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX;
}

async function getPageAnalyticsTotalViews() {
  try {
    const { data, error } = await supabase
      .from('page_analytics')
      .select('view_count')
      .not('view_count', 'is', null);

    if (!error && Array.isArray(data)) {
      return data.reduce((sum, row: any) => sum + (row?.view_count || 0), 0);
    }
  } catch {
    // Fall through to legacy schema
  }

  try {
    const { data, error } = await supabase
      .from('page_analytics')
      .select('visit_count')
      .not('visit_count', 'is', null);

    if (!error && Array.isArray(data)) {
      return data.reduce((sum, row: any) => sum + (row?.visit_count || 0), 0);
    }
  } catch {
    // Ignore and return 0
  }

  return 0;
}

async function getOrCreatePageAnalyticsEntry(page: string) {
  try {
    const { data, error } = await supabase
      .from('page_analytics')
      .select('id, view_count')
      .eq('page_path', page)
      .maybeSingle();

    if (!error) {
      return { row: data, schema: 'page_path' as const };
    }
  } catch {
    // Fall through to legacy schema
  }

  try {
    const { data, error } = await supabase
      .from('page_analytics')
      .select('id, visit_count')
      .eq('page_name', page)
      .maybeSingle();

    if (!error) {
      return {
        row: data ? { id: data.id, view_count: data.visit_count } : null,
        schema: 'page_name' as const,
      };
    }
  } catch {
    // Ignore and return null
  }

  return { row: null, schema: null as 'page_path' | 'page_name' | null };
}

async function savePageAnalyticsEntry(page: string, newCount: number) {
  const { row, schema } = await getOrCreatePageAnalyticsEntry(page);

  if (schema === 'page_path') {
    if (row?.id) {
      await supabase
        .from('page_analytics')
        .update({
          view_count: newCount,
          last_visited: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id);
    } else {
      await supabase.from('page_analytics').insert({
        page_path: page,
        view_count: newCount,
        last_visited: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    return;
  }

  if (schema === 'page_name') {
    if (row?.id) {
      await supabase
        .from('page_analytics')
        .update({
          visit_count: newCount,
          last_visited: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id);
    } else {
      await supabase.from('page_analytics').insert({
        page_name: page,
        visit_count: newCount,
        last_visited: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    return;
  }

  try {
    await supabase.from('page_analytics').insert({
      page_path: page,
      view_count: newCount,
      last_visited: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch {
    await supabase.from('page_analytics').insert({
      page_name: page,
      visit_count: newCount,
      last_visited: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
}

export async function GET(request: NextRequest) {
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'page-views') {
      try {
        const totalViews = await getPageAnalyticsTotalViews();
        const fallbackViews = Array.from(fallbackPageViewCounts.values()).reduce((sum, value) => sum + value, 0);

        return NextResponse.json({
          total_views: totalViews + fallbackViews,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        return NextResponse.json(
          { total_views: 0 },
          { status: 200 }
        );
      }
    }

    if (action === 'stats') {
      const extraViews = Array.from(fallbackPageViewCounts.values()).reduce((sum, value) => sum + value, 0);
      const stats = await getSiteStats({ extraViews });

      return NextResponse.json(
        { ...stats, timestamp: new Date().toISOString() },
        { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
      );
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    if (action === 'track-page-view') {
      const { page_name = 'homepage', page_path, user_agent } = data;

      try {
        const page = normalizePagePath(page_name, page_path);

        try {
          const { row } = await getOrCreatePageAnalyticsEntry(page);
          const currentCount = row?.view_count || 0;
          const newCount = currentCount + 1;

          await savePageAnalyticsEntry(page, newCount);

          try {
            const { data: statsData } = await supabase
              .from('website_stats')
              .select('total_visits, monthly_views')
              .maybeSingle();

            const currentVisits = statsData?.total_visits || 0;
            const currentMonthlyViews = statsData?.monthly_views || 0;
            const newVisits = currentVisits + 1;
            const newMonthlyViews = currentMonthlyViews + 1;

            fallbackTotalVisits += 1;
            fallbackPageViewCounts.set(page, (fallbackPageViewCounts.get(page) || 0) + 1);

            await supabase
              .from('website_stats')
              .upsert({
                id: 1,
                total_visits: newVisits,
                monthly_views: newMonthlyViews,
              }, {
                onConflict: 'id'
              });
          } catch (statsErr) {
            // Stats update skipped - continue anyway
          }

          // Best-effort visitor log for admin-only IP/country visibility. Never blocks tracking.
          try {
            const ip = getClientIp(request);
            const geo = getGeoInfo(request);
            await supabase.from('visitor_logs').insert({
              ip_address: ip,
              country: geo.country,
              region: geo.region,
              city: geo.city,
              page_path: page,
              user_agent: typeof user_agent === 'string' ? user_agent.slice(0, 500) : null,
            });
          } catch {
            // Table may not exist yet - ignore
          }

          return NextResponse.json({
            success: true,
            total_views: newCount,
            message: 'Page view tracked'
          });
        } catch (err) {
          return NextResponse.json({ success: true, total_views: 1 });
        }

      } catch (err) {
        return NextResponse.json({ success: true, total_views: 1 });
      }
    }

    if (action === 'update-stats') {
      const { articles, monthly_views, topics, projects } = data;

      try {
        const { error } = await supabase
          .from('website_stats')
          .upsert({
            id: 1,
            articles,
            monthly_views,
            topics,
            projects,
          }, {
            onConflict: 'id'
          });

        if (error) {
          return NextResponse.json({ error: 'Failed to update stats' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      } catch (err) {
        return NextResponse.json({ error: 'Failed to update stats' }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process analytics' }, { status: 500 });
  }
}
