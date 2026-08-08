import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

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

export function useAIBlogGeneration() {
  const [state, setState] = useState<AIGenerationState>({
    isGenerating: false,
    isCompleted: false,
    isError: false,
    message: '',
  });

  const generatePost = useCallback(async (): Promise<void> => {
    setState({
      isGenerating: true,
      isCompleted: false,
      isError: false,
      message: '🚀 Starting AI blog post generation...',
    });

    try {
      const { data: authData, error: authError } = await supabase.auth.refreshSession();
      const session = authData.session;
      const accessToken = session?.access_token;

      if (authError || !accessToken) {
        throw new Error('Admin session required. Please sign in again.');
      }

      const response = await fetch('/api/posts/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'x-user-email': session.user.email || '',
          'x-user-role': 'admin',
        },
        body: JSON.stringify({ source: 'manual-admin' }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setState({
          isGenerating: false,
          isCompleted: true,
          isError: false,
          message: `✅ ${result.message || 'Post generated successfully'} Post: "${result.post?.title || 'AI post'}"`,
          post: result.post,
        });
      } else {
        setState({
          isGenerating: false,
          isCompleted: false,
          isError: true,
          message: `❌ Generation failed: ${result.error || 'Unknown error'}`,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setState({
        isGenerating: false,
        isCompleted: false,
        isError: true,
        message: `❌ Error: ${message}`,
      });
    }
  }, []);

  return {
    ...state,
    generatePost,
  };
}
