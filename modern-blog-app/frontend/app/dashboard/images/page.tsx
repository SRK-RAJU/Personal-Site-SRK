'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import { FaUpload, FaTrash, FaDownload, FaCopy, FaBolt } from 'react-icons/fa';
import { validateImageFile, sanitizeFileName } from '@/lib/security';
import { compressImage, calculateCompressionSavings } from '@/lib/imageCompression';

interface Image {
  id: string | null;
  name: string;
  url: string;
  size: number;
  created_at: string | null;
}

export default function ImagesPage() {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [compressionStats, setCompressionStats] = useState<string>('');

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.storage
        .from('blog-images')
        .list();

      if (error) {
        console.error('Error fetching images:', error);
        return;
      }

      const imageList = (data || [])
        .filter((file: any) => file.name !== '.emptyFolderPlaceholder')
        .map((file: any) => {
          const { data } = supabase.storage
            .from('blog-images')
            .getPublicUrl(file.name);

          return {
            id: file.id,
            name: file.name,
            url: data.publicUrl,
            size: file.metadata?.size || 0,
            created_at: file.created_at,
          };
        });

      setImages(imageList);
    } catch (err) {
      console.error('Error fetchImages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setError('');
    setSuccess('');
    setCompressionStats('');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid file');
        continue;
      }

      try {
        setUploading(true);
        const originalSize = file.size;

        // Compress image before upload
        let fileToUpload = file;
        let compression = '';
        
        try {
          const compressedBlob = await compressImage(file);
          const compressedSize = compressedBlob.size;
          const savings = calculateCompressionSavings(originalSize, compressedSize);
          
          fileToUpload = new File([compressedBlob], file.name, {
            type: 'image/jpeg',
          });
          
          compression = `(${savings}% saved - ${(originalSize / 1024).toFixed(0)}KB → ${(compressedSize / 1024).toFixed(0)}KB)`;
          setCompressionStats(compression);
        } catch (compressErr) {
          console.warn('Compression failed, uploading original:', compressErr);
          compression = '(compression skipped)';
        }

        const fileName = sanitizeFileName(file.name);
        const uniqueName = `${Date.now()}-${fileName}`;

        const { data, error } = await supabase.storage
          .from('blog-images')
          .upload(uniqueName, fileToUpload);

        if (error) {
          setError(`Failed to upload ${file.name}: ${error.message}`);
          continue;
        }

        setSuccess(`✓ ${file.name} uploaded successfully! ${compression}`);
        setUploadProgress(((i + 1) / files.length) * 100);
      } catch (err) {
        console.error('Upload error:', err);
        setError('Failed to upload image');
      } finally {
        if (i === files.length - 1) {
          setUploading(false);
          setUploadProgress(0);
          fetchImages();
        }
      }
    }

    e.target.value = '';
  };

  const handleDelete = async (fileName: string) => {
    if (!window.confirm('Delete this image?')) return;

    try {
      const { error } = await supabase.storage
        .from('blog-images')
        .remove([fileName]);

      if (error) {
        setError('Failed to delete image');
        return;
      }

      setImages(images.filter((img) => img.name !== fileName));
      setSuccess('Image deleted successfully');
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete image');
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div>
      <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
        Image Manager
      </h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8">
        Upload and manage your blog featured images with automatic compression
      </p>

      {/* Upload Section */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-8 border border-emerald-200 dark:border-emerald-900/30">
        <div className="border-2 border-dashed border-emerald-300 dark:border-emerald-700 rounded-lg p-8 text-center bg-gradient-to-b from-emerald-50 to-transparent dark:from-emerald-900/10 dark:to-transparent">
          <FaUpload className="text-4xl text-emerald-500 dark:text-emerald-400 mx-auto mb-4" />

          <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">
            Drag and drop images here
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Images are automatically compressed before upload (Max 5MB, supports JPEG, PNG, WebP, GIF)
          </p>

          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            id="file-input"
          />

          <label htmlFor="file-input">
            <button
              type="button"
              onClick={() => {
                const input = document.getElementById('file-input') as HTMLInputElement;
                input?.click();
              }}
              disabled={uploading}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-slate-400 disabled:to-slate-500 text-white px-6 py-2 rounded-lg font-semibold inline-block cursor-pointer shadow-md hover:shadow-lg transition-all"
            >
              Choose Images
            </button>
          </label>

          {uploading && (
            <div className="mt-4">
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 font-semibold">
                {Math.round(uploadProgress)}% Complete
              </p>
            </div>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-200 rounded-lg text-sm border border-red-300 dark:border-red-800">
            ❌ {error}
          </div>
        )}
        {success && (
          <div className="mt-4 p-4 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-200 rounded-lg text-sm border border-emerald-300 dark:border-emerald-800">
            {success}
          </div>
        )}
      </div>

      {/* Images Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Your Images ({images.length})
        </h2>

        {loading ? (
          <p className="text-slate-600 dark:text-slate-400">Loading images...</p>
        ) : images.length === 0 ? (
          <p className="text-slate-600 dark:text-slate-400 text-center py-8">
            No images uploaded yet. Start by uploading your first image!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image) => (
              <div
                key={image.id}
                className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden hover:shadow-lg hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-300"
              >
                {/* Image Preview */}
                <div className="bg-slate-100 dark:bg-slate-900 h-48 flex items-center justify-center overflow-hidden relative">
                  <Image
                    src={image.url}
                    alt={image.name}
                    fill
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Image Info */}
                <div className="p-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 truncate font-medium">
                    {image.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                    📦 {formatFileSize(image.size)}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => copyToClipboard(image.url)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded hover:bg-emerald-200 dark:hover:bg-emerald-900/40 transition-colors text-sm font-semibold"
                    >
                      <FaCopy />
                      {copiedUrl === image.url ? 'Copied!' : 'Copy URL'}
                    </button>
                    <button
                      onClick={() => handleDelete(image.name)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors text-sm font-semibold"
                    >
                      <FaTrash />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="mt-8 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-300 dark:border-emerald-700 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-4">
          <FaBolt className="text-2xl text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-4 text-emerald-900 dark:text-emerald-300">
              🚀 Image Optimization with Auto-Compression
            </h3>
            <ul className="space-y-2 text-emerald-800 dark:text-emerald-200 text-sm">
              <li>✓ <span className="font-semibold">Auto Compression:</span> Images are automatically compressed before upload (40-70% size reduction)</li>
              <li>✓ <span className="font-semibold">Smart Format:</span> Optimized quality settings for best visual fidelity</li>
              <li>✓ <span className="font-semibold">Storage Savings:</span> 5MB image → ~1-2MB after compression</li>
              <li>✓ <span className="font-semibold">Descriptive Names:</span> Use clear file names (no spaces, use hyphens)</li>
              <li>✓ <span className="font-semibold">Supported Formats:</span> JPEG, PNG, WebP, GIF (Max 5MB original)</li>
              <li>✓ <span className="font-semibold">Copy URL:</span> Click "Copy URL" button to get shareable image link</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
