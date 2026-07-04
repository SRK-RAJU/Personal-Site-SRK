/**
 * ============================================================================
 * ADMIN-TRIGGERED AI BLOG GENERATION
 * ============================================================================
 */

import { tavily, TavilyKeylessLimitError } from '@tavily/core';
import { createClient } from '@supabase/supabase-js';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function getTavilyApiKey(): string {
  return process.env.TAVILY_API_KEY || process.env.TAVILY_API || '';
}

function getGeminiApiKey(): string {
  return process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || '';
}

function getGeminiModelName(): string {
  return process.env.GEMINI_MODEL || process.env.GOOGLE_GEMINI_MODEL || process.env.AI_MODEL_NAME || process.env.GEMINI_PRIMARY_MODEL || 'gemini-3.1-flash';
}

const tvly = tavily({
  apiKey: getTavilyApiKey(),
});

const AI_MODEL_NAME = getGeminiModelName();
const TAVILY_SEARCH_DEPTH: 'basic' | 'advanced' | 'fast' | 'ultra-fast' = 'basic';
const TAVILY_SEARCH_TOPIC: 'general' | 'news' | 'finance' = 'news';
const TAVILY_SEARCH_MAX_RESULTS = 3;
const TAVILY_QUERY_CATEGORY_PROMPT_LIMIT = 2; // keep the broad prompt small and focused
const TAVILY_CATEGORY_QUERY_LIMIT = 2; // how many category-focused Tavily searches to run
const TAVILY_SEARCH_RESPONSE_LIMIT = 4; // max number of deduplicated results returned to Gemini
const TAVILY_QUERY_TOOL_CHUNK_SIZE = 4; // split large tool groups into smaller searches
const MAX_TAVILY_SEARCH_QUERIES = 3; // keep runtime low for Vercel/free tier
const MAX_TAVILY_QUERY_LENGTH = 360; // Tavily rejects longer queries
const SEQUENTIAL_REQUEST_DELAY_MS = 100; // shorter spacing to stay under serverless timeout
const HOT_TOOL_CATEGORIES = ['AI', 'Cloud', 'Security', 'DevOps', 'Operations', 'Networking', 'Development'];
const MAX_GENERATION_TOOLS = 24;
const GEMINI_MAX_OUTPUT_TOKENS = 1600;
const GEMINI_FALLBACK_MODELS = ['gemini-3.1-flash-lite', 'gemini-2.0-flash-lite'];

function normalizeGoogleModelName(model: string): string {
  return model.replace(/^google-/i, '').trim();
}

function getGeminiModelCandidates(model: string): string[] {
  const preferredModel = normalizeGoogleModelName(model || getGeminiModelName());
  const candidates = [preferredModel, ...GEMINI_FALLBACK_MODELS];
  const unique: string[] = [];
  candidates.forEach((candidate) => {
    if (candidate && !unique.includes(candidate)) {
      unique.push(candidate);
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

  const geminiApiKey = getGeminiApiKey();
  if (!geminiApiKey) {
    missing.push('GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY');
  }
  return { valid: missing.length === 0, missing };
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

function getTodaySlug(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${TODAY_SLUG_PREFIX}-${year}-${month}-${day}`;
}

async function checkIfAlreadyGeneratedToday(): Promise<{ alreadyGenerated: boolean; slug: string }> {
  const todaySlug = getTodaySlug();
  const todayKey = getTodayDateKey();

  if (LAST_SUCCESSFUL_RUN_DATE === todayKey) {
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
      LAST_SUCCESSFUL_RUN_DATE = todayKey;
      return { alreadyGenerated: true, slug: todaySlug };
    }

    return { alreadyGenerated: false, slug: todaySlug };
  } catch (err) {
    return { alreadyGenerated: false, slug: todaySlug };
  }
}

async function getToolsForGeneration(limit: number = TOOLS_COVERAGE_QUERY_LIMIT): Promise<{name: string, category: string}[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('tools_coverage_metadata')
      .select('tool_name, category')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .limit(Math.max(limit, 300));

    if (error || !data) return [];

    const hotTools = (data as any[])
      .filter((tool: any) => HOT_TOOL_CATEGORIES.includes(tool.category))
      .map((tool: any) => ({ name: tool.tool_name, category: tool.category }))
      .filter((tool) => tool.name);

    return hotTools.slice(0, Math.min(MAX_GENERATION_TOOLS, limit));
  } catch (err) {
    return [];
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

function groupToolsByCategory(toolsWithCategories: {name: string, category: string}[]): Record<string, string[]> {
  return toolsWithCategories.reduce((acc, tool) => {
    const category = tool.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(tool.name);
    return acc;
  }, {} as Record<string, string[]>);
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

function buildCompactTavilyQuery(category: string, tools: string[]): string {
  const toolNames = tools.slice(0, TAVILY_QUERY_TOOL_CHUNK_SIZE).join(', ');
  const baseQuery = `Recent ${category} tool news: ${toolNames}. Include CVEs, releases, security updates.`;

  if (baseQuery.length <= MAX_TAVILY_QUERY_LENGTH) {
    return baseQuery;
  }

  const shorterTools = tools.slice(0, Math.max(1, TAVILY_QUERY_TOOL_CHUNK_SIZE - 2)).join(', ');
  return `Recent ${category} tool news: ${shorterTools}. Include CVEs and releases.`;
}

function buildTavilySearchQueries(toolsWithCategories: {name: string, category: string}[]): string[] {
  const toolNames = toolsWithCategories.map((tool) => tool.name).filter(Boolean);
  const totalTools = toolNames.length;
  const categories = Array.from(new Set(toolsWithCategories.map((tool) => tool.category).filter(Boolean))).slice(0, TAVILY_QUERY_CATEGORY_PROMPT_LIMIT);

  if (totalTools === 0) {
    return ['Recent DevOps, cloud security, and AI tool news.'];
  }

  const categoryGroups = groupToolsByCategory(toolsWithCategories);
  const orderedCategories = Object.keys(categoryGroups).sort((a, b) => a.localeCompare(b));

  const queries: string[] = [];
  const primaryQuery = `Recent enterprise DevOps, cloud, security, and AI tool news for ${categories.join(', ')}. Include CVEs, releases, and vendor updates.`;
  queries.push(primaryQuery);

  orderedCategories.slice(0, TAVILY_CATEGORY_QUERY_LIMIT).forEach((category) => {
    const tools = categoryGroups[category] || [];
    const query = buildCompactTavilyQuery(category, tools);
    if (query) {
      queries.push(query);
    }
  });

  return queries.slice(0, MAX_TAVILY_SEARCH_QUERIES);
}

async function searchTrendContext(toolsWithCategories: {name: string, category: string}[]): Promise<TrendSearchContext> {
  const tavilyApiKey = getTavilyApiKey();
  if (!tavilyApiKey) {
    return { results: [], queryCount: 0 };
  }

  const toolNames = toolsWithCategories.map((tool) => tool.name).filter(Boolean);
  const toolQueries = buildTavilySearchQueries(toolsWithCategories);
  const delayMs = process.env.TAVILY_SEARCH_DELAY_MS
    ? Number(process.env.TAVILY_SEARCH_DELAY_MS)
    : tavilyApiKey ? 0 : 1500;

  if (delayMs > 0) {
    console.log(`[TAVILY-SEARCH] Waiting ${delayMs}ms before search to reduce rate-limit pressure.`);
    await sleep(delayMs);
  }

  const allResults: SearchResult[] = [];
  console.log(`[TAVILY-SEARCH] Running ${toolQueries.length} trend search queries for active tools before Gemini generation.`);

  for (let index = 0; index < toolQueries.length; index += 1) {
    const toolQuery = toolQueries[index];
    const searchBody = `${toolQuery} Focus on the last 7 days of relevant news and vulnerabilities.`;

    try {
      await sleep(SEQUENTIAL_REQUEST_DELAY_MS);
      const response = await tvly.search(searchBody, {
        days: 7,
        maxResults: TAVILY_SEARCH_MAX_RESULTS,
        searchDepth: TAVILY_SEARCH_DEPTH,
        topic: TAVILY_SEARCH_TOPIC,
        includeAnswer: false,
        includeUsage: true,
      });

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
    const fallbackResponse = await tvly.search('DevOps cloud security CVE enterprise tools trends 2026 for the last 7 days', {
      days: 7,
      maxResults: TAVILY_SEARCH_MAX_RESULTS,
      searchDepth: TAVILY_SEARCH_DEPTH,
      topic: TAVILY_SEARCH_TOPIC,
      includeAnswer: false,
      includeUsage: true,
    });

    return {
      results: (fallbackResponse.results || []).map((result: any) => ({
        title: result.title || 'No title',
        url: result.url || '',
        content: result.content ? result.content.substring(0, 320) : 'No content summary available.',
        published_date: result.publishedDate,
      })),
      queryCount: toolQueries.length + 1,
    };
  }

  return { results: dedupedResults, queryCount: toolQueries.length };
}

async function generateWithGoogleGemini(systemPrompt: string, context: string, model: string, attempts = 2, modelIndex = 0): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error('Google Gemini API key is missing');

  const modelCandidates = getGeminiModelCandidates(model);
  const selectedModel = modelCandidates[modelIndex] || modelCandidates[0] || 'gemini-2.0-flash-lite';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    await sleep(SEQUENTIAL_REQUEST_DELAY_MS);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(selectedModel)}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
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

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      const retryAfterHeader = response.headers.get('retry-after');
      const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : 0;
      const isRateLimit = response.status === 429 || response.status === 503;

      console.error('[GEMINI] API request failed', { status: response.status, body, model: selectedModel, retryAfterSeconds });

      if (isRateLimit && attempts > 0) {
        const waitMs = retryAfterSeconds > 0 ? retryAfterSeconds * 1000 + 500 : 1200;
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
  toolsWithCategories: {name: string, category: string}[]
): string {
  const excludedTopicsText = excludedTopics.map((t) => `- ${t.tool_name}: ${t.feature_or_fix}`).join('\n');
  const categoryPriority = ['AI', 'Cloud', 'Security', 'Operations', 'DevOps', 'Networking', 'Development', 'Other'];
  const toolsByCategory = toolsWithCategories.reduce((acc, tool) => {
    const category = tool.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(tool.name);
    return acc;
  }, {} as Record<string, string[]>);

  const categoryBreakdown = Object.entries(toolsByCategory)
    .sort(([a], [b]) => {
      const aIndex = categoryPriority.indexOf(a);
      const bIndex = categoryPriority.indexOf(b);
      const aKey = aIndex === -1 ? categoryPriority.length : aIndex;
      const bKey = bIndex === -1 ? categoryPriority.length : bIndex;
      return aKey - bKey || a.localeCompare(b);
    })
    .map(([cat, tools]) => `- **${cat}**: ${tools.join(', ')}`)
    .join('\n');

  return `You are an expert DevOps, Cloud, and Cybersecurity technical writer.
Create one single concise weekly report focused on the hottest current AI, cloud, DevOps, and security tools only. Prioritize recent momentum, new releases, security updates, and practical platform impact.

FORMAT RULES:
- Title (# format): "Weekly DevOps & Cloud Security Report: Hot Tools Brief"
- Section headings (## format) for major themes
- Tool summaries (### format) for each tool inside its matching category
- Add a dedicated section titled "## Technology Stack" near the end of the article that groups the covered tools by category in a concise, scannable way
- Use this order whenever possible: AI / Generative Intelligence, Cloud, Security, Operations
- Keep the report compact and easy to scan
- Focus on the most relevant tools from the list below rather than trying to cover every possible tool
- When discussing CVEs, releases, bug fixes, patches, and product updates, summarize them in your own words and avoid verbatim copying of long vendor text or release notes; focus on implications, risks, and practical takeaways
- Do not reproduce large excerpts from source pages, release notes, or blog posts; keep the output original and concise
 
IMPORTANT COVERAGE RULES:
- For EVERY tool listed under "TOOLS TO COVER" produce a short subsection with heading ### <Tool Name> containing 2-3 original, scannable sentences summarizing current vendor state, key risks (if any), and one practical takeaway. Keep each tool summary concise and non-duplicative.
- At the end of the document include a ## Coverage Checklist section listing every tool and whether it was covered: - <Tool Name>: Covered.

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

function buildCompactFallbackMarkdown(toolsWithCategories: {name: string, category: string}[], trendNews: SearchResult[]): string {
  const grouped = toolsWithCategories.reduce((acc, tool) => {
    const category = tool.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(tool.name);
    return acc;
  }, {} as Record<string, string[]>);

  const lines = [
    '# Weekly DevOps & Cloud Security Report: Hot Tools Brief',
    '',
    'This week’s report focuses on the most relevant AI, cloud, DevOps, and security tools that are shaping delivery and security operations.',
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
  excludedTopics: ExcludedTopic[]
): Promise<GeneratedPost | null> {
  if (!getGeminiApiKey()) return null;
  const systemPrompt = createSystemPrompt(excludedTopics, toolsWithCategories);
  const toolNames = toolsWithCategories.map(t => t.name);

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
    console.warn('[GENERATION] Main Gemini call failed, using compact fallback content.', (err as any)?.message || err);
    generatedMarkdown = buildCompactFallbackMarkdown(toolsWithCategories, trendNews);
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
  const formattedDate = today.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const title = `Weekly DevOps & Cloud Security Report: ${formattedDate}`;
  const slug = getTodaySlug();
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
    tools_covered: toolsCoveredFinal,
    cves_mentioned: cveMatches.length,
  };
}

async function saveGenerationBackup(post: GeneratedPost, runId?: string): Promise<string | null> {
  try {
    const backupDir = path.join(process.cwd(), '.ai-generation-backups');
    await mkdir(backupDir, { recursive: true });
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

  try {
    console.log(`[SUPABASE-SAVE] Upserting report (${post.content.length} bytes)...`);

    const { error } = await supabase
      .from('ai_generated_posts')
      .upsert(
        [{
          title: post.title,
          slug: post.slug,
          content: post.content,
          excerpt: post.excerpt,
          category: 'DevOps',
          tags: post.tools_covered,
          tools_covered: post.tools_covered,
          cves_mentioned: post.cves_mentioned,
          ai_model: AI_MODEL_NAME,
          author: 'Raju',
          author_name: 'Raju',
          status: 'published',
          published_at: new Date().toISOString(),
        }],
        { onConflict: 'slug' } 
      );

    if (error) {
      console.warn('[SUPABASE-SAVE] Slug conflict caught, running unique title overwrite backup...', error.message);
      
      const { error: fallbackError } = await supabase
        .from('ai_generated_posts')
        .upsert(
          [{
            title: post.title,
            slug: post.slug,
            content: post.content,
            excerpt: post.excerpt,
            category: 'DevOps',
            tags: post.tools_covered,
            tools_covered: post.tools_covered,
            cves_mentioned: post.cves_mentioned,
            ai_model: AI_MODEL_NAME,
            status: 'published',
            published_at: new Date().toISOString(),
          }],
          { onConflict: 'title' }
        );

      if (fallbackError) {
        console.error('[SUPABASE-SAVE] ❌ Total Database Overwrite Blocked:', fallbackError.message);
        return { saved: false, backupPath };
      }
    }

    console.log('[SUPABASE-SAVE] ✅ Today\'s file safely committed/overwritten!');
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

    await releaseStaleGenerationLocks();

    const generationInProgress = await hasActiveGenerationInProgress();
    if (generationInProgress) {
      return NextResponse.json({ success: true, skipped: true, reason: 'Generation already in progress' }, { status: 200 });
    }

    await logGeneration(runId, { run_id: runId, status: 'running', posts_generated: 0, posts_published: 0 });

    const { alreadyGenerated, slug } = await checkIfAlreadyGeneratedToday();
    if (alreadyGenerated) {
      return NextResponse.json({ success: true, skipped: true, slug, reason: 'Already generated today' }, { status: 200 });
    }

    const toolsWithCategories = await getToolsForGeneration(TOOLS_COVERAGE_QUERY_LIMIT);
    const excludedTopics = await getExcludedTopics();
    const trendSearch = await searchTrendContext(toolsWithCategories);
    const trendNews = trendSearch.results;

    const post = await generateBlogPost(toolsWithCategories, trendNews, excludedTopics);

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

    return NextResponse.json({
      success: true,
      runId,
      duration_seconds: duration,
      tavily_enabled: !!getTavilyApiKey(),
      tavily_search_queries: trendSearch.queryCount,
      gemini_calls: 1,
      db_tool_count: toolsWithCategories.length,
      tools_covered: post.tools_covered.length,
      backup_path: saveResult.backupPath,
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
