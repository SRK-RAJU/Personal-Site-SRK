import { apiJson, apiOptions } from '@/lib/publicApi';
import { SITE_NAME, SITE_URL } from '@/lib/siteMeta';

export function OPTIONS() {
  return apiOptions();
}

const errorResponse = {
  description: 'Error',
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
};

const pageParam = { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } };

export async function GET() {
  const spec = {
    openapi: '3.1.0',
    info: {
      title: `${SITE_NAME} public API`,
      version: '1.0.0',
      description:
        'Read-only API access to weekly AI-assisted reports and the tool catalog. API access does not grant reproduction or redistribution rights. See the terms on the developers page.',
      termsOfService: `${SITE_URL}/developers#terms`,
    },
    servers: [{ url: SITE_URL }],
    paths: {
      '/api/v1/posts': {
        get: {
          summary: 'List published reports (newest first)',
          parameters: [
            pageParam,
            { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 50, default: 20 } },
            { name: 'category', in: 'query', description: 'Exact category name, case-insensitive.', schema: { type: 'string', maxLength: 100 } },
            { name: 'q', in: 'query', description: 'Text to find in the title.', schema: { type: 'string', maxLength: 100 } },
          ],
          responses: {
            '200': {
              description: 'A page of reports',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { type: 'array', items: { $ref: '#/components/schemas/Post' } },
                      meta: { $ref: '#/components/schemas/Pagination' },
                    },
                  },
                },
              },
            },
            '429': errorResponse,
            '503': errorResponse,
          },
        },
      },
      '/api/v1/posts/{slug}': {
        get: {
          summary: 'Get one report including its markdown',
          parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': {
              description: 'The report',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/PostDetail' },
                      attribution: { type: 'object' },
                    },
                  },
                },
              },
            },
            '404': errorResponse,
            '429': errorResponse,
          },
        },
      },
      '/api/v1/categories': {
        get: {
          summary: 'List the tool categories',
          parameters: [{ name: 'include', in: 'query', description: 'Use "tools" to include every tool of each category.', schema: { type: 'string', enum: ['tools'] } }],
          responses: {
            '200': {
              description: 'Categories',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { type: 'array', items: { $ref: '#/components/schemas/Category' } },
                      meta: {
                        type: 'object',
                        properties: {
                          categories: { type: 'integer' },
                          catalog_entries: { type: 'integer' },
                          distinct_tools: { type: 'integer' },
                        },
                      },
                    },
                  },
                },
              },
            },
            '429': errorResponse,
          },
        },
      },
    },
    components: {
      schemas: {
        Post: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            slug: { type: 'string' },
            url: { type: 'string', format: 'uri' },
            excerpt: { type: 'string' },
            category: { type: 'string' },
            tools_covered: { type: 'array', items: { type: 'string' } },
            cves_mentioned: { type: 'integer' },
            published_at: { type: 'string', format: 'date-time' },
            source: { type: 'string', enum: ['ai', 'manual'] },
          },
        },
        PostDetail: {
          allOf: [
            { $ref: '#/components/schemas/Post' },
            {
              type: 'object',
              properties: {
                tags: { type: 'array', items: { type: 'string' } },
                updated_at: { type: ['string', 'null'], format: 'date-time' },
                read_time_minutes: { type: ['integer', 'null'] },
                content_markdown: { type: 'string' },
              },
            },
          ],
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            total_pages: { type: 'integer' },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            tool_count: { type: 'integer' },
            docs_url: { type: 'string', format: 'uri' },
            tools: { type: 'array', items: { type: 'object' } },
          },
        },
        Error: {
          type: 'object',
          properties: { error: { type: 'object', properties: { status: { type: 'integer' }, message: { type: 'string' } } } },
        },
      },
    },
  };

  return apiJson(spec, { maxAge: 3600, staleWhileRevalidate: 86400 });
}
