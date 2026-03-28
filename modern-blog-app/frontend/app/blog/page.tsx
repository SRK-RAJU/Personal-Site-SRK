'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaCalendar, FaUser, FaEye, FaArrowRight } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';

// Note: Metadata is handled by layout.tsx for this client component

// Fetch posts from Supabase
async function getBlogPosts() {
  try {
    // Handle missing Supabase credentials gracefully for builds
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('[Build] Supabase credentials not available - returning empty posts array');
      return []
    }

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Supabase error:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Error fetching posts:', err)
    return []
  }
}

export default function Blog() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      const postsData = await getBlogPosts();
      setPosts(postsData);
      setLoading(false);
    };
    loadPosts();
  }, []);

  return (
    <div className="min-h-screen w-full">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 dark:from-cyan-500/10 dark:via-transparent dark:to-blue-500/10 border-b border-cyan-500/20">
        <div className="container-max">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6">
              <span className="gradient-text">Latest</span> Articles
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
              Insights, tutorials, and thoughts on web development, cloud architecture, DevOps, and modern technology practices.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Posts Section */}
      <section className="section-padding">
        <div className="container-max">
          {loading ? (
            <div className="text-center py-16 sm:py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent mx-auto"></div>
              <p className="mt-4 text-slate-600 dark:text-slate-400">Loading articles...</p>
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
                    <div className="card-glass card-gradient h-full flex flex-col hover:border-cyan-500/50 transition-all duration-300 overflow-hidden">
                      {/* Image */}
                      {post.featured_image_url && (
                        <div className="relative h-40 sm:h-48 overflow-hidden bg-gradient-to-br from-cyan-500/10 to-blue-500/10 mb-4 sm:mb-6">
                          <Image
                            src={post.featured_image_url}
                            alt={post.title}
                            fill
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        </div>
                      )}

                      {/* Badge */}
                      {post.category && (
                        <div className="mb-3 flex gap-2">
                          <span className="badge text-xs">{post.category}</span>
                        </div>
                      )}

                      {/* Title */}
                      <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 line-clamp-2 group-hover:text-cyan-500 transition-colors">
                        {post.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mb-4 sm:mb-6 line-clamp-3 flex-1">
                        {post.excerpt || post.content?.slice(0, 150)}
                      </p>

                      {/* Meta Info */}
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                        {post.published_at && (
                          <div className="flex items-center gap-1.5">
                            <FaCalendar className="text-cyan-500" />
                            <span>{new Date(post.published_at).toLocaleDateString()}</span>
                          </div>
                        )}
                        
                        {post.author_name && (
                          <div className="flex items-center gap-1.5">
                            <FaUser className="text-blue-500" />
                            <span>{post.author_name}</span>
                          </div>
                        )}

                        {post.views_count !== undefined && (
                          <div className="flex items-center gap-1.5">
                            <FaEye className="text-purple-500" />
                            <span>{post.views_count}</span>
                          </div>
                        )}

                        <FaArrowRight className="ml-auto text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
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
              <p className="text-slate-600 dark:text-slate-400 mb-6">
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
