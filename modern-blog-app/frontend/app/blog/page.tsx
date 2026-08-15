'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaCalendar, FaUser, FaEye, FaArrowRight } from 'react-icons/fa';
import { motion } from 'framer-motion';
import axios from 'axios';
import ToolsList from '@/components/ToolsList';
import FloatingToolsButton from '@/components/FloatingToolsButton';

export default function Blog() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'human' | 'ai'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const currentQuery = (new URLSearchParams(window.location.search).get('search') || '').trim().toLowerCase();
    setSearchQuery(currentQuery);
  }, []);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/posts?published=true&order=published_at&ascending=false&limit=10000');
        setPosts(response.data.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError('Failed to load articles. Please try again later.');
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    loadPosts();
  }, []);

  const groupedPosts = useMemo(() => {
    const sourceFiltered = posts.filter((post) => {
      const isAi = post.source_table === 'ai_generated_posts';
      if (sourceFilter === 'ai') return isAi;
      if (sourceFilter === 'human') return !isAi;
      return true;
    });

    const searchFiltered = sourceFiltered.filter((post) => {
      if (!searchQuery) return true;

      const title = String(post.title || '').toLowerCase();
      const excerpt = String(post.excerpt || '').toLowerCase();
      const content = String(post.content || '').toLowerCase();
      const category = String(post.category || '').toLowerCase();
      const tags = Array.isArray(post.tags) ? post.tags.join(' ').toLowerCase() : '';

      return (
        title.includes(searchQuery) ||
        excerpt.includes(searchQuery) ||
        content.includes(searchQuery) ||
        category.includes(searchQuery) ||
        tags.includes(searchQuery)
      );
    });

    const groups = new Map<string, any[]>();

    searchFiltered.forEach((post) => {
      const category = (post.category || 'General').toString().trim() || 'General';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(post);
    });

    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [posts, sourceFilter, searchQuery]);

  const visibleGroups = selectedCategory === 'all'
    ? groupedPosts
    : groupedPosts.filter(([category]) => category === selectedCategory);

  const categories = ['all', ...groupedPosts.map(([category]) => category)];

  return (
    <div className="min-h-screen w-full futurist-grid-bg">
      <section className="section-padding border-b border-cyan-200/60 dark:border-cyan-900/40">
        <div className="container-max">
          <motion.div
            className="futurist-hero text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="mb-4 text-4xl font-bold text-slate-900 dark:text-white sm:mb-6 sm:text-5xl md:text-6xl">
              <span className="gradient-text">Latest</span> Posts
            </h1>
            <p className="text-slate-800 dark:text-slate-100 text-base sm:text-lg max-w-2xl mx-auto font-semibold leading-8">
              Fresh admin-published posts across AI/ML, cloud, DevOps, security, and platform engineering.
            </p>
            {searchQuery && (
              <p className="mt-4 futurist-pill">
                Showing results for: {searchQuery}
              </p>
            )}
            <div className="mt-6 flex justify-center">
              <ToolsList />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-max">
          {loading ? (
            <div className="text-center py-16 sm:py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-500 border-t-transparent mx-auto"></div>
              <p className="mt-4 text-slate-800 dark:text-slate-200">Loading articles...</p>
            </div>
          ) : error ? (
            <motion.div
              className="text-center py-16 sm:py-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-2">Unable to load posts</h3>
              <p className="text-slate-800 dark:text-slate-200 mb-6">{error}</p>
            </motion.div>
          ) : posts.length > 0 ? (
            <>
              <div className="mb-8 flex flex-wrap gap-2">
                {categories.map((category) => {
                  const isActive = selectedCategory === category;
                  const label = category === 'all' ? 'All topics' : category;
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${isActive ? 'border-cyan-500 bg-cyan-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="mb-10 flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'All Sources' },
                  { id: 'human', label: 'Human Posts' },
                  { id: 'ai', label: 'AI Posts' },
                ].map((opt) => {
                  const isActive = sourceFilter === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSourceFilter(opt.id as 'all' | 'human' | 'ai')}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${isActive ? 'border-cyan-500 bg-cyan-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'}`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {visibleGroups.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-700 dark:border-slate-700 dark:text-slate-300">
                  No posts found for this category yet.
                </div>
              ) : (
                visibleGroups.map(([category, categoryPosts]) => (
                  <div key={category} className="mb-12">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{category}</h2>
                      <span className="futurist-pill">Weekly updates</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                      {categoryPosts.map((post: any, idx: number) => (
                        <motion.div
                          key={post.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.08 }}
                        >
                          <Link href={`/blog/${post.slug}`} className="group block h-full">
                            <div className="futurist-card flex h-full flex-col overflow-hidden">
                              {post.featured_image_url && (
                                <div className="relative h-40 sm:h-48 overflow-hidden bg-gradient-to-br from-cyan-500/20 to-pink-500/20 mb-4 sm:mb-6 rounded-lg border border-cyan-200 dark:border-cyan-800">
                                  <Image
                                    src={post.featured_image_url}
                                    alt={post.title}
                                    fill
                                    unoptimized
                                    onError={(e) => {
                                      const img = e.target as HTMLImageElement;
                                      img.style.display = 'none';
                                    }}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                </div>
                              )}

                              {post.category && (
                                <div className="mb-3 flex gap-2">
                                  <span className="badge text-xs">{post.category}</span>
                                  {post.source_table === 'ai_generated_posts' && (
                                    <span className="futurist-pill">
                                      AI
                                    </span>
                                  )}
                                </div>
                              )}

                              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 line-clamp-2 group-hover:text-cyan-500 transition-colors">
                                {post.title}
                              </h3>

                              <p className="text-slate-800 dark:text-slate-200 text-sm sm:text-base mb-4 sm:mb-6 line-clamp-3 flex-1">
                                {post.excerpt || post.content?.slice(0, 150)}
                              </p>

                              <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                                {post.published_at && (
                                  <div className="flex items-center gap-1.5">
                                    <FaCalendar className="text-violet-500" />
                                    <span>{new Date(post.published_at).toLocaleDateString()}</span>
                                  </div>
                                )}

                                {(post.author_name || post.author) && (
                                  <div className="flex items-center gap-1.5">
                                    <FaUser className="text-blue-500" />
                                    <span>{post.author_name || post.author || 'Raju'}</span>
                                  </div>
                                )}

                                {post.view_count !== undefined && (
                                  <div className="flex items-center gap-1.5">
                                    <FaEye className="text-purple-500" />
                                    <span>{post.view_count}</span>
                                  </div>
                                )}

                                <FaArrowRight className="ml-auto text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </>
          ) : (
            <motion.div
              className="text-center py-16 sm:py-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-2">No Articles Yet</h3>
              <p className="text-slate-800 dark:text-slate-200 mb-6">
                Check back soon for interesting content!
              </p>
              <Link href="/" className="btn-primary inline-flex">
                Back to Home
                <FaArrowRight className="ml-2" />
              </Link>
            </motion.div>
          )}
        </div>
      </section>
      <FloatingToolsButton />
    </div>
  );
}
