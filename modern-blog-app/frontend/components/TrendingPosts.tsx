'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaEye, FaFire, FaArrowRight } from 'react-icons/fa';
import { supabase } from '@/lib/supabaseClient';

interface TrendingPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  view_count: number;
  published_at: string;
  featured_image_url: string;
}

// Fallback posts with guaranteed working images
const FALLBACK_POSTS: TrendingPost[] = [
  {
    id: '1',
    title: 'Getting Started with Next.js 14: Complete Guide',
    slug: 'getting-started-nextjs-14',
    excerpt: 'Learn how to build modern web applications with Next.js 14.',
    view_count: 142,
    published_at: '2025-12-15T10:00:00Z',
    featured_image_url: '/images/adv-banner.svg',
  },
  {
    id: '2',
    title: 'TypeScript Best Practices for Large Projects',
    slug: 'typescript-best-practices',
    excerpt: 'Master TypeScript with advanced patterns and type safety.',
    view_count: 98,
    published_at: '2025-12-10T14:30:00Z',
    featured_image_url: '/images/tech-stack.svg',
  },
  {
    id: '3',
    title: 'Building Real-time Applications with Supabase',
    slug: 'realtime-supabase',
    excerpt: 'Learn how to build scalable real-time applications.',
    view_count: 75,
    published_at: '2025-12-01T09:15:00Z',
    featured_image_url: '/images/devsecops-banner.svg',
  },
];

function TrendingCard({ post, index }: { post: TrendingPost; index: number }) {
  const [imgSrc, setImgSrc] = useState<string>(
    post.featured_image_url || '/images/adv-banner.svg'
  );

  // ensure leading slash for public images
  useEffect(() => {
    if (imgSrc && !imgSrc.startsWith('http') && !imgSrc.startsWith('/')) {
      setImgSrc('/' + imgSrc);
    }
  }, [imgSrc]);

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 hover:border-orange-500 dark:hover:border-orange-500 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/20 h-full flex flex-col bg-white dark:bg-slate-800"
    >
      <div className="absolute top-4 left-4 z-20 inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 via-red-500 to-rose-600 text-white font-bold text-sm shadow-lg shadow-orange-500/50">
        #{index + 1}
      </div>

      <div className="relative h-40 md:h-48 overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800">
        <Image
          src={imgSrc}
          alt={post.title}
          fill
          unoptimized
          onError={() => setImgSrc('/images/adv-banner.svg')}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent group-hover:from-slate-950/80 transition-all duration-300"></div>
      </div>

      <div className="p-4 md:p-5 flex flex-col flex-1">
        <h3 className="font-bold text-sm md:text-base text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-2 mb-3 flex-1">
          {post.title}
        </h3>

        <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3 flex-1">{post.excerpt}</p>

        <div className="flex items-center justify-between mb-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-1.5 text-xs md:text-sm">
            <FaEye className="text-orange-600 dark:text-orange-400 text-xs md:text-sm" />
            <span className="font-semibold text-slate-900 dark:text-white">{post.view_count.toLocaleString()}</span>
            <span className="text-slate-600 dark:text-slate-400">views</span>
          </div>
          <time className="text-xs text-slate-500 dark:text-slate-500">
            {new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </time>
        </div>

        <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-semibold group-hover:gap-3 transition-all text-xs md:text-sm">
          Read Article
          <FaArrowRight className="text-xs group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}

export default function TrendingPosts() {
  const [posts, setPosts] = useState<TrendingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrendingPosts = async () => {
      try {
        // Use singleton client that's already initialized
        const { data, error: queryError } = await supabase
          .from('posts')
          .select('id, title, slug, excerpt, view_count, published_at, featured_image_url')
          .eq('published', true)
          .order('view_count', { ascending: false })
          .limit(3);

        if (queryError || !data || data.length === 0) {
          console.warn('Error fetching trending posts or no data, using fallback:', queryError);
          setPosts(FALLBACK_POSTS);
          setLoading(false);
          return;
        }

        // Use fetched data with validated image URLs
        const postsData: TrendingPost[] = (data || []).map((post: any) => {
          let imageUrl = post.featured_image_url || '/images/adv-banner.svg';
          
          // Ensure image URL is valid, otherwise use fallback
          if (!imageUrl || (typeof imageUrl === 'string' && imageUrl.trim() === '')) {
            imageUrl = '/images/adv-banner.svg';
          }
          
          return {
            ...post,
            featured_image_url: imageUrl,
          };
        });

        setPosts(postsData);
      } catch (err) {
        console.error('Error fetching trending posts:', err);
        setPosts(FALLBACK_POSTS);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingPosts();
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10 rounded-xl p-8 border border-orange-200 dark:border-orange-800">
        <div className="flex items-center justify-center h-48">
          <div className="animate-pulse space-y-4 w-full">
            <div className="h-4 bg-orange-200 dark:bg-orange-800 rounded w-3/4"></div>
            <div className="h-4 bg-orange-200 dark:bg-orange-800 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="py-12 lg:py-16">
      <div className="container-max">
        {/* Header with Icon */}
        <div className="flex items-center gap-3 mb-8 md:mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-orange-400 via-red-500 to-rose-600 shadow-lg shadow-orange-500/30">
            <FaFire className="text-white text-xl md:text-2xl" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-rose-600 dark:from-orange-400 dark:via-red-400 dark:to-rose-400 bg-clip-text text-transparent">
              Trending Now
            </h2>
            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 mt-1">
              Most viewed articles this week
            </p>
          </div>
        </div>

        {/* Trending Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 lg:gap-7 mb-8">
          {posts.map((post, index) => (
            <TrendingCard key={post.id} post={post} index={index} />
          ))}
        </div>

        {/* View All Articles Button */}
        <div className="flex justify-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 rounded-lg bg-gradient-to-r from-orange-600 via-red-600 to-rose-600 hover:from-orange-700 hover:via-red-700 hover:to-rose-700 text-white font-semibold transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/30 transform hover:scale-105"
          >
            View All Articles
            <FaArrowRight className="text-sm" />
          </Link>
        </div>
      </div>
    </section>
  );
}
