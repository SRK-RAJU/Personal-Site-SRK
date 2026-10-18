'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { FaBook, FaImage, FaUsers, FaEye, FaArrowLeft, FaArrowRight, FaPenFancy, FaCloudUploadAlt, FaUserShield } from 'react-icons/fa';
import AIGenerationPanel, {
  GENERATION_TOOL_BATCH_SIZE,
  type AIGeneratedPostSummary,
  type CategoryCoverageSummary,
} from '@/components/AIGenerationPanel';

const COVERAGE_PREVIEW_COUNT = 12;
const MINUTES_BETWEEN_SCHEDULED_CALLS = 2;

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

// PostgREST returns at most 1000 rows per request, so tables that grow every week have to be read page by page.
async function fetchAllRows<T>(
  buildPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  const rows: T[] = [];
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await buildPage(from, from + pageSize - 1);
    if (error || !data || data.length === 0) break;
    rows.push(...data);
    if (data.length < pageSize) break;
  }

  return rows;
}

function buildCoverage(
  tools: Array<{ category: string; name: string; priority: number }>,
  publishedCounts: Record<string, number>
): CategoryCoverageSummary[] {
  const byCategory = new Map<string, Array<{ name: string; priority: number }>>();
  tools.forEach((tool) => {
    if (!byCategory.has(tool.category)) byCategory.set(tool.category, []);
    byCategory.get(tool.category)!.push({ name: tool.name, priority: tool.priority });
  });

  return Array.from(byCategory.entries())
    .map(([category, categoryTools]) => {
      // Same order the generator API uses (priority desc, then name) so the batches shown here are the batches it generates.
      const toolNames = [...categoryTools]
        .sort((a, b) => b.priority - a.priority || a.name.localeCompare(b.name))
        .map((tool) => tool.name);
      const toolCount = toolNames.length;
      const batchCount = Math.max(1, Math.ceil(toolCount / GENERATION_TOOL_BATCH_SIZE));
      const publishedCount = publishedCounts[category] || 0;
      const currentBatch = (publishedCount % batchCount) + 1;
      const nextBatch = batchCount === 1 ? 1 : (currentBatch % batchCount) + 1;
      const batches = Array.from({ length: batchCount }, (_, index) => {
        const start = index * GENERATION_TOOL_BATCH_SIZE;
        const batchTools = toolNames.slice(start, start + GENERATION_TOOL_BATCH_SIZE);
        return {
          batchNumber: index + 1,
          start: start + 1,
          end: start + batchTools.length,
          tools: batchTools,
        };
      });

      return { category, toolCount, batchCount, publishedCount, currentBatch, nextBatch, toolNames, batches };
    })
    .sort((a, b) => a.category.localeCompare(b.category));
}

export default function DashboardHome() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalImages: 0,
    totalUsers: 0,
    totalViews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string | null>(null);
  const [categoryCoverage, setCategoryCoverage] = useState<CategoryCoverageSummary[]>([]);
  const [aiGeneratedPosts, setAiGeneratedPosts] = useState<AIGeneratedPostSummary[]>([]);
  const [showAllCoverage, setShowAllCoverage] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      let totalPosts = 0;
      let totalViews = 0;
      let totalUsers = 0;
      let imagesCount = 0;
      const aiCategoryCounts: Record<string, number> = {};

      try {
        const { data: postsData } = await supabase
          .from('posts')
          .select('id, view_count', { count: 'exact' });

        const aiRows = await fetchAllRows<{ category: string | null; view_count: number | null }>((from, to) =>
          supabase
            .from('ai_generated_posts')
            .select('category, view_count')
            .eq('status', 'published')
            .order('id', { ascending: true })
            .range(from, to) as unknown as PromiseLike<{ data: Array<{ category: string | null; view_count: number | null }> | null; error: unknown }>
        );

        aiRows.forEach((row) => {
          const category = String(row.category || 'General').trim() || 'General';
          aiCategoryCounts[category] = (aiCategoryCounts[category] || 0) + 1;
        });

        totalPosts = (postsData?.length || 0) + aiRows.length;
        totalViews =
          (postsData || []).reduce((sum: number, post: any) => sum + (post.view_count || 0), 0) +
          aiRows.reduce((sum, post) => sum + (post.view_count || 0), 0);
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
        const coverageRows = await fetchAllRows<{ category: string | null; tool_name: string | null; priority: number | null }>(
          (from, to) =>
            supabase
              .from('tools_coverage_metadata')
              .select('category, tool_name, priority')
              .eq('is_active', true)
              .order('id', { ascending: true })
              .range(from, to) as unknown as PromiseLike<{
              data: Array<{ category: string | null; tool_name: string | null; priority: number | null }> | null;
              error: unknown;
            }>
        );

        const { data: recentPosts } = await supabase
          .from('ai_generated_posts')
          .select('id, title, slug, category, published_at, tools_covered')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(600);

        const tools = coverageRows
          .map((row) => ({
            category: String(row.category || 'General').trim() || 'General',
            name: String(row.tool_name || '').trim(),
            priority: Number(row.priority) || 0,
          }))
          .filter((tool) => tool.name);

        setAiGeneratedPosts(
          ((recentPosts as any[]) || []).map((item: any) => ({
            id: item.id,
            title: String(item.title || ''),
            slug: String(item.slug || ''),
            category: String(item.category || 'General').trim() || 'General',
            published_at: String(item.published_at || ''),
            tools_covered: Array.isArray(item.tools_covered) ? item.tools_covered.filter(Boolean) : [],
          }))
        );

        setCategoryCoverage(buildCoverage(tools, aiCategoryCounts));
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

  const statCards = [
    { label: 'Total Posts', value: stats.totalPosts, icon: FaBook },
    { label: 'Total Images', value: stats.totalImages, icon: FaImage },
    { label: 'Total Users', value: stats.totalUsers, icon: FaUsers },
    { label: 'Total Views', value: stats.totalViews, icon: FaEye },
  ];

  const totalBatches = categoryCoverage.reduce((sum, item) => sum + item.batchCount, 0);
  const sweepHours = Math.round(((totalBatches * MINUTES_BETWEEN_SCHEDULED_CALLS) / 60) * 10) / 10;
  const visibleCoverage = showAllCoverage ? categoryCoverage : categoryCoverage.slice(0, COVERAGE_PREVIEW_COUNT);

  const quickLinks = [
    { href: '/dashboard/posts', title: 'Create New Post', description: 'Write and publish a new blog post', icon: FaPenFancy },
    { href: '/dashboard/images', title: 'Upload Images', description: 'Manage blog post images and featured images', icon: FaCloudUploadAlt },
    { href: '/dashboard/users', title: 'Manage Users', description: 'View and manage registered users (admin only)', icon: FaUserShield },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-2 flex items-center gap-4">
        <button
          onClick={() => router.push('/')}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--line-strong)] text-[var(--fg-muted)] transition hover:border-[rgb(var(--accent-rgb)/0.5)] hover:text-[rgb(var(--fg-rgb))]"
          aria-label="Back to the website"
        >
          <FaArrowLeft />
        </button>
        <div>
          <p className="eyebrow">Control center</p>
          <h1 className="dashboard-title mt-1">Admin dashboard</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="dashboard-card !p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-[var(--fg-subtle)]">{card.label}</p>
                  <p className="mt-2 font-display text-3xl font-bold tracking-tight">{loading ? '–' : card.value.toLocaleString()}</p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[rgb(var(--accent-rgb)/0.3)] bg-[rgb(var(--accent-rgb)/0.1)] text-lg text-[rgb(var(--accent-rgb))]">
                  <Icon />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-card !p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Last AI post generated</p>
            <p className="text-sm text-[var(--fg-muted)]">{lastGeneratedAt ? lastGeneratedAt : 'No AI post has been generated yet.'}</p>
          </div>
          <span className="futurist-pill">Weekly scheduler</span>
        </div>
      </div>

      <AIGenerationPanel
        categoryCoverage={categoryCoverage}
        aiGeneratedPosts={aiGeneratedPosts}
        coverageLoading={loading}
        onGenerated={fetchStats}
      />

      <section className="dashboard-card" aria-labelledby="coverage-title">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="coverage-title" className="font-display text-xl font-bold sm:text-2xl">
              Category coverage
            </h2>
            <p className="mt-1 text-sm text-[var(--fg-muted)]">Tools per category and how many {GENERATION_TOOL_BATCH_SIZE}-tool batches each one needs.</p>
          </div>
          {categoryCoverage.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="badge">{categoryCoverage.length} categories</span>
              <span className="badge">{totalBatches} batches</span>
              <span className="badge-secondary">full sweep ≈ {sweepHours} h at {MINUTES_BETWEEN_SCHEDULED_CALLS}-min spacing</span>
            </div>
          )}
        </div>

        {categoryCoverage.length === 0 ? (
          <p className="text-sm text-[var(--fg-muted)]">{loading ? 'Loading coverage…' : 'No active tools found.'}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {visibleCoverage.map((item) => (
                <div key={item.category} className="rounded-xl border border-[var(--line)] bg-[rgb(var(--fg-rgb)/0.03)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold" title={item.category}>
                        {item.category}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--fg-muted)]">{item.toolCount} tools · {item.publishedCount} published</p>
                      <p className="mt-1 text-xs text-[var(--fg-subtle)]">
                        Current batch {item.currentBatch}/{item.batchCount} · next {item.nextBatch}/{item.batchCount}
                      </p>
                    </div>
                    <span className="futurist-pill shrink-0">{item.batchCount} batches</span>
                  </div>
                </div>
              ))}
            </div>
            {categoryCoverage.length > COVERAGE_PREVIEW_COUNT && (
              <button
                type="button"
                onClick={() => setShowAllCoverage((value) => !value)}
                className="btn-secondary mt-4 !text-sm"
                aria-expanded={showAllCoverage}
              >
                {showAllCoverage ? 'Show fewer categories' : `Show all ${categoryCoverage.length} categories`}
              </button>
            )}
          </>
        )}
      </section>

      <section aria-labelledby="quick-links-title">
        <h2 id="quick-links-title" className="mb-4 font-display text-xl font-bold sm:text-2xl">
          Quick actions
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href} className="futurist-card group">
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-[rgb(var(--accent2-rgb)/0.4)] bg-[rgb(var(--accent2-rgb)/0.12)] text-lg text-[rgb(var(--accent-rgb))]">
                  <Icon />
                </span>
                <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
                  {link.title}
                  <FaArrowRight className="text-xs opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" />
                </h3>
                <p className="mt-1 text-sm text-[var(--fg-muted)]">{link.description}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="dashboard-card">
        <h3 className="mb-3 font-display text-lg font-semibold">Quick tips</h3>
        <ul className="grid gap-2 text-sm text-[var(--fg-muted)] md:grid-cols-2">
          <li>✓ Always save drafts before publishing</li>
          <li>✓ Use descriptive post titles and slugs for better SEO</li>
          <li>✓ Optimize images before uploading (recommended: max 2MB per image)</li>
          <li>✓ Set featured images for better social sharing</li>
          <li>✓ Add relevant tags to help users discover your posts</li>
        </ul>
      </section>
    </div>
  );
}
