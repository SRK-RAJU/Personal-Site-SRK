'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaEye, FaFire, FaArrowRight } from 'react-icons/fa';
import axios from 'axios';

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

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="card-hover group relative flex h-full flex-col overflow-hidden !p-0"
    >
      <div className="absolute left-4 top-4 z-20 inline-flex h-10 min-w-[2.5rem] items-center justify-center rounded-xl border border-white/20 bg-black/55 px-2 font-mono text-sm font-bold text-white backdrop-blur-md">
        #{index + 1}
      </div>

      <div className="relative h-48 overflow-hidden bg-[rgb(var(--fg-rgb)/0.05)] md:h-52">
        <Image
          src={!imageError && imgSrc ? imgSrc : '/images/adv-banner.svg'}
          alt={post.title}
          fill
          unoptimized
          onError={() => {
            setImageError(true);
            setImgSrc('/images/adv-banner.svg');
          }}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={index === 0}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="mb-3 line-clamp-2 font-display text-lg font-semibold leading-snug transition-colors group-hover:text-[rgb(var(--accent-rgb))]">
          {post.title}
        </h3>

        <p className="mb-4 line-clamp-2 flex-1 text-sm text-[var(--fg-muted)]">{post.excerpt}</p>

        <div className="mt-auto flex items-center justify-between border-t border-[var(--line)] pt-4 text-sm">
          <div className="flex items-center gap-2 text-[var(--fg-muted)]">
            <FaEye className="text-[rgb(var(--accent-rgb))]" />
            <span className="font-semibold text-[rgb(var(--fg-rgb))]">{post.view_count.toLocaleString()}</span>
            views
          </div>
          <time className="font-mono text-xs text-[var(--fg-subtle)]">
            {new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </time>
        </div>

        <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[rgb(var(--accent-rgb))]">
          Read article
          <FaArrowRight className="text-xs transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

export default function TrendingPosts() {
  const [posts, setPosts] = useState<TrendingPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingPosts = async () => {
      try {
        const response = await axios.get('/api/posts?published=true&order=view_count&ascending=false&limit=3', {
          timeout: 10000,
        });

        const data = response.data?.data;

        if (!Array.isArray(data) || data.length === 0) {
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
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-72 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10">
        <div>
          <p className="eyebrow">
            <FaFire className="text-sm" />
            Most read
          </p>
          <h2 className="section-title mt-3">Trending now</h2>
          <p className="mt-3 text-[var(--fg-muted)]">Most viewed articles this week.</p>
        </div>
        <Link href="/blog" className="btn-secondary !text-sm">
          View all articles
          <FaArrowRight className="text-xs" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, index) => (
          <TrendingCard key={post.id} post={post} index={index} />
        ))}
      </div>
    </section>
  );
}
