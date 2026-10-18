'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaEye } from 'react-icons/fa';
import { usePageViews } from '@/lib/useAnalytics';

export default function VisitorCounter() {
  const { totalViews, loading } = usePageViews();
  const [displayCount, setDisplayCount] = useState(0);
  const [hasUpdated, setHasUpdated] = useState(false);

  // Animate counter increment
  useEffect(() => {
    if (!hasUpdated || totalViews <= 0) return;

    const increment = Math.max(1, Math.ceil(totalViews / 20));
    const interval = setInterval(() => {
      setDisplayCount((prev) => {
        if (prev < totalViews) {
          return Math.min(prev + increment, totalViews);
        }
        return prev;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [totalViews, hasUpdated]);

  // Update display count when totalViews changes
  useEffect(() => {
    if (totalViews > 0) {
      setHasUpdated(true);
    }
  }, [totalViews]);

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
      className="flex items-center justify-center gap-2 rounded-full border border-[rgb(var(--accent-rgb)/0.3)] bg-[rgb(var(--accent-rgb)/0.08)] px-3.5 py-1.5"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <span className="live-dot" aria-hidden="true" />
      <FaEye className="text-sm text-[rgb(var(--accent-rgb))]" />
      <span className="min-w-[72px] font-mono text-xs font-semibold text-[rgb(var(--accent-rgb))]">
        {loading ? (
          <span>Loading…</span>
        ) : (
          <span>{formatNumber(displayCount)} visits</span>
        )}
      </span>
    </motion.div>
  );
}
