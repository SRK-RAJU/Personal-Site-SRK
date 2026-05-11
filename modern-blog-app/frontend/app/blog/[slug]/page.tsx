import Link from 'next/link';
import Image from 'next/image';
import { FaArrowLeft, FaCalendar, FaUser } from 'react-icons/fa';
import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';

export const revalidate = 60; // Revalidate every 60 seconds

// Initialize Supabase client with service role key for server-side operations
function getSupabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
}

export async function generateStaticParams() {
  try {
    const supabase = getSupabaseServer();
    const { data: posts, error } = await supabase
      .from('posts')
      .select('slug')
      .eq('published', true);

    if (error) {
      console.error('Error fetching posts for static generation:', error);
      return [];
    }

    return (posts || []).map((post: any) => ({
      slug: post.slug,
    }));
  } catch (err) {
    console.error('Error in generateStaticParams:', err);
    return [];
  }
}

async function getPost(slug: string) {
  try {
    const supabase = getSupabaseServer();

    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single();

    if (error || !post) {
      return null;
    }

    return post;
  } catch (err) {
    console.error('Error fetching post:', err);
    return null;
  }
}

async function incrementViews(postId: string) {
  try {
    const supabase = getSupabaseServer();

    // The view_count column may not exist, so we'll silently fail
    // This is to avoid errors while still attempting to track views
    try {
      const { data } = await supabase
        .from('posts')
        .select('id')
        .eq('id', postId)
        .single();

      if (data) {
        // Attempt to update view_count if it exists
        try {
          await supabase.rpc('increment_views', { post_id: postId });
        } catch (_rpcError) {
          // If RPC doesn't exist, that's fine - silently ignore
        }
      }
    } catch (err) {
      // Silently ignore errors
      console.warn('Could not increment views (column may not exist)');
    }
  } catch (err) {
    // Silently ignore any errors
    console.warn('Error in incrementViews:', err);
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
    title: post.title,
    description: post.excerpt || post.content?.substring(0, 160),
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.published_at,
      authors: [post.author_name || 'Raju SRK'],
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
    <article className="container-max py-12">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8"
        >
          <FaArrowLeft className="text-sm" />
          Back to Blog
        </Link>

        {/* Featured Image */}
        {post.featured_image_url && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <Image
              src={post.featured_image_url}
              alt={post.title}
              width={1200}
              height={400}
              className="w-full h-96 object-cover"
              priority
            />
          </div>
        )}

        {/* Title */}
        <h1 className="text-5xl font-bold mb-4 text-slate-900 dark:text-white">
          {post.title}
        </h1>

        {/* Meta Info */}
        <div className="flex flex-wrap gap-4 mb-8 pb-8 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
          {post.author_name && (
            <div className="flex items-center gap-2">
              <FaUser className="text-sm" />
              {post.author_name}
            </div>
          )}
          <div className="flex items-center gap-2">
            <FaCalendar className="text-sm" />
            {new Date(post.published_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
          {post.reading_time && (
            <span>{post.reading_time} min read</span>
          )}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {post.tags.map((tag: string) => (
              <span
                key={tag}
                className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="prose dark:prose-invert max-w-none mb-12">
          <div
            className="text-lg leading-relaxed text-slate-700 dark:text-slate-300"
            dangerouslySetInnerHTML={{
              __html: post.content || post.excerpt || '',
            }}
          />
        </div>

        {/* Author Bio */}
        {post.author_bio && (
          <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-6 mb-8">
            <h3 className="font-bold text-lg mb-2">About the Author</h3>
            <p className="text-slate-600 dark:text-slate-400">{post.author_bio}</p>
          </div>
        )}

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Want More Tech Insights?</h2>
          <p className="mb-6">Subscribe to my blog for latest updates on web development and technology.</p>
          <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-slate-100 transition-colors">
            Subscribe Now
          </button>
        </div>

        {/* Related Posts */}
        <div className="mt-12 pt-12 border-t border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold mb-8">More from Blog</h2>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
          >
            View All Posts →
          </Link>
        </div>
      </div>
    </article>
  );
}
