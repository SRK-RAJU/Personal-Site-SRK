'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FaCalendar, FaClock, FaEye, FaArrowRight, FaTag } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

interface BlogCardProps {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featured_image_url?: string;
  created_at: string;
  date?: string;
  views?: number;
  category?: string;
  tags?: string[];
  author?: string;
  featured?: boolean;
}

export default function BlogCard({
  slug,
  title,
  excerpt,
  content,
  featured_image_url,
  created_at,
  views = 0,
  category = 'General',
  tags = [],
  featured = false,
}: BlogCardProps) {
  // Calculate reading time
  const readingTime = Math.ceil(content?.split(' ').length / 200) || 5;
  
  // Format date
  const formattedDate = created_at
    ? formatDistanceToNow(new Date(created_at), { addSuffix: true })
    : 'Recently';

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
      className="group h-full"
    >
      <Link href={`/blog/${slug}`}>
        <div className={`h-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-300 hover:shadow-xl flex flex-col ${featured ? 'ring-2 ring-emerald-500' : ''}`}>
          {/* Featured badge */}
          {featured && (
            <div className="absolute top-4 left-4 z-10">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold">
                ⭐ Featured
              </span>
            </div>
          )}

          {/* Image */}
          {featured_image_url && (
            <div className="relative h-48 sm:h-56 overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800">
              <Image
                src={featured_image_url}
                alt={title}
                fill
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          )}

          {/* Content */}
          <div className="p-6 flex-1 flex flex-col">
            {/* Category badge */}
            <div className="mb-3">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                <FaTag className="text-xs" />
                {category}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:gradient-text transition-all">
              {title}
            </h3>

            {/* Excerpt */}
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2 flex-1">
              {excerpt || content?.substring(0, 100) + '...'}
            </p>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1">
                <FaCalendar className="text-emerald-600 dark:text-emerald-400" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <FaClock className="text-blue-600 dark:text-blue-400" />
                <span>{readingTime} min read</span>
              </div>
              {views > 0 && (
                <div className="flex items-center gap-1">
                  <FaEye className="text-orange-600 dark:text-orange-400" />
                  <span>{views.toLocaleString()} views</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {tags && tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex px-2 py-1 rounded text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Read more button */}
            <motion.div
              className="mt-4 inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm group-hover:gap-3 transition-all"
              whileHover={{ x: 5 }}
            >
              Read Article
              <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
            </motion.div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
