import { NextRequest } from 'next/server';
import { apiError, apiJson, apiOptions, isRateLimited, rateLimitResponse } from '@/lib/publicApi';
import { getPublicPost } from '@/lib/publicPosts';
import { SITE_NAME, SITE_URL } from '@/lib/siteMeta';

export function OPTIONS() {
  return apiOptions();
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (isRateLimited(request)) return rateLimitResponse();

  const { slug } = await params;
  const post = await getPublicPost(slug);
  if (!post) return apiError(404, 'Post not found.');

  const url = `${SITE_URL}/blog/${encodeURIComponent(post.slug)}`;
  return apiJson({
    data: {
      title: post.title,
      slug: post.slug,
      url,
      excerpt: post.excerpt,
      category: post.category,
      tools_covered: post.tools_covered,
      cves_mentioned: post.cves_mentioned,
      tags: post.tags,
      published_at: post.published_at,
      updated_at: post.updated_at,
      read_time_minutes: post.read_time_minutes,
      source: post.source,
      content_markdown: post.content,
    },
    attribution: {
      permission_required_for_republication: true,
      credit: SITE_NAME,
      link: url,
      terms: `${SITE_URL}/developers#terms`,
    },
  });
}
