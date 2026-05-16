'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { FaEdit, FaTrash, FaPlus, FaEye, FaSearch, FaArrowLeft } from 'react-icons/fa';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  published: boolean;
  published_at: string;
  view_count: number;
  author_name: string;
}

export default function PostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      
      // Use API endpoint instead of direct Supabase call
      const url = new URL('/api/posts', window.location.origin);
      
      const { data, error } = await fetch(url.toString()).then(r => r.json());

      if (error) {
        console.error('Error fetching posts:', error);
        return;
      }

      // Filter locally
      let filtered = data || [];
      
      if (filterStatus === 'published') {
        filtered = filtered.filter((p: Post) => p.published === true);
      } else if (filterStatus === 'draft') {
        filtered = filtered.filter((p: Post) => p.published === false);
      }

      // Search locally
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter((p: Post) =>
          p.title.toLowerCase().includes(query) ||
          p.slug.toLowerCase().includes(query)
        );
      }

      // Sort by published_at
      filtered.sort((a: Post, b: Post) => {
        const dateA = new Date(a.published_at).getTime();
        const dateB = new Date(b.published_at).getTime();
        return dateB - dateA;
      });

      setPosts(filtered);
    } catch (err) {
      console.error('Error fetchPosts:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchQuery]);
  
  useEffect(() => {
    fetchPosts();
  }, [filterStatus, searchQuery, fetchPosts]);

  const handleDelete = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      setDeleting(postId);
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        alert('Error deleting post: ' + result.error);
        return;
      }

      setPosts(posts.filter((p) => p.id !== postId));
      alert('Post deleted successfully');
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <FaArrowLeft /> Back
          </button>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
            Manage Posts
          </h1>
        </div>
        <Link
          href="/dashboard/posts/new"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          <FaPlus /> New Post
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search posts by title or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Posts</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-slate-600 dark:text-slate-400">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              No posts found
            </p>
            <Link
              href="/dashboard/posts/new"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              <FaPlus /> Create Your First Post
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {post.title}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        /{post.slug}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        post.published
                          ? 'bg-violet-100 dark:bg-violet-900/20 text-violet-800 dark:text-violet-200'
                          : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
                      }`}
                    >
                      {post.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <FaEye className="text-sm" />
                      {post.view_count || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">
                    {new Date(post.published_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/dashboard/posts/${post.id}`}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        <FaEdit />
                      </Link>
                      <button
                        onClick={() => handleDelete(post.id)}
                        disabled={deleting === post.id}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 disabled:opacity-50"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
