'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaSearch } from 'react-icons/fa';
import { motion } from 'framer-motion';
import toolsData from '@/data/industry-tools.json';

interface Tool {
  name: string;
  officialUrl: string;
  description: string;
  tags: string[];
}

interface Category {
  id: string;
  displayName: string;
  tools: Tool[];
}

export default function ToolsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = (toolsData as any).categories as Category[];

  const filteredCategories = useMemo(() => {
    return categories
      .map((cat) => ({
        ...cat,
        tools: cat.tools.filter((tool) => {
          const matchesSearch =
            searchQuery === '' ||
            tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tool.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

          return matchesSearch;
        }),
      }))
      .filter((cat) => {
        if (selectedCategory && selectedCategory !== 'all') {
          return cat.id === selectedCategory;
        }
        return cat.tools.length > 0 || !searchQuery;
      });
  }, [searchQuery, selectedCategory, categories]);

  const totalTools = filteredCategories.reduce((sum, cat) => sum + cat.tools.length, 0);

  return (
    <div className="min-h-screen w-full futurist-grid-bg">
      {/* Header */}
      <section className="section-padding border-b border-cyan-200/60 dark:border-cyan-900/40">
        <div className="container-max">
          <motion.div
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 font-semibold mb-6 transition-colors"
            >
              <FaArrowLeft className="text-lg" />
              Back to Home
            </Link>

            <h1 className="mb-4 text-4xl font-bold text-slate-900 dark:text-white sm:mb-6 sm:text-5xl md:text-6xl">
              <span className="gradient-text">Industry Tools</span> Catalog
            </h1>
            <p className="text-slate-800 dark:text-slate-100 text-base sm:text-lg max-w-2xl font-semibold leading-8 mb-8">
              Explore 478 verified tools across 69 categories. Find the right technology stack for your projects.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <div className="futurist-card text-center py-4">
                <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{categories.length}</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">Categories</p>
              </div>
              <div className="futurist-card text-center py-4">
                <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{categories.reduce((sum, cat) => sum + cat.tools.length, 0)}</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">Tools</p>
              </div>
              <div className="futurist-card text-center py-4">
                <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{(categories.reduce((sum, cat) => sum + cat.tools.length, 0) / categories.length).toFixed(1)}</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">Avg per Category</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-8">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tools by name, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
              />
              {searchQuery && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Showing {totalTools} tool{totalTools !== 1 ? 's' : ''} matching "{searchQuery}"
                </p>
              )}
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  selectedCategory === null
                    ? 'border-cyan-500 bg-cyan-600 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    selectedCategory === cat.id
                      ? 'border-cyan-500 bg-cyan-600 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                  }`}
                >
                  {cat.displayName}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="section-padding">
        <div className="container-max">
          {filteredCategories.length === 0 ? (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-xl text-slate-700 dark:text-slate-300 mb-4">
                No tools found matching "{searchQuery}"
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-6 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold transition"
              >
                Clear Search
              </button>
            </motion.div>
          ) : (
            filteredCategories.map((category, catIdx) => (
              <motion.div
                key={category.id}
                className="mb-16"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: catIdx * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <span className="inline-block w-1.5 h-8 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-full"></span>
                    {category.displayName}
                  </h2>
                  <span className="futurist-pill">{category.tools.length} tools</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {category.tools.map((tool, idx) => (
                    <motion.a
                      key={idx}
                      href={tool.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group futurist-card flex flex-col h-full overflow-hidden hover:shadow-lg transition-all duration-300"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      viewport={{ once: true }}
                    >
                      {/* Card Header with gradient */}
                      <div className="h-2 bg-gradient-to-r from-cyan-500 to-blue-600"></div>

                      <div className="flex-1 p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-2 flex-1">
                            {tool.name}
                          </h3>
                          <svg
                            className="w-5 h-5 text-cyan-500 group-hover:text-cyan-600 flex-shrink-0 transition-colors"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M11 3a1 1 0 100 2h3.586L9.293 9.293a1 1 0 001.414 1.414L16 6.414V10a1 1 0 102 0V4a1 1 0 00-1-1h-6z" />
                          </svg>
                        </div>

                        <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 line-clamp-3 leading-relaxed">
                          {tool.description}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {tool.tags.slice(0, 3).map((tag, i) => (
                            <span
                              key={i}
                              className="inline-block px-2.5 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 text-xs font-medium rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                          {tool.tags.length > 3 && (
                            <span className="inline-block px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400">
                              +{tool.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Footer with URL preview */}
                      <div className="px-4 sm:px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                        {tool.officialUrl.replace('https://', '').replace('http://', '').split('/')[0]}
                      </div>
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="section-padding border-t border-cyan-200/60 dark:border-cyan-900/40 bg-gradient-to-b from-slate-50 dark:from-slate-900 to-transparent">
        <div className="container-max text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Found a useful tool?
          </h2>
          <p className="text-slate-700 dark:text-slate-300 mb-8">
            Check out our blog for detailed guides and tutorials on using these tools effectively.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg transition-all hover:shadow-lg"
            >
              Explore Blog
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/20 font-bold rounded-lg transition-all"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
