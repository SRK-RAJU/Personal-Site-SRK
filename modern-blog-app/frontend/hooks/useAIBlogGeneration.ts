/**
 * ============================================================================
 * AI BLOG GENERATION HOOK - FIXED & DEBUGGING ENABLED
 * ============================================================================
 * Purpose:
 * - Automatically generates AI blog posts on first deployment
 * - Checks CORRECT database table (ai_generated_posts)
 * - Includes detailed debugging and error logging
 * 
 * Tech: NextJS + Supabase + Google Gemini + Tavily
 * Cost: $0/month (100% free tier)
 * ============================================================================
 */

import { useEffect, useState, useCallback } from 'react';

// Types
interface AIGenerationState {
  isGenerating: boolean;
  isCompleted: boolean;
  isError: boolean;
  message: string;
  post?: {
    title: string;
    slug: string;
    tools_covered: string[];
    cves_mentioned: number;
  };
}

/**
 * Hook to manage AI blog generation
 * Usage: Call in your layout or home page component
 */
export function useAIBlogGeneration(autoTrigger: boolean = true) {
  const [state, setState] = useState<AIGenerationState>({
    isGenerating: false,
    isCompleted: false,
    isError: false,
    message: '',
  });

  /**
   * Check if auto-generation should run
   * - True if: (1) First deployment (no AI posts exist) OR (2) Monday 3 AM
   */
  const shouldGeneratePost = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[useAIBlogGeneration] Checking if generation needed...');

      // ✅ FIXED: Check ai_generated_posts table (not default posts table)
      const response = await fetch('/api/ai-agent/check-generation-status', {
        method: 'GET',
      });

      if (!response.ok) {
        console.warn('[useAIBlogGeneration] Check status failed:', response.status);
        return false;
      }

      const { shouldGenerate, reason } = await response.json();
      console.log('[useAIBlogGeneration] Generation check:', { shouldGenerate, reason });

      return shouldGenerate;
    } catch (err) {
      console.error('[useAIBlogGeneration] Error checking if generation needed:', err);
      return false;
    }
  }, []);

  /**
   * Trigger AI post generation
   */
  const generatePost = useCallback(async (): Promise<void> => {
    setState({
      isGenerating: true,
      isCompleted: false,
      isError: false,
      message: '🚀 Starting AI blog post generation...',
    });

    try {
      console.log('[useAIBlogGeneration] Calling /api/ai-agent/generate-post');

      const response = await fetch('/api/ai-agent/generate-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setState({
          isGenerating: false,
          isCompleted: true,
          isError: false,
          message: `✅ ${result.message} Post: "${result.post.title}"`,
          post: result.post,
        });
        console.log('[useAIBlogGeneration] ✅ Success:', result);
      } else if (response.status === 503) {
        // Configuration error - missing environment variables
        setState({
          isGenerating: false,
          isCompleted: false,
          isError: true,
          message: `❌ ${result.message}\nMissing: ${result.missing_vars?.join(', ')}`,
        });
        console.error('[useAIBlogGeneration] Configuration error:', result);
      } else if (response.status === 401) {
        setState({
          isGenerating: false,
          isCompleted: false,
          isError: true,
          message: `❌ Unauthorized - Check API keys in Vercel environment variables`,
        });
        console.error('[useAIBlogGeneration] Authorization failed:', result);
      } else {
        setState({
          isGenerating: false,
          isCompleted: false,
          isError: true,
          message: `❌ Generation failed: ${result.error || 'Unknown error'}`,
        });
        console.error('[useAIBlogGeneration] Error:', result);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setState({
        isGenerating: false,
        isCompleted: false,
        isError: true,
        message: `❌ Error: ${message}`,
      });
      console.error('[useAIBlogGeneration] Exception:', error);
    }
  }, []);

  /**
   * Auto-trigger on first deployment
   */
  useEffect(() => {
    if (!autoTrigger) return;

    const checkAndGenerate = async () => {
      const should = await shouldGeneratePost();
      if (should) {
        await generatePost();
      }
    };

    // Check immediately on mount
    checkAndGenerate();

    // Also check every hour (in case app stays open)
    const interval = setInterval(checkAndGenerate, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoTrigger, shouldGeneratePost, generatePost]);

  return {
    ...state,
    generatePost,
  };
}
