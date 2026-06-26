import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { tavily } from '@tavily/core';
import { createClient } from '@supabase/supabase-js';
import { slugify } from '@/lib/ai-utils';
import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// VERCEL COMPILER INSTRUCTIONS
// ============================================================================
export const dynamic = 'force-dynamic';

// ============================================================================
// CONFIGURATION & INITIALIZATION
// ============================================================================

const tvly = tavily({
  apiKey: process.env.TAVILY_API_KEY || '',
});

const targetDbUrl = process.env.DIRECT_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';

const supabase = createClient(
  targetDbUrl,
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
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.DIRECT_SUPABASE_URL) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL or DIRECT_SUPABASE_URL');
  }
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

async function getToolsForGeneration(): Promise<{name: string, category: string}[]> {
  try {
    const { data, error } = await supabase
      .from('tools_coverage_metadata')
      .select('tool_name, category')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .limit(TOOLS_COVERAGE_QUERY_LIMIT);

    if (error || !data) return [];
    return data.map((t: any) => ({name: t.tool_name, category: t.category}));
  } catch (err) {
    return [];
  }
}

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

async function searchEcosystemTrend(): Promise<SearchResult[]> {
  try {
    if (!process.env.TAVILY_API_KEY) return [];
    console.log(`[TAVILY-SEARCH] Gathering collective macro CVE vulnerabilities news...`);
    const response = await tvly.search("DevOps Cloud Security releases vulnerabilities CVE latest news", {
      days: 7,
      max_results: 3,
      include_answer: false,
    });

    return (response.results || []).map((result: any) => ({
      title: result.title,
      url: result.url,
      content: result.content,
      published_date: result.published_date,
    }));
  } catch (err) {
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
    const { text: generatedMarkdown } = await generateText({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      prompt: `Synthesize a comprehensive report mapping current tech shifts to these tracking vectors using the following global telemetry context:\n\n${context}`,
      temperature: 0.6,
    });

    const formattedDate = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    const title = `Weekly DevOps & Cloud Security Report: ${formattedDate}`;
    const slug = `devops-report-${slugify(formattedDate)}`;
    
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

function extractTitle(markdown: string): string | null {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

async function savePostToSupabase(post: GeneratedPost): Promise<boolean> {
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
      console.error('[SUPABASE-SAVE] ❌ Database Upsert Error:', error.message);
      return false;
    }
    console.log('[SUPABASE-SAVE] ✅ Today\'s data safely committed/overwritten!');
    return true;
  } catch (err) {
    return false;
  }
}

async function logGeneration(runId: string, log: GenerationLog): Promise<void> {
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
// MAIN ROUTE EXPORT
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const runId = generateRunId();
  const startTime = Date.now();

  try {
    // 🛡️ SHIELD 1: NEXT.JS COMPILATION BUILD-TIME SHIELD
    // If Vercel tries to run code checks or compile paths while processing deployment builds, 
    // it exits immediately without invoking database variables or executing search tokens.
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({ message: 'Shield active: build phase compile ignored.' }, { status: 200 });
    }

    const envCheck = validateEnvironment();
    if (!envCheck.valid) {
      return NextResponse.json({ error: 'Configuration Error', missing_vars: envCheck.missing }, { status: 503 });
    }

    // 🔒 GUARD 1: CRON AUTHORIZATION SECRET VALIDATION
    const authHeader = request.headers.get('authorization') || '';
    const hasValidSecret = verifyCronSecret(authHeader);
    
    if (!hasValidSecret) {
      return NextResponse.json({ error: 'Unauthorized route access attempt.' }, { status: 401 });
    }

    const toolsWithCategories = await getToolsForGeneration();
    const excludedTopics = await getExcludedTopics();
    const trendNews = await searchEcosystemTrend();

    const post = await generateBlogPost(toolsWithCategories, trendNews, excludedTopics);

    if (!post) {
      await logGeneration(runId, { run_id: runId, status: 'failed', posts_generated: 0, posts_published: 0, error_message: 'Empty serialization matrix string output' });
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
    return NextResponse.json({ error: 'Fatal compilation exception', message: error?.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Apply Build Shield to GET method handler context as well
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({ message: 'Shield active: build phase compile ignored.' }, { status: 200 });
  }

  const searchParams = request.nextUrl.searchParams;
  const isTest = searchParams.get('test') === 'true';
  const secret = searchParams.get('secret');

  if (!isTest || secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Invalid verification parameters.' }, { status: 400 });
  }
  return POST(request);
}