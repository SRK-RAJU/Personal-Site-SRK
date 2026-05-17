import Link from 'next/link';
import Image from 'next/image';
import { FaArrowLeft, FaCalendar, FaUser } from 'react-icons/fa';
import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';

export const revalidate = 60; // Revalidate every 60 seconds
export const dynamicParams = true; // Enable dynamic route generation

// Default fallback posts for production
const DEFAULT_POSTS = [
  {
    id: 1,
    title: 'Getting Started with Next.js 14: Complete Guide',
    slug: 'getting-started-nextjs-14',
    excerpt: 'Learn how to build modern web applications with Next.js 14, including App Router, Server Components, and deployment strategies.',
    content: '<p>Next.js 14 brings incredible new features for building performant web applications. Explore App Router, Server Components, Streaming, and more to create lightning-fast applications.</p><p>With built-in optimization and modern React patterns, Next.js 14 is the perfect choice for full-stack web development.</p>',
    category: 'web-development',
    featured_image_url: '/images/adv-banner.svg',
    published: true,
    published_at: '2025-12-15T10:00:00Z',
    author_name: 'Raju SRK',
    reading_time: 8,
    view_count: 142,
  },
  {
    id: 2,
    title: 'TypeScript Best Practices for Large Projects',
    slug: 'typescript-best-practices',
    excerpt: 'Master TypeScript with advanced patterns, type safety, and best practices for enterprise applications.',
    content: '<p>TypeScript has become the standard for large-scale JavaScript projects. Learn advanced patterns and best practices for maintaining type safety across your codebase.</p><p>Discover generics, advanced types, and architectural patterns that will improve your development workflow.</p>',
    category: 'programming',
    featured_image_url: '/images/tech-stack.svg',
    published: true,
    published_at: '2025-12-10T14:30:00Z',
    author_name: 'Raju SRK',
    reading_time: 12,
    view_count: 98,
  },
  {
    id: 3,
    title: 'Building Real-time Applications with Supabase',
    slug: 'realtime-supabase',
    excerpt: 'Learn how to build scalable real-time applications using Supabase and PostgreSQL.',
    content: '<p>Supabase provides a powerful way to build real-time applications with PostgreSQL as the backbone. Explore real-time subscriptions, authentication, and storage features.</p><p>Build responsive, scalable applications that react to database changes in real-time.</p>',
    category: 'backend',
    featured_image_url: '/images/devsecops-banner.svg',
    published: true,
    published_at: '2025-12-01T09:15:00Z',
    author_name: 'Raju SRK',
    reading_time: 10,
    view_count: 75,
  },
  {
    id: 4,
    title: 'AWS Solutions Architect: Designing Scalable Systems',
    slug: 'aws-solutions-architect',
    excerpt: 'Master AWS architecture patterns, design principles, and best practices for building scalable and resilient cloud solutions.',
    content: '<p>Learn how to design AWS solutions that are scalable, reliable, and cost-effective. Explore EC2, RDS, S3, Lambda, and advanced architecture patterns.</p><p>Master multi-region deployments, auto-scaling, and disaster recovery strategies.</p>',
    category: 'cloud-architecture',
    featured_image_url: '/images/adv-banner.svg',
    published: true,
    published_at: '2025-11-28T11:45:00Z',
    author_name: 'Raju SRK',
    reading_time: 15,
    view_count: 120,
  },
  {
    id: 5,
    title: 'PostgreSQL Performance Optimization Techniques',
    slug: 'postgresql-performance-optimization',
    excerpt: 'Optimize PostgreSQL databases for maximum performance with indexing, query optimization, and monitoring strategies.',
    content: '<p>Discover techniques to optimize PostgreSQL performance including proper indexing, query optimization, connection pooling, and monitoring best practices.</p><p>Learn how to identify bottlenecks and optimize complex queries for better application performance.</p>',
    category: 'database',
    featured_image_url: '/images/devsecops-banner.svg',
    published: true,
    published_at: '2025-11-20T14:20:00Z',
    author_name: 'Raju SRK',
    reading_time: 11,
    view_count: 89,
  },
];

// Detect placeholder environment values and avoid creating a live Supabase client when not configured
function isSupabasePlaceholder(value?: string) {
  return !value || /your_project_id|YOUR_PROJECT_ID|YOUR_ANON_KEY_HERE|YOUR_SERVICE_ROLE_KEY_HERE|yourdomain\.com/i.test(value);
}

function getSupabaseServer() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || isSupabasePlaceholder(supabaseUrl) || isSupabasePlaceholder(supabaseKey)) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function generateStaticParams() {
  try {
    const supabase = getSupabaseServer();
    if (!supabase) {
      return DEFAULT_POSTS.map((post) => ({
        slug: post.slug,
      }));
    }

    const { data: posts, error } = await supabase
      .from('posts')
      .select('slug')
      .eq('published', true);

    if (error) {
      console.error('Error fetching posts for static generation:', error);
      return DEFAULT_POSTS.map((post) => ({
        slug: post.slug,
      }));
    }

    if (!posts || posts.length === 0) {
      return DEFAULT_POSTS.map((post) => ({
        slug: post.slug,
      }));
    }

    return posts.map((post: any) => ({
      slug: post.slug,
    }));
  } catch (err) {
    console.error('Error in generateStaticParams:', err);
    return DEFAULT_POSTS.map((post) => ({
      slug: post.slug,
    }));
  }
}

async function getPost(slug: string) {
  try {
    const supabase = getSupabaseServer();
    if (supabase) {
      const { data: post, error } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single();

      if (!error && post) {
        return post;
      }
    }
  } catch (err) {
    console.warn('Error fetching post from database:', err);
  }

  // Fallback to default posts if database query fails or post not found
  const defaultPost = DEFAULT_POSTS.find((p) => p.slug === slug);
  return defaultPost || null;
}

async function incrementViews(postId: string) {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return;
  }

  try {
    const { data } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single();

    if (data) {
      try {
        await supabase.rpc('increment_views', { post_id: postId });
      } catch (_rpcError) {
        // If RPC doesn't exist, ignore.
      }
    }
  } catch (err) {
    console.warn('Could not increment views or update post metadata:', err);
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPost(params.slug);

  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The blog post you are looking for does not exist.',
    };
  }

  return {
    title: `${post.title} | Blog`,
    description: post.excerpt || post.content?.substring(0, 160) || 'Read this article',
    openGraph: {
      title: post.title,
      description: post.excerpt || 'Read this article',
      type: 'article',
      publishedTime: post.published_at,
      authors: [post.author_name || 'Raju SRK'],
      images: post.featured_image_url ? [{ url: post.featured_image_url, width: 1200, height: 400 }] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPost(params.slug);

  if (!post) {
    notFound();
  }

  // Increment view count (non-blocking)
  incrementViews(post.id).catch(console.error);

  return (
    <article className="w-full">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-50 via-violet-50/30 to-blue-50/30 dark:from-slate-950 dark:via-violet-950/10 dark:to-blue-950/10 py-12 border-b border-violet-500/20">
        <div className="container-max">
          <div className="max-w-3xl mx-auto">
            {/* Back Button */}
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 mb-6 font-semibold transition-colors"
            >
              <FaArrowLeft className="text-sm" />
              Back to Articles
            </Link>

            {/* Category Badge */}
            {post.category && (
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-500/30 rounded-full text-sm font-semibold">
                  {post.category}
                </span>
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 text-slate-900 dark:text-white leading-tight">
              {post.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap gap-6 mt-8 text-slate-800 dark:text-slate-200 text-sm sm:text-base">
              {post.author_name && (
                <div className="flex items-center gap-2">
                  <FaUser className="text-violet-500" />
                  <span className="font-semibold">{post.author_name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <FaCalendar className="text-violet-500" />
                <span>
                  {new Date(post.published_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              {post.reading_time && (
                <div className="flex items-center gap-2">
                  <span>📖</span>
                  <span>{post.reading_time} min read</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Image */}
      {post.featured_image_url && (
        <section className="py-8">
          <div className="container-max">
            <div className="max-w-3xl mx-auto rounded-xl overflow-hidden shadow-lg">
              <Image
                src={post.featured_image_url}
                alt={post.title}
                width={1200}
                height={400}
                className="w-full h-96 object-cover"
                priority
              />
            </div>
          </div>
        </section>
      )}

      {/* Content */}
      <section className="section-padding">
        <div className="container-max">
          <div className="max-w-3xl mx-auto">
            {/* Excerpt */}
            {post.excerpt && (
              <div className="mb-8 p-6 bg-violet-500/10 dark:bg-violet-500/5 border-l-4 border-violet-500 rounded">
                <p className="text-lg text-slate-800 dark:text-slate-200 font-semibold italic">
                  {post.excerpt}
                </p>
              </div>
            )}

            {/* Main Content */}
            <div className="prose dark:prose-invert max-w-none mb-12">
              <div
                className="text-lg leading-relaxed text-slate-800 dark:text-slate-200 space-y-6"
                dangerouslySetInnerHTML={{
                  __html: post.content || '',
                }}
              />
            </div>

            {/* Tags */}
            {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
              <div className="mb-12 pt-8 border-t border-slate-200 dark:border-slate-700">
                <div className="flex flex-wrap gap-3">
                  {post.tags.map((tag: string) => (
                    <Link
                      key={tag}
                      href={`/blog?tag=${encodeURIComponent(tag)}`}
                      className="px-4 py-2 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-sm font-semibold hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Call to Action */}
            <div className="mt-12 p-8 bg-gradient-to-r from-violet-500/10 to-blue-500/10 dark:from-violet-500/5 dark:to-blue-500/5 border border-violet-500/30 rounded-xl">
              <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
                Want More Tech Insights?
              </h3>
              <p className="text-slate-800 dark:text-slate-200 mb-6">
                Subscribe to my blog for the latest updates on web development, cloud architecture, and DevOps practices.
              </p>
              <button className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all hover:shadow-lg">
                Subscribe Now
              </button>
            </div>

            {/* More Posts */}
            <div className="mt-12 pt-12 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
                More from Blog
              </h3>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold transition-colors"
              >
                View All Articles →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}
