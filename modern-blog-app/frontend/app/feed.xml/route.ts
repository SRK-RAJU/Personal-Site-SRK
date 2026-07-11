import { createClient } from '@supabase/supabase-js';

export const revalidate = 1800;

type FeedPost = {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  published_at?: string;
  updated_at?: string;
  author?: string;
  author_name?: string;
};

function getSupabase() {
  const url = process.env.DIRECT_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || /placeholder|YOUR_|your_project_id|yourdomain\.com/i.test(url + key)) {
    return null;
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function esc(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rjexa.com';
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Raju Tech';
  const description = process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'Personal tech blog.';

  const supabase = getSupabase();
  let posts: FeedPost[] = [];

  if (supabase) {
    try {
      const [{ data: regular }, { data: ai }] = await Promise.all([
        supabase
          .from('posts')
          .select('title, slug, excerpt, content, published_at, updated_at, author')
          .eq('published', true)
          .order('published_at', { ascending: false })
          .limit(50),
        supabase
          .from('ai_generated_posts')
          .select('title, slug, excerpt, content, published_at, updated_at, author, author_name, status')
          .in('status', ['published', 'live', 'active', ''])
          .order('published_at', { ascending: false })
          .limit(50),
      ]);

      posts = [...(regular || []), ...(ai || [])]
        .filter((post: FeedPost) => !!post?.slug)
        .sort(
          (a: FeedPost, b: FeedPost) =>
            new Date(b.published_at || b.updated_at || 0).getTime() -
            new Date(a.published_at || a.updated_at || 0).getTime()
        )
        .slice(0, 75);
    } catch (_error) {
      posts = [];
    }
  }

  const items = posts
    .map((post) => {
      const url = `${baseUrl}/blog/${encodeURIComponent(post.slug)}`;
      const title = esc(post.title || 'Untitled');
      const summary = esc(post.excerpt || String(post.content || '').slice(0, 200));
      const pubDate = new Date(post.published_at || post.updated_at || Date.now()).toUTCString();
      const author = esc(post.author_name || post.author || 'Raju');

      return `<item><title>${title}</title><link>${url}</link><guid>${url}</guid><description>${summary}</description><pubDate>${pubDate}</pubDate><author>${author}</author></item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(siteName)}</title><link>${baseUrl}</link><description>${esc(description)}</description><language>en-us</language><lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}</channel></rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
    },
  });
}
