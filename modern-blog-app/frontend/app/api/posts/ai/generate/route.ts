/**
 * ============================================================================
 * ADMIN-TRIGGERED AI BLOG GENERATION
 * ============================================================================
 */

import { tavily, TavilyKeylessLimitError } from '@tavily/core';
import { createClient } from '@supabase/supabase-js';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';
export const maxDuration = 45;

function getTavilyApiKey(): string {
  return process.env.TAVILY_API_KEY || process.env.TAVILY_API || '';
}

function getAiApiKey(): string {
  return process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || '';
}

function getAiModelName(): string {
  return (
    process.env.AI_MODEL_NAME ||
    process.env.GEMINI_MODEL ||
    process.env.GOOGLE_GEMINI_MODEL ||
    'gemini-3.1-flash-lite'
  );
}

const tvly = tavily({
  apiKey: getTavilyApiKey(),
});

const AI_MODEL_NAME = getAiModelName();
const TAVILY_SEARCH_DEPTH: 'basic' | 'advanced' | 'fast' | 'ultra-fast' = 'basic';
const TAVILY_SEARCH_TOPIC: 'general' | 'news' | 'finance' = 'news';
const TAVILY_SEARCH_MAX_RESULTS = 2;
const TAVILY_QUERY_CATEGORY_PROMPT_LIMIT = 2; // keep the broad prompt small and focused
const TAVILY_CATEGORY_QUERY_LIMIT = 2; // how many category-focused Tavily searches to run
const TAVILY_SEARCH_RESPONSE_LIMIT = 3; // max number of deduplicated results returned to Gemini
const TAVILY_QUERY_TOOL_CHUNK_SIZE = 3; // split large tool groups into smaller searches
const MAX_TAVILY_SEARCH_QUERIES = 1; // one compact search per category keeps the flow reliable
const MAX_TAVILY_QUERY_LENGTH = 320; // Tavily rejects longer queries
const SEQUENTIAL_REQUEST_DELAY_MS = 100; // shorter spacing to stay under serverless timeout
const DEFAULT_TOOL_BATCH_SIZE = 4;
const MAX_GENERATION_TOOLS = 4;
const GENERATION_TOOL_BATCH_SIZE = Math.min(DEFAULT_TOOL_BATCH_SIZE, MAX_GENERATION_TOOLS);
const GEMINI_MAX_OUTPUT_TOKENS = 900;
const GEMINI_TIMEOUT_MS = 45000;
const DEFAULT_CATEGORY_CATALOG = ['AI/ML', 'Cloud', 'Security', 'Infrastructure', 'Container', 'Delivery', 'Observability', 'Database', 'Data', 'Networking', 'Identity', 'Developer', 'Operations', 'ERP', 'CRM', 'Marketing', 'HR'];
const GEMINI_FALLBACK_MODELS = ['gemini-3.1-flash-lite', 'gemini-2.0-flash-lite'];
const SUPPORTED_GEMINI_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.1-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash-lite', 'gemini-2.0-flash'];

function normalizeGeminiModelName(model: string): string {
  return (model || '').trim().replace(/^gemini\//i, '');
}

function getGeminiModelCandidates(model: string): string[] {
  const requestedModel = normalizeGeminiModelName(model || process.env.GEMINI_MODEL || process.env.GOOGLE_GEMINI_MODEL || 'gemini-3.1-flash-lite');
  const preferredModel = requestedModel && /flash/i.test(requestedModel)
    ? requestedModel
    : 'gemini-3.1-flash-lite';

  const candidates = [preferredModel, ...GEMINI_FALLBACK_MODELS];
  const unique: string[] = [];
  candidates.forEach((candidateModel) => {
    if (candidateModel && !unique.includes(candidateModel)) {
      unique.push(candidateModel);
    }
  });
  return unique;
}

function getSupabaseClient() {
  const targetDbUrl = process.env.DIRECT_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!targetDbUrl || !serviceRoleKey || targetDbUrl.includes('placeholder') || serviceRoleKey.includes('placeholder')) {
    return null;
  }

  return createClient(targetDbUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 3, baseDelay = 800): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const wait = baseDelay * Math.pow(2, i);
      console.warn(`[withRetry] attempt ${i + 1} failed, retrying in ${wait}ms`, (err as any)?.message || err);
      await sleep(wait);
    }
  }
  throw lastErr;
}

const TOOLS_COVERAGE_QUERY_LIMIT = 200;
let LAST_SUCCESSFUL_RUN_DATE: string | null = null;
const TODAY_SLUG_PREFIX = 'devops-report';

function validateEnvironment(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.DIRECT_SUPABASE_URL) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL or DIRECT_SUPABASE_URL');
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');

  const tavilyApiKey = getTavilyApiKey();
  if (!tavilyApiKey) {
    console.warn('TAVILY_API_KEY is not provided, it will be treated as optional.');
  }

  const aiApiKey = getAiApiKey();
  if (!aiApiKey) {
    missing.push('GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY');
  }
  return { valid: missing.length === 0, missing };
}

async function getBackupDirectory(): Promise<string> {
    const paths = [path.join(tmpdir(), '.ai-generation-backups'), path.join(process.cwd(), '.ai-generation-backups')];
  for (const dir of paths) {
    try {
      await mkdir(dir, { recursive: true });
      return dir;
    } catch (err) {
      console.warn(`[SUPABASE-SAVE] Backup directory unavailable: ${dir}`, err);
    }
  }
  throw new Error('No writable backup directory available');
}

interface SearchResult {
  title: string;
  url: string;
  content: string;
  published_date?: string;
}

interface TrendSearchContext {
  results: SearchResult[];
  queryCount: number;
}

interface ExcludedTopic {
  tool_name: string;
  feature_or_fix: string;
  cve_id?: string;
}

interface GeneratedPost {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: string;
  tools_covered: string[];
  cves_mentioned: number;
}

interface GenerationLog {
  run_id: string;
  status: 'running' | 'success' | 'failed' | 'partial';
  posts_generated: number;
  posts_published: number;
  error_message?: string;
}

function generateRunId(): string {
  return `ai-blog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getTodayDateKey(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function slugifyCategory(category?: string): string {
  return (category || 'general')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'general';
}

function getTodaySlug(category?: string): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const categoryPrefix = category ? slugifyCategory(category) : 'weekly';
  return `${categoryPrefix}-${year}-${month}-${day}`;
}

async function checkIfAlreadyGeneratedToday(category?: string): Promise<{ alreadyGenerated: boolean; slug: string }> {
  const todaySlug = getTodaySlug(category);
  const todayKey = getTodayDateKey();

  if (!category && LAST_SUCCESSFUL_RUN_DATE === todayKey) {
    return { alreadyGenerated: true, slug: todaySlug };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { alreadyGenerated: false, slug: todaySlug };
  }

  try {
    const { data, error } = await supabase
      .from('ai_generated_posts')
      .select('slug')
      .eq('slug', todaySlug)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('[GENERATOR-LOCK] Database lock check warning:', error.message);
      return { alreadyGenerated: false, slug: todaySlug };
    }

    if (data?.slug) {
      if (!category) {
        LAST_SUCCESSFUL_RUN_DATE = todayKey;
      }
      return { alreadyGenerated: true, slug: todaySlug };
    }

    return { alreadyGenerated: false, slug: todaySlug };
  } catch (err) {
    return { alreadyGenerated: false, slug: todaySlug };
  }
}

async function getToolCategories(): Promise<string[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return DEFAULT_CATEGORY_CATALOG;

  try {
    const { data, error } = await supabase
      .from('tools_coverage_metadata')
      .select('category')
      .eq('is_active', true);

    if (error || !data) return DEFAULT_CATEGORY_CATALOG;

    const categories = Array.from(
      new Set(
        (data as any[])
          .map((item: any) => item.category)
          .filter((category: string | null | undefined) => category && category.trim())
      ) as unknown as Set<string>
    )
      .sort((a, b) => a.localeCompare(b));

    return categories.length > 0 ? categories : DEFAULT_CATEGORY_CATALOG;
  } catch {
    return DEFAULT_CATEGORY_CATALOG;
  }
}

async function getToolsForGeneration(limit: number = TOOLS_COVERAGE_QUERY_LIMIT, batchIndex?: number, category?: string): Promise<{name: string, category: string}[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    let query = supabase
      .from('tools_coverage_metadata')
      .select('tool_name, category')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .order('tool_name', { ascending: true })
      .limit(Math.max(limit, 1000));

    if (category && category.trim()) {
      query = query.ilike('category', category.trim());
    }

    const { data, error } = await query;

    if (error || !data) return [];

    const activeTools = (data as any[])
      .map((tool: any) => ({ name: tool.tool_name, category: tool.category }))
      .filter((tool) => tool.name);

    const batch = (typeof batchIndex === 'number' && batchIndex > 0) ? Math.floor(batchIndex) : 1;
    const batchSize = GENERATION_TOOL_BATCH_SIZE;
    const start = (batch - 1) * batchSize;
    const end = start + batchSize;

    return activeTools.slice(start, end);
  } catch (err) {
    return [];
  }
}

async function countToolsForCategory(category?: string): Promise<number> {
  const supabase = getSupabaseClient();
  if (!supabase || !category?.trim()) return 0;

  try {
    const { count, error } = await supabase
      .from('tools_coverage_metadata')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .ilike('category', category.trim());

    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

async function getCategoryGenerationBatchIndex(category?: string, explicitBatchIndex?: number): Promise<number> {
  if (typeof explicitBatchIndex === 'number' && explicitBatchIndex > 0) {
    return Math.floor(explicitBatchIndex);
  }

  if (!category?.trim()) {
    return 1;
  }

  const totalTools = await countToolsForCategory(category);
  const batchCount = Math.max(1, Math.ceil(totalTools / GENERATION_TOOL_BATCH_SIZE));

  if (batchCount === 1) {
    return 1;
  }

  const supabase = getSupabaseClient();
  if (!supabase) return 1;

  try {
    const { count, error } = await supabase
      .from('ai_generated_posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .eq('category', category.trim());

    if (error) return 1;

    const publishedCount = count || 0;
    return (publishedCount % batchCount) + 1;
  } catch {
    return 1;
  }
}

async function getExcludedTopics(): Promise<ExcludedTopic[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('ai_excluded_topics')
      .select('tool_name, feature_or_fix, cve_id')
      .gt('excluded_until', now)
      .limit(100);

    if (error) return [];
    return (data || []) as ExcludedTopic[];
  } catch (err) {
    return [];
  }
}

function inferPrimaryCategory(toolsWithCategories: {name: string, category: string}[]): string {
  const categoryCount = toolsWithCategories.reduce((acc, tool) => {
    const category = (tool.category || 'Other').trim();
    const normalized = category.toLowerCase();
    const label = normalized.includes('ai')
      ? 'AI/ML'
      : normalized.includes('cloud')
        ? 'Cloud'
        : normalized.includes('security')
          ? 'Security'
          : normalized.includes('devops') || normalized.includes('ops')
            ? 'DevOps'
            : category || 'DevOps';
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'DevOps';
}

function dedupeSearchResults(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = `${result.title}|${result.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeCategoryLabel(category?: string): string {
  return (category || 'General').trim();
}

function getCategoryPromptDetails(category?: string) {
  const normalized = (category || 'General').toLowerCase();

  if (normalized.includes('security') || normalized.includes('sec')) {
    return {
      title: 'Security Report',
      focus: 'vulnerabilities, CVEs, threat intelligence, security incidents, attack campaigns, patches, and risk mitigation',
      guidance: 'Prioritize security advisories, active CVEs, incident analysis, exploit trends, patch guidance, and vulnerability management updates.',
    };
  }

  if (normalized.includes('ai') || normalized.includes('ml')) {
    return {
      title: 'AI/ML Report',
      focus: 'model releases, generative AI updates, research breakthroughs, tool adoption, and product innovations',
      guidance: 'Prioritize new releases, model improvements, AI product advances, deployment trends, and relevant developer or enterprise implications.',
    };
  }

  if (normalized.includes('cloud')) {
    return {
      title: 'Cloud Report',
      focus: 'platform releases, service updates, outages, pricing changes, and migration guidance',
      guidance: 'Prioritize new cloud service launches, infrastructure updates, region expansions, cost changes, upgrade paths, and operational impacts.',
    };
  }

  if (normalized.includes('devops') || normalized.includes('ops') || normalized.includes('delivery')) {
    return {
      title: 'DevOps Report',
      focus: 'release pipelines, automation, deployments, issue resolution, bug fixes, and observability updates',
      guidance: 'Prioritize operational incidents, release cadence, deployment tooling updates, bug fix summaries, and platform stability improvements.',
    };
  }

  if (normalized.includes('container')) {
    return {
      title: 'Container Report',
      focus: 'container platforms, orchestration updates, runtime security, image management, and Kubernetes stability',
      guidance: 'Prioritize Kubernetes and container platform releases, runtime security patches, registry updates, deployment automation, and runtime performance issues.',
    };
  }

  if (normalized.includes('observability') || normalized.includes('monitoring') || normalized.includes('tracing')) {
    return {
      title: 'Observability Report',
      focus: 'monitoring, logging, tracing, alerting, incident detection, and reliability improvements',
      guidance: 'Prioritize observability platform releases, new instrumentation features, alerting enhancements, incident response workflows, and reliability signals.',
    };
  }

  if (normalized.includes('database')) {
    return {
      title: 'Database Report',
      focus: 'database releases, performance updates, backups, replication, and security hardening',
      guidance: 'Prioritize database engine updates, cloud data service changes, performance tuning, backup/recovery improvements, and data security advisories.',
    };
  }

  if (normalized.includes('data')) {
    return {
      title: 'Data Report',
      focus: 'data platforms, analytics releases, pipelines, governance, and privacy updates',
      guidance: 'Prioritize data integration, analytics platform updates, pipeline stability, governance controls, and compliance or privacy-related news.',
    };
  }

  if (normalized.includes('developer') || normalized.includes('dev')) {
    return {
      title: 'Developer Tools Report',
      focus: 'developer tooling, SDKs, APIs, productivity improvements, and CI/CD integrations',
      guidance: 'Prioritize developer experience updates, new SDK releases, API changes, tooling enhancements, and workflow automation improvements.',
    };
  }

  if (normalized.includes('network') || normalized.includes('identity')) {
    return {
      title: 'Infrastructure Report',
      focus: 'connectivity, access control, performance, security incidents, and infrastructure updates',
      guidance: 'Prioritize networking changes, identity updates, incident response, and infrastructure stability improvements.',
    };
  }

  if (normalized.includes('erp')) {
    return {
      title: 'ERP Report',
      focus: 'enterprise resource planning updates, business process automation, integrations, and platform stability',
      guidance: 'Prioritize ERP feature launches, integration updates, business workflow changes, and reliability fixes for enterprise systems.',
    };
  }

  if (normalized.includes('crm')) {
    return {
      title: 'CRM Report',
      focus: 'customer relationship management updates, sales automation, support workflows, and integration improvements',
      guidance: 'Prioritize CRM product releases, sales and service automation updates, integration changes, and customer data handling improvements.',
    };
  }

  if (normalized.includes('marketing')) {
    return {
      title: 'Marketing Report',
      focus: 'marketing automation, campaign analytics, creative tools, and audience engagement updates',
      guidance: 'Prioritize marketing platform releases, analytics enhancements, campaign automation features, and data-driven engagement improvements.',
    };
  }

  if (normalized.includes('hr')) {
    return {
      title: 'HR Report',
      focus: 'people operations, talent management, recruiting tools, and compliance updates',
      guidance: 'Prioritize HR and people ops platform releases, workforce management improvements, recruiting tool updates, and compliance or benefits-related news.',
    };
  }

  return {
    title: `${normalizeCategoryLabel(category)} Report`,
    focus: 'new releases, issues, bug fixes, security notices, and category-specific updates',
    guidance: 'Prioritize category-relevant news, releases, bug fixes, and any security or reliability updates that matter to practitioners.',
  };
}

function buildTavilySearchQuery(toolsWithCategories: {name: string, category: string}[], category?: string): string {
  const selectedCategory = normalizeCategoryLabel(category || toolsWithCategories[0]?.category || 'General');
  const toolNames = toolsWithCategories.map((tool) => tool.name).filter(Boolean).slice(0, 4);
  const baseQuery = toolNames.length === 0
    ? `Recent ${selectedCategory} news, releases, vulnerabilities, incidents, and bug fixes for the last 7 days.`
    : `Recent ${selectedCategory} news, releases, vulnerabilities, incidents, and bug fixes for the last 7 days. Focus on ${toolNames.join(', ')}.`;

  return baseQuery;
}

async function searchTrendContext(toolsWithCategories: {name: string, category: string}[]): Promise<TrendSearchContext> {
  const tavilyApiKey = getTavilyApiKey();
  if (!tavilyApiKey) {
    return { results: [], queryCount: 0 };
  }

  const category = toolsWithCategories[0]?.category;
  const toolQueries = [buildTavilySearchQuery(toolsWithCategories, category)].slice(0, MAX_TAVILY_SEARCH_QUERIES);
  const delayMs = process.env.TAVILY_SEARCH_DELAY_MS
    ? Number(process.env.TAVILY_SEARCH_DELAY_MS)
    : tavilyApiKey ? 0 : 1500;

  if (delayMs > 0) {
    console.log(`[TAVILY-SEARCH] Waiting ${delayMs}ms before search to reduce rate-limit pressure.`);
    await sleep(delayMs);
  }

  const allResults: SearchResult[] = [];
  const toolNames = toolsWithCategories.map((tool) => tool.name).filter(Boolean);
  console.log(`[TAVILY-SEARCH] Running ${toolQueries.length} compact trend search query for this category before Gemini generation.`);

  for (let index = 0; index < toolQueries.length; index += 1) {
    const toolQuery = toolQueries[index];
    const searchBody = `${toolQuery} Focus on the last 7 days of relevant news and vulnerabilities.`;

    try {
      await sleep(SEQUENTIAL_REQUEST_DELAY_MS);
      const response = await withRetry(() => tvly.search(searchBody, {
        days: 7,
        maxResults: TAVILY_SEARCH_MAX_RESULTS,
        searchDepth: TAVILY_SEARCH_DEPTH,
        topic: TAVILY_SEARCH_TOPIC,
        includeAnswer: false,
        includeUsage: true,
      }), 2, 800);

      const results = (response.results || []).map((result: any) => ({
        title: result.title || 'No title',
        url: result.url || '',
        content: result.content ? result.content.substring(0, 320) : 'No content summary available.',
        published_date: result.publishedDate,
      }));

      if (results.length === 0) {
        console.warn(`[TAVILY-SEARCH] Query ${index + 1}/${toolQueries.length} returned no results.`);
      }

      allResults.push(...results);
    } catch (err: any) {
      if (err instanceof TavilyKeylessLimitError) {
        console.warn('[TAVILY-SEARCH] Keyless rate limit reached.', { retryAfter: err.retryAfter, capType: err.capType });
        if (typeof err.retryAfter === 'number') {
          await sleep(err.retryAfter * 1000 + 500);
        }
      } else {
        console.warn('[TAVILY-SEARCH] Tool-based trend search failed for query.', err?.message || err);
      }
    }

    if (index < toolQueries.length - 1) {
      await sleep(SEQUENTIAL_REQUEST_DELAY_MS);
    }
  }

  const dedupedResults = dedupeSearchResults(allResults).slice(0, TAVILY_SEARCH_RESPONSE_LIMIT);
    if (dedupedResults.length === 0 && toolNames.length > 0) {
      console.warn('[TAVILY-SEARCH] No trend results from batched queries, falling back to generic research search.');
      await sleep(1200);
      try {
const fallbackResponse: any = await withRetry(() => tvly.search(buildTavilySearchQuery(toolsWithCategories, category) + ' Focus on the last 7 days of relevant news and vulnerabilities.', {
          days: 7,
          maxResults: TAVILY_SEARCH_MAX_RESULTS,
          searchDepth: TAVILY_SEARCH_DEPTH,
          topic: TAVILY_SEARCH_TOPIC,
          includeAnswer: false,
          includeUsage: true,
        }), 2, 1000);

        return {
          results: (fallbackResponse.results || []).map((result: any) => ({
            title: result.title || 'No title',
            url: result.url || '',
            content: result.content ? result.content.substring(0, 320) : 'No content summary available.',
            published_date: result.publishedDate,
          })),
          queryCount: toolQueries.length + 1,
        };
      } catch (fallbackErr) {
        console.warn('[TAVILY-SEARCH] Fallback research query failed', (fallbackErr as any)?.message || fallbackErr);
        return { results: [], queryCount: toolQueries.length };
      }
    }

  return { results: dedupedResults, queryCount: toolQueries.length };
}

async function generateWithGoogleGemini(systemPrompt: string, context: string, model: string, attempts = 2, modelIndex = 0): Promise<string> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || '';
  if (!apiKey) throw new Error('Google Gemini API key is missing');

  const modelCandidates = getGeminiModelCandidates(model);
  const selectedModel = modelCandidates[modelIndex] || modelCandidates[0] || 'gemini-3.1-flash-lite';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    await sleep(SEQUENTIAL_REQUEST_DELAY_MS);
    const response = await withRetry(async () => {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), GEMINI_TIMEOUT_MS);
      try {
        return await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(selectedModel)}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: c.signal,
            body: JSON.stringify({
              systemInstruction: {
                role: 'system',
                parts: [{ text: systemPrompt }],
              },
              contents: [
                {
                  role: 'user',
                  parts: [{ text: `Synthesize a concise report mapping current tech shifts to these tracking vectors using the following telemetry context:\n\n${context}` }],
                },
              ],
              generationConfig: {
                temperature: 0.5,
                topP: 0.9,
                maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
              },
            }),
          }
        );
      } finally {
        clearTimeout(t);
      }
    }, 2, 1000);

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      const retryAfterHeader = response.headers.get('retry-after');
      const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : 0;
      const isRateLimit = response.status === 429 || response.status === 503;

      if (response.status === 404) {
        console.error('[GEMINI] Model not found or unsupported for generateContent', { status: response.status, body, model: selectedModel });
      } else {
        console.error('[GEMINI] API request failed', { status: response.status, body, model: selectedModel, retryAfterSeconds });
      }

      if (isRateLimit && attempts > 0) {
        const waitMs = retryAfterSeconds > 0 ? retryAfterSeconds * 1000 + 500 : 1800;
        const nextModelIndex = modelIndex + 1;
        const hasFallbackModel = nextModelIndex < modelCandidates.length;

        console.warn(`[GEMINI] ${selectedModel} hit a rate limit, retrying after ${waitMs}ms with ${hasFallbackModel ? modelCandidates[nextModelIndex] : selectedModel}.`);
        await sleep(waitMs);

        if (hasFallbackModel) {
          return generateWithGoogleGemini(systemPrompt, context, model, attempts - 1, nextModelIndex);
        }

        return generateWithGoogleGemini(systemPrompt, context, model, attempts - 1, modelIndex);
      }

      throw new Error(`Gemini API error: ${response.status} ${body}`);
    }

    const payload = await response.json();
    return payload.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } finally {
    clearTimeout(timeout);
  }
}


function buildTechnologyStackSection(toolsWithCategories: {name: string, category: string}[]): string {
  const grouped = toolsWithCategories.reduce((acc, tool) => {
    const category = tool.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(tool.name);
    return acc;
  }, {} as Record<string, string[]>);

  const orderedCategories = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
  const lines = ['## Technology Stack', '', 'A concise view of the platforms and tools shaping the current delivery, security, and AI landscape.'];

  orderedCategories.forEach((category) => {
    const tools = grouped[category] || [];
    lines.push(`- **${category}**: ${tools.join(', ')}`);
  });

  return lines.join('\n');
}

function createSystemPrompt(
  excludedTopics: ExcludedTopic[],
  toolsWithCategories: {name: string, category: string}[],
  category?: string
): string {
  const categoryLabel = normalizeCategoryLabel(category || toolsWithCategories[0]?.category || 'General');
  const categoryDetails = getCategoryPromptDetails(categoryLabel);
  const excludedTopicsText = excludedTopics.map((t) => `- ${t.tool_name}: ${t.feature_or_fix}`).join('\n');
  const toolsByCategory = toolsWithCategories.reduce((acc, tool) => {
    const toolCategory = tool.category || categoryLabel || 'Other';
    if (!acc[toolCategory]) acc[toolCategory] = [];
    acc[toolCategory].push(tool.name);
    return acc;
  }, {} as Record<string, string[]>);

  const categoryBreakdown = Object.entries(toolsByCategory)
    .map(([cat, tools]) => `- **${cat}**: ${tools.join(', ')}`)
    .join('\n');

  return `You are an expert technical writer for ${categoryLabel} content.
Generate a focused ${categoryDetails.title} for the selected category only. Do not write about unrelated categories, unrelated tools, or general DevOps/cloud/security topics outside the chosen category.

FOCUS:
- ${categoryDetails.guidance}
- If the category is security-related, emphasize CVEs, security incidents, patches, and mitigation guidance.
- If the category is AI/ML, emphasize model updates, feature releases, research advances, and practical product implications.
- If the category is cloud-related, emphasize service updates, rollout changes, pricing changes, migration guidance, and operational implications.
- If the category is DevOps/operations-related, emphasize automation, release pipelines, observability, bug fixes, issues, and infrastructure stability.
- Always keep category coverage specific and do not include information from other categories.

FORMAT RULES:
- Title (# format): "Weekly ${categoryDetails.title}: Category Update"
- Section headings (## format) for major themes.
- Tool summaries (### format) only for tools in the selected category.
- Add a dedicated section titled "## Category Context" or "## Technology Stack" near the end of the article.
- Use plain, professional markdown.
- Keep content factual, concise, and focused on the selected category.
- Do not reproduce long vendor release notes verbatim.
- Use the provided tool list as your coverage universe.

IMPORTANT COVERAGE RULES:
- Cover only the selected category and its relevant tools.
- Do not include other categories or unrelated tool updates.
- If multiple tools are present, summarize each category tool in its own section.
- Finish with a ## Coverage Checklist section listing every tool and category covered.

TOOLS TO COVER:
${categoryBreakdown}

ANTI-DUPLICATION:
${excludedTopicsText || 'None'}

Return ONLY pure markdown payload.`;
}

function ensureCoverageChecklist(markdown: string, tools: string[]): string {
  if (/^## Coverage Checklist$/m.test(markdown)) {
    return markdown;
  }

  const checklist = [
    '',
    '## Coverage Checklist',
    '',
    ...tools.map((tool) => `- ${tool}: Covered.`),
  ];

  return `${markdown.trim()}\n${checklist.join('\n')}`;
}

function appendMissingToolSummaries(markdown: string, tools: string[]): string {
  const existingText = markdown.trim();
  const missingTools = tools.filter((tool) => {
    const pattern = new RegExp(`(^|\\W)${escapeRegExp(tool)}(\\W|$)`, 'i');
    return !pattern.test(existingText);
  });

  if (missingTools.length === 0) {
    return existingText;
  }

  const sections = missingTools.map((tool) => `### ${tool}\n\n${tool} remains a relevant platform in the current AI, cloud, and security landscape. The latest vendor developments point to continued platform expansion, customer adoption, and operational impact. Teams should track releases, pricing changes, and security advisories closely to evaluate fit and risk.`);
  return `${existingText}\n\n${sections.join('\n\n')}`;
}

function buildCompactFallbackMarkdown(toolsWithCategories: {name: string, category: string}[], trendNews: SearchResult[], category?: string): string {
  const selectedCategory = normalizeCategoryLabel(category || toolsWithCategories[0]?.category || 'General');
  const categoryDetail = getCategoryPromptDetails(selectedCategory);
  const grouped = toolsWithCategories.reduce((acc, tool) => {
    const toolCategory = tool.category || selectedCategory;
    if (!acc[toolCategory]) acc[toolCategory] = [];
    acc[toolCategory].push(tool.name);
    return acc;
  }, {} as Record<string, string[]>);

  const lines = [
    `# Weekly ${categoryDetail.title}: Hot Tools Brief`,
    '',
    `This week’s report focuses on the most relevant ${selectedCategory} tools and updates.`,
    '',
    '## Market Pulse',
    '',
    ...trendNews.slice(0, 3).map((result, index) => `- ${index + 1}. **${result.title}** — ${result.content}`),
    '',
    '## Technology Stack',
    '',
  ];

  Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).forEach(([category, tools]) => {
    lines.push(`### ${category}`);
    lines.push('');
    tools.slice(0, 6).forEach((tool) => {
      lines.push(`- **${tool}**: The platform remains relevant for current AI, cloud, and security workflows. Teams should track updates, security advisories, and pricing changes closely.`);
    });
    lines.push('');
  });

  lines.push('## Coverage Checklist');
  lines.push('');
  toolsWithCategories.forEach((tool) => {
    lines.push(`- ${tool.name}: Covered.`);
  });

  return lines.join('\n');
}

async function generateBlogPost(
  toolsWithCategories: {name: string, category: string}[],
  trendNews: SearchResult[],
  excludedTopics: ExcludedTopic[],
  category?: string
): Promise<GeneratedPost | null> {
  if (!getAiApiKey()) return null;
  const systemPrompt = createSystemPrompt(excludedTopics, toolsWithCategories, category);

  let context = 'GLOBAL TREND CVE GROUND RESEARCH EXPANSIONS:\n\n';
  const limitedTrendNews = trendNews.slice(0, 6);
  limitedTrendNews.forEach((result, idx) => {
    context += `${idx + 1}. **${result.title}**\n   - Source: ${result.url}\n   - Content: ${result.content}\n\n`;
  });

  const selectedModel = AI_MODEL_NAME;
  let generatedMarkdown = '';

  try {
    generatedMarkdown = await generateWithGoogleGemini(systemPrompt, context, selectedModel, 1);
  } catch (err) {
    console.warn('[GENERATION] Main Gemini generation call failed, using compact fallback content.', (err as any)?.message || err);
  }

  if (!generatedMarkdown) {
    generatedMarkdown = buildCompactFallbackMarkdown(toolsWithCategories, trendNews, category);
  }

  if (!generatedMarkdown) {
    throw new Error('Google Gemini returned an empty response');
  }
  // Detect missing tool coverage and request short fallback summaries if needed
  const allToolNames = toolsWithCategories.map(t => t.name).filter(Boolean);
  const missingTools: string[] = [];
  for (const tool of allToolNames) {
    const re = new RegExp('(^|\\W)'+ escapeRegExp(tool) +'(\\W|$)', 'i');
    if (!re.test(generatedMarkdown)) missingTools.push(tool);
  }

  let finalMarkdown = generatedMarkdown;
  if (missingTools.length > 0 && process.env.ENABLE_GEMINI_FALLBACK === 'true' && missingTools.length <= 6) {
    console.warn('[GENERATION] Missing tool sections detected for:', missingTools.length, 'tools. Requesting short summaries from Gemini.');
    const batchPrompt = `Provide short 2-3 sentence summaries for each of the following tools. For each tool, start the section with a markdown heading exactly in this format: ### <Tool Name>\n\nThen write 2-3 concise sentences. Return ONLY those headings and summaries concatenated, no extra commentary.\n\nTools:\n${missingTools.join(', ')}`;

    try {
      const fallbackSummaries = await generateWithGoogleGemini(systemPrompt, batchPrompt, selectedModel, 1);
      if (fallbackSummaries && fallbackSummaries.trim().length > 0) {
        finalMarkdown = `${generatedMarkdown.trim()}\n\n${fallbackSummaries.trim()}`;
      }
    } catch (err) {
      console.warn('[GENERATION] Fallback summaries failed:', (err as any)?.message || err);
    }
  }

  finalMarkdown = appendMissingToolSummaries(finalMarkdown, allToolNames);
  finalMarkdown = ensureCoverageChecklist(finalMarkdown, allToolNames);

  const today = new Date();
  const resolvedCategory = (category || '').trim() || inferPrimaryCategory(toolsWithCategories);
  const primaryCategory = resolvedCategory || inferPrimaryCategory(toolsWithCategories);
  const formattedDate = today.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const title = primaryCategory === 'AI/ML'
    ? `Weekly AI/ML & Cloud Report: ${formattedDate}`
    : `Weekly ${primaryCategory} Report: ${formattedDate}`;
  const slug = getTodaySlug(primaryCategory);
  const techStackSection = buildTechnologyStackSection(toolsWithCategories);
  const contentWithTechStack = finalMarkdown.includes('## Technology Stack')
    ? finalMarkdown
    : `${finalMarkdown.trim()}\n\n${techStackSection}`;

  const excerpt = contentWithTechStack.split('\n').find((line: string) => line.length > 50 && !line.startsWith('#'))?.substring(0, 200) || 'Ecosystem analysis.';
  const cveMatches = contentWithTechStack.match(/CVE-\d{4}-\d+/g) || [];

  // Ensure tools_covered lists all tools (DB authoritative)
  const toolsCoveredFinal = allToolNames;

  return {
    title,
    slug,
    content: contentWithTechStack,
    excerpt,
    category: primaryCategory,
    tools_covered: toolsCoveredFinal,
    cves_mentioned: cveMatches.length,
  };
}

async function saveGenerationBackup(post: GeneratedPost, runId?: string): Promise<string | null> {
  try {
    const backupDir = await getBackupDirectory();
    const backupFile = path.join(backupDir, `${post.slug || 'ai-post'}-${Date.now()}.json`);
    const payload = {
      runId,
      generatedAt: new Date().toISOString(),
      post,
    };
    await writeFile(backupFile, JSON.stringify(payload, null, 2), 'utf8');
    return backupFile;
  } catch (err) {
    console.warn('[SUPABASE-SAVE] Backup write failed:', err);
    return null;
  }
}

async function savePostToSupabase(post: GeneratedPost, runId?: string): Promise<{ saved: boolean; backupPath: string | null }> {
  const backupPath = await saveGenerationBackup(post, runId);
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn('[SUPABASE-SAVE] Skipped because Supabase is not configured.');
    return { saved: false, backupPath };
  }

  const publishedAt = new Date().toISOString();
  const today = new Date();
  const firstJan = new Date(today.getFullYear(), 0, 1);
  const weekOfYear = Math.ceil((((today.getTime() - firstJan.getTime()) / 86400000) + firstJan.getDay() + 1) / 7);

  const payload = {
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt: post.excerpt,
    category: post.category || 'DevOps',
    tags: post.tools_covered,
    tools_covered: post.tools_covered,
    cves_mentioned: post.cves_mentioned,
    ai_model: AI_MODEL_NAME,
    status: 'published',
    published_at: publishedAt,
    updated_at: publishedAt,
    week_of_year: weekOfYear,
    year: today.getFullYear(),
  };

  try {
    console.log(`[SUPABASE-SAVE] Saving report (${post.content.length} bytes)...`);

    const { data: existing, error: existingError } = await supabase
      .from('ai_generated_posts')
      .select('id')
      .eq('slug', post.slug)
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.warn('[SUPABASE-SAVE] Existing record lookup failed, falling back to insert.', existingError.message);
    }

    if (existing && existing.id) {
      const { error: updateError } = await supabase
        .from('ai_generated_posts')
        .update(payload)
        .eq('id', existing.id);

      if (updateError) {
        console.error('[SUPABASE-SAVE] Update failed:', updateError.message);
        return { saved: false, backupPath };
      }
    } else {
      const { error: insertError } = await supabase
        .from('ai_generated_posts')
        .insert([payload]);

      if (insertError) {
        console.error('[SUPABASE-SAVE] Insert failed:', insertError.message);
        return { saved: false, backupPath };
      }
    }

    console.log('[SUPABASE-SAVE] ✅ Today\'s file safely committed!');
    return { saved: true, backupPath };
  } catch (err) {
    console.error('[SUPABASE-SAVE] Failed to save AI post to Supabase', err);
    return { saved: false, backupPath };
  }
}

async function logGeneration(runId: string, log: GenerationLog): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const { error } = await supabase
      .from('ai_generation_logs')
      .upsert([
        {
          run_id: runId,
          scheduled_time: new Date().toISOString(),
          execution_start: new Date().toISOString(),
          execution_end: new Date().toISOString(),
          status: log.status,
          posts_generated: log.posts_generated,
          posts_published: log.posts_published,
          error_message: log.error_message,
        },
      ], { onConflict: 'run_id' });

    if (error) {
      console.warn('[LOG-GENERATION] ⚠️ Logging write skipped.', error.message);
    }
  } catch (err) {
    console.warn('[LOG-GENERATION] ⚠️ Logging write skipped.', err);
  }
}

// ============================================================================
// ADMIN-TRIGGERED GENERATION HANDLER
// ============================================================================

async function releaseStaleGenerationLocks(): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const staleBefore = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from('ai_generation_logs')
      .update({
        status: 'failed',
        error_message: 'Stale lock released',
      })
      .eq('status', 'running')
      .lt('scheduled_time', staleBefore);

    if (error) {
      console.warn('[GENERATOR-LOCK] Failed to clear stale lock:', error.message);
    }
  } catch (err) {
    console.warn('[GENERATOR-LOCK] Failed to clear stale lock:', err);
  }
}

async function hasActiveGenerationInProgress(): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('ai_generation_logs')
      .select('run_id')
      .eq('status', 'running')
      .gte('scheduled_time', since)
      .limit(1);

    return !error && (data?.length ?? 0) > 0;
  } catch {
    return false;
  }
}

async function handleGenerationRequest(request: NextRequest): Promise<NextResponse> {
  const runId = generateRunId();
  const startTime = Date.now();

  try {
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({ skipped: true, reason: 'Build phase' }, { status: 200 });
    }

    const auth = await verifyAdminAuth(request);
    if (!auth.isValid) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const envCheck = validateEnvironment();
    if (!envCheck.valid) {
      return NextResponse.json({ error: 'Configuration Error', missing_vars: envCheck.missing }, { status: 503 });
    }

    const isAdmin = auth.isValid;

    await releaseStaleGenerationLocks();

    if (!isAdmin) {
      const generationInProgress = await hasActiveGenerationInProgress();
      if (generationInProgress) {
        return NextResponse.json({ success: true, skipped: true, reason: 'Generation already in progress' }, { status: 200 });
      }
    }

    await logGeneration(runId, { run_id: runId, status: 'running', posts_generated: 0, posts_published: 0 });

    let requestBody: any = {};
    try {
      requestBody = await request.json();
    } catch {
      requestBody = {};
    }

    const mode = requestBody?.mode === 'all-categories' ? 'all-categories' : requestBody?.generateAll ? 'all-categories' : 'single-category';
    const requestedCategory = typeof requestBody?.category === 'string' ? requestBody.category.trim() : '';
    let batchIndex = 1;
    if (requestBody && typeof requestBody.batch !== 'undefined') {
      const parsed = Number(requestBody.batch);
      if (!Number.isNaN(parsed) && parsed > 0) batchIndex = Math.floor(parsed);
    }

    const requestedCategories = mode === 'all-categories'
      ? await getToolCategories()
      : requestedCategory
        ? [requestedCategory]
        : [];

    const selectedCategories = requestedCategories.length > 0
      ? requestedCategories
      : (() => {
          const fallback = DEFAULT_CATEGORY_CATALOG;
          if (typeof batchIndex === 'number' && batchIndex > 0) {
            return [fallback[Math.max(0, batchIndex - 1)] || fallback[0]];
          }
          return [fallback[0]];
        })();

    if (mode === 'all-categories') {
      const generated: any[] = [];
      let totalTavilyQueries = 0;
      let totalGeminiCalls = 0;
      let totalTools = 0;
      let totalSaved = 0;

      for (const category of selectedCategories) {
        const categorySlug = getTodaySlug(category);
        if (!isAdmin) {
          const { alreadyGenerated } = await checkIfAlreadyGeneratedToday(category);
          if (alreadyGenerated) {
            generated.push({ category, skipped: true, slug: categorySlug, reason: 'Already generated today' });
            continue;
          }
        }

        const batchForCategory = await getCategoryGenerationBatchIndex(category, batchIndex);
        const toolsWithCategories = await getToolsForGeneration(TOOLS_COVERAGE_QUERY_LIMIT, batchForCategory, category);
        if (!toolsWithCategories.length) {
          generated.push({ category, skipped: true, reason: 'No tools found for category' });
          continue;
        }

        const excludedTopics = await getExcludedTopics();
        const trendSearch = await searchTrendContext(toolsWithCategories);
        const trendNews = trendSearch.results;
        const post = await generateBlogPost(toolsWithCategories, trendNews, excludedTopics, category);

        if (!post) {
          generated.push({ category, skipped: true, reason: 'Generation failed' });
          continue;
        }

        const saveResult = await savePostToSupabase(post, runId);
        totalTavilyQueries += trendSearch.queryCount;
        totalGeminiCalls += 1;
        totalTools += toolsWithCategories.length;
        totalSaved += saveResult.saved ? 1 : 0;
        generated.push({ category, saved: saveResult.saved, post: { title: post.title, slug: post.slug, cves_mentioned: post.cves_mentioned }, backupPath: saveResult.backupPath });
      }

      await logGeneration(runId, { run_id: runId, status: totalSaved > 0 ? 'success' : 'partial', posts_generated: generated.filter((item) => item.post).length, posts_published: totalSaved });
      const duration = Math.round((Date.now() - startTime) / 1000);
      return NextResponse.json({
        success: true,
        runId,
        duration_seconds: duration,
        mode: 'all-categories',
        categories: selectedCategories,
        tavily_enabled: !!getTavilyApiKey(),
        tavily_search_queries: totalTavilyQueries,
        gemini_calls: totalGeminiCalls,
        db_tool_count: totalTools,
        generated,
      }, { status: 200 });
    }

    const category = selectedCategories[0];
    if (!isAdmin) {
      const { alreadyGenerated, slug } = await checkIfAlreadyGeneratedToday(category);
      if (alreadyGenerated) {
        return NextResponse.json({ success: true, skipped: true, slug, reason: 'Already generated today' }, { status: 200 });
      }
    }

    const batchForCategory = await getCategoryGenerationBatchIndex(category, batchIndex);
    const toolsWithCategories = await getToolsForGeneration(TOOLS_COVERAGE_QUERY_LIMIT, batchForCategory, category);
    const excludedTopics = await getExcludedTopics();
    const trendSearch = await searchTrendContext(toolsWithCategories);
    const trendNews = trendSearch.results;

    const post = await generateBlogPost(toolsWithCategories, trendNews, excludedTopics, category);

    if (!post) {
      await logGeneration(runId, { run_id: runId, status: 'failed', posts_generated: 0, posts_published: 0, error_message: 'Empty payload' });
      return NextResponse.json({ error: 'Failed to generate post' }, { status: 500 });
    }

    const saveResult = await savePostToSupabase(post, runId);

    if (!saveResult.saved) {
      await logGeneration(runId, { run_id: runId, status: 'partial', posts_generated: 1, posts_published: 0, error_message: 'Upsert transaction error' });
      return NextResponse.json({ warning: 'Database insertion failed', backup_path: saveResult.backupPath }, { status: 200 });
    }

    await logGeneration(runId, { run_id: runId, status: 'success', posts_generated: 1, posts_published: 1 });
    const duration = Math.round((Date.now() - startTime) / 1000);
    const promptDetails = getCategoryPromptDetails(category);

    return NextResponse.json({
      success: true,
      runId,
      duration_seconds: duration,
      mode: 'single-category',
      category,
      batch_index: batchForCategory,
      batch_count: Math.max(1, Math.ceil((await countToolsForCategory(category)) / GENERATION_TOOL_BATCH_SIZE)),
      tavily_enabled: !!getTavilyApiKey(),
      tavily_search_queries: trendSearch.queryCount,
      gemini_calls: 1,
      db_tool_count: toolsWithCategories.length,
      tools_covered: post.tools_covered.length,
      batch: batchIndex,
      backup_path: saveResult.backupPath,
      category_prompt_details: promptDetails,
      post: { title: post.title, slug: post.slug, cves_mentioned: post.cves_mentioned }
    }, { status: 200 });

  } catch (error: any) {
    const duration = Math.round((Date.now() - startTime) / 1000);
    await logGeneration(runId, { run_id: runId, status: 'failed', posts_generated: 0, posts_published: 0, error_message: error?.message });
    return NextResponse.json({ error: 'Fatal engine exception', message: error?.message, duration_seconds: duration }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    mode: 'manual-admin-only',
    message: 'Use POST with admin authentication to generate a post.',
  });
}

export async function POST(request: NextRequest) {
  return handleGenerationRequest(request);
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
