import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Use service role key for all operations to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

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

function getClientIp(request: NextRequest) {
  const forwardedIp = request.headers.get('x-forwarded-for');
  if (forwardedIp) {
    return forwardedIp.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

function isRateLimited(ip: string, isWrite: boolean = false) {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const recent = timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW);
  recent.push(now);
  rateLimitMap.set(ip, recent);
  const limit = isWrite ? RATE_LIMIT_MAX_WRITE : RATE_LIMIT_MAX_READ;
  return recent.length > limit;
}

// Default fallback posts
const DEFAULT_POSTS = [
  {
    id: 1,
    title: 'Getting Started with Next.js 14: Complete Guide',
    slug: 'getting-started-nextjs-14',
    excerpt: 'Learn how to build modern web applications with Next.js 14, including App Router, Server Components, and deployment strategies.',
    content: 'Next.js 14 brings incredible new features for building performant web applications with improved performance and developer experience...',
    category: 'web-development',
    featured_image_url: '/images/adv-banner.svg',
    published: true,
    published_at: '2025-12-15T10:00:00Z',
    author: 'Raju',
    read_time_minutes: 8,
    view_count: 142,
  },
  {
    id: 2,
    title: 'TypeScript Best Practices for Large Projects',
    slug: 'typescript-best-practices',
    excerpt: 'Master TypeScript with advanced patterns, type safety, and best practices for enterprise applications.',
    content: 'TypeScript has become the standard for large-scale JavaScript projects. Learn advanced patterns and best practices for maintaining type safety...',
    category: 'programming',
    featured_image_url: '/images/tech-stack.svg',
    published: true,
    published_at: '2025-12-10T14:30:00Z',
    author: 'Raju',
    read_time_minutes: 12,
    view_count: 98,
  },
  {
    id: 3,
    title: 'Building Real-time Applications with Supabase',
    slug: 'realtime-supabase',
    excerpt: 'Learn how to build scalable real-time applications using Supabase and PostgreSQL.',
    content: 'Supabase provides a powerful way to build real-time applications with PostgreSQL as the backbone. Explore real-time subscriptions, authentication, and storage...',
    category: 'backend',
    featured_image_url: '/images/devsecops-banner.svg',
    published: true,
    published_at: '2025-12-01T09:15:00Z',
    author: 'Raju',
    read_time_minutes: 10,
    view_count: 75,
  },
  {
    id: 4,
    title: 'AWS Solutions Architect: Designing Scalable Systems',
    slug: 'aws-solutions-architect',
    excerpt: 'Master AWS architecture patterns, design principles, and best practices for building scalable and resilient cloud solutions.',
    content: 'Learn how to design AWS solutions that are scalable, reliable, and cost-effective. Explore EC2, RDS, S3, and advanced architecture patterns...',
    category: 'cloud-architecture',
    featured_image_url: '/images/adv-banner.svg',
    published: true,
    published_at: '2025-11-28T11:45:00Z',
    author: 'Raju',
    read_time_minutes: 15,
    view_count: 120,
  },
  {
    id: 5,
    title: 'PostgreSQL Performance Optimization Techniques',
    slug: 'postgresql-performance-optimization',
    excerpt: 'Optimize PostgreSQL databases for maximum performance with indexing, query optimization, and monitoring strategies.',
    content: 'Discover techniques to optimize PostgreSQL performance including proper indexing, query optimization, connection pooling, and monitoring best practices...',
    category: 'database',
    featured_image_url: '/images/devsecops-banner.svg',
    published: true,
    published_at: '2025-11-20T14:20:00Z',
    author: 'Raju',
    read_time_minutes: 11,
    view_count: 89,
  },
];

export async function GET(request: NextRequest) {
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
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
        const { data: aiData, error: aiError } = await supabase
          .from('ai_generated_posts')
          .select('id, title, slug, excerpt, content, category, featured_image_url, published_at, created_at, updated_at')
          .order(order, { ascending })
          .limit(parseInt(limit));

        if (!aiError && aiData) {
          // Transform AI posts to match regular post schema
          aiPosts = aiData.map((post: any) => ({
            ...post,
            published: true,
            author: 'AI Agent',
            read_time_minutes: Math.ceil((post.content?.length || 0) / 200), // Estimate reading time
            view_count: 0,
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
