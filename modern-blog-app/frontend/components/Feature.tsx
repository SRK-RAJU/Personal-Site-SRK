'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface FeatureProps {
  icon: ReactNode;
  title: string;
  description: string;
  details?: string[];
  gradient?: string;
  delay?: number;
}

export default function Feature({
  icon,
  title,
  description,
  details = [],
  gradient = 'from-violet-500 to-blue-500',
  delay = 0,
}: FeatureProps) {
  return (
    <motion.div
      className="relative group"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
    >
      {/* Background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-blue-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-300" />

      {/* Card */}
      <div className="relative p-6 sm:p-8 card-glass border-2 border-transparent group-hover:border-violet-500/50 dark:group-hover:border-violet-500/30 transition-all duration-300 h-full">
        {/* Icon */}
        <motion.div
          className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${gradient} text-white mb-4 sm:mb-6 glow-violet`}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          <div className="text-3xl sm:text-4xl">{icon}</div>
        </motion.div>

        {/* Title */}
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-3">
          {title}
        </h3>

        {/* Description */}
        <p className="text-slate-800 dark:text-slate-200 text-sm sm:text-base mb-4 sm:mb-6 leading-relaxed">
          {description}
        </p>

        {/* Details List */}
        {details.length > 0 && (
          <ul className="space-y-2 sm:space-y-3">
            {details.map((detail, idx) => (
              <motion.li
                key={idx}
                className="flex items-start gap-2 text-sm text-slate-800 dark:text-slate-200"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: delay + idx * 0.05 }}
              >
                <span className="text-violet-500 font-bold mt-0.5">✦</span>
                <span>{detail}</span>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}
