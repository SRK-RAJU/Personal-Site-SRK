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
      // Get stored stats + fallback to live queries for accuracy and to avoid stale seeded values
      const { data: statsData, error: statsError } = await supabase
        .from('website_stats')
        .select('*')
        .single();

      if (statsError && statsError.code !== 'PGRST116') {
        throw statsError;
      }

      const fallbackStats = {
        articles: 0,
        monthly_views: 0,
        topics: 0,
        projects: 0,
        total_visits: 0,
      };

      // If there is a posts table, use it for live counts
      try {
        const { count: articleCount } = await supabase.from('posts').select('id', { count: 'exact', head: true });
        if (typeof articleCount === 'number') fallbackStats.articles = articleCount;
      } catch (err) {
        console.warn('Could not fetch posts count for stats:', err);
      }

      // Use page_analytics for actual views stat when available
      try {
        const { data: pageData } = await supabase
          .from('page_analytics')
          .select('view_count')
          .eq('page', 'homepage')
          .single();
        if (pageData?.view_count != null) fallbackStats.monthly_views = pageData.view_count;
      } catch (err) {
        console.warn('Could not fetch page analytics for stats:', err);
      }

      // Count projects and topics if tables exist
      try {
        const { count: projectsCount } = await supabase.from('projects').select('id', { count: 'exact', head: true });
        if (typeof projectsCount === 'number') fallbackStats.projects = projectsCount;
      } catch (_err) {
        // ignore if table not present
      }

      try {
        const { count: topicsCount } = await supabase.from('topics').select('id', { count: 'exact', head: true });
        if (typeof topicsCount === 'number') fallbackStats.topics = topicsCount;
      } catch (_err) {
        // ignore if table not present
      }

      try {
        const { data: totalVisitsData } = await supabase
          .from('website_stats')
          .select('total_visits')
          .single();
        if (totalVisitsData?.total_visits != null) fallbackStats.total_visits = totalVisitsData.total_visits;
      } catch (_err) {
        // ignore
      }

      return NextResponse.json({
        articles: statsData?.article_count ?? fallbackStats.articles,
        monthly_views: statsData?.monthly_views ?? fallbackStats.monthly_views,
        topics: statsData?.topics_count ?? fallbackStats.topics,
        projects: statsData?.projects_count ?? fallbackStats.projects,
        total_visits: statsData?.total_visits ?? fallbackStats.total_visits,
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
      } else {
        await supabase.from('website_stats').insert([
          {
            article_count: 0,
            monthly_views: 0,
            topics_count: 0,
            projects_count: 0,
            total_visits: 1,
          },
        ]);
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
