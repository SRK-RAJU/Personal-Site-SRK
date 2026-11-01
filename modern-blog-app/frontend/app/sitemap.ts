import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

// Regenerate hourly so new AI posts reach search engines without a redeploy.
export const revalidate = 3600;

const PAGE_SIZE = 1000;
const MAX_PAGES = 10;

function getSupabase() {
  const url = process.env.DIRECT_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || /placeholder|YOUR_|your_project_id|your-project|yourdomain\.com/i.test(url + key)) {
    return null;
  }

  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function getPostEntries(baseUrl: string): Promise<MetadataRoute.Sitemap> {
  const supabase: any = getSupabase();
  if (!supabase) return [];

  const bySlug = new Map<string, MetadataRoute.Sitemap[number]>();

  try {
    for (const table of ['ai_generated_posts', 'posts'] as const) {
      for (let page = 0; page < MAX_PAGES; page += 1) {
        let query: any = supabase.from(table).select('slug, published_at');
        query = table === 'posts'
          ? query.eq('published', true)
          : query.in('status', ['published', 'live', 'active', '']);

        const { data, error } = await query
          .order('published_at', { ascending: false })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (error) console.warn(`[sitemap] ${table} query failed:`, error.message);
        if (error || !data) break;

        for (const row of data as Array<{ slug?: string | null; published_at?: string | null; updated_at?: string | null }>) {
          const slug = typeof row.slug === 'string' ? row.slug.trim() : '';
          if (!slug || bySlug.has(slug)) continue;

          const modified = new Date(row.updated_at || row.published_at || Date.now());
          bySlug.set(slug, {
            url: `${baseUrl}/blog/${encodeURIComponent(slug)}`,
            lastModified: Number.isNaN(modified.getTime()) ? new Date() : modified,
            changeFrequency: 'weekly',
            priority: 0.7,
          });
        }

        if (data.length < PAGE_SIZE) break;
      }
    }
  } catch {
    // A database problem must never break the static part of the sitemap.
  }

  return Array.from(bySlug.values());
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rjexa.com';
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tools`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/images`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/sitemap-page`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  const postEntries = await getPostEntries(baseUrl);
  return [...staticEntries, ...postEntries];
}
