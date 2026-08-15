'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaArrowLeft, FaImages } from 'react-icons/fa';

interface LearningImage {
  name: string;
  tool_name: string;
  url: string;
  size: number;
  created_at: string | null;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export default function LearningImagesPage() {
  const [images, setImages] = useState<LearningImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/images/public');
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result?.message || result?.error || 'Unable to load tool visuals.');
        }
        setImages(Array.isArray(result?.images) ? result.images : []);
      } catch (loadError: any) {
        setError(loadError?.message || 'Unable to load tool visuals.');
        setImages([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div className="page-wrapper">
      <div className="page-frame max-w-6xl">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-cyan-700 dark:text-cyan-300 hover:underline">
            <FaArrowLeft /> Back to Home
          </Link>
        </div>

        <div className="page-hero">
          <h1 className="text-4xl sm:text-5xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-fuchsia-500">
            Tools
          </h1>
          <p className="text-slate-800 dark:text-slate-200">
            Tool-wise architecture visuals designed for beginner to advanced learning.
          </p>
        </div>

        <div className="page-panel p-6 mt-6">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Total images: <span className="font-semibold">{images.length}</span>
          </p>
        </div>

        {loading ? (
          <p className="text-slate-700 dark:text-slate-300 mt-8">Loading tool visuals...</p>
        ) : error ? (
          <div className="page-panel p-10 mt-8 text-center">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        ) : images.length === 0 ? (
          <div className="page-panel p-10 mt-8 text-center">
            <FaImages className="mx-auto text-3xl text-cyan-500 mb-3" />
            <p className="text-slate-800 dark:text-slate-200">No tool visuals available yet.</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image) => (
              <div key={image.name} className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
                <div className="relative h-48 bg-slate-100 dark:bg-slate-800">
                  <Image
                    src={image.url}
                    alt={image.tool_name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="p-4">
                  <p className="font-semibold text-slate-900 dark:text-white">{image.tool_name}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{formatFileSize(image.size)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
