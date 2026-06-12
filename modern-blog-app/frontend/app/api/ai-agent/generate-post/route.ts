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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const CRON_SECRET = process.env.CRON_SECRET || '';
const TOOLS_COVERAGE_QUERY_LIMIT = 10;

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

/**
 * Verify Cron Secret (security check from Vercel)
 */
function verifyCronSecret(authorization: string): boolean {
  const headerSecret = authorization?.split(' ')[1];
  return CRON_SECRET !== '' && headerSecret === CRON_SECRET;
}

/**
 * Generate unique run ID for tracking
 */
function generateRunId(): string {
  return `ai-blog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get list of tools to cover this week (round-robin through tools_coverage_metadata)
 */
async function getToolsForGeneration(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('tools_coverage_metadata')
      .select('tool_name, priority')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(TOOLS_COVERAGE_QUERY_LIMIT);

    if (error) {
      return ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'GitHub Actions'];
    }

    return (data || []).map((t: any) => t.tool_name);
  } catch (err) {
    return ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'GitHub Actions'];
  }
}

/**
 * Fetch excluded topics from last 14 days to avoid repetition
 */
async function getExcludedTopics(): Promise<ExcludedTopic[]> {
  try {
    const { data, error } = await supabase
      .from('ai_excluded_topics')
      .select('tool_name, feature_or_fix, cve_id')
      .gt('excluded_until', new Date().toISOString())
      .limit(100);

    if (error) {
      return [];
    }

    return (data || []) as ExcludedTopic[];
  } catch (err) {
    return [];
  }
}

/**
 * Search for recent updates on a tool using Tavily
 */
async function searchToolUpdates(
  toolName: string,
  excludedTopics: ExcludedTopic[]
): Promise<SearchResult[]> {
  try {
    const query = `${toolName} updates releases security CVE 2024 2025 latest news`;
    
    const response = await tvly.search(query, {
      days: 7, // Last 7 days only
      max_results: 5,
      include_answer: true,
    });

    // Filter results based on excluded topics
    const filteredResults = (response.results || [])
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

    return filteredResults;
  } catch (err) {
    return [];
  }
}

/**
 * Create system prompt for AI with anti-duplication context
 */
function createSystemPrompt(
  excludedTopics: ExcludedTopic[],
  toolsList: string[]
): string {
  const excludedTopicsText = excludedTopics
    .map((t) => `- ${t.tool_name}: ${t.feature_or_fix}`)
    .join('\n');

  return `You are an expert DevOps, Cloud, and Cybersecurity technical writer.

Your task: Generate a professional, original blog post covering recent updates, security vulnerabilities (CVEs), 
and best practices in DevOps, Cloud Computing, Cybersecurity, and AI/Automation.

CRITICAL REQUIREMENTS:
1. ORIGINAL WRITING: Do NOT copy-paste from sources. Rewrite everything in your own technical style.
2. FAIR USE: Every statement must be paraphrased and attributed with inline markdown links.
3. STRUCTURE: Use clear sections (### Heading format) for each tool/topic.
4. FORMAT: Output MUST be valid Markdown. Include:
   - Title (# format)
   - Table of contents (optional)
   - Tool sections with: Latest Release, Security Concern/CVE, Action Required
   - Source attribution links at the end of each section
5. LENGTH: Target 15-20 KB, approximately 3000-4000 words
6. TONE: Professional, informative, actionable - suitable for enterprise DevOps engineers
7. COVERAGE: Include at least 8-10 different tools/topics

TOOLS TO COVER THIS WEEK: ${toolsList.join(', ')}

ANTI-DUPLICATION - DO NOT REPEAT THESE TOPICS (from last 14 days):
${excludedTopicsText || 'None'}

Focus on NEW updates, NEW CVEs, and NEW features that weren't covered recently.

OUTPUT FORMAT:
Return ONLY the markdown content. No JSON, no metadata, pure markdown.
Start with # (main title) and use ## for tool sections.`;
}

/**
 * Generate blog post using Google Gemini + Tavily data (100% FREE)
 */
async function generateBlogPost(
  toolNames: string[],
  searchResults: Map<string, SearchResult[]>,
  excludedTopics: ExcludedTopic[]
): Promise<GeneratedPost | null> {
  try {
    const systemPrompt = createSystemPrompt(excludedTopics, toolNames);

    let context = 'RECENT UPDATES AND RESEARCH:\n\n';
    for (const [tool, results] of searchResults) {
      context += `### ${tool} Recent News:\n`;
      results.forEach((result, idx) => {
        context += `${idx + 1}. **${result.title}**\n   - Source: ${result.url}\n   - Content: ${result.content.substring(0, 300)}...\n\n`;
      });
    }

    const { text: generatedMarkdown } = await generateText({
      model: google('gemini-3.5-flash'),
      system: systemPrompt,
      prompt: `Based on the following recent updates, write a comprehensive technical blog post:\n\n${context}`,
      temperature: 0.7,
      maxTokens: 3000,
    });

    // Parse the generated markdown
    const title = extractTitle(generatedMarkdown);
    if (!title) {
      return null;
    }

    const slug = slugify(title);
    const excerpt = generatedMarkdown
      .split('\n')
      .find((line: string) => line.length > 50 && !line.startsWith('#'))
      ?.substring(0, 200) || 'AI-generated DevOps and Security insights.';

    // Count CVEs mentioned
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

/**
 * Extract title from markdown (first # heading)
 */
function extractTitle(markdown: string): string | null {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

/**
 * Save generated post to Supabase
 */
async function savePostToSupabase(post: GeneratedPost): Promise<boolean> {
  try {
    const { error } = await supabase.from('ai_generated_posts').insert({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      category: 'DevOps',
      tags: post.tools_covered,
      tools_covered: post.tools_covered,
      cves_mentioned: post.cves_mentioned,
      ai_model: 'google-gemini-3.5-flash',
      status: 'published',
      published_at: new Date().toISOString(),
    });

    if (error) {
      return false;
    }

    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Log generation execution
 */
async function logGeneration(
  runId: string,
  log: GenerationLog
): Promise<void> {
  try {
    await supabase.from('ai_generation_logs').insert({
      run_id: runId,
      scheduled_time: new Date().toISOString(),
      execution_start: new Date().toISOString(),
      execution_end: new Date().toISOString(),
      status: log.status,
      posts_generated: log.posts_generated,
      posts_published: log.posts_published,
      error_message: log.error_message,
    });
  } catch (err) {
    // Silent fail - logging handled by Vercel
  }
}

// ============================================================================
// MAIN API HANDLER
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const runId = generateRunId();
  const startTime = Date.now();

  try {
    // Security: Verify Cron Secret
    const authHeader = request.headers.get('authorization') || '';
    if (!verifyCronSecret(authHeader)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get configuration
    const toolsList = await getToolsForGeneration();
    const excludedTopics = await getExcludedTopics();

    // Search for updates
    const searchResults = new Map<string, SearchResult[]>();
    for (const tool of toolsList) {
      const results = await searchToolUpdates(tool, excludedTopics);
      if (results.length > 0) {
        searchResults.set(tool, results);
      }
    }

    // Generate blog post
    const post = await generateBlogPost(toolsList, searchResults, excludedTopics);

    if (!post) {
      const log: GenerationLog = {
        run_id: runId,
        status: 'failed',
        posts_generated: 0,
        posts_published: 0,
        error_message: 'Failed to generate post',
      };
      await logGeneration(runId, log);

      return NextResponse.json(
        { error: 'Failed to generate post' },
        { status: 500 }
      );
    }

    // Save to database
    const saved = await savePostToSupabase(post);

    if (!saved) {
      const log: GenerationLog = {
        run_id: runId,
        status: 'partial',
        posts_generated: 1,
        posts_published: 0,
        error_message: 'Post generated but failed to save',
      };
      await logGeneration(runId, log);

      return NextResponse.json(
        {
          warning: 'Post generated but failed to save',
          post: { title: post.title, slug: post.slug },
        },
        { status: 200 }
      );
    }

    // Log success
    const duration = Math.round((Date.now() - startTime) / 1000);
    const log: GenerationLog = {
      run_id: runId,
      status: 'success',
      posts_generated: 1,
      posts_published: 1,
    };
    await logGeneration(runId, log);

    return NextResponse.json(
      {
        success: true,
        runId,
        duration_seconds: duration,
        post: {
          title: post.title,
          slug: post.slug,
          tools_covered: post.tools_covered,
          cves_mentioned: post.cves_mentioned,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const duration = Math.round((Date.now() - startTime) / 1000);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    const log: GenerationLog = {
      run_id: runId,
      status: 'failed',
      posts_generated: 0,
      posts_published: 0,
      error_message: errorMessage,
    };
    await logGeneration(runId, log);

    return NextResponse.json(
      {
        error: 'Generation failed',
        message: errorMessage,
        duration_seconds: duration,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// OPTIONAL: GET endpoint for manual triggering (testing)
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Add ?test=true&secret=XXXX to manually trigger
  const searchParams = request.nextUrl.searchParams;
  const isTest = searchParams.get('test') === 'true';
  const secret = searchParams.get('secret');

  if (!isTest || secret !== CRON_SECRET) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }

  // Forward to POST handler
  return POST(request);
}
