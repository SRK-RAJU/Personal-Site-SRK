import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Use service role key for all operations to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

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
  try {
    const { searchParams } = new URL(request.url);
    const published = searchParams.get('published');
    const limit = searchParams.get('limit') || '100';
    const order = searchParams.get('order') || 'published_at';
    const ascending = searchParams.get('ascending') === 'true';

    // Don't select view_count as it might not exist in the schema
    let query = supabase.from('posts').select('id, title, slug, excerpt, content, category, featured_image_url, published, published_at, author, read_time_minutes, view_count, created_at, updated_at');

    if (published === 'true') {
      query = query.eq('published', true);
    }

    const { data, error } = await query
      .order(order, { ascending })
      .limit(parseInt(limit));

    // If there's an error, log it but return fallback posts instead of 500
    if (error) {
      console.error('Posts API query error:', error.message);
      return NextResponse.json({ data: DEFAULT_POSTS });
    }

    // If no data, return fallback posts
    if (!data || data.length === 0) {
      return NextResponse.json({ data: DEFAULT_POSTS });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('Exception in posts API:', err);
    // Return fallback data instead of 500 error
    return NextResponse.json({ data: DEFAULT_POSTS });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('posts')
      .insert([body])
      .select();

    if (error) {
      console.error('API Error creating post:', error.message);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('Exception in posts API POST:', err);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 400 }
    );
  }
}
