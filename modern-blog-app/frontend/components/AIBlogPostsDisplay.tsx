'use client';

/**
 * ============================================================================
 * AI GENERATED BLOG POSTS DISPLAY COMPONENT
 * ============================================================================
 * File: components/AIBlogPostsDisplay.tsx
 *
 * Purpose: Display AI-generated blog posts on the blog page
 * - Fetch posts from Supabase
 * - Render markdown with syntax highlighting
 * - Show metadata (tools covered, CVEs, read time)
 * - Responsive design
 *
 * ============================================================================
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { FaClock, FaCode, FaExclamationTriangle, FaArrowRight } from 'react-icons/fa';

interface AIPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  tools_covered: string[];
  cves_mentioned: number;
  view_count: number;
  read_time_minutes: number;
  published_at: string;
  is_featured: boolean;
}

interface AIBlogPostsDisplayProps {
  limit?: number;
  showFeaturedOnly?: boolean;
  compact?: boolean;
}

export default function AIBlogPostsDisplay({
  limit = 10,
  showFeaturedOnly = false,
  compact = false,
}: AIBlogPostsDisplayProps) {
  const [posts, setPosts] = useState<AIPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(
    () => createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    ),
    []
  );

  useEffect(() => {
    const fetchAIPosts = async () => {
      try {
        setLoading(true);

        let query = supabase
          .from('ai_generated_posts')
          .select(
            'id, title, slug, excerpt, content, category, tags, tools_covered, cves_mentioned, view_count, read_time_minutes, published_at, is_featured'
          )
          .eq('status', 'published');

        if (showFeaturedOnly) {
          query = query.eq('is_featured', true);
        }

        const { data, error: fetchError } = await query
          .order('published_at', { ascending: false })
          .limit(limit);

        if (fetchError) {
          setError(fetchError.message);
          return;
        }

        setPosts((data || []) as AIPost[]);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchAIPosts();
  }, [limit, showFeaturedOnly, supabase]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-700 dark:text-red-300">
          Error loading AI posts: {error}
        </p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-300">
          No AI-generated posts yet. Check back soon!
        </p>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <motion.div
      className="grid gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {posts.map((post) => (
        <motion.div
          key={post.id}
          variants={itemVariants}
          className={`card group cursor-pointer transition-all duration-300 ${
            post.is_featured
              ? 'border-2 border-amber-400 dark:border-amber-500 bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/20'
              : ''
          }`}
        >
          {post.is_featured && (
            <div className="inline-block mb-3 px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs font-bold rounded-full">
              ⭐ FEATURED
            </div>
          )}

          {/* Post Title & Link */}
          <Link href={`/blog/${post.slug}`}>
            <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
              {post.title}
            </h3>
          </Link>

          {/* Excerpt */}
          {!compact && (
            <p className="text-slate-700 dark:text-slate-300 mb-4 line-clamp-2">
              {post.excerpt}
            </p>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap gap-4 mb-4 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <FaClock className="text-violet-500" />
              <span>{post.read_time_minutes} min read</span>
            </div>

            {post.cves_mentioned > 0 && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <FaExclamationTriangle />
                <span>{post.cves_mentioned} CVE{post.cves_mentioned !== 1 ? 's' : ''}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <FaCode className="text-blue-500" />
              <span>{post.tools_covered?.length || 0} Tools</span>
            </div>

            <div className="text-slate-500">
              {new Date(post.published_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>

          {/* Tools Tags */}
          {post.tools_covered && post.tools_covered.length > 0 && (
            <div className="mb-4 rounded-2xl border border-violet-200/70 bg-violet-50/70 p-3 shadow-sm dark:border-violet-900/60 dark:bg-violet-950/30">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                  <FaCode className="text-violet-500" />
                  Tool Stack
                </div>
                <span className="rounded-full border border-violet-300/60 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-violet-700 dark:border-violet-800/70 dark:bg-violet-900/40 dark:text-violet-300">
                  {post.tools_covered.length} tools
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {post.tools_covered.slice(0, 6).map((tool: string) => (
                  <span
                    key={tool}
                    className="inline-block rounded-full border border-violet-300/60 bg-gradient-to-r from-violet-100 to-fuchsia-100 px-3 py-1 text-xs font-semibold text-violet-700 shadow-sm dark:border-violet-800/70 dark:from-violet-950/70 dark:to-fuchsia-950/70 dark:text-violet-200"
                  >
                    {tool}
                  </span>
                ))}
                {post.tools_covered.length > 6 && (
                  <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    +{post.tools_covered.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.slice(0, 3).map((tag: string) => (
                <span
                  key={tag}
                  className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Read More Button */}
          <Link
            href={`/blog/${post.slug}`}
            className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 font-semibold hover:text-violet-700 dark:hover:text-violet-300 transition-colors group"
          >
            Read Full Post
            <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      ))}

      {/* View All Posts Link */}
      {posts.length >= limit && (
        <motion.div
          variants={itemVariants}
          className="text-center mt-6"
        >
          <Link
            href="/blog?filter=ai-posts"
            className="inline-block px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-violet-500/50 transition-all duration-300"
          >
            View All AI-Generated Posts
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}
