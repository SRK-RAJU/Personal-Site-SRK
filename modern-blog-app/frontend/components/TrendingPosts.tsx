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

function TrendingCard({ post, index }: { post: TrendingPost; index: number }) {
  const [imgSrc, setImgSrc] = useState<string>(
    post.featured_image_url && post.featured_image_url.trim() 
      ? (post.featured_image_url.startsWith('/') ? post.featured_image_url : '/' + post.featured_image_url)
      : '/images/adv-banner.svg'
  );
  const [imageError, setImageError] = useState(false);

  // ensure leading slash for public images
  useEffect(() => {
    if (imgSrc && !imgSrc.startsWith('http') && !imgSrc.startsWith('/')) {
      setImgSrc('/' + imgSrc);
    }
  }, [imgSrc]);

  const gradients = [
    'from-violet-500 via-purple-500 to-pink-500',
    'from-purple-500 via-pink-500 to-orange-500',
    'from-orange-500 via-red-500 to-pink-500'
  ];
  const gradient = gradients[index] || gradients[0];

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative overflow-hidden rounded-2xl border border-slate-700/40 hover:border-violet-400/50 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/30 h-full flex flex-col bg-slate-950/95 backdrop-blur-xl hover:bg-slate-900/95"
    >
      {/* Rank Badge with gradient */}
      <div className={`absolute top-4 left-4 z-20 inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br ${gradient} text-white font-bold text-lg shadow-lg`}>
        #{index + 1}
      </div>

      {/* Image container */}
      <div className="relative h-48 md:h-56 overflow-hidden bg-gradient-to-br from-white/10 to-white/5">
        <Image
          src={!imageError && imgSrc ? imgSrc : '/images/adv-banner.svg'}
          alt={post.title}
          fill
          unoptimized
          onError={() => {
            setImageError(true);
            setImgSrc('/images/adv-banner.svg');
          }}
          className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-500 ease-out"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={index === 0}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/35 to-transparent group-hover:from-slate-950/90 transition-all duration-300"></div>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-bold text-lg text-white transition-colors line-clamp-2 mb-3 flex-1 group-hover:text-violet-100">
          {post.title}
        </h3>

        <p className="text-sm text-slate-100 line-clamp-2 mb-4 flex-1">
          {post.excerpt}
        </p>

        {/* Stats and date */}
        <div className="flex items-center justify-between mb-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-sm">
            <FaEye className="text-violet-300" />
            <span className="font-bold text-white">{post.view_count.toLocaleString()}</span>
            <span className="text-slate-200">views</span>
          </div>
          <time className="text-xs text-slate-200">
            {new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </time>
        </div>

        {/* CTA */}
        <div className="mt-auto inline-flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold transition-all duration-300 hover:scale-[1.02] text-sm">
          Read Article
          <FaArrowRight className="text-sm transition-transform group-hover:translate-x-1" />
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
          setPosts([]);
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
        setPosts([]);
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
        {/* Header with Icon - Modern Design */}
        <div className="flex items-center gap-4 mb-12">
          <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 shadow-2xl overflow-hidden group">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity bg-white" />
            <FaFire className="text-white text-3xl relative z-10" />
          </div>
          <div>
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white">
              Trending Now
            </h2>
            <p className="text-sm md:text-base text-slate-800 dark:text-slate-200 mt-1 font-semibold">
              Most viewed articles this week
            </p>
          </div>
        </div>

        {/* Trending Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-8">
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
