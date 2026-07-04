'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { FaBook, FaImage, FaUsers, FaEye, FaArrowLeft, FaRobot } from 'react-icons/fa';
import { useAuth } from '@/lib/authContext';

export default function DashboardHome() {
  const router = useRouter();
  const { session, userRole } = useAuth();
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalImages: 0,
    totalUsers: 0,
    totalViews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiError, setAiError] = useState('');
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch dashboard data on load. Generation is never triggered automatically.
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      let totalPosts = 0;
      let totalViews = 0;
      let totalUsers = 0;
      let imagesCount = 0;

      try {
        const { data: postsData } = await supabase
          .from('posts')
          .select('id, view_count', { count: 'exact' });

        totalPosts = postsData?.length || 0;
        totalViews = (postsData || []).reduce((sum: number, post: any) => sum + (post.view_count || 0), 0);
      } catch {
        totalPosts = 0;
        totalViews = 0;
      }

      try {
        const { data: storageData } = await supabase.storage
          .from('uploads')
          .list('', { limit: 1 });
        imagesCount = storageData?.length || 0;
      } catch {
        imagesCount = 0;
      }

      try {
        const { count } = await supabase
          .from('user_roles')
          .select('user_id', { count: 'exact' });
        totalUsers = count || 0;
      } catch {
        totalUsers = 0;
      }

      setStats({
        totalPosts,
        totalImages: imagesCount,
        totalUsers,
        totalViews,
      });

      try {
        const { data: aiPostsData } = await supabase
          .from('ai_generated_posts')
          .select('published_at')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(1)
          .maybeSingle<{ published_at: string }>();

        if (aiPostsData?.published_at) {
          setLastGeneratedAt(new Date(aiPostsData.published_at).toLocaleString());
        } else {
          setLastGeneratedAt(null);
        }
      } catch {
        setLastGeneratedAt(null);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAiPost = async () => {
    if (!session?.access_token) {
      setAiError('You need to be signed in to run this action.');
      return;
    }

    setShowConfirm(false);
    setIsGeneratingAi(true);
    setAiError('');
    setAiMessage('Generation started. The report is being created now without reloading the page.');

    try {
      const response = await fetch('/api/posts/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          'x-trigger-source': 'dashboard-admin',
          'x-user-role': userRole || 'user',
          'x-user-email': session.user?.email || '',
        },
        body: JSON.stringify({ source: 'dashboard-admin' }),
      });

      const result = await response.json();

      if (response.ok && (result.success || result.skipped)) {
        const message = result.skipped
          ? `Generation was skipped: ${result.reason || 'No new post needed.'}`
          : `Generation started successfully. ${result.post?.title ? `Created ${result.post.title}` : ''}`.trim();
        setAiMessage(message);
        setLastGeneratedAt(result.skipped ? lastGeneratedAt : 'Just now');
      } else {
        setAiError(result.error || 'AI generation failed.');
      }
    } catch (err) {
      setAiError('Unable to start AI generation right now.');
    } finally {
      setIsGeneratingAi(false);
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
      color: 'bg-violet-500',
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
          className="text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors"
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
                <p className="text-slate-800 dark:text-slate-200 text-sm font-semibold">
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

      <div className="mb-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Last AI post generated</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {lastGeneratedAt ? lastGeneratedAt : 'No AI post has been generated yet.'}
            </p>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Admin-only action
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Quick Start
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FaRobot className="text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-amber-900 dark:text-amber-300">
                Generate AI Post
              </h3>
            </div>
            <p className="text-sm text-slate-800 dark:text-slate-200 mb-3">
              Admin-only action to generate a new AI report post when needed.
            </p>
            {userRole === 'admin' ? (
              <>
                <button
                  onClick={() => {
                    setAiMessage('');
                    setAiError('');
                    setShowConfirm(true);
                  }}
                  disabled={isGeneratingAi}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isGeneratingAi ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Running...
                    </>
                  ) : (
                    'Run AI Generation'
                  )}
                </button>
                {showConfirm && (
                  <div className="mt-3 rounded-lg border border-amber-300 bg-white p-3 text-sm text-slate-700 dark:border-amber-700 dark:bg-slate-900 dark:text-slate-200">
                    <p className="mb-2 font-semibold">Are you sure you want to run AI generation?</p>
                    <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                      This uses paid AI/search credits, so only run it when you really need a new post.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleGenerateAiPost}
                        className="rounded bg-amber-600 px-3 py-1.5 text-white hover:bg-amber-700"
                      >
                        Yes, run it
                      </button>
                      <button
                        onClick={() => {
                          setShowConfirm(false);
                          setAiMessage('');
                          setAiError('');
                        }}
                        className="rounded border border-slate-300 px-3 py-1.5 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
                      >
                        No, keep it
                      </button>
                    </div>
                  </div>
                )}
                {aiMessage && <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-400">{aiMessage}</p>}
                {aiError && <p className="mt-3 text-sm text-red-700 dark:text-red-400">{aiError}</p>}
              </>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Only administrators can trigger this action.
              </p>
            )}
          </div>
          <a
            href="/dashboard/posts"
            className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
              Create New Post
            </h3>
            <p className="text-sm text-slate-800 dark:text-slate-200">
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
            <p className="text-sm text-slate-800 dark:text-slate-200">
              Manage blog post images and featured images
            </p>
          </a>

          <a
            href="/dashboard/users"
            className="p-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700 rounded-lg hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-violet-900 dark:text-violet-300 mb-2">
              Manage Users
            </h3>
            <p className="text-sm text-slate-800 dark:text-slate-200">
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
        <ul className="space-y-3 text-slate-800 dark:text-slate-200">
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
