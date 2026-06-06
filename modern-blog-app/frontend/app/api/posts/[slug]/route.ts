import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const slug = params.slug;

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Attempt to increment view count, but don't fail the request if it errors
    try {
      // First check if view_count column exists
      const { data: checkData } = await supabase
        .from('posts')
        .select('view_count')
        .eq('id', data.id)
        .single();

      if (checkData && typeof checkData.view_count === 'number') {
        await supabase
          .from('posts')
          .update({ view_count: (checkData.view_count || 0) + 1 })
          .eq('id', data.id);
      }
    } catch (viewCountErr) {
      // View count tracking is not critical
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 400 }
    );
  }
}
