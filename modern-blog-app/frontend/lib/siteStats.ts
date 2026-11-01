import { getServiceClient, type ServiceClient } from '@/lib/supabaseServer';
import { getCatalogTotals } from '@/lib/toolCatalog';

export interface SiteStats {
  articles: number;
  monthly_views: number;
  topics: number;
  total_visits: number;
  countries_reached: number;
}

export const EMPTY_STATS: SiteStats = {
  articles: 0,
  monthly_views: 0,
  topics: 0,
  total_visits: 0,
  countries_reached: 0,
};

const PUBLISHED_STATUSES = ['published', 'live', 'active', ''];

type Supabase = ServiceClient;

/** Row count of a table, or null when the table/column is missing (so "unknown" is never shown as 0). */
async function countRows(supabase: Supabase, table: string, apply?: (query: any) => any): Promise<number | null> {
  try {
    let query: any = supabase.from(table).select('*', { count: 'exact', head: true });
    if (apply) query = apply(query);
    const { count, error } = await query;
    if (error || typeof count !== 'number') return null;
    return count;
  } catch {
    return null;
  }
}

async function sumColumn(supabase: Supabase, table: string, column: string): Promise<number | null> {
  try {
    const { data, error } = await supabase.from(table).select(column).not(column, 'is', null);
    if (error || !Array.isArray(data)) return null;
    return (data as unknown as Array<Record<string, unknown>>).reduce((sum, row) => sum + (Number(row[column]) || 0), 0);
  } catch {
    return null;
  }
}

async function distinctCountries(supabase: Supabase): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('visitor_logs')
      .select('country')
      .not('country', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5000);
    if (error || !Array.isArray(data)) return 0;
    const countries = new Set(
      (data as Array<{ country?: string | null }>)
        .map((row) => (row.country || '').trim())
        .filter((country) => country && country !== 'Unknown')
    );
    return countries.size;
  } catch {
    return 0;
  }
}

async function storedStats(supabase: Supabase): Promise<SiteStats> {
  try {
    const { data } = await supabase.from('website_stats').select('*').eq('id', 1).maybeSingle();
    return {
      articles: Number(data?.articles || 0),
      monthly_views: Number(data?.monthly_views || 0),
      topics: Number(data?.topics || 0),
      total_visits: Number(data?.total_visits || 0),
      countries_reached: 0,
    };
  } catch {
    return { ...EMPTY_STATS };
  }
}

/**
 * Real site numbers, computed from the tables that actually hold the data.
 * (The old code counted the empty `posts` table instead of `ai_generated_posts`, and its `topics` fallback
 * sat in a `catch` that never ran because Supabase returns errors instead of throwing them.)
 */
export async function getSiteStats(options: { extraViews?: number } = {}): Promise<SiteStats> {
  // The catalog that seeds the database is also bundled with the app, so "tools covered" is never shown as 0.
  const catalogTools = getCatalogTotals().tools;

  const supabase = getServiceClient();
  if (!supabase) return { ...EMPTY_STATS, topics: catalogTools };

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [stored, aiPosts, manualPosts, tools, viewCount, visitCount, last30Days, countries] = await Promise.all([
    storedStats(supabase),
    countRows(supabase, 'ai_generated_posts', (q) => q.in('status', PUBLISHED_STATUSES)),
    countRows(supabase, 'posts', (q) => q.eq('published', true)),
    countRows(supabase, 'tools_coverage_metadata', (q) => q.eq('is_active', true)),
    sumColumn(supabase, 'page_analytics', 'view_count'),
    sumColumn(supabase, 'page_analytics', 'visit_count'),
    countRows(supabase, 'visitor_logs', (q) => q.gte('created_at', since)),
    distinctCountries(supabase),
  ]);

  const pageViews = (viewCount ?? visitCount ?? 0) + (options.extraViews || 0);

  return {
    articles: Math.max(stored.articles, (aiPosts ?? 0) + (manualPosts ?? 0)),
    topics: Math.max(stored.topics, tools ?? 0, catalogTools),
    total_visits: Math.max(stored.total_visits, pageViews),
    monthly_views: last30Days ?? 0,
    countries_reached: countries,
  };
}
