import Link from 'next/link';
import Image from 'next/image';
import { FaArrowLeft, FaCalendar, FaUser } from 'react-icons/fa';
import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';

export const revalidate = 60; // Revalidate every 60 seconds
export const dynamic = 'force-dynamic';
export const dynamicParams = true; // Enable dynamic route generation

// Detect placeholder environment values and avoid creating a live Supabase client when not configured
function isSupabasePlaceholder(value?: string) {
  return !value || /your_project_id|YOUR_PROJECT_ID|YOUR_ANON_KEY_HERE|YOUR_SERVICE_ROLE_KEY_HERE|yourdomain\.com/i.test(value);
}

function getSupabaseServer() {
  const supabaseUrl = process.env.DIRECT_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || isSupabasePlaceholder(supabaseUrl) || isSupabasePlaceholder(supabaseKey)) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function generateStaticParams() {
  return [];
}

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

async function getPost(slug: string) {
  try {
    const supabase = getSupabaseServer();
    if (supabase) {
      const slugCandidates = buildSlugCandidates(slug);

      const { data: post, error } = await supabase
        .from('posts')
        .select('*')
        .in('slug', slugCandidates)
        .eq('published', true)
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && post) {
        return post;
      }

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
          return {
            ...aiPost,
            published: true,
            author_name: aiPost.author_name || aiPost.author || 'AI Agent',
            published_at: aiPost.published_at || aiPost.created_at,
            read_time_minutes: aiPost.read_time_minutes || Math.ceil((aiPost.content?.length || 0) / 200),
          };
        }
      }
    }
  } catch (err) {
    console.warn('Error fetching post from database:', err);
  }

  return null;
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
