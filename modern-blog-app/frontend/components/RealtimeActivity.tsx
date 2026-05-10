'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaChartLine, FaUsers, FaEye, FaFire, FaClock, FaRocket } from 'react-icons/fa';
import { usePageViews, useWebsiteStats } from '@/lib/useAnalytics';

interface ActivityMetric {
  label: string;
  value: number;
  icon: React.ComponentType<any>;
  color: string;
  trend: number;
}

export default function RealtimeActivity() {
  const { totalViews } = usePageViews();
  const { stats } = useWebsiteStats();
  const [metrics, setMetrics] = useState<ActivityMetric[]>([
    { label: 'Articles', value: 0, icon: FaChartLine, color: 'from-cyan-500 to-blue-500', trend: 0 },
    { label: 'Total Visits', value: 0, icon: FaEye, color: 'from-emerald-500 to-teal-500', trend: 0 },
    { label: 'Projects', value: 3, icon: FaRocket, color: 'from-orange-500 to-red-500', trend: 0 },
    { label: 'Monthly Views', value: 0, icon: FaFire, color: 'from-purple-500 to-pink-500', trend: 0 },
  ]);

  useEffect(() => {
    // Update metrics with real data from API
    const estimatedOnline = Math.max(1, Math.floor((totalViews || stats.total_visits || 0) / 100));
    
    setMetrics([
      {
        label: 'Articles',
        value: stats.articles || 0,
        icon: FaChartLine,
        color: 'from-cyan-500 to-blue-500',
        trend: 2,
      },
      {
        label: 'Total Visits',
        value: totalViews || stats.total_visits || 0,
        icon: FaEye,
        color: 'from-emerald-500 to-teal-500',
        trend: 5,
      },
      {
        label: 'Projects',
        value: stats.projects || 3,
        icon: FaFire,
        color: 'from-orange-500 to-red-500',
        trend: 1,
      },
      {
        label: 'Monthly Views',
        value: stats.monthly_views || totalViews || 0,
        icon: FaClock,
        color: 'from-purple-500 to-pink-500',
        trend: 3,
      },
    ]);
  }, [totalViews, stats]);

  return (
    <div className="w-full">
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 section-gap-tight"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1 }}
      >
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const isTrendPositive = metric.trend >= 0;

          return (
            <motion.div
              key={metric.label}
              className={`card-glass bg-gradient-to-br ${metric.color} bg-opacity-5 border-2 border-transparent hover:border-current`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="flex items-start justify-between mb-3">
                <Icon className={`text-xl bg-gradient-to-br ${metric.color} bg-clip-text text-transparent`} />
                <motion.span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                    isTrendPositive
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}
                >
                  {isTrendPositive ? '↑' : '↓'} {Math.abs(metric.trend)}%
                </motion.span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1">
                {metric.value.toLocaleString()}
              </p>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">{metric.label}</p>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
