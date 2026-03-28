import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'page-views') {
      // Get total page views
      const { data, error } = await supabase
        .from('page_analytics')
        .select('view_count')
        .eq('page', 'homepage')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return NextResponse.json({
        total_views: data?.view_count || 0,
      });
    }

    if (action === 'stats') {
      // Get all stats
      const { data: statsData, error: statsError } = await supabase
        .from('website_stats')
        .select('*')
        .single();

      if (statsError && statsError.code !== 'PGRST116') {
        throw statsError;
      }

      return NextResponse.json({
        articles: statsData?.article_count || 0,
        monthly_views: statsData?.monthly_views || 0,
        topics: statsData?.topics_count || 0,
        projects: statsData?.projects_count || 0,
        total_visits: statsData?.total_visits || 0,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    if (action === 'track-page-view') {
      const { page_name = 'homepage', user_ip, user_agent } = data;

      // Get or create page analytics record
      const { data: existing } = await supabase
        .from('page_analytics')
        .select('id, view_count')
        .eq('page', page_name)
        .single();

      if (existing) {
        // Update existing record
        await supabase
          .from('page_analytics')
          .update({
            view_count: existing.view_count + 1,
            last_viewed: new Date(),
          })
          .eq('id', existing.id);
      } else {
        // Create new record
        await supabase.from('page_analytics').insert([
          {
            page: page_name,
            view_count: 1,
            last_viewed: new Date(),
          },
        ]);
      }

      // Also update website_stats total_visits
      const { data: stats } = await supabase
        .from('website_stats')
        .select('id, total_visits')
        .single();

      if (stats) {
        await supabase
          .from('website_stats')
          .update({ total_visits: (stats.total_visits || 0) + 1 })
          .eq('id', stats.id);
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'update-stats') {
      const { article_count, monthly_views, topics_count, projects_count } = data;

      const { data: stats } = await supabase
        .from('website_stats')
        .select('id')
        .single();

      if (stats) {
        await supabase
          .from('website_stats')
          .update({
            article_count,
            monthly_views,
            topics_count,
            projects_count,
          })
          .eq('id', stats.id);
      } else {
        await supabase.from('website_stats').insert([
          {
            article_count,
            monthly_views,
            topics_count,
            projects_count,
            total_visits: 0,
          },
        ]);
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to process analytics' }, { status: 500 });
  }
}
