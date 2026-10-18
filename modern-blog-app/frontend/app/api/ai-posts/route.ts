import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = process.env.DIRECT_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!url || !key) {
      return NextResponse.json({ 
        data: [],
        error: 'Supabase not configured'
      });
    }

    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { searchParams } = new URL(request.url);
    const parsedLimit = parseInt(searchParams.get('limit') || '1000', 10);
    // Callers such as the home page ask for a handful of posts; never download the whole table for that.
    const limit = Math.min(Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 1000, 1000);

    // Query AI posts directly
    const { data, error, count } = await supabase
      .from('ai_generated_posts')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ 
        data: [],
        error: error.message,
        row_count: count
      });
    }

    return NextResponse.json({
      data: data || [],
      row_count: count,
      status: 'success'
    });
  } catch (err: any) {
    return NextResponse.json({
      data: [],
      error: err.message
    });
  }
}
