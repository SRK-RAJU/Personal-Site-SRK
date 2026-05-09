'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/supabaseStorage';

interface LazySupabaseImageProps {
  bucket: string;
  path: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fallback?: string;
}

/**
 * Lazy-loading image component for Supabase Storage
 * Only fetches image when it becomes visible (Intersection Observer)
 * Helps reduce bandwidth usage on free tier
 */
export default function LazySupabaseImage({
  bucket,
  path,
  alt,
  width = 300,
  height = 300,
  className = '',
  priority = false,
  fallback,
}: LazySupabaseImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!priority);
  const [error, setError] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const loadImage = useCallback(async () => {
    try {
      setIsLoading(true);
      const url = await getImageUrl(bucket, path);
      if (url.url) {
        setImageSrc(url.url);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Error loading image:', err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [bucket, path]);

  useEffect(() => {
    if (priority) {
      loadImage();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage();
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image enters viewport
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [priority, loadImage]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
      )}

      {error && fallback ? (
        <Image
          src={fallback}
          alt={alt}
          width={width}
          height={height}
          className={className}
        />
      ) : imageSrc ? (
        <Image
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          className={className}
          onError={() => setError(true)}
        />
      ) : (
        <div className={`bg-slate-200 dark:bg-slate-700 ${className}`} />
      )}
    </div>
  );
}
