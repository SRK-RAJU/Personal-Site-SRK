'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { FaBook, FaImage, FaUsers, FaEye, FaArrowLeft, FaRobot } from 'react-icons/fa';
import { useAuth } from '@/lib/authContext';

function getCategoryPromptDetails(category: string) {
  const normalized = (category || 'General').toLowerCase();

  if (normalized.includes('security') || normalized.includes('sec')) {
    return {
      title: 'Security Report',
      focus: 'vulnerabilities, CVEs, security incidents, patches, and risk mitigation',
      guidance: 'Prioritize security advisories, active CVEs, incident analysis, exploit trends, patch guidance, and vulnerability management updates.',
    };
  }

  if (normalized.includes('ai') || normalized.includes('ml')) {
    return {
      title: 'AI/ML Report',
      focus: 'AI model updates, generative AI releases, research advances, and product implications',
      guidance: 'Prioritize new model releases, AI feature updates, research breakthroughs, developer adoption, and enterprise impacts.',
    };
  }

  if (normalized.includes('cloud')) {
    return {
      title: 'Cloud Report',
      focus: 'cloud service updates, region expansions, pricing changes, and migration guidance',
      guidance: 'Prioritize cloud platform releases, service improvements, pricing changes, migration notes, and operational impacts.',
    };
  }

  if (normalized.includes('devops') || normalized.includes('ops') || normalized.includes('delivery')) {
    return {
      title: 'DevOps Report',
      focus: 'release pipelines, automation, deployments, issue resolution, bug fixes, and observability updates',
      guidance: 'Prioritize operational incidents, deployment workflows, tooling updates, bug fix summaries, and stability improvements.',
    };
  }

  return {
    title: `${category} Report`,
    focus: 'category-specific releases, bug fixes, issues, and updates',
    guidance: 'Prioritize news that is directly relevant to the selected category and avoid unrelated topics.',
  };
}

const GENERATION_TOOL_BATCH_SIZE = 4;

interface CoverageBatch {
  batchNumber: number;
  start: number;
  end: number;
  tools: string[];
}

interface CategoryCoverageSummary {
  category: string;
  toolCount: number;
  batchCount: number;
  publishedCount: number;
  currentBatch: number;
  nextBatch: number;
  toolNames: string[];
  batches: CoverageBatch[];
}

interface AIGeneratedPostSummary {
  id: number | string;
  title: string;
  slug: string;
  category: string;
  published_at: string;
  tools_covered: string[];
}

async function countStorageFiles(bucket: string, prefix: string = ''): Promise<number> {
  let total = 0;
  let offset = 0;
  const pageSize = 100;

  while (true) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(prefix, { limit: pageSize, offset });

    if (error || !data || data.length === 0) {
      break;
    }

    for (const item of data as any[]) {
      const name = item?.name || '';
      if (!name || name === '.emptyFolderPlaceholder') {
        continue;
      }

      if (item?.id) {
        total += 1;
        continue;
      }

      const nestedPrefix = prefix ? `${prefix}/${name}` : name;
      total += await countStorageFiles(bucket, nestedPrefix);
    }

    if (data.length < pageSize) {
      break;
    }

    offset += pageSize;
  }

  return total;
}

export default function DashboardHome() {
  const router = useRouter();
  const { session, user, userRole } = useAuth();
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
  const [selectedCategory, setSelectedCategory] = useState('AI/ML');
  const [generateMode, setGenerateMode] = useState<'single' | 'all'>('single');
  const [categoryCursor, setCategoryCursor] = useState(0);
  const [promptDetails, setPromptDetails] = useState<{ title: string; focus: string; guidance: string } | null>(null);
  const [promptDetailsByCategory, setPromptDetailsByCategory] = useState<Array<{ category: string; title: string; focus: string; guidance: string }>>([]);
  const [categoryStatuses, setCategoryStatuses] = useState<Array<{ category: string; saved?: boolean; skipped?: boolean; reason?: string; title?: string; slug?: string }>>([]);
  const [categoryCoverage, setCategoryCoverage] = useState<CategoryCoverageSummary[]>([]);
  const [aiGeneratedPosts, setAiGeneratedPosts] = useState<AIGeneratedPostSummary[]>([]);
  const [batchOverride, setBatchOverride] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      let totalPosts = 0;
      let totalViews = 0;
      let totalUsers = 0;
      let imagesCount = 0;

      try {
        const { data: postsData } = await supabase
          .from('posts')
          .select('id, view_count', { count: 'exact' });

        const { data: aiPostsData } = await supabase
          .from('ai_generated_posts')
          .select('id, view_count')
          .eq('status', 'published');

        totalPosts = (postsData?.length || 0) + (aiPostsData?.length || 0);
        totalViews =
          (postsData || []).reduce((sum: number, post: any) => sum + (post.view_count || 0), 0) +
          (aiPostsData || []).reduce((sum: number, post: any) => sum + (post.view_count || 0), 0);
      } catch {
        totalPosts = 0;
        totalViews = 0;
      }

      try {
        const [uploadsCount, blogImagesCount] = await Promise.all([
          countStorageFiles('uploads'),
          countStorageFiles('blog-images'),
        ]);
        imagesCount = uploadsCount + blogImagesCount;
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
        const { data: coverageData } = await supabase
          .from('tools_coverage_metadata')
          .select('category, tool_name')
          .eq('is_active', true);

        const { data: publishedCategoryData } = await supabase
          .from('ai_generated_posts')
          .select('id, title, slug, category, published_at, tools_covered')
          .eq('status', 'published')
          .order('published_at', { ascending: false });

        const coverageTools = (coverageData || []).reduce((acc: Record<string, string[]>, item: any) => {
          const category = String(item.category || 'General').trim() || 'General';
          const toolName = String(item.tool_name || '').trim();
          if (!toolName) return acc;
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(toolName);
          return acc;
        }, {});

        const publishedCounts = (publishedCategoryData || []).reduce((acc: Record<string, number>, item: any) => {
          const category = String(item.category || 'General').trim() || 'General';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {});

        setAiGeneratedPosts(
          (publishedCategoryData || []).map((item: any) => ({
            id: item.id,
            title: String(item.title || ''),
            slug: String(item.slug || ''),
            category: String(item.category || 'General').trim() || 'General',
            published_at: String(item.published_at || ''),
            tools_covered: Array.isArray(item.tools_covered) ? item.tools_covered.filter(Boolean) : [],
          }))
        );

        setCategoryCoverage(
          Object.entries(coverageTools)
            .map(([category, toolNames]) => {
              const normalizedToolNames = [...toolNames].sort((a, b) => a.localeCompare(b));
              const toolCount = normalizedToolNames.length;
              const batchCount = Math.max(1, Math.ceil(toolCount / GENERATION_TOOL_BATCH_SIZE));
              const publishedCount = publishedCounts[category] || 0;
              const currentBatch = (publishedCount % batchCount) + 1;
              const nextBatch = batchCount === 1 ? 1 : (currentBatch % batchCount) + 1;
              const batches = Array.from({ length: batchCount }, (_, index) => {
                const start = index * GENERATION_TOOL_BATCH_SIZE;
                const tools = normalizedToolNames.slice(start, start + GENERATION_TOOL_BATCH_SIZE);
                return {
                  batchNumber: index + 1,
                  start: start + 1,
                  end: start + tools.length,
                  tools,
                };
              });

              return {
                category,
                toolCount,
                batchCount,
                publishedCount,
                currentBatch,
                nextBatch,
                toolNames: normalizedToolNames,
                batches,
              };
            })
            .sort((a, b) => a.category.localeCompare(b.category))
        );
      } catch {
        setCategoryCoverage([]);
        setAiGeneratedPosts([]);
      }

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
  }, []);

  useEffect(() => {
    // Only fetch dashboard data on load. Generation is never triggered automatically.
    fetchStats();
  }, [fetchStats]);

  const categoryOptions = [
    'AI/ML',
    'Cloud',
    'Security',
    'Infrastructure',
    'Container',
    'Delivery',
    'Observability',
    'Database',
    'Data',
    'Networking',
    'Identity',
    'Developer',
    'Operations',
    'ERP',
    'CRM',
    'Marketing',
    'HR',
  ];

  const nextCategory = categoryOptions[categoryCursor % categoryOptions.length];
  const selectedCoverage = categoryCoverage.find((item) => item.category === selectedCategory);
  const selectedBatchCount = selectedCoverage?.batchCount || 1;
  const parsedBatchOverride = Number(batchOverride);
  const effectiveBatchNumber = Number.isFinite(parsedBatchOverride) && parsedBatchOverride > 0
    ? Math.min(Math.floor(parsedBatchOverride), selectedBatchCount)
    : selectedCoverage?.nextBatch || 1;
  const effectiveBatch = selectedCoverage?.batches.find((batch) => batch.batchNumber === effectiveBatchNumber) || null;
  const selectedBatchOptions = selectedCoverage?.batches || [];
  const previousBatchPosts = useMemo(() => {
    if (!selectedCoverage || !effectiveBatch) return [];

    const batchToolSet = new Set(effectiveBatch.tools.map((tool) => tool.toLowerCase()));
    return aiGeneratedPosts
      .filter((post) => post.category === selectedCoverage.category)
      .map((post) => {
        const matchedTools = post.tools_covered.filter((tool) => batchToolSet.has(String(tool).toLowerCase()));
        return {
          ...post,
          matchedTools,
          matchedCount: matchedTools.length,
        };
      })
      .filter((post) => post.matchedCount > 0)
      .sort((a, b) => {
        if (b.matchedCount !== a.matchedCount) return b.matchedCount - a.matchedCount;
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      })
      .slice(0, 5);
  }, [aiGeneratedPosts, effectiveBatch, selectedCoverage]);

  const handleGenerateAiPost = async (categoryOverride?: string) => {
    if (!session?.access_token) {
      setAiError('You need to be signed in to run this action.');
      return;
    }

    const effectiveCategory = categoryOverride || selectedCategory;
    const parsedBatch = Number(batchOverride);
    const batch = Number.isFinite(parsedBatch) && parsedBatch > 0 ? Math.floor(parsedBatch) : undefined;

    setShowConfirm(false);
    setIsGeneratingAi(true);
    setAiError('');
    setAiMessage(generateMode === 'all' ? 'Starting category-based generation for all available categories...' : `Starting generation for ${effectiveCategory}...`);
    setPromptDetails(null);
    setPromptDetailsByCategory([]);
    setCategoryStatuses([]);

    try {
      const response = await fetch('/api/posts/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          'x-trigger-source': 'dashboard-admin',
          'x-user-email': user?.email || '',
          'x-user-role': userRole || '',
          'x-admin-email': user?.email || '',
          'x-admin-role': userRole === 'admin' ? 'admin' : '',
        },
        body: JSON.stringify({
          source: 'dashboard-admin',
          mode: generateMode === 'all' ? 'all-categories' : 'single-category',
          category: effectiveCategory,
          batch,
        }),
      });

      const result = await response.json();

      if (response.ok && (result.success || result.skipped)) {
        const message = result.skipped
          ? `Generation was skipped: ${result.reason || 'No new post needed.'}`
          : generateMode === 'all'
            ? `Generated ${result.generated?.filter((item: any) => item.post)?.length || 0} category posts.`
            : `Generation completed for ${result.category || effectiveCategory}.`;

        setAiMessage(message);
        setLastGeneratedAt(result.skipped ? lastGeneratedAt : 'Just now');
        setCategoryCursor((value) => value + 1);

        if (result.mode === 'all-categories') {
          setPromptDetailsByCategory(result.prompt_details_by_category || []);
          setCategoryStatuses(result.generated || []);
        } else {
          setPromptDetails(result.category_prompt_details || null);
          setCategoryStatuses([{ category: result.category || effectiveCategory, saved: !result.skipped, skipped: result.skipped, reason: result.reason || (result.post ? 'Generated successfully.' : 'No details'), title: result.post?.title, slug: result.post?.slug }]);
        }
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
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push('/')}
          className="text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <FaArrowLeft size={24} />
        </button>
        <h1 className="dashboard-title">
          Welcome to Admin Dashboard
        </h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="dashboard-card">
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

      <div className="dashboard-card mb-8 p-4">
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

      {/* Category Coverage */}
      <div className="dashboard-card mb-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Category Coverage</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Tool count per category and how many 4-tool batches each category needs.</p>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">Batch size: {GENERATION_TOOL_BATCH_SIZE}</div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {categoryCoverage.map((item) => (
            <div key={item.category} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/70">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{item.category}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{item.toolCount} tools total</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Current batch: {item.currentBatch}/{item.batchCount} • Next batch: {item.nextBatch}/{item.batchCount}
                  </p>
                </div>
                <span className="futurist-pill">{item.batchCount} batches</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-card">
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
              Admin-only action to generate a new AI report post for one category or all categories.
            </p>
            {userRole === 'admin' ? (
              <>
                <div className="mb-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => setGenerateMode('single')}
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold ${generateMode === 'single' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}
                  >
                    Single category
                  </button>
                  <button
                    onClick={() => setGenerateMode('all')}
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold ${generateMode === 'all' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}
                  >
                    All categories
                  </button>
                </div>
                {generateMode === 'single' && (
                  <div className="space-y-3">
                    <select
                      value={selectedCategory}
                      onChange={(event) => setSelectedCategory(event.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                      {categoryOptions.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    <select
                      value={batchOverride}
                      onChange={(event) => setBatchOverride(event.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                      <option value="">Auto-rotate next batch</option>
                      {selectedBatchOptions.map((batch) => (
                        <option key={batch.batchNumber} value={String(batch.batchNumber)}>
                          Batch {batch.batchNumber} of {selectedBatchCount} • tools {batch.start}-{batch.end}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Leave blank to auto-rotate batches. Select a batch to force that 4-tool chunk for the chosen category.
                    </p>
                    {selectedCoverage ? (
                      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                        <p>Tools: {selectedCoverage.toolCount} | Published: {selectedCoverage.publishedCount}</p>
                        <p>Current batch: {selectedCoverage.currentBatch}/{selectedCoverage.batchCount} | Next batch: {selectedCoverage.nextBatch}/{selectedCoverage.batchCount}</p>
                        {effectiveBatch ? (
                          <>
                            <p>Selected batch: {effectiveBatch.batchNumber}/{selectedCoverage.batchCount} | Tool range: {effectiveBatch.start}-{effectiveBatch.end}</p>
                            <p className="mt-1">Tools in batch: {effectiveBatch.tools.join(', ')}</p>
                          </>
                        ) : null}
                      </div>
                    ) : null}
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                        Previous posts for this batch
                      </p>
                      {previousBatchPosts.length > 0 ? (
                        <div className="mt-2 space-y-2">
                          {previousBatchPosts.map((post) => (
                            <a
                              key={post.id}
                              href={`/blog/${post.slug}`}
                              className="block rounded-lg border border-slate-200 bg-white p-3 hover:border-amber-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900"
                            >
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">{post.title}</p>
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {new Date(post.published_at).toLocaleString()} • matched tools: {post.matchedTools.join(', ')}
                              </p>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          No previous AI posts matched this category batch yet.
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={() => {
                      if (isGeneratingAi) return;
                      setShowConfirm(true);
                    }}
                    disabled={isGeneratingAi}
                    className="flex-1 items-center justify-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isGeneratingAi ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mx-auto" />
                    ) : generateMode === 'all' ? (
                      'Generate all categories'
                    ) : (
                      `Generate ${selectedCategory}`
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (isGeneratingAi) return;
                      setGenerateMode('single');
                      setSelectedCategory(nextCategory);
                      setShowConfirm(true);
                    }}
                    disabled={isGeneratingAi}
                    className="flex-1 rounded-lg border border-amber-400 bg-white px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-900 dark:text-amber-300"
                  >
                    {isGeneratingAi ? 'Working…' : `Generate next: ${nextCategory}`}
                  </button>
                </div>
                {showConfirm && (
                  <div className="mt-3 rounded-lg border border-amber-300 bg-white p-3 text-sm text-slate-700 dark:border-amber-700 dark:bg-slate-900 dark:text-slate-200">
                    <p className="mb-2 font-semibold">
                      {generateMode === 'all'
                        ? 'Generate AI posts for all categories?'
                        : `Generate the ${selectedCategory} post now?`}
                    </p>
                    <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                      This uses paid AI/search credits, so only continue when you really want a new post.
                    </p>
                    {generateMode === 'single' && (
                      <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                          Selected category prompt
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                          {getCategoryPromptDetails(selectedCategory).title}
                        </p>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                          Focus: {getCategoryPromptDetails(selectedCategory).focus}
                        </p>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                          Guidance: {getCategoryPromptDetails(selectedCategory).guidance}
                        </p>
                      </div>
                    )}
                    {generateMode === 'all' && (
                      <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                          All-categories generation
                        </p>
                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                          Each category will be generated with its own specific prompt. The system will avoid mixing unrelated category topics in a single post.
                        </p>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          if (generateMode === 'all') {
                            void handleGenerateAiPost();
                          } else {
                            void handleGenerateAiPost(selectedCategory);
                          }
                        }}
                        className="rounded bg-amber-600 px-3 py-1.5 text-white hover:bg-amber-700"
                      >
                        Yes, generate it
                      </button>
                      <button
                        onClick={() => {
                          setShowConfirm(false);
                          setAiMessage('');
                          setAiError('');
                        }}
                        className="rounded border border-slate-300 px-3 py-1.5 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                {aiMessage && <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-400">{aiMessage}</p>}
                {aiError && <p className="mt-3 text-sm text-red-700 dark:text-red-400">{aiError}</p>}
                {promptDetails && (
                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    <h4 className="font-semibold mb-2">Category prompt details</h4>
                    <p className="text-sm"><span className="font-semibold">Title focus:</span> {promptDetails.title}</p>
                    <p className="text-sm mt-1"><span className="font-semibold">Focus:</span> {promptDetails.focus}</p>
                    <p className="text-sm mt-1"><span className="font-semibold">Guidance:</span> {promptDetails.guidance}</p>
                  </div>
                )}
                {promptDetailsByCategory.length > 0 && (
                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    <h4 className="font-semibold mb-2">Category prompt details</h4>
                    <div className="space-y-3">
                      {promptDetailsByCategory.map((detail) => (
                        <div key={detail.category} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                          <p className="text-sm font-semibold">{detail.category}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400"><span className="font-semibold">Title focus:</span> {detail.title}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1"><span className="font-semibold">Focus:</span> {detail.focus}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1"><span className="font-semibold">Guidance:</span> {detail.guidance}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {categoryStatuses.length > 0 && (
                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    <h4 className="font-semibold mb-2">Generation status</h4>
                    <ul className="space-y-2 text-sm">
                      {categoryStatuses.map((status) => (
                        <li key={status.category} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                          <p className="font-semibold">{status.category}</p>
                          <p>{status.skipped ? 'Skipped' : status.saved ? 'Saved' : 'Failed'}</p>
                          {status.reason && <p className="text-xs text-slate-500 dark:text-slate-400">{status.reason}</p>}
                          {status.title && <p className="text-xs text-slate-500 dark:text-slate-400">Post: {status.title}</p>}
                          {status.slug && <p className="text-xs text-slate-500 dark:text-slate-400">Slug: {status.slug}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
