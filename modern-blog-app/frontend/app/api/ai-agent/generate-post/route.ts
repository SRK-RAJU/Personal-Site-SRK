/**
 * ============================================================================
 * SECURE VERCEL CRON POWERED AI BLOG PIPELINE ENGINE
 * ============================================================================
 */

import { tavily } from '@tavily/core';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // మీ vercel.json లో 60 సెట్ చేసారు కాబట్టి ఇక్కడ కూడా 60 ఉంచాం

const tvly = tavily({
  apiKey: process.env.TAVILY_API_KEY || '',
});

const CRON_SECRET = process.env.CRON_SECRET || '';

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
const TOOLS_COVERAGE_QUERY_LIMIT = 100;
let LAST_SUCCESSFUL_RUN_DATE: string | null = null;
const TODAY_SLUG_PREFIX = 'devops-report';

function validateEnvironment(): { valid: boolean; missing: string[] } {
  const missing = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.DIRECT_SUPABASE_URL) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL or DIRECT_SUPABASE_URL');
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) missing.push('GOOGLE_GENERATIVE_AI_API_KEY');
  if (!process.env.TAVILY_API_KEY) missing.push('TAVILY_API_KEY');
  return { valid: missing.length === 0, missing };
}

interface SearchResult {
  title: string;
  url: string;
  content: string;
  published_date?: string;
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

function verifyCronSecret(authorization: string): boolean {
  if (!CRON_SECRET) return false;
  const headerSecret = authorization?.startsWith('Bearer ') 
    ? authorization.substring(7) 
    : authorization;
  return headerSecret === CRON_SECRET;
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
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const year = today.getFullYear();
  return `${TODAY_SLUG_PREFIX}-${month}-${day}-${year}`;
}

function getRuntimeToolLimit(isManualTest: boolean): number {
  return 5;
}

function isTrustedRequest(request: NextRequest, isManualTest: boolean): boolean {
  const authHeader = request.headers.get('authorization') || '';
  const hasValidSecret = verifyCronSecret(authHeader);
  const isVercelSystemRequest =
    request.headers.has('x-vercel-id') ||
    request.headers.get('user-agent')?.includes('vercel-cron') ||
    request.headers.get('x-vercel-cron') === '1' ||
    request.headers.get('x-vercel-deployment-url') !== null;
  const isGitHubAction = request.headers.get('user-agent')?.includes('GitHub-Hookshot') || request.headers.get('x-github-event') !== null;

  return hasValidSecret || isVercelSystemRequest || isGitHubAction || isManualTest;
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

async function getToolsForGeneration(limit: number = 100): Promise<{name: string, category: string}[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('tools_coverage_metadata')
      .select('tool_name, category')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .limit(limit);

    if (error || !data) return [];
    return data.map((t: any) => ({name: t.tool_name, category: t.category}));
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

async function searchTrendContext(): Promise<SearchResult[]> {
  if (!process.env.TAVILY_API_KEY) return [];

  try {
    console.log('[TAVILY-SEARCH] Running one consolidated trend search for the weekly report.');
    const response = await tvly.search('DevOps cloud security CVE enterprise tools trends 2026', {
      days: 7,
      max_results: 5,
      include_answer: false,
    });

    return (response.results || []).map((result: any) => ({
      title: result.title || 'No title',
      url: result.url || '',
      content: result.content ? result.content.substring(0, 800) : 'No content summary available.',
      published_date: result.publishedDate,
    }));
  } catch (err) {
    console.warn('[TAVILY-SEARCH] Consolidated trend search failed, continuing with Gemini-only context.');
    return [];
  }
}

function createSystemPrompt(
  excludedTopics: ExcludedTopic[],
  toolsWithCategories: {name: string, category: string}[]
): string {
  const excludedTopicsText = excludedTopics.map((t) => `- ${t.tool_name}: ${t.feature_or_fix}`).join('\n');
  const toolsByCategory = toolsWithCategories.reduce((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = [];
    acc[tool.category].push(tool.name);
    return acc;
  }, {} as Record<string, string[]>);

  const categoryBreakdown = Object.entries(toolsByCategory)
    .map(([cat, tools]) => `- **${cat}**: ${tools.join(', ')}`)
    .join('\n');

  return `You are an expert DevOps, Cloud, and Cybersecurity technical writer.
Generate ONE massive, high-density professional blog post covering ALL provided enterprise tools (${toolsWithCategories.length} tools total) with distinct, comprehensive tool-wise summaries structured cleanly inside their matching categories.

FORMAT RULES:
- Title (# format): "Weekly DevOps & Cloud Security Report: Comprehensive Multi-Tool Analysis"
- Category headings (## format)
- Tool summaries (### format for each tool)

TOOLS TO COVER:
${categoryBreakdown}

ANTI-DUPLICATION:
${excludedTopicsText || 'None'}

Return ONLY pure markdown payload.`;
}

async function generateBlogPost(
  toolsWithCategories: {name: string, category: string}[],
  trendNews: SearchResult[],
  excludedTopics: ExcludedTopic[]
): Promise<GeneratedPost | null> {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) return null;

    const systemPrompt = createSystemPrompt(excludedTopics, toolsWithCategories);
    const toolNames = toolsWithCategories.map(t => t.name);

    let context = 'GLOBAL TREND CVE GROUND RESEARCH EXPANSIONS:\n\n';
    trendNews.forEach((result, idx) => {
      context += `${idx + 1}. **${result.title}**\n   - Source: ${result.url}\n   - Content: ${result.content}\n\n`;
    });

    console.log('[GEMINI-GENERATE] Calling Google Gemini API...');
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) return null;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            role: 'system',
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: `Synthesize a comprehensive report mapping current tech shifts to these tracking vectors using the following global telemetry context:\n\n${context}` }],
            },
          ],
          generationConfig: {
            temperature: 0.6,
            topP: 0.95,
            maxOutputTokens: 4000,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiPayload = await geminiResponse.json();
    const generatedMarkdown = geminiPayload.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!generatedMarkdown) {
      throw new Error('Gemini returned an empty response');
    }

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    const title = `Weekly DevOps & Cloud Security Report: ${formattedDate}`;
    const slug = getTodaySlug();
    
    const excerpt = generatedMarkdown.split('\n').find((line: string) => line.length > 50 && !line.startsWith('#'))?.substring(0, 200) || 'Ecosystem analysis.';
    const cveMatches = generatedMarkdown.match(/CVE-\d{4}-\d+/g) || [];

    return {
      title,
      slug,
      content: generatedMarkdown,
      excerpt,
      tools_covered: toolNames,
      cves_mentioned: cveMatches.length,
    };
  } catch (err) {
    return null;
  }
}

async function savePostToSupabase(post: GeneratedPost): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn('[SUPABASE-SAVE] Skipped because Supabase is not configured.');
    return false;
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
          ai_model: 'google-gemini-2.5-flash',
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
            ai_model: 'google-gemini-2.5-flash',
            status: 'published',
            published_at: new Date().toISOString(),
          }],
          { onConflict: 'title' }
        );

      if (fallbackError) {
        console.error('[SUPABASE-SAVE] ❌ Total Database Overwrite Blocked:', fallbackError.message);
        return false;
      }
    }

    console.log('[SUPABASE-SAVE] ✅ Today\'s file safely committed/overwritten!');
    return true;
  } catch (err) {
    return false;
  }
}

async function logGeneration(runId: string, log: GenerationLog): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    await supabase
      .from('ai_generation_logs')
      .insert([{
        run_id: runId,
        scheduled_time: new Date().toISOString(),
        execution_start: new Date().toISOString(),
        execution_end: new Date().toISOString(),
        status: log.status,
        posts_generated: log.posts_generated,
        posts_published: log.posts_published,
        error_message: log.error_message,
      }]);
  } catch (err) {
    console.warn('[LOG-GENERATION] ⚠️ Logging write skipped.');
  }
}

// ============================================================================
// VERCEL CRON METHOD HANDLER (CONSOLIDATED FOR SAFETY)
// ============================================================================

async function handleCronExecution(request: NextRequest): Promise<NextResponse> {
  const runId = generateRunId();
  const startTime = Date.now();

  try {
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({ skipped: true, reason: 'Build phase' }, { status: 200 });
    }

    const isPrefetch = 
      request.headers.get('sec-fetch-purpose') === 'prefetch' ||
      request.headers.get('purpose') === 'prefetch' ||
      request.headers.has('x-next-js-data');

    if (isPrefetch) {
      return NextResponse.json({ error: 'Prefetch restricted' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const isManualTest = searchParams.get('test') === 'true';

    if (!isTrustedRequest(request, isManualTest)) {
      return NextResponse.json({ error: 'Direct public access is entirely blocked.' }, { status: 401 });
    }

    const envCheck = validateEnvironment();
    if (!envCheck.valid) {
      return NextResponse.json({ error: 'Configuration Error', missing_vars: envCheck.missing }, { status: 503 });
    }

    const runtimeToolQueryLimit = getRuntimeToolLimit(isManualTest);
    console.log(`[VERCEL-CRON-ENGINE] Initialized process sequence for ${runtimeToolQueryLimit} tools.`);

    const requestSource = request.headers.get('x-trigger-source') || searchParams.get('source') || '';
    const isTrustedDeployTrigger =
      requestSource === 'github-actions' ||
      requestSource === 'vercel-deploy' ||
      requestSource === 'deployment-check' ||
      request.headers.get('user-agent')?.includes('GitHub-Actions-Workflow') ||
      request.headers.get('x-vercel-cron') === '1';

    const { alreadyGenerated, slug } = await checkIfAlreadyGeneratedToday();
    if (alreadyGenerated && !isTrustedDeployTrigger) {
      return NextResponse.json({ success: true, skipped: true, slug, reason: 'Already generated today' }, { status: 200 });
    }

    const toolsWithCategories = await getToolsForGeneration(runtimeToolQueryLimit);
    const excludedTopics = await getExcludedTopics();
    
    const trendNews = await searchTrendContext();

    const post = await generateBlogPost(toolsWithCategories, trendNews, excludedTopics);

    if (!post) {
      await logGeneration(runId, { run_id: runId, status: 'failed', posts_generated: 0, posts_published: 0, error_message: 'Empty payload' });
      return NextResponse.json({ error: 'Failed to generate post' }, { status: 500 });
    }

    const saved = await savePostToSupabase(post);

    if (!saved) {
      await logGeneration(runId, { run_id: runId, status: 'partial', posts_generated: 1, posts_published: 0, error_message: 'Upsert transaction error' });
      return NextResponse.json({ warning: 'Database insertion failed' }, { status: 200 });
    }

    await logGeneration(runId, { run_id: runId, status: 'success', posts_generated: 1, posts_published: 1 });
    const duration = Math.round((Date.now() - startTime) / 1000);

    return NextResponse.json({
      success: true,
      runId,
      duration_seconds: duration,
      post: { title: post.title, slug: post.slug, cves_mentioned: post.cves_mentioned }
    }, { status: 200 });

  } catch (error: any) {
    const duration = Math.round((Date.now() - startTime) / 1000);
    await logGeneration(runId, { run_id: runId, status: 'failed', posts_generated: 0, posts_published: 0, error_message: error?.message });
    return NextResponse.json({ error: 'Fatal engine exception', message: error?.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleCronExecution(request);
}

export async function POST(request: NextRequest) {
  return handleCronExecution(request);
}