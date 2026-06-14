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
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    },
  }
);

const CRON_SECRET = process.env.CRON_SECRET || '';
const TOOLS_COVERAGE_QUERY_LIMIT = 100; // Load ALL 50+ tools from database
// Note: Generate ONE comprehensive post per week covering ALL tools with summaries

// ============================================================================
// ENVIRONMENT VALIDATION
// ============================================================================

/**
 * Validate all required environment variables are set
 */
function validateEnvironment(): { valid: boolean; missing: string[] } {
  const missing = [];
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    missing.push('SUPABASE_SERVICE_ROLE_KEY');
  }
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    missing.push('GOOGLE_GENERATIVE_AI_API_KEY');
  }
  if (!process.env.TAVILY_API_KEY) {
    missing.push('TAVILY_API_KEY');
  }
  
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
 * Get ALL 50+ tools from database for comprehensive weekly coverage
 * Returns tools organized by category for structured reporting
 */
async function getToolsForGeneration(): Promise<{name: string, category: string}[]> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return [
        {name: 'Kubernetes', category: 'Container/Orchestration'},
        {name: 'Docker', category: 'Container/Orchestration'},
        {name: 'AWS', category: 'Cloud Platform'},
        {name: 'Terraform', category: 'Infrastructure as Code'},
        {name: 'GitHub Actions', category: 'CI/CD Pipeline'},
      ];
    }

    // Load ALL active tools (50+) from database - ordered by category then priority
    const response = await fetch(
      `${supabaseUrl}/rest/v1/tools_coverage_metadata?is_active=eq.true&order=category.asc,priority.desc&limit=${TOOLS_COVERAGE_QUERY_LIMIT}&select=tool_name,category,priority`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    );

    if (!response.ok) {
      console.warn('[AI-BLOG] Failed to fetch tools, using fallback');
      return [
        {name: 'Kubernetes', category: 'Container/Orchestration'},
        {name: 'Docker', category: 'Container/Orchestration'},
        {name: 'AWS', category: 'Cloud Platform'},
        {name: 'Terraform', category: 'Infrastructure as Code'},
        {name: 'GitHub Actions', category: 'CI/CD Pipeline'},
      ];
    }

    const allTools = await response.json();
    if (!allTools || allTools.length === 0) {
      return [];
    }

    console.log(`[AI-BLOG] ✅ Loaded ${allTools.length} tools from database for comprehensive coverage`);
    return allTools.map((t: any) => ({name: t.tool_name, category: t.category}));
  } catch (err) {
    console.error('[AI-BLOG] Error loading tools:', err);
    return [];
  }
}

/**
 * Fetch excluded topics from last 14 days to avoid repetition
 */
async function getExcludedTopics(): Promise<ExcludedTopic[]> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return [];
    }

    const now = new Date().toISOString();
    const response = await fetch(
      `${supabaseUrl}/rest/v1/ai_excluded_topics?excluded_until=gt.${encodeURIComponent(now)}&limit=100&select=tool_name,feature_or_fix,cve_id`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
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
    // Check if Tavily API key is set
    if (!process.env.TAVILY_API_KEY) {
      console.error(`[TAVILY-SEARCH] ❌ TAVILY_API_KEY not set for tool: ${toolName}`);
      return [];
    }

    const query = `${toolName} updates releases security CVE 2024 2025 latest news`;
    
    console.log(`[TAVILY-SEARCH] Searching for ${toolName}...`);
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

    console.log(`[TAVILY-SEARCH] Found ${filteredResults.length} results for ${toolName}`);
    return filteredResults;
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[TAVILY-SEARCH] Error searching ${toolName}:`, error);
    return [];
  }
}

/**
 * Create system prompt for AI - structured for tool-wise comprehensive coverage
 */
function createSystemPrompt(
  excludedTopics: ExcludedTopic[],
  toolsWithCategories: {name: string, category: string}[]
): string {
  const excludedTopicsText = excludedTopics
    .map((t) => `- ${t.tool_name}: ${t.feature_or_fix}`)
    .join('\n');

  // Group tools by category for the prompt
  const toolsByCategory = toolsWithCategories.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool.name);
    return acc;
  }, {} as Record<string, string[]>);

  const categoryBreakdown = Object.entries(toolsByCategory)
    .map(([cat, tools]) => `- **${cat}**: ${tools.join(', ')}`)
    .join('\n');

  return `You are an expert DevOps, Cloud, and Cybersecurity technical writer.

Your task: Generate ONE comprehensive, professional blog post covering ALL 50+ enterprise tools 
with tool-wise summaries organized by category. This post covers recent updates, security vulnerabilities (CVEs), 
and best practices across the entire DevOps/Cloud/Security/AI ecosystem.

CRITICAL REQUIREMENTS:
1. COMPREHENSIVE COVERAGE: Include EVERY provided tool with a structured summary
2. ORIGINAL WRITING: Do NOT copy-paste. Rewrite everything in technical style.
3. FAIR USE: Paraphrase all content and attribute with inline markdown links
4. STRUCTURE: Organize by category, then tools within each category
5. FORMAT RULES:
   - Title (# format): "Weekly DevOps & Cloud Security Report: [Current Week]"
   - Category headings (## format)
   - Tool summaries (### format for each tool)
   - Each tool summary includes:
     * Latest Release/Update
     * Security Concern or CVE (if applicable)
     * Action Required for DevOps Teams
     * Quick reference box or code example
6. LENGTH: Target 25-30 KB, approximately 5000-6000 words (comprehensive!)
7. DEPTH: Thorough coverage of all tools, not superficial
8. TONE: Professional, informative, actionable - suitable for enterprise architects
9. ACTIONABLE: Each tool section must include specific actions DevOps teams should take

TOOLS TO COVER - ORGANIZED BY CATEGORY (${toolsWithCategories.length} total tools):
${categoryBreakdown}

ANTI-DUPLICATION - DO NOT REPEAT (from last 14 days):
${excludedTopicsText || 'None'}

Focus on NEW updates, NEW CVEs, NEW features, and NEW best practices.

OUTPUT FORMAT:
Return ONLY markdown content. Structure: # Title → ## Category → ### Tool Name → Content
No JSON, no metadata, pure markdown suitable for publishing directly.`;
}

/**
 * Generate blog post using Google Gemini + Tavily data (100% FREE)
 */
async function generateBlogPost(
  toolsWithCategories: {name: string, category: string}[],
  searchResults: Map<string, SearchResult[]>,
  excludedTopics: ExcludedTopic[]
): Promise<GeneratedPost | null> {
  try {
    // Check if Gemini API key is set
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error('[GEMINI-GENERATE] ❌ GOOGLE_GENERATIVE_AI_API_KEY not set');
      return null;
    }

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
      model: google('gemini-3.5-flash'), 
      system: systemPrompt,
      prompt: `Based on the following recent updates, write a comprehensive technical blog post:\n\n${context}`,
      temperature: 0.7,
    });

    console.log('[GEMINI-GENERATE] ✅ Generation successful');

    // Parse the generated markdown
    const title = extractTitle(generatedMarkdown);
    if (!title) {
      console.error('[GEMINI-GENERATE] ❌ Failed to extract title from generated content');
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
    const error = err instanceof Error ? err.message : 'Unknown error';
    console.error('[GEMINI-GENERATE] ❌ Error:', error);
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
 * Save generated post to Supabase using Direct Fetch API (Cloudflare bypass)
 */
async function savePostToSupabase(post: GeneratedPost): Promise<boolean> {
  const maxRetries = 3;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[SUPABASE-SAVE] Attempt ${attempt}/${maxRetries} to save post:`, {
        title: post.title,
        slug: post.slug,
        contentLength: post.content.length,
        tools: post.tools_covered.length,
        cves: post.cves_mentioned,
      });

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !serviceRoleKey) {
        console.error('[SUPABASE-SAVE] ❌ Missing credentials: SUPABASE_URL or SERVICE_ROLE_KEY');
        return false;
      }

      // Prepare payload
      const payload = {
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
      };

      // Use direct fetch with Cloudflare-friendly headers
      const response = await fetch(`${supabaseUrl}/rest/v1/ai_generated_posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Prefer': 'return=minimal',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-site',
          'Origin': process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000',
        },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get('content-type');
      const responseText = await response.text();

      // Check if we got Cloudflare HTML challenge instead of JSON
      if (contentType?.includes('text/html') || responseText.includes('<!DOCTYPE html')) {
        console.warn(`[SUPABASE-SAVE] ⚠️ Cloudflare challenge detected (attempt ${attempt}). Retrying...`);
        lastError = new Error('Cloudflare challenge received');
        
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
          continue;
        }
        return false;
      }

      // Parse response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = responseText;
      }

      // Check HTTP status
      if (!response.ok) {
        console.error('[SUPABASE-SAVE] ❌ Insert error (HTTP ' + response.status + '):', {
          status: response.status,
          statusText: response.statusText,
          data: data,
        });

        // Provide actionable error messages
        if (data?.code === '42P01' || responseText.includes('does not exist')) {
          console.error('[SUPABASE-SAVE] 🔧 FIX: Table "ai_generated_posts" does not exist. Run SQL schema setup.');
        }
        if (data?.code === '42501' || responseText.includes('insufficient privilege')) {
          console.error('[SUPABASE-SAVE] 🔧 FIX: Row Level Security (RLS) blocking insert. Disable RLS.');
        }

        lastError = new Error(`HTTP ${response.status}: ${data?.message || responseText}`);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
          continue;
        }
        return false;
      }

      console.log('[SUPABASE-SAVE] ✅ Post saved successfully (HTTP ' + response.status + ')');
      return true;

    } catch (err) {
      lastError = err;
      const error = err instanceof Error ? err.message : String(err);
      console.error(`[SUPABASE-SAVE] ❌ Exception (attempt ${attempt}):`, error);

      if (attempt < maxRetries) {
        console.log(`[SUPABASE-SAVE] 🔄 Retrying in ${Math.pow(2, attempt)}s...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        continue;
      }
    }
  }

  console.error('[SUPABASE-SAVE] ❌ All retries failed:', lastError);
  return false;
}

/**
 * Check if this is the first run (no posts in database yet)
 * Used to automatically trigger on first deployment without manual testing
 */
async function isFirstRun(): Promise<boolean> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return false;
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/ai_generated_posts?select=id&limit=1`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Accept': 'application/json',
          'Prefer': 'count=exact',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    );

    if (!response.ok) {
      return false;
    }

    const countHeader = response.headers.get('content-range');
    if (!countHeader) {
      return false;
    }

    const count = parseInt(countHeader.split('/')[1], 10);
    return count === 0;
  } catch (err) {
    return false;
  }
}

/**
 * Log generation execution (with Cloudflare bypass)
 */
async function logGeneration(
  runId: string,
  log: GenerationLog
): Promise<void> {
  try {
    console.log('[LOG-GENERATION] Logging generation status:', log.status);
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.warn('[LOG-GENERATION] ⚠️ Missing credentials - skipping log');
      return;
    }

    const payload = {
      run_id: runId,
      scheduled_time: new Date().toISOString(),
      execution_start: new Date().toISOString(),
      execution_end: new Date().toISOString(),
      status: log.status,
      posts_generated: log.posts_generated,
      posts_published: log.posts_published,
      error_message: log.error_message,
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/ai_generation_logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'return=minimal',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log('[LOG-GENERATION] ✅ Generation logged successfully');
    } else {
      console.warn('[LOG-GENERATION] ⚠️ Failed to log (HTTP ' + response.status + ')');
    }
  } catch (err) {
    console.warn('[LOG-GENERATION] ⚠️ Exception logging generation:', err);
  }
}

// ============================================================================
// MAIN API HANDLER
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const runId = generateRunId();
  const startTime = Date.now();

  try {
    // ✅ VALIDATE ENVIRONMENT VARIABLES FIRST
    const envCheck = validateEnvironment();
    if (!envCheck.valid) {
      console.error('[AI-BLOG] Missing environment variables:', envCheck.missing);
      const duration = Math.round((Date.now() - startTime) / 1000);
      
      return NextResponse.json(
        {
          error: 'Configuration Error',
          message: `Missing required environment variables: ${envCheck.missing.join(', ')}`,
          details: 'Please add these to Vercel dashboard → Environment Variables',
          missing_vars: envCheck.missing,
          duration_seconds: duration,
        },
        { status: 503 }
      );
    }

    // Security: Verify Cron Secret OR allow first-run auto-generation OR allow from app
    const authHeader = request.headers.get('authorization') || '';
    const isFirstRunGeneration = await isFirstRun();
    const cronSecret = process.env.CRON_SECRET;
    const hasValidSecret = cronSecret && cronSecret.length > 0 && verifyCronSecret(authHeader);
    
    // Check if call is from app (user-agent check)
    const userAgent = request.headers.get('user-agent') || '';
    const isFromApp = userAgent.includes('Mozilla') || userAgent.includes('Chrome') || userAgent === 'Vercel-Internal-Cron';
    
    console.log(`[AI-BLOG] POST Request - FirstRun: ${isFirstRunGeneration}, ValidSecret: ${hasValidSecret}, FromApp: ${isFromApp}, SecretLength: ${cronSecret?.length || 0}`);
    
    // Allow if: (1) Valid cron secret OR (2) First deployment (auto-test) OR (3) Called directly from app
    if (!hasValidSecret && !isFirstRunGeneration && !isFromApp) {
      console.error(`[AI-BLOG] Authorization failed. CronSecret set: ${!!cronSecret}, HeaderSecret: ${!!authHeader}`);
      return NextResponse.json(
        { error: 'Unauthorized', details: 'Missing or invalid CRON_SECRET' },
        { status: 401 }
      );
    }

    // Get configuration
    console.log('[AI-BLOG] ⏭️ Getting tools list...');
    const toolsWithCategories = await getToolsForGeneration();
    console.log(`[AI-BLOG] ✅ Loaded ${toolsWithCategories.length} tools for comprehensive coverage`);

    console.log('[AI-BLOG] ⏭️ Getting excluded topics...');
    const excludedTopics = await getExcludedTopics();
    console.log('[AI-BLOG] ✅ Excluded topics:', excludedTopics.length);
    
    // Log execution type
    const executionType = isFirstRunGeneration ? 'FIRST_RUN_AUTO' : 'SCHEDULED_CRON';
    console.log(`[AI-BLOG] 🚀 Execution type: ${executionType}`);

    // Search for updates - search for each tool
    console.log('[AI-BLOG] ⏭️ Searching for tool updates across all tools...');
    const searchResults = new Map<string, SearchResult[]>();
    for (const toolWithCategory of toolsWithCategories) {
      const results = await searchToolUpdates(toolWithCategory.name, excludedTopics);
      if (results.length > 0) {
        searchResults.set(toolWithCategory.name, results);
      }
    }
    console.log(`[AI-BLOG] ✅ Found updates for ${searchResults.size}/${toolsWithCategories.length} tools`);

    // Generate comprehensive blog post covering ALL tools
    console.log('[AI-BLOG] ⏭️ Generating comprehensive blog post with ALL tools...');
    const post = await generateBlogPost(toolsWithCategories, searchResults, excludedTopics);

    if (!post) {
      const log: GenerationLog = {
        run_id: runId,
        status: 'failed',
        posts_generated: 0,
        posts_published: 0,
        error_message: 'Failed to generate post',
      };
      await logGeneration(runId, log);

      console.error('[AI-BLOG] ❌ Post generation failed');
      return NextResponse.json(
        { error: 'Failed to generate post' },
        { status: 500 }
      );
    }

    console.log(`[AI-BLOG] ✅ Post generated: "${post.title}"`);

    // Save to database
    console.log('[AI-BLOG] ⏭️ Saving to Supabase...');
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

      console.error('[AI-BLOG] ⚠️ Post generated but save failed');
      console.error('[AI-BLOG] 🔧 SETUP: Run SUPABASE_SETUP.sql in Supabase SQL Editor');
      console.error('[AI-BLOG] 🔧 CHECK: Verify ai_generated_posts table exists');
      console.error('[AI-BLOG] 🔧 CHECK: Check Supabase RLS policies (should be disabled for testing)');
      
      return NextResponse.json(
        {
          warning: 'Post generated but failed to save to database',
          error: 'Failed to save post to Supabase',
          solution: 'Run SUPABASE_SETUP.sql in Supabase Dashboard → SQL Editor',
          post: { 
            title: post.title, 
            slug: post.slug,
            contentLength: post.content.length,
            tools: post.tools_covered,
          },
          debug: 'Check console logs for detailed Supabase error (look for [SUPABASE-SAVE] messages)',
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

    console.log(`[AI-BLOG] ✅ SUCCESS! Post saved in ${duration}s`);

    return NextResponse.json(
      {
        success: true,
        executionType: isFirstRunGeneration ? 'FIRST_RUN_AUTO_TEST' : 'SCHEDULED_CRON',
        message: isFirstRunGeneration 
          ? '✅ First deployment auto-test successful! Post generated immediately. Then runs every Monday at 3 AM UTC.'
          : '✅ Scheduled cron job executed successfully.',
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
