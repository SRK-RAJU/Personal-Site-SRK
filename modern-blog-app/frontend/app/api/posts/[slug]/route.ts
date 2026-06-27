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
      .maybeSingle();

    let post = data;

    if (!post) {
      const { data: aiPost, error: aiError } = await supabase
        .from('ai_generated_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

      if (!aiError && aiPost) {
        post = {
          ...aiPost,
          published: true,
          author_name: aiPost.author_name || 'AI Agent',
          published_at: aiPost.published_at || aiPost.created_at,
        };
      }
    }

    if (error || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Attempt to increment view count, but don't fail the request if it errors
    try {
      if (post?.id && post?.source_table !== 'ai_generated_posts') {
        const { data: checkData } = await supabase
          .from('posts')
          .select('view_count')
          .eq('id', post.id)
          .single();

        if (checkData && typeof checkData.view_count === 'number') {
          await supabase
            .from('posts')
            .update({ view_count: (checkData.view_count || 0) + 1 })
            .eq('id', post.id);
        }
      }
    } catch (viewCountErr) {
      // View count tracking is not critical
    }

    return NextResponse.json({ data: post });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 400 }
    );
  }
}
