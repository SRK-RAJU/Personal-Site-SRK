import { getServiceClient } from '@/lib/supabaseServer';
import { estimateReadTime } from '@/lib/ai-utils';

const PUBLISHED_STATUSES = ['published', 'live', 'active', ''];
const AI_COLUMNS = 'id, title, slug, excerpt, category, tools_covered, cves_mentioned, ai_model, view_count, published_at';
const MANUAL_COLUMNS = 'id, title, slug, excerpt, category, published_at, created_at, updated_at, read_time_minutes, view_count';
const MAX_ROWS_PER_TABLE = 1000;

export interface PublicPostSummary {
  id: string | number;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tools_covered: string[];
  cves_mentioned: number;
  published_at: string;
  read_time_minutes: number | null;
  view_count: number;
  ai_model: string | null;
  source: 'ai' | 'manual';
}

export interface PublicPost extends PublicPostSummary {
  content: string;
  tags: string[];
  updated_at: string | null;
}

export interface PostListResult {
  posts: PublicPostSummary[];
  total: number;
  page: number;
  limit: number;
  available: boolean;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? Math.floor(value) : min));
}

/** Escapes LIKE wildcards so user input is matched literally. */
function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function mapAi(row: any, withContent = false): PublicPostSummary & { content?: string } {
  return {
    id: row.id,
    title: String(row.title || ''),
    slug: String(row.slug || ''),
    excerpt: String(row.excerpt || ''),
    category: String(row.category || ''),
    tools_covered: toStringArray(row.tools_covered),
    cves_mentioned: Number(row.cves_mentioned || 0),
    published_at: String(row.published_at || ''),
    read_time_minutes: withContent && row.content ? estimateReadTime(String(row.content)) : null,
    view_count: Number(row.view_count || 0),
    ai_model: row.ai_model ? String(row.ai_model) : null,
    source: 'ai',
    ...(withContent ? { content: String(row.content || '') } : {}),
  };
}

function mapManual(row: any, withContent = false): PublicPostSummary & { content?: string } {
  return {
    id: row.id,
    title: String(row.title || ''),
    slug: String(row.slug || ''),
    excerpt: String(row.excerpt || ''),
    category: String(row.category || ''),
    tools_covered: toStringArray(row.tools_covered ?? row.tags),
    cves_mentioned: Number(row.cves_mentioned || 0),
    published_at: String(row.published_at || row.created_at || ''),
    read_time_minutes: withContent && row.content ? estimateReadTime(String(row.content)) : row.reading_time ? Number(row.reading_time) : null,
    view_count: Number(row.view_count || 0),
    ai_model: null,
    source: 'manual',
    ...(withContent ? { content: String(row.content || '') } : {}),
  };
}

/**
 * Published posts from both tables (AI reports and manual posts), newest first.
 * Selects only light columns unless `includeReadTime` is set, which also loads the content to estimate reading time.
 */
export async function listPublicPosts(
  options: { page?: number; limit?: number; category?: string; q?: string; includeReadTime?: boolean } = {}
): Promise<PostListResult> {
  const limit = clamp(options.limit ?? 12, 1, 50);
  const page = clamp(options.page ?? 1, 1, Math.max(1, Math.floor(MAX_ROWS_PER_TABLE / limit)));
  const empty: PostListResult = { posts: [], total: 0, page, limit, available: false };

  const supabase = getServiceClient();
  if (!supabase) return empty;

  const withContent = Boolean(options.includeReadTime);
  const rowsNeeded = page * limit;
  const category = (options.category || '').trim().slice(0, 100);
  const search = (options.q || '').trim().slice(0, 100);

  try {
    let aiQuery: any = supabase
      .from('ai_generated_posts')
      .select(withContent ? `${AI_COLUMNS}, content` : AI_COLUMNS, { count: 'exact' })
      .in('status', PUBLISHED_STATUSES);
    let manualQuery: any = supabase
      .from('posts')
      .select(withContent ? `${MANUAL_COLUMNS}, content` : MANUAL_COLUMNS, { count: 'exact' })
      .eq('published', true);

    for (const apply of [
      (query: any) => (category ? query.ilike('category', escapeLike(category)) : query),
      (query: any) => (search ? query.ilike('title', `%${escapeLike(search)}%`) : query),
    ]) {
      aiQuery = apply(aiQuery);
      manualQuery = apply(manualQuery);
    }

    const [ai, manual] = await Promise.all([
      aiQuery.order('published_at', { ascending: false }).range(0, rowsNeeded - 1),
      manualQuery.order('published_at', { ascending: false }).range(0, rowsNeeded - 1),
    ]);

    if (ai.error && manual.error) return empty;

    const seen = new Set<string>();
    const merged = [
      ...((ai.data || []) as any[]).map((row) => mapAi(row, withContent)),
      ...((manual.data || []) as any[]).map((row) => mapManual(row, withContent)),
    ]
      .filter((post) => post.slug && !seen.has(post.slug) && seen.add(post.slug))
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
      .slice((page - 1) * limit, page * limit)
      .map(({ content: _content, ...summary }) => summary);

    return {
      posts: merged,
      total: (ai.count ?? 0) + (manual.count ?? 0),
      page,
      limit,
      available: true,
    };
  } catch {
    return empty;
  }
}

export async function getPublicPost(slug: string): Promise<PublicPost | null> {
  const supabase = getServiceClient();
  const cleanSlug = slug.trim().slice(0, 300);
  if (!supabase || !cleanSlug) return null;

  try {
    const { data: aiRow } = await supabase
      .from('ai_generated_posts')
      .select('*')
      .eq('slug', cleanSlug)
      .in('status', PUBLISHED_STATUSES)
      .maybeSingle();

    if (aiRow) {
      return {
        ...(mapAi(aiRow, true) as PublicPostSummary & { content: string }),
        tags: toStringArray(aiRow.tags),
        updated_at: aiRow.updated_at ? String(aiRow.updated_at) : null,
      };
    }

    const { data: manualRow } = await supabase
      .from('posts')
      .select(`${MANUAL_COLUMNS}, content`)
      .eq('slug', cleanSlug)
      .eq('published', true)
      .maybeSingle();

    if (manualRow) {
      return {
        ...(mapManual(manualRow, true) as PublicPostSummary & { content: string }),
        tags: [],
        updated_at: manualRow.updated_at ? String(manualRow.updated_at) : null,
      };
    }
  } catch {
    // Fall through to "not found".
  }

  return null;
}
