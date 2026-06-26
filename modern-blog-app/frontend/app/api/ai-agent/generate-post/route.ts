/**
 * ============================================================================
 * AI BLOGGING PIPELINE - MAIN API ROUTE (PRODUCTION)
 * ============================================================================
 * File: app/api/ai-agent/generate-post/route.ts
 *
 * Purpose:
 * - Handles weekly Vercel Cron requests to generate DevOps/Security blog posts
 * - Executes every Monday at 3 AM UTC
 * - Uses Google Gemini AI for content generation (100% FREE)
 * - Uses Tavily AI API for global news/updates search (1000/month FREE)
 * - Implements anti-duplication via Supabase excluded topics
 * - Stores generated posts in Supabase with metadata
 *
 * Tech Stack:
 * - @google/generative-ai (LLM provider - FREE)
 * - tavily-js (web search client - FREE)
 * - @supabase/supabase-js (database - FREE tier)
 *
 * Monthly Cost: $0 (100% free tier services)
 * ============================================================================
 */
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { tavily } from '@tavily/core';
import { createClient } from '@supabase/supabase-js';
import { slugify } from '@/lib/ai-utils';
import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// CONFIGURATION & INITIALIZATION
// ============================================================================

const tvly = tavily({
  apiKey: process.env.TAVILY_API_KEY || '',
});

// ✅ IPPUDU IDHI NEE WORKER URL (https://api.rjexa.com) NI VADUTHUNDHI
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  }
);

const CRON_SECRET = process.env.CRON_SECRET || '';
const TOOLS_COVERAGE_QUERY_LIMIT = 100;

// ============================================================================
// ENVIRONMENT VALIDATION
// ============================================================================

function validateEnvironment(): { valid: boolean; missing: string[] } {
  const missing = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) missing.push('GOOGLE_GENERATIVE_AI_API_KEY');
  if (!process.env.TAVILY_API_KEY) missing.push('TAVILY_API_KEY');
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

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

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function verifyCronSecret(authorization: string): boolean {
  const headerSecret = authorization?.split(' ')[1];
  return CRON_SECRET !== '' && headerSecret === CRON_SECRET;
}

function generateRunId(): string {
  return `ai-blog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 🛠️ GET TOOLS FUNCTION USING SDK (CLEAN & SECURE)
async function getToolsForGeneration(): Promise<{name: string, category: string}[]> {
  try {
    const { data, error } = await supabase
      .from('tools_coverage_metadata')
      .select('tool_name, category')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('priority', { ascending: false })
      .limit(TOOLS_COVERAGE_QUERY_LIMIT);

    if (error || !data) {
      console.warn('[AI-BLOG] Failed to fetch tools via SDK, using fallback');
      return [
        {name: 'Kubernetes', category: 'Container/Orchestration'},
        {name: 'Docker', category: 'Container/Orchestration'},
        {name: 'AWS', category: 'Cloud Platform'},
        {name: 'Terraform', category: 'Infrastructure as Code'},
        {name: 'GitHub Actions', category: 'CI/CD Pipeline'},
      ];
    }

    console.log(`[AI-BLOG] ✅ Loaded ${data.length} tools via custom domain worker.`);
    return data.map((t: any) => ({name: t.tool_name, category: t.category}));
  } catch (err) {
    console.error('[AI-BLOG] Error loading tools:', err);
    return [];
  }
}

// 🛠️ GET EXCLUDED TOPICS USING SDK
async function getExcludedTopics(): Promise<ExcludedTopic[]> {
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

// 🛠️ FIX TAVILY RATE LIMITS: ADDED PACING DELAY (400ms) BETWEEN LOOPS
async function searchToolUpdates(
  toolName: string,
  excludedTopics: ExcludedTopic[],
  searchAttempt: number = 0
): Promise<SearchResult[]> {
  try {
    if (!process.env.TAVILY_API_KEY) return [];

    // 💡 100 tools cycle low rate limit lock avvakunda 400ms sleep algorithm
    await new Promise(resolve => setTimeout(resolve, 400));

    const query = `${toolName} updates releases security CVE 2025 2026 latest news`;
    console.log(`[TAVILY-SEARCH] Searching for ${toolName}...`);
    
    const response = await tvly.search(query, {
      days: 7,
      max_results: 2, 
      include_answer: false,
    });

    return (response.results || [])
      .filter((result: any) => {
        const resultText = `${result.title} ${result.content}`.toLowerCase();
        return !excludedTopics.some(
          (excluded) =>
            excluded.tool_name.toLowerCase() === toolName.toLowerCase() &&
            resultText.includes(excluded.feature_or_fix.toLowerCase())
        );
      })
      .map((result: any) => ({
        title: result.title,
        url: result.url,
        content: result.content,
        published_date: result.published_date,
      }));
  } catch (err) {
    console.error(`[TAVILY-SEARCH] Error searching ${toolName}:`, err);
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
Generate ONE comprehensive, professional blog post covering ALL provided enterprise tools with tool-wise summaries organized by category.

FORMAT RULES:
- Title (# format): "Weekly DevOps & Cloud Security Report: [Current Week]"
- Category headings (## format)
- Tool summaries (### format for each tool)

TOOLS TO COVER:
${categoryBreakdown}

ANTI-DUPLICATION:
${excludedTopicsText || 'None'}

Return ONLY pure markdown.`;
}

async function generateBlogPost(
  toolsWithCategories: {name: string, category: string}[],
  searchResults: Map<string, SearchResult[]>,
  excludedTopics: ExcludedTopic[]
): Promise<GeneratedPost | null> {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) return null;

    const systemPrompt = createSystemPrompt(excludedTopics, toolsWithCategories);
    const toolNames = toolsWithCategories.map(t => t.name);

    let context = 'RECENT UPDATES AND RESEARCH:\n\n';
    for (const [tool, results] of searchResults) {
      context += `### ${tool} Recent News:\n`;
      results.forEach((result, idx) => {
        context += `${idx + 1}. **${result.title}**\n   - Source: ${result.url}\n   - Content: ${result.content.substring(0, 300)}...\n\n`;
      });
    }

    console.log('[GEMINI-GENERATE] Calling Google Gemini API...');
    const { text: generatedMarkdown } = await generateText({
      model: google('gemini-2.5-flash'), // Updated engine standard
      system: systemPrompt,
      prompt: `Based on the following recent updates, write a comprehensive technical blog post:\n\n${context}`,
      temperature: 0.7,
    });

    const title = extractTitle(generatedMarkdown);
    if (!title) return null;

    const slug = slugify(title);
    const excerpt = generatedMarkdown.split('\n').find((line: string) => line.length > 50 && !line.startsWith('#'))?.substring(0, 200) || 'AI insights.';
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
    console.error('[GEMINI-GENERATE] ❌ Error:', err);
    return null;
  }
}

function extractTitle(markdown: string): string | null {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

// 🛠️ FIX CLOUDFLARE 403 BLOCKS ON UPLOAD: REMOVED RAW FETCH SPOOF HEADERS & USED OFFICIAL SDK
async function savePostToSupabase(post: GeneratedPost): Promise<boolean> {
  try {
    console.log(`[SUPABASE-SAVE] Attempting to insert massive post (${post.content.length} bytes) safely via API Worker route...`);

    const { error } = await supabase
      .from('ai_generated_posts')
      .insert([{
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
      }]);

    if (error) {
      console.error('[SUPABASE-SAVE] ❌ SDK Insert Error via Worker:', error.message);
      return false;
    }

    console.log('[SUPABASE-SAVE] ✅ Post payload accepted and saved successfully!');
    return true;
  } catch (err) {
    console.error('[SUPABASE-SAVE] ❌ Exception tracking stream payload:', err);
    return false;
  }
}

async function isFirstRun(): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from('ai_generated_posts')
      .select('*', { count: 'exact', head: true });

    if (error || count === null) return false;
    return count === 0;
  } catch (err) {
    return false;
  }
}

// 🛠️ LOG GENERATION USING CLEAN EXPLICIT CLIENT RUNS
async function logGeneration(runId: string, log: GenerationLog): Promise<void> {
  try {
    const { error } = await supabase
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

    if (error) console.warn('[LOG-GENERATION] ⚠️ Logging error:', error.message);
    else console.log('[LOG-GENERATION] ✅ Execution states tracked inside logs.');
  } catch (err) {
    console.warn('[LOG-GENERATION] ⚠️ Tracking error exceptions:', err);
  }
}

// ============================================================================
// MAIN API HANDLER (POST)
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const runId = generateRunId();
  const startTime = Date.now();

  try {
    const envCheck = validateEnvironment();
    if (!envCheck.valid) {
      return NextResponse.json({ error: 'Configuration Error', missing_vars: envCheck.missing }, { status: 503 });
    }

    const authHeader = request.headers.get('authorization') || '';
    const isFirstRunGeneration = await isFirstRun();
    const hasValidSecret = verifyCronSecret(authHeader);
    const userAgent = request.headers.get('user-agent') || '';
    const isFromApp = userAgent.includes('Mozilla') || userAgent.includes('Chrome') || userAgent === 'Vercel-Internal-Cron';
    
    if (!hasValidSecret && !isFirstRunGeneration && !isFromApp) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const toolsWithCategories = await getToolsForGeneration();
    const excludedTopics = await getExcludedTopics();
    const searchResults = new Map<string, SearchResult[]>();
    
    let searchAttempt = 0;
    for (const toolWithCategory of toolsWithCategories) {
      const results = await searchToolUpdates(toolWithCategory.name, excludedTopics, searchAttempt);
      if (results.length > 0) {
        searchResults.set(toolWithCategory.name, results);
      }
      searchAttempt++;
    }

    const post = await generateBlogPost(toolsWithCategories, searchResults, excludedTopics);

    if (!post) {
      await logGeneration(runId, { run_id: runId, status: 'failed', posts_generated: 0, posts_published: 0, error_message: 'Generation payload returned empty' });
      return NextResponse.json({ error: 'Failed to generate post' }, { status: 500 });
    }

    const saved = await savePostToSupabase(post);

    if (!saved) {
      await logGeneration(runId, { run_id: runId, status: 'partial', posts_generated: 1, posts_published: 0, error_message: 'Post generated but network proxy validation failed on saving' });
      return NextResponse.json({ warning: 'Cloud WAF processing anomaly, verify logs', post: { title: post.title, slug: post.slug } }, { status: 200 });
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
    return NextResponse.json({ error: 'Fatal compilation issue', message: error?.message, duration_seconds: duration }, { status: 500 });
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const isTest = searchParams.get('test') === 'true';
  const secret = searchParams.get('secret');

  if (!isTest || secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Invalid payload context structural parameters' }, { status: 400 });
  }
  return POST(request);
}