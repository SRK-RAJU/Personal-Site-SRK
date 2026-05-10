import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Use service role key for all operations to bypass RLS
const supabaseServiceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Fallback to anon key if service role is not available
const supabase = supabaseServiceRole;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'page-views') {
      try {
        // Get total page views with error handling
        const { data, error } = await supabase
          .from('page_analytics')
          .select('view_count')
          .eq('page', 'homepage')
          .single();

        // Handle "no rows found" error gracefully (PGRST116)
        if (error && error.code !== 'PGRST116') {
          console.error('Analytics page-views error:', error);
          return NextResponse.json(
            { error: 'Failed to fetch page views', details: error.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          total_views: data?.view_count || 0,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Page-views exception:', err);
        return NextResponse.json(
          { total_views: 0, error: 'Service temporarily unavailable' },
          { status: 200 } // Return 200 with fallback data
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
          console.warn('Stats fetch warning:', statsError);
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
          console.warn('Could not fetch posts count:', err);
        }

        try {
          const { data: pageData } = await supabase
            .from('page_analytics')
            .select('view_count')
            .eq('page', 'homepage')
            .single();
          if (pageData?.view_count != null) fallbackStats.monthly_views = pageData.view_count;
        } catch (err) {
          console.warn('Could not fetch page analytics:', err);
        }

        try {
          const { count: projectsCount } = await supabase
            .from('projects')
            .select('id', { count: 'exact', head: true });
          if (typeof projectsCount === 'number') fallbackStats.projects = projectsCount;
        } catch (err) {
          console.warn('Could not fetch projects count:', err);
        }

        try {
          const { count: topicsCount } = await supabase
            .from('topics')
            .select('id', { count: 'exact', head: true });
          if (typeof topicsCount === 'number') fallbackStats.topics = topicsCount;
        } catch (err) {
          console.warn('Could not fetch topics count:', err);
        }

        try {
          const { data: totalVisitsData } = await supabase
            .from('website_stats')
            .select('total_visits')
            .single();
          if (totalVisitsData?.total_visits != null) fallbackStats.total_visits = totalVisitsData.total_visits;
        } catch (err) {
          console.warn('Could not fetch total visits:', err);
        }

        return NextResponse.json({
          articles: statsData?.articles ?? fallbackStats.articles,
          monthly_views: statsData?.monthly_views ?? fallbackStats.monthly_views,
          topics: statsData?.topics ?? fallbackStats.topics,
          projects: statsData?.projects ?? fallbackStats.projects,
          total_visits: statsData?.total_visits ?? fallbackStats.total_visits,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Stats action exception:', err);
        // Return safe fallback values even on complete failure
        return NextResponse.json(
          {
            articles: 0,
            monthly_views: 0,
            topics: 0,
            projects: 5,
            total_visits: 0,
            error: 'Using default values',
          },
          { status: 200 }
        );
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('GET Analytics error:', error);
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
            articles: 0,
            monthly_views: 0,
            topics: 0,
            projects: 0,
            total_visits: 1,
          },
        ]);
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'update-stats') {
      const { articles, monthly_views, topics, projects } = data;

      const { data: stats } = await supabase
        .from('website_stats')
        .select('id')
        .single();

      if (stats) {
        await supabase
          .from('website_stats')
          .update({
            articles,
            monthly_views,
            topics,
            projects,
          })
          .eq('id', stats.id);
      } else {
        await supabase.from('website_stats').insert([
          {
            articles,
            monthly_views,
            topics,
            projects,
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
