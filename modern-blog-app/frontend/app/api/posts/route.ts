import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getClientIp, isTrustedAutomationRequest as isTrustedReadRequest } from '@/lib/requestAccess';

function getSupabaseClient() {
  const url = process.env.DIRECT_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  let key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!key) {
    key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  }

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

// Input validation schema
const PostSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  slug: z.string().min(3, 'Slug must be at least 3 characters').max(200),
  excerpt: z.string().min(10).max(500).optional(),
  content: z.string().min(10),
  category: z.string().optional(),
  featured_image_url: z.string().url().optional(),
  published: z.boolean().optional(),
  published_at: z.string().datetime().optional(),
  author: z.string().optional(),
  read_time_minutes: z.number().int().positive().optional(),
  view_count: z.number().int().nonnegative().optional(),
});

// Rate limiting
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX_READ = 100; // max read requests per window
const RATE_LIMIT_MAX_WRITE = 20; // max write requests per window

function isRateLimited(ip: string, isWrite: boolean = false) {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const recent = timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW);
  recent.push(now);
  rateLimitMap.set(ip, recent);
  const limit = isWrite ? RATE_LIMIT_MAX_WRITE : RATE_LIMIT_MAX_READ;
  return recent.length > limit;
}

// If Supabase is not configured or no posts exist, return an empty list instead of dummy data.
const DEFAULT_POSTS: any[] = [];

export async function GET(request: NextRequest) {
  if (isTrustedReadRequest(request)) {
    // Allow internal automation and deployment checks without public-rate-limit interference.
  } else {
    const clientIp = getClientIp(request);
    if (isRateLimited(clientIp)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
  }

  const clientIp = getClientIp(request);
  if (!isTrustedReadRequest(request) && isRateLimited(clientIp)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ data: DEFAULT_POSTS });
    }

    const { searchParams } = new URL(request.url);
    const published = searchParams.get('published');
    const limit = searchParams.get('limit') || '100';
    const order = searchParams.get('order') || 'published_at';
    const ascending = searchParams.get('ascending') === 'true';
    const includeAI = searchParams.get('includeAI') !== 'false'; // Include AI posts by default

    // Query regular posts
    let query = supabase.from('posts').select('id, title, slug, excerpt, content, category, featured_image_url, published, published_at, author, read_time_minutes, view_count, created_at, updated_at');

    if (published === 'true') {
      query = query.eq('published', true);
    }

    const { data: regularPosts, error: regularError } = await query
      .order(order, { ascending })
      .limit(parseInt(limit));

    // Query AI-generated posts if requested
    let aiPosts = [];
    if (includeAI) {
      try {
        const aiQuery = supabase
          .from('ai_generated_posts')
          .select('id, title, slug, excerpt, content, category, featured_image_url, published_at, created_at, updated_at, status, ai_model, tools_covered, cves_mentioned')
          .order(order, { ascending })
          .limit(parseInt(limit));

        // AI-generated rows are surfaced even if the status value is missing or not exactly "published",
        // since the ingestion pipeline may write them with different status values depending on the DB state.
        const { data: aiData, error: aiError } = await aiQuery;

        if (!aiError && aiData) {
          // Transform AI posts to match regular post schema
          aiPosts = aiData.map((post: any) => ({
            ...post,
            published: true,
            author: 'AI Agent',
            author_name: 'AI Agent',
            read_time_minutes: Math.ceil((post.content?.length || 0) / 200), // Estimate reading time
            view_count: 0,
            ai_model: post.ai_model || 'google-gemini-2.5-flash',
            tools_covered: post.tools_covered || [],
            cves_mentioned: post.cves_mentioned || 0,
            source_table: 'ai_generated_posts',
          }));
        }
      } catch (err) {
        console.warn('[POSTS-API] Error querying AI posts:', err);
      }
    }

    // Merge and sort posts
    const allPosts = [...(regularPosts || []), ...aiPosts];
    const sortedPosts = allPosts.sort((a: any, b: any) => {
      const aTime = new Date(a.published_at).getTime();
      const bTime = new Date(b.published_at).getTime();
      return ascending ? aTime - bTime : bTime - aTime;
    });

    // If no error on regular posts, return merged data
    if (!regularError) {
      return NextResponse.json({ data: sortedPosts.slice(0, parseInt(limit)) });
    }

    // If there's an error on regular posts, try AI posts only
    if (aiPosts.length > 0) {
      return NextResponse.json({ data: aiPosts.slice(0, parseInt(limit)) });
    }

    // If no data from either table, return fallback posts
    return NextResponse.json({ data: DEFAULT_POSTS });
  } catch (err) {
    // Return fallback data instead of 500 error
    return NextResponse.json({ data: DEFAULT_POSTS });
  }
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp, true)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
    }

    const body = await request.json();

    // Validate input with Zod
    let validatedData;
    try {
      validatedData = PostSchema.parse(body);
    } catch (validationError) {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('posts')
      .insert([validatedData])
      .select();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 400 }
    );
  }
}
