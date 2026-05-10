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
      console.error('Post not found:', error);
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Attempt to increment view count, but don't fail the request if it errors
    try {
      await supabase
        .from('posts')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', data.id);
    } catch (viewCountErr) {
      // Log but don't fail - view count tracking is not critical
      console.error('Failed to update view count:', viewCountErr);
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('Exception in post API:', err);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 400 }
    );
  }
}
