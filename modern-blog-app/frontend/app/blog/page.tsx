'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaCalendar, FaUser, FaEye, FaArrowRight } from 'react-icons/fa';
import { motion } from 'framer-motion';
import axios from 'axios';

export default function Blog() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/posts?published=true&order=published_at&ascending=false&limit=100');
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

  return (
    <div className="min-h-screen w-full">
      <section className="section-padding bg-gradient-to-br from-violet-50/80 via-blue-50/50 to-violet-50/80 dark:from-violet-950/30 dark:via-blue-950/20 dark:to-violet-950/30 border-b border-violet-300/50 dark:border-violet-700/50">
        <div className="container-max">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 text-slate-900 dark:text-white">
              <span className="gradient-text">Latest</span> Posts
            </h1>
            <p className="text-slate-900 dark:text-slate-100 text-base sm:text-lg max-w-2xl mx-auto font-semibold">
              Fresh AI-generated posts and weekly reports covering DevOps, cloud architecture, security, and automation.
            </p>
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
          ) : posts.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1,
                  },
                },
              }}
            >
              {posts.map((post: any, idx: number) => (
                <motion.div
                  key={post.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                >
                  <Link href={`/blog/${post.slug}`} className="group block h-full">
                    <div className="card-glass card-gradient h-full flex flex-col hover:border-violet-500/50 transition-all duration-300 overflow-hidden">
                      {post.featured_image_url && (
                        <div className="relative h-40 sm:h-48 overflow-hidden bg-gradient-to-br from-violet-500/20 to-blue-500/20 mb-4 sm:mb-6 rounded-lg border border-violet-200 dark:border-violet-800">
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
                        </div>
                      )}

                      <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 line-clamp-2 group-hover:text-violet-500 transition-colors">
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
                        
                        {post.author_name && (
                          <div className="flex items-center gap-1.5">
                            <FaUser className="text-blue-500" />
                            <span>{post.author_name}</span>
                          </div>
                        )}

                        {post.view_count !== undefined && (
                          <div className="flex items-center gap-1.5">
                            <FaEye className="text-purple-500" />
                            <span>{post.view_count}</span>
                          </div>
                        )}

                        <FaArrowRight className="ml-auto text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
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
    </div>
  );
}
