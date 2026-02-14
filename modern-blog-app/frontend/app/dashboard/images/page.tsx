'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FaUpload, FaTrash, FaDownload, FaCopy } from 'react-icons/fa';
import { validateImageFile, sanitizeFileName } from '@/lib/security';

interface Image {
  id: string;
  name: string;
  url: string;
  size: number;
  created_at: string;
}

export default function ImagesPage() {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

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
        .filter((file) => file.name !== '.emptyFolderPlaceholder')
        .map((file) => {
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
        const fileName = sanitizeFileName(file.name);
        const uniqueName = `${Date.now()}-${fileName}`;

        const { data, error } = await supabase.storage
          .from('blog-images')
          .upload(uniqueName, file);

        if (error) {
          setError(`Failed to upload ${file.name}: ${error.message}`);
          continue;
        }

        setSuccess(`${file.name} uploaded successfully!`);
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
      <h1 className="text-4xl font-bold mb-8 text-slate-900 dark:text-white">
        Image Manager
      </h1>

      {/* Upload Section */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-8">
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center">
          <FaUpload className="text-4xl text-slate-400 mx-auto mb-4" />

          <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">
            Drag and drop images here
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            or click to select (Max 5MB per image, supports JPEG, PNG, WebP, GIF)
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
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-6 py-2 rounded-lg font-semibold inline-block cursor-pointer"
            >
              Choose Images
            </button>
          </label>

          {uploading && (
            <div className="mt-4">
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {Math.round(uploadProgress)}%
              </p>
            </div>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-200 rounded-lg text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 p-4 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-200 rounded-lg text-sm">
            {success}
          </div>
        )}
      </div>

      {/* Images Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
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
                className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Image Preview */}
                <div className="bg-slate-100 dark:bg-slate-900 h-48 flex items-center justify-center overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Image Info */}
                <div className="p-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                    {image.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                    {formatFileSize(image.size)}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => copyToClipboard(image.url)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors text-sm"
                    >
                      <FaCopy />
                      {copiedUrl === image.url ? 'Copied!' : 'Copy URL'}
                    </button>
                    <button
                      onClick={() => handleDelete(image.name)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors text-sm"
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
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-4 text-blue-900 dark:text-blue-300">
          💡 Image Optimization Tips
        </h3>
        <ul className="space-y-2 text-blue-800 dark:text-blue-200 text-sm">
          <li>✓ Compress images before uploading for faster loading</li>
          <li>✓ Use descriptive file names (no spaces, use hyphens)</li>
          <li>✓ Keep images under 2MB for optimal performance</li>
          <li>✓ Use WebP format for better compression</li>
          <li>✓ Copy the image URL to use in your blog posts</li>
        </ul>
      </div>
    </div>
  );
}
