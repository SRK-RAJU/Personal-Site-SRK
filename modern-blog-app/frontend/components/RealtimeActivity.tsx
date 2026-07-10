'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaChartLine, FaUsers, FaEye, FaFire, FaFileAlt, FaRocket } from 'react-icons/fa';
import { usePageViews, useWebsiteStats } from '@/lib/useAnalytics';

interface ActivityMetric {
  label: string;
  value: number;
  icon: React.ComponentType<any>;
  bgColor: string;
  textColor: string;
  borderColor: string;
  trend: number;
}

export default function RealtimeActivity() {
  const { totalViews } = usePageViews();
  const { stats } = useWebsiteStats();
  const [metrics, setMetrics] = useState<ActivityMetric[]>([
    { label: 'Articles', value: 0, icon: FaFileAlt, bgColor: 'bg-blue-50 dark:bg-blue-950/30', textColor: 'text-blue-600 dark:text-blue-400', borderColor: 'border-blue-200 dark:border-blue-800', trend: 0 },
    { label: 'Total Visits', value: 0, icon: FaEye, bgColor: 'bg-violet-50 dark:bg-violet-950/30', textColor: 'text-violet-600 dark:text-violet-400', borderColor: 'border-violet-200 dark:border-violet-800', trend: 0 },
    { label: 'Monthly Views', value: 0, icon: FaFire, bgColor: 'bg-rose-50 dark:bg-rose-950/30', textColor: 'text-rose-600 dark:text-rose-400', borderColor: 'border-rose-200 dark:border-rose-800', trend: 0 },
  ]);

  useEffect(() => {
    const estimatedOnline = Math.max(1, Math.floor((totalViews || stats.total_visits || 0) / 100));
    
    setMetrics([
      {
        label: 'Articles',
        value: stats.articles || 0,
        icon: FaFileAlt,
        bgColor: 'bg-blue-50 dark:bg-blue-950/30',
        textColor: 'text-blue-600 dark:text-blue-400',
        borderColor: 'border-blue-200 dark:border-blue-800',
        trend: 2,
      },
      {
        label: 'Total Visits',
        value: totalViews || stats.total_visits || 0,
        icon: FaEye,
        bgColor: 'bg-violet-50 dark:bg-violet-950/30',
        textColor: 'text-violet-600 dark:text-violet-400',
        borderColor: 'border-violet-200 dark:border-violet-800',
        trend: 5,
      },
      {
        label: 'Monthly Views',
        value: stats.monthly_views || totalViews || 0,
        icon: FaFire,
        bgColor: 'bg-rose-50 dark:bg-rose-950/30',
        textColor: 'text-rose-600 dark:text-rose-400',
        borderColor: 'border-rose-200 dark:border-rose-800',
        trend: 3,
      },
    ]);
  }, [totalViews, stats]);

  return (
    <div className="w-full">
      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 gap-4"
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
              className={`rounded-lg p-4 border-2 transition-all duration-300 hover:shadow-lg ${metric.bgColor} ${metric.borderColor} hover:border-current`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -4 }}
            >
              <div className="flex items-start justify-between mb-3">
                <Icon className={`text-2xl ${metric.textColor}`} />
                <motion.span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                    isTrendPositive
                      ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300'
                      : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                  }`}
                >
                  {isTrendPositive ? '↑' : '↓'} {Math.abs(metric.trend)}%
                </motion.span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-1">
                {metric.value.toLocaleString()}
              </p>
              <p className={`text-xs sm:text-sm font-medium ${metric.textColor}`}>{metric.label}</p>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
