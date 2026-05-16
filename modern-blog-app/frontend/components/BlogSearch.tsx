'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaTimes } from 'react-icons/fa';

interface BlogSearchProps {
  onSearch: (query: string) => void;
  onCategoryFilter?: (category: string) => void;
  categories?: string[];
  placeholder?: string;
}

export default function BlogSearch({
  onSearch,
  onCategoryFilter,
  categories = ['All', 'Cloud', 'DevOps', 'Security', 'Tutorial'],
  placeholder = 'Search articles...',
}: BlogSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
      onSearch(value);
    },
    [onSearch]
  );

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    onCategoryFilter?.(category);
  };

  return (
    <motion.div
      className="mb-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Search Input */}
      <motion.div
        className={`relative transition-all duration-300 ${
          isFocused
            ? 'shadow-xl ring-2 ring-violet-500'
            : 'shadow-md'
        } rounded-xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700`}
        animate={{ scale: isFocused ? 1.02 : 1 }}
      >
        <div className="flex items-center px-4 py-3">
          <FaSearch className="text-slate-400 dark:text-slate-500 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="flex-1 bg-transparent outline-none text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
          />
          {query && (
            <motion.button
              onClick={() => handleSearch('')}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <FaTimes className="text-slate-400" />
            </motion.button>
          )}
        </div>

        {/* Search suggestions or highlight */}
        {isFocused && (
          <motion.div
            className="h-1 bg-gradient-to-r from-violet-500 via-pink-500 to-violet-500"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </motion.div>

      {/* Category Filter */}
      {categories && categories.length > 0 && (
        <motion.div
          className="mt-4 flex flex-wrap gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {categories.map((category, idx) => (
            <motion.button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-lg'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * idx }}
            >
              {category}
            </motion.button>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
