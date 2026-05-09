'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { FaBook, FaImage, FaUsers, FaEye, FaArrowLeft } from 'react-icons/fa';

export default function DashboardHome() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalImages: 0,
    totalUsers: 0,
    totalViews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch posts count
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('id, view_count', { count: 'exact' });

      // Fetch images count
      const { data: imagesData, count: imagesCount, error: imagesError } = await supabase
        .from('storage')
        .select('id', { count: 'exact' });

      // Fetch users count (from users table, not user_roles)
      const { data: usersData, count: usersCount, error: usersError } = await supabase
        .from('users')
        .select('id', { count: 'exact' });

      let totalViews = 0;
      if (postsData) {
        totalViews = postsData.reduce((sum: number, post: any) => sum + (post.view_count || 0), 0);
      }

      setStats({
        totalPosts: postsData?.length || 0,
        totalImages: imagesCount || 0,
        totalUsers: usersCount || 0,
        totalViews,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Total Posts',
      value: stats.totalPosts,
      icon: <FaBook className="text-3xl" />,
      color: 'bg-blue-500',
    },
    {
      label: 'Total Images',
      value: stats.totalImages,
      icon: <FaImage className="text-3xl" />,
      color: 'bg-purple-500',
    },
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: <FaUsers className="text-3xl" />,
      color: 'bg-green-500',
    },
    {
      label: 'Total Views',
      value: stats.totalViews,
      icon: <FaEye className="text-3xl" />,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push('/')}
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <FaArrowLeft size={24} />
        </button>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
          Welcome to Admin Dashboard
        </h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-semibold">
                  {card.label}
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  {loading ? '-' : card.value}
                </p>
              </div>
              <div className={`${card.color} text-white p-4 rounded-lg opacity-10`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Quick Start
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/dashboard/posts"
            className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
              Create New Post
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Write and publish a new blog post
            </p>
          </a>

          <a
            href="/dashboard/images"
            className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">
              Upload Images
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Manage blog post images and featured images
            </p>
          </a>

          <a
            href="/dashboard/users"
            className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-green-900 dark:text-green-300 mb-2">
              Manage Users
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              View and manage registered users (admin only)
            </p>
          </a>
        </div>
      </div>

      {/* Tips Section */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-purple-700 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-white">
          📋 Quick Tips
        </h3>
        <ul className="space-y-3 text-slate-700 dark:text-slate-300">
          <li>✓ Always save drafts before publishing</li>
          <li>✓ Use descriptive post titles and slugs for better SEO</li>
          <li>✓ Optimize images before uploading (recommended: max 2MB per image)</li>
          <li>✓ Set featured images for better social sharing</li>
          <li>✓ Add relevant tags to help users discover your posts</li>
        </ul>
      </div>
    </div>
  );
}
