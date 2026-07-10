'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { FaArrowLeft, FaSave } from 'react-icons/fa';
import { useAuth } from '@/lib/authContext';

interface PostRecord {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  category?: string;
  featured_image_url?: string;
  published?: boolean;
}

export default function EditPostPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const postId = useMemo(() => String(params?.id || ''), [params]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image_url: '',
    category: 'General',
    published: false,
  });

  useEffect(() => {
    const loadPost = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/posts?limit=10000');
        const result = await response.json();
        const posts = Array.isArray(result.data) ? result.data : [];
        const post = posts.find((item: PostRecord) => item.id === postId);

        if (!post) {
          setError('Post not found');
          return;
        }

        setFormData({
          title: post.title || '',
          slug: post.slug || '',
          excerpt: post.excerpt || '',
          content: post.content || '',
          featured_image_url: post.featured_image_url || '',
          category: post.category || 'General',
          published: Boolean(post.published),
        });
      } catch (err) {
        setError('Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      loadPost();
    }
  }, [postId]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;
    const nextValue = type === 'checkbox' && 'checked' in event.target ? event.target.checked : value;

    setFormData((current) => ({
      ...current,
      [name]: nextValue,
    }));

    if (name === 'title') {
      const nextSlug = value
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      setFormData((current) => ({
        ...current,
        slug: nextSlug,
      }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!session?.access_token) {
      setError('Your session has expired. Please sign in again.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          slug: formData.slug.trim(),
          excerpt: formData.excerpt.trim(),
          content: formData.content.trim(),
          category: formData.category,
          featured_image_url: formData.featured_image_url.trim() || null,
          published: formData.published,
          published_at: formData.published ? new Date().toISOString() : null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to update post');
        return;
      }

      router.push('/dashboard/posts');
    } catch (err) {
      setError('Failed to update post');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl py-12 text-sm text-slate-600 dark:text-slate-300">
        Loading post...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-12">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/dashboard/posts" className="rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
          <FaArrowLeft className="text-xl text-slate-800 dark:text-slate-200" />
        </Link>
        <h1 className="dashboard-title">Edit Post</h1>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-300 bg-red-100 p-4 text-red-800 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="dashboard-card space-y-6">
        <div>
          <label htmlFor="title" className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white">
            Post Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            required
          />
        </div>

        <div>
          <label htmlFor="slug" className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white">
            URL Slug
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            value={formData.slug}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="category" className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
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
            <label htmlFor="featured_image_url" className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white">
              Featured Image URL
            </label>
            <input
              id="featured_image_url"
              name="featured_image_url"
              type="url"
              value={formData.featured_image_url}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label htmlFor="excerpt" className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white">
            Excerpt
          </label>
          <textarea
            id="excerpt"
            name="excerpt"
            rows={3}
            value={formData.excerpt}
            onChange={handleChange}
            className="w-full resize-none rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="content" className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white">
            Content
          </label>
          <textarea
            id="content"
            name="content"
            rows={14}
            value={formData.content}
            onChange={handleChange}
            className="w-full resize-none rounded-lg border border-slate-300 bg-white px-4 py-3 font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            required
          />
        </div>

        <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            name="published"
            checked={formData.published}
            onChange={handleChange}
            className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
          />
          Published
        </label>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-cyan-700 disabled:opacity-50"
          >
            <FaSave /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link
            href="/dashboard/posts"
            className="rounded-lg bg-slate-200 px-6 py-3 font-semibold text-slate-900 transition-colors hover:bg-slate-300 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}