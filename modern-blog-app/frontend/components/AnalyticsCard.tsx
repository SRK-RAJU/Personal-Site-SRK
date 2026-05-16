'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: number;
  trendLabel?: string;
  gradient?: string;
  onClick?: () => void;
}

export default function AnalyticsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendLabel,
  gradient = 'from-violet-500 to-blue-500',
  onClick,
}: AnalyticsCardProps) {
  const isPositiveTrend = trend && trend > 0;

  return (
    <motion.div
      className="card-glass card-gradient cursor-pointer h-full border-violet-500/30 hover:border-violet-400/60 hover:shadow-violet-500/20 shadow-lg hover:shadow-2xl"
      whileHover={{ scale: 1.05, y: -5 }}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium mb-1 group-hover:text-white transition-colors">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-bold gradient-text-vibrant">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-700 dark:text-slate-200 mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-lg bg-gradient-to-br ${gradient} text-white glow-violet`}>
            <div className="text-lg sm:text-2xl">{icon}</div>
          </div>
        )}
      </div>

      {trend !== undefined && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div
            className={`flex items-center gap-1 text-xs sm:text-sm font-semibold ${
              isPositiveTrend
                ? 'text-violet-600 dark:text-violet-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {isPositiveTrend ? <FaArrowUp /> : <FaArrowDown />}
            {Math.abs(trend)}%
          </div>
          {trendLabel && (
            <span className="text-xs text-slate-800 dark:text-slate-200">
              {trendLabel}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}
