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

        if (queryError) {
          console.warn('Error fetching trending posts:', queryError);
          setError(null);
          setPosts([]);
          setLoading(false);
          return;
        }

        // Use fetched data with fallback images
        const postsData: TrendingPost[] = (data || []).map((post: any) => ({
          ...post,
          featured_image_url: post.featured_image_url || '/images/adv-banner.svg',
        }));

        setPosts(postsData);
      } catch (err) {
        console.error('Error fetching trending posts:', err);
        setError(null);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingPosts();
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-xl p-8 border border-emerald-200 dark:border-emerald-800">
        <div className="flex items-center justify-center h-48">
          <div className="animate-pulse space-y-4 w-full">
            <div className="h-4 bg-emerald-200 dark:bg-emerald-800 rounded w-3/4"></div>
            <div className="h-4 bg-emerald-200 dark:bg-emerald-800 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || posts.length === 0) {
    return null;
  }

  return (
    <section className="py-12">
      <div className="container-max">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-r from-orange-400 to-red-500">
            <FaFire className="text-white text-xl" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Trending Now</h2>
            <p className="text-slate-600 dark:text-slate-400">Most viewed articles this week</p>
          </div>
        </div>

        {/* Trending Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post, index) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-300 hover:shadow-xl"
            >
              {/* Ranking Badge */}
              <div className="absolute top-4 left-4 z-10 inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-orange-400 to-red-500 text-white font-bold text-sm">
                #{index + 1}
              </div>

              {/* Background Image */}
              {post.featured_image_url && (
                <div className="relative h-40 overflow-hidden bg-slate-200 dark:bg-slate-700">
                  <Image
                    src={post.featured_image_url}
                    alt={post.title}
                    fill
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
                </div>
              )}

              {/* Content */}
              <div className="p-5 bg-white dark:bg-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 mb-3">
                  {post.title}
                </h3>

                {/* View Count & Date */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <FaEye className="text-emerald-600 dark:text-emerald-400" />
                    <span className="font-semibold">{post.view_count.toLocaleString()} views</span>
                  </div>
                  <time className="text-xs text-slate-500 dark:text-slate-500">
                    {new Date(post.published_at).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </time>
                </div>

                {/* Excerpt */}
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                  {post.excerpt}
                </p>

                {/* Read More Link */}
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold group-hover:gap-3 transition-all">
                  Read Article
                  <FaArrowRight className="text-sm group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View All Link */}
        <div className="text-center mt-10">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold transition-all hover:shadow-lg"
          >
            View All Articles
            <FaArrowRight />
          </Link>
        </div>
      </div>
    </section>
  );
}
