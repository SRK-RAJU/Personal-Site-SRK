'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaEye, FaFire, FaFileAlt } from 'react-icons/fa';
import { usePageViews, useWebsiteStats } from '@/lib/useAnalytics';

interface ActivityMetric {
  label: string;
  value: number;
  icon: React.ComponentType<any>;
  trend: number;
}

const emptyMetrics: ActivityMetric[] = [
  { label: 'Articles', value: 0, icon: FaFileAlt, trend: 0 },
  { label: 'Total Visits', value: 0, icon: FaEye, trend: 0 },
  { label: 'Monthly Views', value: 0, icon: FaFire, trend: 0 },
];

export default function RealtimeActivity() {
  const { totalViews } = usePageViews();
  const { stats } = useWebsiteStats();
  const [metrics, setMetrics] = useState<ActivityMetric[]>(emptyMetrics);

  useEffect(() => {
    setMetrics([
      { label: 'Articles', value: stats.articles || 0, icon: FaFileAlt, trend: 2 },
      { label: 'Total Visits', value: totalViews || stats.total_visits || 0, icon: FaEye, trend: 5 },
      { label: 'Monthly Views', value: stats.monthly_views || totalViews || 0, icon: FaFire, trend: 3 },
    ]);
  }, [totalViews, stats]);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const isTrendPositive = metric.trend >= 0;

          return (
            <motion.div
              key={metric.label}
              className="futurist-card"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
            >
              <div className="mb-4 flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgb(var(--accent-rgb)/0.3)] bg-[rgb(var(--accent-rgb)/0.1)] text-[rgb(var(--accent-rgb))]">
                  <Icon />
                </span>
                <span
                  className={`rounded-full px-2 py-1 font-mono text-xs font-semibold ${
                    isTrendPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  }`}
                >
                  {isTrendPositive ? '↑' : '↓'} {Math.abs(metric.trend)}%
                </span>
              </div>
              <p className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{metric.value.toLocaleString()}</p>
              <p className="mt-1 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-[var(--fg-subtle)]">{metric.label}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
