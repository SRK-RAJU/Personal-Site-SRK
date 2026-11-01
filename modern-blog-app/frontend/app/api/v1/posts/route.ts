import { NextRequest } from 'next/server';
import { apiError, apiJson, apiOptions, isRateLimited, rateLimitResponse } from '@/lib/publicApi';
import { listPublicPosts } from '@/lib/publicPosts';
import { SITE_URL } from '@/lib/siteMeta';

export function OPTIONS() {
  return apiOptions();
}

export async function GET(request: NextRequest) {
  if (isRateLimited(request)) return rateLimitResponse();

  const params = request.nextUrl.searchParams;
  const result = await listPublicPosts({
    page: Number(params.get('page') || 1),
    limit: Number(params.get('limit') || 20),
    category: params.get('category') || '',
    q: params.get('q') || '',
  });

  if (!result.available) return apiError(503, 'The data source is temporarily unavailable.');

  return apiJson({
    data: result.posts.map((post) => ({
      title: post.title,
      slug: post.slug,
      url: `${SITE_URL}/blog/${encodeURIComponent(post.slug)}`,
      excerpt: post.excerpt,
      category: post.category,
      tools_covered: post.tools_covered,
      cves_mentioned: post.cves_mentioned,
      published_at: post.published_at,
      source: post.source,
    })),
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      total_pages: Math.max(1, Math.ceil(result.total / result.limit)),
    },
  });
}
