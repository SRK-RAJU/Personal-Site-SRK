'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface StatsCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down';
  color?: 'emerald' | 'blue' | 'orange' | 'purple';
  gradient?: string;
}

export default function StatsCard({
  icon,
  label,
  value,
  change,
  trend = 'up',
  color = 'emerald',
  gradient = 'from-emerald-600 to-teal-600',
}: StatsCardProps) {
  const colorClasses = {
    emerald: 'from-emerald-500 to-teal-500',
    blue: 'from-blue-500 to-cyan-500',
    orange: 'from-orange-500 to-red-500',
    purple: 'from-purple-500 to-pink-500',
  };

  const bgGradient = colorClasses[color] || gradient;
  const trendColor = trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const trendSymbol = trend === 'up' ? '↑' : '↓';

  return (
    <motion.div
      className="card-glass border-2 border-transparent hover:border-emerald-500/50 dark:hover:border-emerald-500/30"
      whileHover={{ scale: 1.05, y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Icon container */}
      <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${bgGradient} text-white mb-4 glow-emerald`}>
        <div className="text-2xl">{icon}</div>
      </div>

      {/* Label */}
      <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-1">
        {label}
      </p>

      {/* Value */}
      <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>

      {/* Change indicator */}
      {change !== undefined && (
        <motion.p
          className={`text-sm font-semibold flex items-center gap-1 ${trendColor}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span>{trendSymbol}</span>
          {Math.abs(change).toFixed(1)}% from last month
        </motion.p>
      )}
    </motion.div>
  );
}
