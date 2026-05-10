'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaSave } from 'react-icons/fa';

export default function NewPostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image: '',
    tags: '',
    category: 'General',
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Auto-generate slug from title
    if (name === 'title') {
      const newSlug = value
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      setFormData((prev) => ({
        ...prev,
        slug: newSlug,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        setError('Title is required');
        setLoading(false);
        return;
      }

      if (!formData.slug.trim()) {
        setError('Slug is required');
        setLoading(false);
        return;
      }

      if (!formData.content.trim()) {
        setError('Content is required');
        setLoading(false);
        return;
      }

      // Create post object with optional featured_image
      const postData: any = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        excerpt: formData.excerpt.trim() || formData.content.substring(0, 160),
        content: formData.content.trim(),
        category: formData.category || 'General',
        tags: formData.tags.split(',').map(tag => tag.trim()),
        published: false, // Default to draft
        published_at: new Date().toISOString(),
        view_count: 0,
        author_name: 'SRK', // Or get from user context
        created_at: new Date().toISOString(),
      };

      // Only add featured_image if provided
      if (formData.featured_image.trim()) {
        postData.featured_image = formData.featured_image.trim();
      }

      const { data, error: insertError } = await supabase
        .from('posts')
        .insert([postData])
        .select();

      if (insertError) throw insertError;

      // Success
      alert('Post created successfully! It\'s currently in draft mode.');
      router.push('/dashboard/posts');
    } catch (err: any) {
      console.error('Error creating post:', err);
      setError(err.message ||'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/posts" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <FaArrowLeft className="text-xl text-slate-600 dark:text-slate-400" />
        </Link>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Create New Post</h1>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-800 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
            Post Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Getting Started with DevOps"
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Slug */}
        <div>
          <label htmlFor="slug" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
            URL Slug * (auto-generated from title)
          </label>
          <input
            type="text"
            id="slug"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            placeholder="e.g., getting-started-with-devops"
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Category & Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="General">General</option>
              <option value="DevOps">DevOps</option>
              <option value="Cloud">Cloud</option>
              <option value="Security">Security</option>
              <option value="Development">Development</option>
              <option value="Tutorial">Tutorial</option>
              <option value="Tip">Tip</option>
            </select>
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g., devops, kubernetes, automation"
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Excerpt */}
        <div>
          <label htmlFor="excerpt" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
            Excerpt (preview text - optional)
          </label>
          <textarea
            id="excerpt"
            name="excerpt"
            value={formData.excerpt}
            onChange={handleChange}
            placeholder="Brief summary of your post (optional, will be auto-generated if empty)"
            rows={2}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            If empty, the first 160 characters of content will be used.
          </p>
        </div>

        {/* Featured Image URL (Optional) */}
        <div>
          <label htmlFor="featured_image" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
            Featured Image URL (optional)
          </label>
          <input
            type="url"
            id="featured_image"
            name="featured_image"
            value={formData.featured_image}
            onChange={handleChange}
            placeholder="e.g., https://example.com/image.jpg"
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            💡 TIP: Leave empty to save Supabase storage quota. Text-only posts work great!
          </p>
        </div>

        {/* Main Content */}
        <div>
          <label htmlFor="content" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
            Post Content * (Markdown supported)
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="Write your post content here...&#10;&#10;# Heading 1&#10;## Heading 2&#10;&#10;**Bold text** or *italic text*&#10;&#10;- List item 1&#10;- List item 2&#10;&#10;[Link text](https://example.com)"
            rows={12}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none"
            required
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Write your post in Markdown format. You can include code blocks with triple backticks.
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-2">💡 Quota Optimization Tips:</h3>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <li>✓ Text-only posts don't use storage spaces within free tier</li>
            <li>✓ Use markdown for code snippets instead of images</li>
            <li>✓ Link to external images instead of uploading</li>
            <li>✓ Each post counts towards your free row limit</li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <FaSave /> {loading ? 'Creating...' : 'Create Draft Post'}
          </button>
          <Link
            href="/dashboard/posts"
            className="px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-semibold transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
