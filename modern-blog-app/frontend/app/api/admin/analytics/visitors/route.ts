import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: NextRequest) {
  return requireAdminAuth(request, async () => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit') || '100'), 200);

    const { data: recentVisits, error: recentError } = await supabase
      .from('visitor_logs')
      .select('id, ip_address, country, region, city, page_path, user_agent, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (recentError) {
      return NextResponse.json({
        recent_visits: [],
        total_logged_visits: 0,
        unique_ips: 0,
        top_countries: [],
        error: 'visitor_logs table not found. Run docs/VISITOR_ANALYTICS_SETUP.sql in Supabase first.',
      });
    }

    const { count: totalLoggedVisits } = await supabase
      .from('visitor_logs')
      .select('id', { count: 'exact', head: true });

    // Pull a larger window for aggregation (country / unique IP counts)
    const { data: aggregationRows } = await supabase
      .from('visitor_logs')
      .select('ip_address, country')
      .order('created_at', { ascending: false })
      .limit(5000);

    const uniqueIps = new Set((aggregationRows || []).map((row: any) => row.ip_address)).size;

    const countryCounts = (aggregationRows || []).reduce((acc: Record<string, number>, row: any) => {
      const country = row.country || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {});

    const topCountries = Object.entries(countryCounts)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({
      recent_visits: recentVisits || [],
      total_logged_visits: totalLoggedVisits || 0,
      unique_ips: uniqueIps,
      top_countries: topCountries,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load visitor analytics' }, { status: 500 });
  }
  });
}
