/**
 * ============================================================================
 * AI BLOG GENERATION HOOK - Direct Integration into React App
 * ============================================================================
 * Purpose:
 * - Automatically generates AI blog posts on first deployment
 * - Runs directly in React app (no Vercel cron needed)
 * - Can be manually triggered from UI
 * - Generates every Monday at 3 AM if running continuously
 * 
 * Tech: NextJS + Supabase + Google Gemini + Tavily
 * Cost: $0/month (100% free tier)
 * ============================================================================
 */

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

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
   * - True if: (1) First deployment (no posts exist) OR (2) Monday 3 AM
   */
  const shouldGeneratePost = useCallback(async (): Promise<boolean> => {
    try {
      // Check if any posts exist
      const response = await fetch('/api/posts?limit=1');
      const { data } = await response.json();

      // First deployment - no posts exist
      if (!data || data.length === 0) {
        console.log('✅ First deployment detected - will auto-generate post');
        return true;
      }

      // Check if it's Monday 3 AM UTC
      const now = new Date();
      const isMonday = now.getUTCDay() === 1;
      const is3AM = now.getUTCHours() === 3;

      if (isMonday && is3AM) {
        console.log('⏰ Monday 3 AM detected - will auto-generate post');
        return true;
      }

      return false;
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
