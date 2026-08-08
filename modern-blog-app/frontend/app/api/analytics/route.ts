import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getClientIp, isTrustedAutomationRequest } from '@/lib/requestAccess';

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
  if (!isTrustedAutomationRequest(request) && isRateLimited(clientIp)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'page-views') {
      try {
        const totalViews = await getPageAnalyticsTotalViews();
        const fallbackViews = Array.from(fallbackPageViewCounts.values()).reduce((sum, value) => sum + value, 0);
        const headerFallback = Number(request.headers.get('x-analytics-fallback') || '0');

        return NextResponse.json({
          total_views: Math.max(totalViews + fallbackViews, headerFallback),
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
      try {
        // Get stored stats with fallback values
        const { data: statsData, error: statsError } = await supabase
          .from('website_stats')
          .select('*')
          .single();

        if (statsError && statsError.code !== 'PGRST116') {
          // Don't throw - use fallback values
        }

        const fallbackStats = {
          articles: 0,
          monthly_views: 0,
          topics: 0,
          projects: 0,
          total_visits: 0,
        };

        // Safely fetch live counts with try-catch for each query
        try {
          const { count: articleCount } = await supabase
            .from('posts')
            .select('id', { count: 'exact', head: true });
          if (typeof articleCount === 'number') fallbackStats.articles = articleCount;
        } catch (err) {
          // Silent failure - use fallback
        }

        try {
          const monthlyViews = await getPageAnalyticsTotalViews();
          const fallbackViews = Array.from(fallbackPageViewCounts.values()).reduce((sum, value) => sum + value, 0);
          const headerFallback = Number(request.headers.get('x-analytics-fallback') || '0');
          if (monthlyViews + fallbackViews + headerFallback > 0) fallbackStats.monthly_views = monthlyViews + fallbackViews + headerFallback;
        } catch (err) {
          // Silent failure - use fallback
        }

        // Projects table is no longer used by the main site analytics flow.
        // Keep the existing fallback value if the table does not exist.
        
        try {
          const { count: topicsCount } = await supabase
            .from('topics')
            .select('id', { count: 'exact', head: true });
          if (typeof topicsCount === 'number') fallbackStats.topics = topicsCount;
        } catch (err) {
          try {
            const { count: toolTopicsCount } = await supabase
              .from('tools_coverage_metadata')
              .select('id', { count: 'exact', head: true })
              .eq('is_active', true);
            if (typeof toolTopicsCount === 'number') fallbackStats.topics = toolTopicsCount;
          } catch {
            // Silent failure - use fallback
          }
        }

        try {
          const { data: totalVisitsData } = await supabase
            .from('website_stats')
            .select('total_visits')
            .single();
          if (totalVisitsData?.total_visits != null) fallbackStats.total_visits = totalVisitsData.total_visits;
        } catch (err) {
          // Silent failure - use fallback
        }

        return NextResponse.json({
          articles: Math.max(Number(statsData?.articles || 0), fallbackStats.articles),
          monthly_views: Math.max(Number(statsData?.monthly_views || 0), fallbackStats.monthly_views),
          topics: Math.max(Number(statsData?.topics || 0), fallbackStats.topics),
          total_visits: Math.max(Number(statsData?.total_visits || 0), fallbackStats.total_visits),
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        // Return safe fallback values even on complete failure
        return NextResponse.json(
          {
            articles: 0,
            monthly_views: 0,
            topics: 0,
            total_visits: 0,
            error: 'Using default values',
          },
          { status: 200 }
        );
      }
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
      const { page_name = 'homepage', page_path, user_ip, user_agent } = data;

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
            const headerFallback = Number(request.headers.get('x-analytics-fallback') || '0');
            const newVisits = Math.max(currentVisits + 1, headerFallback + 1);
            const newMonthlyViews = Math.max(currentMonthlyViews + 1, headerFallback + 1);

            fallbackTotalVisits += 1;
            fallbackPageViewCounts.set(page, (fallbackPageViewCounts.get(page) || 0) + 1);

            await supabase
              .from('website_stats')
              .upsert({
                id: 1,
                total_visits: newVisits,
                monthly_views: newMonthlyViews,
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'id'
              });
          } catch (statsErr) {
            // Stats update skipped - continue anyway
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
            updated_at: new Date().toISOString()
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
