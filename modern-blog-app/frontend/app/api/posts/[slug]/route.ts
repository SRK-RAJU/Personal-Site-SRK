import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function buildSlugCandidates(slug: string): string[] {
  const trimmed = decodeURIComponent(slug || '').trim();
  const variants = new Set<string>();
  const normalized = trimmed.toLowerCase();

  [trimmed, normalized, normalized.replace(/_/g, '-'), normalized.replace(/-+/g, '-')].forEach((value) => {
    if (value) variants.add(value);
  });

  const legacyMatch = normalized.match(/^devops-report-(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (legacyMatch) {
    const [, year, month, day] = legacyMatch;
    const paddedMonth = String(Number(month)).padStart(2, '0');
    const paddedDay = String(Number(day)).padStart(2, '0');
    variants.add(`devops-report-${year}-${paddedMonth}-${paddedDay}`);
    variants.add(`devops-report-${year}-${month}-${day}`);
  }

  return Array.from(variants).filter(Boolean);
}

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.DIRECT_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!url || !key || url.includes('placeholder') || key.includes('placeholder')) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const slug = params.slug;
    const supabase = getSupabaseClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const slugCandidates = buildSlugCandidates(slug);

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .in('slug', slugCandidates)
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let post = data;

    if (!post) {
      const { data: aiPost, error: aiError } = await supabase
        .from('ai_generated_posts')
        .select('*')
        .in('slug', slugCandidates)
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!aiError && aiPost) {
        const isPublicAiPost = ['published', 'live', 'active', ''].includes(aiPost.status) || !!aiPost.published_at;

        if (isPublicAiPost) {
          post = {
            ...aiPost,
            published: true,
            author_name: aiPost.author_name || aiPost.author || 'Raju',
            published_at: aiPost.published_at || aiPost.created_at,
          };
        }
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
