/**
 * ============================================================================
 * ADMIN-TRIGGERED AI BLOG GENERATION
 * ============================================================================
 */

import { tavily } from '@tavily/core';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const tvly = tavily({
  apiKey: process.env.TAVILY_API_KEY || '',
});

const AI_MODEL_NAME = process.env.AI_MODEL_NAME || 'google-gemini-2.5-flash';

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
const TOOLS_COVERAGE_QUERY_LIMIT = 200;
let LAST_SUCCESSFUL_RUN_DATE: string | null = null;
const TODAY_SLUG_PREFIX = 'devops-report';

function validateEnvironment(): { valid: boolean; missing: string[] } {
  const missing = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.DIRECT_SUPABASE_URL) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL or DIRECT_SUPABASE_URL');
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!process.env.TAVILY_API_KEY) missing.push('TAVILY_API_KEY');
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    missing.push('GOOGLE_GENERATIVE_AI_API_KEY');
  }
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
      content: result.content ? result.content.substring(0, 320) : 'No content summary available.',
      published_date: result.publishedDate,
    }));
  } catch (err) {
    console.warn('[TAVILY-SEARCH] Consolidated trend search failed, continuing with Gemini-only context.');
    return [];
  }
}

async function generateWithGoogleGemini(systemPrompt: string, context: string, model: string): Promise<string> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
  if (!apiKey) throw new Error('Google Gemini API key is missing');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`,
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

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Gemini API error: ${response.status} ${body}`);
  }

  const payload = await response.json();
  return payload.candidates?.[0]?.content?.parts?.[0]?.text || '';
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
Create one single comprehensive weekly report that covers AI providers first, then cloud infrastructure, security defenses, and operations automation.

FORMAT RULES:
- Title (# format): "Weekly DevOps & Cloud Security Report: Comprehensive Multi-Tool Analysis"
- Section headings (## format) for major themes
- Tool summaries (### format) for each tool inside its matching category
- Add a dedicated section titled "## Technology Stack" near the end of the article that groups the covered tools by category in a concise, scannable way
- Use the following order whenever possible: AI / Generative Intelligence, Cloud, Security, Operations, Other enterprise tools
- Cover major AI providers explicitly: OpenAI, Anthropic/Claude, GitHub Copilot, Google Gemini, and major enterprise AI tools
- Mention cybersecurity vendors such as Palo Alto, Zscaler, Cloudflare, and other security tools as part of the narrative
- Keep the post cohesive, with one report that ties AI, cloud, security, and operations together
- Cover as many tools from the list below as possible, grouping them into category sections instead of creating multiple posts
- When discussing CVEs, releases, bug fixes, patches, and product updates, summarize them in your own words and avoid verbatim copying of long vendor text or release notes; focus on implications, risks, and practical takeaways
- Do not reproduce large excerpts from source pages, release notes, or blog posts; keep the output original and concise

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

    const selectedModel = AI_MODEL_NAME;
    const generatedMarkdown = await generateWithGoogleGemini(systemPrompt, context, selectedModel);
    if (!generatedMarkdown) {
      throw new Error('Google Gemini returned an empty response');
    }

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    const title = `Weekly DevOps & Cloud Security Report: ${formattedDate}`;
    const slug = getTodaySlug();
    const techStackSection = buildTechnologyStackSection(toolsWithCategories);
    const contentWithTechStack = generatedMarkdown.includes('## Technology Stack')
      ? generatedMarkdown
      : `${generatedMarkdown.trim()}\n\n${techStackSection}`;
    
    const excerpt = contentWithTechStack.split('\n').find((line: string) => line.length > 50 && !line.startsWith('#'))?.substring(0, 200) || 'Ecosystem analysis.';
    const cveMatches = contentWithTechStack.match(/CVE-\d{4}-\d+/g) || [];

    return {
      title,
      slug,
      content: contentWithTechStack,
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
// ADMIN-TRIGGERED GENERATION HANDLER
// ============================================================================

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