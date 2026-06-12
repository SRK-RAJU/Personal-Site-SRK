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
        const response = await axios.get('/api/posts?category=DevOps&limit=3', {
          timeout: 10000,
        });

        if (response.data.data && Array.isArray(response.data.data)) {
          // Filter for AI-generated posts
          const aiPosts = response.data.data
            .filter((post: any) => post.ai_model && post.ai_model.includes('groq'))
            .slice(0, 3);
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
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <FaRobot className="text-3xl text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text" />
            <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text">
              AI-Generated Weekly Insights
            </h2>
          </div>
          <p className="text-gray-300 text-lg max-w-3xl">
            Automated analysis of 50+ DevOps, Cloud, Security & AI tools. Updated every Monday with the latest CVEs, releases, and best practices.
          </p>
        </motion.div>

        {/* Posts Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {posts.map((post) => (
            <motion.article
              key={post.id}
              variants={itemVariants}
              className="group relative overflow-hidden rounded-xl border border-gray-700 hover:border-purple-500 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 bg-gradient-to-br from-gray-900/50 to-gray-900/20 backdrop-blur-sm"
            >
              {/* Gradient Background Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Content */}
              <div className="relative p-6 h-full flex flex-col">
                {/* AI Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/50">
                    <FaRobot className="text-xs text-purple-400" />
                    <span className="text-xs font-semibold text-purple-300">AI Generated</span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all duration-300">
                  {post.title}
                </h3>

                {/* Excerpt */}
                <p className="text-gray-300 text-sm mb-4 flex-grow line-clamp-3">
                  {post.excerpt}
                </p>

                {/* Tools Covered */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FaTools className="text-purple-400" />
                    <span className="text-xs font-semibold text-gray-400">
                      {post.tools_covered.length} Tools Covered
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {post.tools_covered.slice(0, 3).map((tool) => (
                      <span
                        key={tool}
                        className="px-2 py-1 text-xs bg-gray-800 text-gray-300 rounded border border-gray-700 hover:border-purple-500 transition-colors"
                      >
                        {tool}
                      </span>
                    ))}
                    {post.tools_covered.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-gray-800 text-gray-300 rounded border border-gray-700">
                        +{post.tools_covered.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* CVEs & Metadata */}
                <div className="flex items-center gap-4 text-xs text-gray-400 mb-4 pb-4 border-b border-gray-700">
                  {post.cves_mentioned > 0 && (
                    <div className="flex items-center gap-1">
                      <FaShieldAlt className="text-red-500" />
                      <span>{post.cves_mentioned} CVEs</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <FaClock className="text-gray-500" />
                    <span>{post.read_time_minutes} min read</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaCalendar className="text-gray-500" />
                    <span>{formatDate(new Date(post.published_at))}</span>
                  </div>
                </div>

                {/* Read More Link */}
                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-semibold text-sm mt-auto group/link"
                >
                  Read Full Analysis
                  <FaArrowRight className="text-xs group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.article>
          ))}
        </motion.div>

        {/* View All Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="flex justify-center mt-12"
        >
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50"
          >
            View All AI Insights
            <FaArrowRight />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
