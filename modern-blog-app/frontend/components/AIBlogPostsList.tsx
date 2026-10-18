'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FaCalendar, FaRobot, FaTools, FaShieldAlt, FaArrowRight, FaClock } from 'react-icons/fa';
import axios from 'axios';
import { formatDate } from '@/lib/ai-utils';

interface AIPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  published_at: string;
  view_count: number;
  read_time_minutes: number;
  tools_covered: string[];
  cves_mentioned: number;
  ai_model: string;
}

export default function AIBlogPostsList() {
  const [posts, setPosts] = useState<AIPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAIPosts = async () => {
      try {
        const response = await axios.get('/api/ai-posts?limit=6', {
          timeout: 10000,
        });

        if (response.data.data && Array.isArray(response.data.data)) {
          // Transform and take top 6
          const aiPosts = response.data.data.map((post: any) => ({
            ...post,
            ai_model: post.ai_model || 'google-gemini-2.5-flash',
            tools_covered: Array.isArray(post.tools_covered) ? post.tools_covered : [],
            cves_mentioned: post.cves_mentioned || 0,
            read_time_minutes: post.read_time_minutes || Math.ceil((post.content?.length || 0) / 200),
            view_count: post.view_count || 0,
          })).slice(0, 6);

          setPosts(aiPosts);
          if (aiPosts.length === 0) {
            setError('No AI posts available yet');
          }
        }
      } catch (err) {
        console.error('Error fetching AI posts:', err);
        setError('Failed to load AI posts');
      } finally {
        setLoading(false);
      }
    };

    fetchAIPosts();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  return (
    <section className="relative border-y border-[var(--line)] bg-[rgb(var(--fg-rgb)/0.025)] py-14 sm:py-20">
      <div className="container-max">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">
              <FaRobot className="text-sm" />
              AI weekly reports
            </p>
            <h2 className="section-title mt-3">Latest AI posts</h2>
            <p className="mt-3 text-[var(--fg-muted)]">
              Fresh category reports, generated each week by the scheduler (or on demand by an admin from the dashboard).
            </p>
          </div>
          <Link href="/blog" className="btn-secondary self-start !text-sm md:self-auto">
            Explore all posts
            <FaArrowRight className="text-xs" />
          </Link>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[rgb(var(--accent-rgb))] border-t-transparent" />
            <p className="mt-4 text-sm text-[var(--fg-muted)]">Loading AI-generated posts…</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 p-8 text-center">
            <p className="text-lg font-semibold text-rose-300">Unable to load AI posts right now.</p>
            <p className="mt-2 text-sm text-[var(--fg-muted)]">{error}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--line-strong)] p-10 text-center">
            <p className="eyebrow justify-center">No AI posts yet</p>
            <h3 className="mt-3 text-2xl font-bold">No generated posts are available yet.</h3>
            <p className="mx-auto mt-2 max-w-2xl text-[var(--fg-muted)]">
              The weekly scheduler will publish them, or an admin can generate them from the dashboard.
            </p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
          >
            {posts.map((post, index) => {
              const isFeatured = index === 0;
              return (
                <motion.article
                  key={post.id}
                  variants={itemVariants}
                  className={`futurist-card group flex h-full flex-col overflow-hidden ${
                    isFeatured ? 'md:col-span-2 xl:col-span-1 !border-[rgb(var(--accent-rgb)/0.4)]' : ''
                  }`}
                >
                  <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[rgb(var(--accent-rgb)/0.14)] blur-3xl transition-opacity duration-300 group-hover:opacity-100" />

                  <div className="relative flex h-full flex-col">
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <span className="futurist-pill">
                        <FaRobot />
                        {isFeatured ? 'Featured update' : 'AI generated'}
                      </span>
                      {isFeatured && <span className="badge-vibrant">New</span>}
                    </div>

                    {post.category && (
                      <p className="mb-2 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[var(--fg-subtle)]">{post.category}</p>
                    )}

                    <h3 className="mb-3 font-display text-xl font-semibold leading-snug transition-colors group-hover:text-[rgb(var(--accent-rgb))]">
                      {post.title}
                    </h3>

                    <p className="mb-4 line-clamp-3 flex-grow text-sm leading-6 text-[var(--fg-muted)]">{post.excerpt}</p>

                    <div className="mb-4 rounded-xl border border-[var(--line)] bg-[rgb(var(--fg-rgb)/0.03)] p-3">
                      <div className="mb-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[var(--fg-subtle)]">
                          <FaTools className="text-[rgb(var(--accent-rgb))]" />
                          Tool coverage
                        </div>
                        <span className="badge !text-[0.68rem]">{post.tools_covered.length} tools</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {post.tools_covered.slice(0, 4).map((tool) => (
                          <span key={tool} className="badge-secondary !text-[0.68rem]">
                            {tool}
                          </span>
                        ))}
                        {post.tools_covered.length > 4 && (
                          <span className="badge-secondary !text-[0.68rem]">+{post.tools_covered.length - 4} more</span>
                        )}
                      </div>
                    </div>

                    <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-[var(--fg-muted)]">
                      {post.cves_mentioned > 0 && (
                        <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-red-400">
                          <FaShieldAlt />
                          {post.cves_mentioned} CVEs
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 rounded-full bg-[rgb(var(--fg-rgb)/0.06)] px-2.5 py-1">
                        <FaClock />
                        {post.read_time_minutes} min read
                      </span>
                      <span className="flex items-center gap-1.5 rounded-full bg-[rgb(var(--fg-rgb)/0.06)] px-2.5 py-1">
                        <FaCalendar />
                        {formatDate(new Date(post.published_at))}
                      </span>
                    </div>

                    <Link
                      href={`/blog/${post.slug}`}
                      className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-[rgb(var(--accent-rgb))]"
                    >
                      Read full update
                      <FaArrowRight className="text-xs transition group-hover:translate-x-1" />
                      <span className="absolute inset-0" aria-hidden="true" />
                    </Link>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
}
