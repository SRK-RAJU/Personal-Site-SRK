'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaEye, FaUsers, FaArrowUp } from 'react-icons/fa';
import { usePageViews } from '@/lib/useAnalytics';

export default function VisitorCounter() {
  const { totalViews } = usePageViews();
  const [displayCount, setDisplayCount] = useState(0);
  const [animateCounter, setAnimateCounter] = useState(false);

  useEffect(() => {
    if (totalViews > 0 && displayCount !== totalViews) {
      setAnimateCounter(true);
      const interval = setInterval(() => {
        setDisplayCount((prev) => {
          if (prev < totalViews) {
            return Math.min(prev + Math.ceil((totalViews - prev) / 10), totalViews);
          }
          return prev;
        });
      }, 50);

      return () => clearInterval(interval);
    }
  }, [totalViews, displayCount]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <motion.div
      className="flex items-center justify-center gap-2 px-3 py-1 rounded-lg bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-600/20 dark:to-teal-600/20 border border-emerald-500/30 dark:border-emerald-500/40 backdrop-blur-sm"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <FaEye className="text-emerald-600 dark:text-emerald-400 text-sm" />
      </motion.div>
      <span className="text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-300">
        {formatNumber(displayCount)} visits
      </span>
    </motion.div>
  );
}
