'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface LoadingSkeletonProps {
  count?: number;
  variant?: 'card' | 'text' | 'avatar' | 'line';
  height?: string;
  width?: string;
}

export default function LoadingSkeleton({
  count = 1,
  variant = 'card',
  height = 'h-12',
  width = 'w-full',
}: LoadingSkeletonProps) {
  const skeletons = Array.from({ length: count });

  const getVariantClasses = (): string => {
    switch (variant) {
      case 'card':
        return `${height} ${width} rounded-xl`;
      case 'text':
        return `${height} w-3/4 rounded`;
      case 'avatar':
        return 'w-12 h-12 rounded-full';
      case 'line':
        return `${height} ${width} rounded`;
      default:
        return `${height} ${width} rounded`;
    }
  };

  return (
    <>
      {skeletons.map((_, idx) => (
        <motion.div
          key={idx}
          className={`skeleton ${getVariantClasses()} mb-4`}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, delay: idx * 0.1 }}
        />
      ))}
    </>
  );
}

export function CardSkeleton() {
  return (
    <div className="card animate-pulse">
      <LoadingSkeleton variant="line" height="h-4" width="w-3/4" />
      <LoadingSkeleton count={3} variant="text" height="h-3" width="w-full" />
      <div className="mt-4">
        <LoadingSkeleton variant="line" height="h-10" width="w-1/3" />
      </div>
    </div>
  );
}

export function BlogCardSkeleton() {
  return (
    <div className="card h-full animate-pulse flex flex-col">
      <LoadingSkeleton variant="card" height="h-48" width="w-full" />
      <div className="p-6 flex-1 flex flex-col">
        <LoadingSkeleton variant="line" height="h-4" width="w-1/3" />
        <LoadingSkeleton count={2} variant="text" height="h-4" width="w-full" />
        <div className="mt-4 flex-1">
          <LoadingSkeleton count={2} variant="line" height="h-3" width="w-full" />
        </div>
        <div className="mt-4 flex gap-4">
          <LoadingSkeleton variant="line" height="h-4" width="w-1/4" />
          <LoadingSkeleton variant="line" height="h-4" width="w-1/4" />
        </div>
      </div>
    </div>
  );
}
