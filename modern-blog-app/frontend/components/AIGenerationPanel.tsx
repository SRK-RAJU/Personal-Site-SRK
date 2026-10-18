'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FaRobot,
  FaPlay,
  FaStop,
  FaForward,
  FaCheckCircle,
  FaExclamationTriangle,
  FaMinusCircle,
  FaLayerGroup,
} from 'react-icons/fa';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/authContext';

// Must match DEFAULT_TOOL_BATCH_SIZE / MAX_GENERATION_TOOLS in app/api/posts/ai/generate/route.ts.
export const GENERATION_TOOL_BATCH_SIZE = 4;

// Rough duration of one generation call (search + AI + save); used only for the time estimate.
const ESTIMATED_SECONDS_PER_CALL = 25;
const PAUSE_BETWEEN_CALLS_MS = 1500;
const TOKEN_REFRESH_EVERY_CALLS = 15;

export interface CoverageBatch {
  batchNumber: number;
  start: number;
  end: number;
  tools: string[];
}

export interface CategoryCoverageSummary {
  category: string;
  toolCount: number;
  batchCount: number;
  publishedCount: number;
  currentBatch: number;
  nextBatch: number;
  toolNames: string[];
  batches: CoverageBatch[];
}

export interface AIGeneratedPostSummary {
  id: number | string;
  title: string;
  slug: string;
  category: string;
  published_at: string;
  tools_covered: string[];
}

interface PromptDetails {
  title: string;
  focus: string;
  guidance: string;
}

export interface BulkEntry {
  key: string;
  category: string;
  batch: number | null;
  status: 'saved' | 'skipped' | 'failed';
  message: string;
  title?: string;
}

export interface BulkProgress {
  running: boolean;
  stopped: boolean;
  total: number;
  done: number;
  saved: number;
  skipped: number;
  failed: number;
  current: string;
  entries: BulkEntry[];
}

type GenerateMode = 'single' | 'all';

function getCategoryPromptDetails(category: string): PromptDetails {
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

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

interface InterpretedResult {
  status: 'saved' | 'skipped' | 'failed';
  message: string;
  title?: string;
}

function interpretResult(response: Response, result: any): InterpretedResult {
  if (!response.ok) {
    return { status: 'failed', message: result?.error || result?.message || `Request failed (HTTP ${response.status})` };
  }
  // The single-run API answers 200 + warning when the post was generated but could not be saved.
  if (result?.warning) {
    return { status: 'failed', message: String(result.warning) };
  }
  if (result?.skipped) {
    return { status: 'skipped', message: result.reason || 'Skipped' };
  }
  if (result?.success) {
    const title = result.post?.title || result.generated?.find((item: any) => item?.post)?.post?.title;
    return { status: 'saved', message: 'Saved', title };
  }
  return { status: 'failed', message: result?.error || 'Unexpected response from the generator' };
}

export interface GenerationController {
  isAdmin: boolean;
  generateMode: GenerateMode;
  setGenerateMode: (mode: GenerateMode) => void;
  categoryOptions: string[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  batchOverride: string;
  setBatchOverride: (value: string) => void;
  selectedCoverage: CategoryCoverageSummary | null;
  effectiveBatchNumber: number;
  effectiveBatch: CoverageBatch | null;
  previousBatchPosts: Array<AIGeneratedPostSummary & { matchedTools: string[]; matchedCount: number }>;
  nextCategory: string;
  includeAllBatches: boolean;
  setIncludeAllBatches: (value: boolean) => void;
  bulkJobCount: number;
  bulkMinutes: number;
  showConfirm: boolean;
  openConfirm: () => void;
  cancelConfirm: () => void;
  confirmGenerate: () => void;
  generateNext: () => void;
  isGenerating: boolean;
  message: string;
  error: string;
  promptDetails: PromptDetails | null;
  bulk: BulkProgress | null;
  stopBulk: () => void;
  getPromptDetails: (category: string) => PromptDetails;
  coverageLoading: boolean;
}

interface ControllerProps {
  categoryCoverage: CategoryCoverageSummary[];
  aiGeneratedPosts: AIGeneratedPostSummary[];
  coverageLoading?: boolean;
  onGenerated?: () => void | Promise<void>;
}

function useGenerationController({
  categoryCoverage,
  aiGeneratedPosts,
  coverageLoading = false,
  onGenerated,
}: ControllerProps): GenerationController {
  const { session, user, userRole } = useAuth();
  const isAdmin = userRole === 'admin';

  const [generateMode, setGenerateModeState] = useState<GenerateMode>('single');
  const [selectedCategory, setSelectedCategoryState] = useState('');
  const [batchOverride, setBatchOverride] = useState('');
  const [includeAllBatches, setIncludeAllBatches] = useState(false);
  const [categoryCursor, setCategoryCursor] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [promptDetails, setPromptDetails] = useState<PromptDetails | null>(null);
  const [bulk, setBulk] = useState<BulkProgress | null>(null);
  const stopRequested = useRef(false);

  // Category names must match tools_coverage_metadata.category exactly, so they always come from the database.
  const categoryOptions = useMemo(() => categoryCoverage.map((item) => item.category), [categoryCoverage]);

  useEffect(() => {
    if (categoryOptions.length > 0 && !categoryOptions.includes(selectedCategory)) {
      setSelectedCategoryState(categoryOptions[0]);
    }
  }, [categoryOptions, selectedCategory]);

  const setSelectedCategory = useCallback((category: string) => {
    setSelectedCategoryState(category);
    setBatchOverride('');
  }, []);

  const setGenerateMode = useCallback((mode: GenerateMode) => {
    setGenerateModeState(mode);
    setShowConfirm(false);
  }, []);

  const selectedCoverage = useMemo(
    () => categoryCoverage.find((item) => item.category === selectedCategory) || null,
    [categoryCoverage, selectedCategory]
  );
  const selectedBatchCount = selectedCoverage?.batchCount || 1;
  const parsedBatchOverride = Number(batchOverride);
  const hasBatchOverride = Number.isFinite(parsedBatchOverride) && parsedBatchOverride > 0;
  const effectiveBatchNumber = hasBatchOverride
    ? Math.min(Math.floor(parsedBatchOverride), selectedBatchCount)
    : selectedCoverage?.nextBatch || 1;
  const effectiveBatch = selectedCoverage?.batches.find((batch) => batch.batchNumber === effectiveBatchNumber) || null;

  const previousBatchPosts = useMemo(() => {
    if (!selectedCoverage || !effectiveBatch) return [];

    const batchToolSet = new Set(effectiveBatch.tools.map((tool) => tool.toLowerCase()));
    return aiGeneratedPosts
      .filter((post) => post.category === selectedCoverage.category)
      .map((post) => {
        const matchedTools = post.tools_covered.filter((tool) => batchToolSet.has(String(tool).toLowerCase()));
        return { ...post, matchedTools, matchedCount: matchedTools.length };
      })
      .filter((post) => post.matchedCount > 0)
      .sort((a, b) => {
        if (b.matchedCount !== a.matchedCount) return b.matchedCount - a.matchedCount;
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      })
      .slice(0, 5);
  }, [aiGeneratedPosts, effectiveBatch, selectedCoverage]);

  const nextCategory = categoryOptions.length > 0 ? categoryOptions[categoryCursor % categoryOptions.length] : '';

  const bulkJobCount = useMemo(
    () => categoryCoverage.reduce((sum, item) => sum + (includeAllBatches ? item.batchCount : 1), 0),
    [categoryCoverage, includeAllBatches]
  );
  const bulkMinutes = Math.max(1, Math.round((bulkJobCount * ESTIMATED_SECONDS_PER_CALL) / 60));

  const getFreshToken = useCallback(async (): Promise<string | null> => {
    // Re-fetch the session right before calling the API: the React state token can be a stale snapshot.
    const { data, error: refreshError } = await supabase.auth.refreshSession();
    const token = data?.session?.access_token;
    return refreshError || !token ? null : token;
  }, []);

  const callGenerate = useCallback(
    async (accessToken: string, body: Record<string, unknown>) => {
      const response = await fetch('/api/posts/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'x-trigger-source': 'dashboard-admin',
          'x-user-email': user?.email || '',
          'x-user-role': userRole || '',
          'x-admin-email': user?.email || '',
          'x-admin-role': userRole === 'admin' ? 'admin' : '',
        },
        body: JSON.stringify({ source: 'dashboard-admin', mode: 'single-category', ...body }),
      });
      const result = await response.json().catch(() => ({}));
      return { response, result };
    },
    [user?.email, userRole]
  );

  const runSingle = useCallback(
    async (category: string) => {
      if (!session?.access_token) {
        setError('You need to be signed in to run this action.');
        return;
      }
      if (!category) {
        setError('Select a category first.');
        return;
      }

      const token = await getFreshToken();
      if (!token) {
        setError('Your session has expired. Please sign in again and retry.');
        return;
      }

      // The batch selector can hold a number from another category; never send one that is out of range.
      const coverage = categoryCoverage.find((item) => item.category === category);
      const maxBatch = coverage?.batchCount || 1;
      const batch = hasBatchOverride ? Math.min(Math.floor(parsedBatchOverride), maxBatch) : undefined;

      setShowConfirm(false);
      setIsGenerating(true);
      setError('');
      setPromptDetails(null);
      setMessage(`Starting generation for ${category}${batch ? ` (batch ${batch})` : ''}...`);

      try {
        const { response, result } = await callGenerate(token, { category, batch });
        const outcome = interpretResult(response, result);

        if (outcome.status === 'failed') {
          setError(outcome.message);
          setMessage('');
          return;
        }

        setMessage(
          outcome.status === 'skipped'
            ? `Generation was skipped: ${outcome.message}`
            : `Generation completed for ${result.category || category}${outcome.title ? `: "${outcome.title}"` : '.'}`
        );
        setPromptDetails(result.category_prompt_details || null);
        setCategoryCursor((value) => value + 1);
        await onGenerated?.();
      } catch {
        setError('Unable to start AI generation right now.');
        setMessage('');
      } finally {
        setIsGenerating(false);
      }
    },
    [session?.access_token, getFreshToken, categoryCoverage, hasBatchOverride, parsedBatchOverride, callGenerate, onGenerated]
  );

  const runBulk = useCallback(async () => {
    if (!session?.access_token) {
      setError('You need to be signed in to run this action.');
      return;
    }

    const jobs = categoryCoverage.flatMap((item) =>
      includeAllBatches
        ? item.batches.map((batch) => ({ category: item.category, batch: batch.batchNumber as number | null }))
        : [{ category: item.category, batch: null as number | null }]
    );

    if (jobs.length === 0) {
      setError('No categories with active tools were found.');
      return;
    }

    let token = await getFreshToken();
    if (!token) {
      setError('Your session has expired. Please sign in again and retry.');
      return;
    }

    stopRequested.current = false;
    setShowConfirm(false);
    setIsGenerating(true);
    setError('');
    setMessage('');
    setPromptDetails(null);

    const progress: BulkProgress = {
      running: true,
      stopped: false,
      total: jobs.length,
      done: 0,
      saved: 0,
      skipped: 0,
      failed: 0,
      current: '',
      entries: [],
    };
    setBulk({ ...progress });

    let abortedMessage = '';

    for (let index = 0; index < jobs.length; index += 1) {
      if (stopRequested.current) break;

      const job = jobs[index];
      progress.current = `${job.category}${job.batch ? ` · batch ${job.batch}` : ''}`;
      setBulk({ ...progress, entries: [...progress.entries] });

      if (index > 0 && index % TOKEN_REFRESH_EVERY_CALLS === 0) {
        const refreshed = await getFreshToken();
        if (refreshed) token = refreshed;
      }

      let outcome: InterpretedResult;
      try {
        let { response, result } = await callGenerate(token as string, { category: job.category, batch: job.batch ?? undefined });

        if (response.status === 401) {
          const refreshed = await getFreshToken();
          if (refreshed) {
            token = refreshed;
            ({ response, result } = await callGenerate(token, { category: job.category, batch: job.batch ?? undefined }));
          }
        }

        outcome = interpretResult(response, result);
        if (response.status === 401) {
          abortedMessage = 'Stopped: the server rejected the admin session. Sign in again and retry.';
        }
      } catch {
        outcome = { status: 'failed', message: 'Network error' };
      }

      progress.done += 1;
      progress[outcome.status] += 1;
      progress.entries.push({
        key: `${job.category}#${job.batch ?? 'auto'}#${index}`,
        category: job.category,
        batch: job.batch,
        status: outcome.status,
        message: outcome.message,
        title: outcome.title,
      });
      setBulk({ ...progress, entries: [...progress.entries] });

      if (abortedMessage) break;
      if (index < jobs.length - 1 && !stopRequested.current) {
        await sleep(PAUSE_BETWEEN_CALLS_MS);
      }
    }

    progress.running = false;
    progress.stopped = stopRequested.current || Boolean(abortedMessage);
    progress.current = '';
    setBulk({ ...progress, entries: [...progress.entries] });

    if (abortedMessage) {
      setError(abortedMessage);
    } else {
      setMessage(
        `${progress.stopped ? 'Stopped' : 'Finished'}: ${progress.saved} saved, ${progress.skipped} skipped, ${progress.failed} failed (${progress.done}/${progress.total} calls).`
      );
    }

    setIsGenerating(false);
    await onGenerated?.();
  }, [session?.access_token, categoryCoverage, includeAllBatches, getFreshToken, callGenerate, onGenerated]);

  const confirmGenerate = useCallback(() => {
    if (generateMode === 'all') {
      void runBulk();
    } else {
      void runSingle(selectedCategory);
    }
  }, [generateMode, runBulk, runSingle, selectedCategory]);

  return {
    isAdmin,
    generateMode,
    setGenerateMode,
    categoryOptions,
    selectedCategory,
    setSelectedCategory,
    batchOverride,
    setBatchOverride,
    selectedCoverage,
    effectiveBatchNumber,
    effectiveBatch,
    previousBatchPosts,
    nextCategory,
    includeAllBatches,
    setIncludeAllBatches,
    bulkJobCount,
    bulkMinutes,
    showConfirm,
    openConfirm: () => {
      if (!isGenerating) setShowConfirm(true);
    },
    cancelConfirm: () => {
      setShowConfirm(false);
      setMessage('');
      setError('');
    },
    confirmGenerate,
    generateNext: () => {
      if (isGenerating || !nextCategory) return;
      setGenerateModeState('single');
      setSelectedCategory(nextCategory);
      setShowConfirm(true);
    },
    isGenerating,
    message,
    error,
    promptDetails,
    bulk,
    stopBulk: () => {
      stopRequested.current = true;
    },
    getPromptDetails: getCategoryPromptDetails,
    coverageLoading,
  };
}

const statusStyles: Record<BulkEntry['status'], { icon: typeof FaCheckCircle; className: string; label: string }> = {
  saved: { icon: FaCheckCircle, className: 'text-emerald-400', label: 'Saved' },
  skipped: { icon: FaMinusCircle, className: 'text-amber-400', label: 'Skipped' },
  failed: { icon: FaExclamationTriangle, className: 'text-rose-400', label: 'Failed' },
};

export function AIGenerationPanelView({ ctl }: { ctl: GenerationController }) {
  const {
    isAdmin,
    generateMode,
    selectedCategory,
    selectedCoverage,
    effectiveBatch,
    bulk,
  } = ctl;

  const noCategories = ctl.categoryOptions.length === 0;
  const bulkPercent = bulk && bulk.total > 0 ? Math.round((bulk.done / bulk.total) * 100) : 0;
  const recentEntries = bulk ? [...bulk.entries].reverse().slice(0, 8) : [];
  const confirmDetails = selectedCategory ? ctl.getPromptDetails(selectedCategory) : null;

  return (
    <section className="dashboard-card" aria-labelledby="ai-generation-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[rgb(var(--accent-rgb)/0.35)] bg-gradient-to-br from-[rgb(var(--accent-rgb)/0.2)] to-[rgb(var(--accent2-rgb)/0.2)] text-lg text-[rgb(var(--accent-rgb))]">
            <FaRobot />
          </span>
          <div>
            <h2 id="ai-generation-title" className="font-display text-xl font-bold sm:text-2xl">
              Generate AI posts
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-[var(--fg-muted)]">
              Run one category batch, or every category one after another. The weekly scheduler does this automatically every Monday; use this panel for manual runs.
            </p>
          </div>
        </div>
        <span className="futurist-pill">Admin only</span>
      </div>

      {!isAdmin ? (
        <p className="mt-5 text-sm text-[var(--fg-muted)]">Only administrators can trigger this action.</p>
      ) : (
        <div className="mt-6 space-y-5">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Generation mode">
            <button
              type="button"
              className="chip"
              aria-pressed={generateMode === 'single'}
              onClick={() => ctl.setGenerateMode('single')}
              disabled={ctl.isGenerating}
            >
              Single category
            </button>
            <button
              type="button"
              className="chip"
              aria-pressed={generateMode === 'all'}
              onClick={() => ctl.setGenerateMode('all')}
              disabled={ctl.isGenerating}
            >
              All categories
            </button>
          </div>

          {noCategories && (
            <p className="rounded-xl border border-dashed border-[var(--line-strong)] p-4 text-sm text-[var(--fg-muted)]">
              {ctl.coverageLoading
                ? 'Loading categories…'
                : 'No active tools found in tools_coverage_metadata, so there is nothing to generate yet.'}
            </p>
          )}

          {!noCategories && generateMode === 'single' && (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--fg-subtle)]">Category</span>
                  <select
                    value={selectedCategory}
                    onChange={(event) => ctl.setSelectedCategory(event.target.value)}
                    className="field"
                    disabled={ctl.isGenerating}
                  >
                    {ctl.categoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--fg-subtle)]">Batch</span>
                  <select
                    value={ctl.batchOverride}
                    onChange={(event) => ctl.setBatchOverride(event.target.value)}
                    className="field"
                    disabled={ctl.isGenerating}
                  >
                    <option value="">Auto-rotate next batch</option>
                    {(selectedCoverage?.batches || []).map((batch) => (
                      <option key={batch.batchNumber} value={String(batch.batchNumber)}>
                        Batch {batch.batchNumber} of {selectedCoverage?.batchCount} · tools {batch.start}-{batch.end}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {selectedCoverage && (
                <div className="rounded-xl border border-[var(--line)] bg-[rgb(var(--fg-rgb)/0.03)] p-4 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <span className="badge">{selectedCoverage.toolCount} tools</span>
                    <span className="badge">{selectedCoverage.publishedCount} published</span>
                    <span className="badge-secondary">
                      next batch {selectedCoverage.nextBatch}/{selectedCoverage.batchCount}
                    </span>
                    {effectiveBatch && (
                      <span className="badge-vibrant">
                        selected: batch {effectiveBatch.batchNumber} · tools {effectiveBatch.start}-{effectiveBatch.end}
                      </span>
                    )}
                  </div>
                  {effectiveBatch && (
                    <p className="mt-3 text-[var(--fg-muted)]">
                      <span className="font-semibold text-[rgb(var(--fg-rgb))]">Tools in batch:</span> {effectiveBatch.tools.join(', ')}
                    </p>
                  )}
                </div>
              )}

              <div className="rounded-xl border border-[var(--line)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-subtle)]">Previous posts for this batch</p>
                {ctl.previousBatchPosts.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {ctl.previousBatchPosts.map((post) => (
                      <a
                        key={post.id}
                        href={`/blog/${post.slug}`}
                        className="block rounded-lg border border-[var(--line)] bg-[rgb(var(--fg-rgb)/0.03)] p-3 transition hover:border-[rgb(var(--accent-rgb)/0.45)]"
                      >
                        <p className="text-sm font-semibold">{post.title}</p>
                        <p className="mt-1 text-xs text-[var(--fg-subtle)]">
                          {new Date(post.published_at).toLocaleString()} · matched tools: {post.matchedTools.join(', ')}
                        </p>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-[var(--fg-muted)]">No previous AI posts matched this category batch yet.</p>
                )}
              </div>
            </div>
          )}

          {!noCategories && generateMode === 'all' && (
            <div className="space-y-4">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--line)] bg-[rgb(var(--fg-rgb)/0.03)] p-4">
                <input
                  type="checkbox"
                  checked={ctl.includeAllBatches}
                  onChange={(event) => ctl.setIncludeAllBatches(event.target.checked)}
                  disabled={ctl.isGenerating}
                  className="mt-1 h-4 w-4 accent-cyan-400"
                />
                <span className="text-sm">
                  <span className="flex items-center gap-2 font-semibold">
                    <FaLayerGroup className="text-[rgb(var(--accent-rgb))]" />
                    Run every batch of every category
                  </span>
                  <span className="mt-1 block text-[var(--fg-muted)]">
                    Off: one call per category (the next batch in rotation). On: all batches, the same coverage as a full weekly sweep.
                  </span>
                </span>
              </label>
              <p className="text-sm text-[var(--fg-muted)]">
                <span className="font-semibold text-[rgb(var(--fg-rgb))]">{ctl.categoryOptions.length} categories</span> →{' '}
                <span className="font-semibold text-[rgb(var(--fg-rgb))]">{ctl.bulkJobCount} calls</span>, about{' '}
                <span className="font-semibold text-[rgb(var(--fg-rgb))]">{ctl.bulkMinutes} min</span>. Calls run one by one from this browser tab, so keep it open until it finishes.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={ctl.openConfirm}
              disabled={ctl.isGenerating || noCategories}
              className="btn-primary flex-1"
            >
              {ctl.isGenerating ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <FaPlay className="text-xs" />
              )}
              {generateMode === 'all' ? `Run all ${ctl.categoryOptions.length} categories` : `Generate ${selectedCategory || 'post'}`}
            </button>
            {generateMode === 'single' && (
              <button
                type="button"
                onClick={ctl.generateNext}
                disabled={ctl.isGenerating || !ctl.nextCategory}
                className="btn-secondary flex-1"
              >
                <FaForward className="text-xs" />
                {ctl.isGenerating ? 'Working…' : `Generate next: ${ctl.nextCategory || '-'}`}
              </button>
            )}
          </div>

          {ctl.showConfirm && (
            <div className="rounded-xl border border-[rgb(var(--accent-rgb)/0.4)] bg-[rgb(var(--accent-rgb)/0.06)] p-4 text-sm">
              <p className="font-semibold">
                {generateMode === 'all'
                  ? `Run ${ctl.bulkJobCount} generation calls (${ctl.categoryOptions.length} categories)?`
                  : `Generate the ${selectedCategory} post now?`}
              </p>
              <p className="mt-1 text-xs text-[var(--fg-muted)]">
                This uses paid AI/search credits, so only continue when you really want new posts.
                {generateMode === 'all' && ' You can stop the run at any time; finished posts stay published.'}
              </p>
              {generateMode === 'single' && confirmDetails && (
                <div className="mt-3 rounded-lg border border-[var(--line)] bg-[rgb(var(--fg-rgb)/0.04)] p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-subtle)]">Category prompt</p>
                  <p className="mt-1.5 font-semibold">{confirmDetails.title}</p>
                  <p className="mt-1 text-xs text-[var(--fg-muted)]">Focus: {confirmDetails.focus}</p>
                  <p className="mt-1 text-xs text-[var(--fg-muted)]">Guidance: {confirmDetails.guidance}</p>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={ctl.confirmGenerate} className="btn-primary !py-2">
                  Yes, generate
                </button>
                <button type="button" onClick={ctl.cancelConfirm} className="btn-secondary !py-2">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {ctl.message && (
            <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400" role="status">
              {ctl.message}
            </p>
          )}
          {ctl.error && (
            <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400" role="alert">
              {ctl.error}
            </p>
          )}

          {bulk && (
            <div className="rounded-xl border border-[var(--line)] p-4" aria-live="polite">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">
                  {bulk.running ? 'Running' : bulk.stopped ? 'Stopped' : 'Finished'} · {bulk.done}/{bulk.total} calls
                </p>
                {bulk.running && (
                  <button type="button" onClick={ctl.stopBulk} className="btn-danger !px-3 !py-1.5 !text-xs">
                    <FaStop />
                    Stop after current call
                  </button>
                )}
              </div>
              <div className="progress-track mt-3" role="progressbar" aria-valuenow={bulkPercent} aria-valuemin={0} aria-valuemax={100}>
                <div className="progress-bar" style={{ width: `${bulkPercent}%` }} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="badge">{bulk.saved} saved</span>
                <span className="badge-secondary">{bulk.skipped} skipped</span>
                <span className={bulk.failed > 0 ? 'badge-orange' : 'badge-secondary'}>{bulk.failed} failed</span>
              </div>
              {bulk.running && bulk.current && (
                <p className="mt-3 text-sm text-[var(--fg-muted)]">
                  Now generating: <span className="font-semibold text-[rgb(var(--fg-rgb))]">{bulk.current}</span>
                </p>
              )}
              {recentEntries.length > 0 && (
                <ul className="mt-3 space-y-1.5 text-sm">
                  {recentEntries.map((entry) => {
                    const style = statusStyles[entry.status];
                    const Icon = style.icon;
                    return (
                      <li key={entry.key} className="flex items-start gap-2">
                        <Icon className={`mt-0.5 shrink-0 ${style.className}`} aria-label={style.label} />
                        <span>
                          <span className="font-medium">{entry.category}</span>
                          {entry.batch ? <span className="text-[var(--fg-subtle)]"> · batch {entry.batch}</span> : null}
                          <span className="text-[var(--fg-muted)]"> — {entry.title || entry.message}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {ctl.promptDetails && (
            <div className="rounded-xl border border-[var(--line)] p-4 text-sm">
              <h4 className="mb-2 font-semibold">Category prompt details</h4>
              <p>
                <span className="font-semibold">Title focus:</span> {ctl.promptDetails.title}
              </p>
              <p className="mt-1">
                <span className="font-semibold">Focus:</span> {ctl.promptDetails.focus}
              </p>
              <p className="mt-1">
                <span className="font-semibold">Guidance:</span> {ctl.promptDetails.guidance}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default function AIGenerationPanel(props: ControllerProps) {
  const controller = useGenerationController(props);
  return <AIGenerationPanelView ctl={controller} />;
}
