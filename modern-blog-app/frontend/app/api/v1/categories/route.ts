import { NextRequest } from 'next/server';
import { apiJson, apiOptions, isRateLimited, rateLimitResponse } from '@/lib/publicApi';
import { getCategories } from '@/lib/toolCatalog';
import { SITE_URL } from '@/lib/siteMeta';

export function OPTIONS() {
  return apiOptions();
}

/** Static catalog (no database access). Add ?include=tools to get every tool of every category. */
export async function GET(request: NextRequest) {
  if (isRateLimited(request)) return rateLimitResponse();

  const includeTools = request.nextUrl.searchParams.get('include') === 'tools';
  const categories = getCategories();

  return apiJson(
    {
      data: categories.map((category) => ({
        id: category.id,
        name: category.name,
        tool_count: category.tools.length,
        docs_url: `${SITE_URL}/docs/${category.id}`,
        ...(includeTools
          ? {
              tools: category.tools.map((tool) => ({
                name: tool.name,
                description: tool.description,
                official_url: tool.officialUrl || null,
                docs_urls: tool.docsUrls,
                tags: tool.tags,
              })),
            }
          : {}),
      })),
      meta: {
        categories: categories.length,
        catalog_entries: categories.reduce((sum, category) => sum + category.tools.length, 0),
        distinct_tools: new Set(categories.flatMap((category) => category.tools.map((tool) => tool.name.toLowerCase()))).size,
      },
    },
    { maxAge: 86400, staleWhileRevalidate: 604800 }
  );
}
