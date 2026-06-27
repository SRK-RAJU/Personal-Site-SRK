'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FaCalendar, FaRobot, FaTools, FaShieldAlt, FaArrowRight, FaClock, FaNewspaper, FaStar } from 'react-icons/fa';
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
        const response = await axios.get('/api/posts?published=true&includeAI=true&limit=6', {
          timeout: 10000,
        });

        if (response.data.data && Array.isArray(response.data.data)) {
          const aiPosts = response.data.data
            .filter((post: any) => post.source_table === 'ai_generated_posts' || post.ai_model)
            .slice(0, 6);
          setPosts(aiPosts);
        }
      } catch (err) {
        console.warn('Could not fetch AI posts:', err);
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
        staggerChildren: 0.1,
        delayChildren: 0.2,
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

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="inline-block">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gradient-to-r from-purple-500 to-pink-500"></div>
        </div>
        <p className="mt-4 text-gray-400">Loading AI-Generated Insights...</p>
      </div>
    );
  }

  if (error && posts.length === 0) {
    return null; // Silently fail if no AI posts yet
  }

  if (posts.length === 0) {
    return null; // No posts to display
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="container-max">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-10 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-purple-950/80 to-slate-900/90 p-8 shadow-2xl shadow-purple-950/30"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/10 px-3 py-1 text-sm font-semibold text-purple-200">
                <FaStar className="text-purple-300" />
                Latest AI Updates
              </div>
              <div className="flex items-center gap-3">
                <FaNewspaper className="text-3xl text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text" />
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                  Posts
                </h2>
              </div>
              <p className="mt-3 max-w-3xl text-base text-slate-300">
                Fresh AI-generated posts covering DevOps, cloud, security, and automation insights. Updated regularly so your weekly and daily reading stays current.
              </p>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 self-start rounded-full border border-purple-400/30 bg-white/5 px-4 py-2 text-sm font-semibold text-purple-200 transition hover:bg-white/10"
            >
              Explore all posts
              <FaArrowRight />
            </Link>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 gap-6 xl:grid-cols-3"
        >
          {posts.map((post, index) => {
            const isFeatured = index === 0;
            return (
              <motion.article
                key={post.id}
                variants={itemVariants}
                className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${isFeatured
                  ? 'border-purple-400/40 bg-gradient-to-br from-purple-950/70 via-slate-900/80 to-slate-900/70 shadow-purple-950/30 xl:col-span-1'
                  : 'border-white/10 bg-gradient-to-br from-slate-900/70 to-slate-800/70 hover:border-purple-400/30'}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="relative flex h-full flex-col p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 rounded-full border border-purple-400/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-200">
                      <FaRobot className="text-purple-300" />
                      {isFeatured ? 'Featured Update' : 'AI Generated'}
                    </div>
                    {isFeatured && (
                      <div className="rounded-full border border-pink-400/20 bg-pink-500/10 px-3 py-1 text-xs font-semibold text-pink-200">
                        New
                      </div>
                    )}
                  </div>

                  <h3 className="mb-3 text-xl font-bold text-white transition group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-300 group-hover:to-pink-300 group-hover:bg-clip-text">
                    {post.title}
                  </h3>

                  <p className="mb-4 flex-grow text-sm leading-6 text-slate-300 line-clamp-3">
                    {post.excerpt}
                  </p>

                  <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      <FaTools className="text-purple-300" />
                      Tools Covered
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {post.tools_covered.slice(0, 3).map((tool) => (
                        <span key={tool} className="rounded-full border border-white/10 bg-slate-800/70 px-2.5 py-1 text-xs text-slate-200">
                          {tool}
                        </span>
                      ))}
                      {post.tools_covered.length > 3 && (
                        <span className="rounded-full border border-white/10 bg-slate-800/70 px-2.5 py-1 text-xs text-slate-400">
                          +{post.tools_covered.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mb-5 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    {post.cves_mentioned > 0 && (
                      <div className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1">
                        <FaShieldAlt className="text-red-400" />
                        <span>{post.cves_mentioned} CVEs</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1">
                      <FaClock className="text-slate-400" />
                      <span>{post.read_time_minutes} min read</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1">
                      <FaCalendar className="text-slate-400" />
                      <span>{formatDate(new Date(post.published_at))}</span>
                    </div>
                  </div>

                  <Link
                    href={`/blog/${post.slug}`}
                    className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-purple-200 transition group-hover:text-purple-100"
                  >
                    Read full update
                    <FaArrowRight className="transition group-hover:translate-x-1" />
                  </Link>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
