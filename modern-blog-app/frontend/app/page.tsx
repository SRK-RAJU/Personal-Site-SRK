import type { Metadata } from 'next';
import HomeClient from './HomeClient';
import { getSiteStats } from '@/lib/siteStats';
import { listPublicPosts } from '@/lib/publicPosts';
import { getCategories } from '@/lib/toolCatalog';
import { SITE_NAME, SITE_URL, getSiteDescription } from '@/lib/siteMeta';

// Real numbers and the latest reports are rendered on the server and refreshed every 5 minutes.
export const revalidate = 300;

export const metadata: Metadata = {
  title: `${SITE_NAME} | Weekly AI-curated intelligence for cloud, DevOps & security`,
  description: getSiteDescription(),
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Weekly AI-curated intelligence for cloud, DevOps & security`,
    description: getSiteDescription(),
  },
};

export default async function HomePage() {
  const [stats, latest] = await Promise.all([
    getSiteStats(),
    listPublicPosts({ limit: 6, includeReadTime: true }),
  ]);

  // null = "could not load on the server" so the client falls back to fetching on its own.
  const initialPosts = latest.available
    ? latest.posts.map((post) => ({ ...post, read_time_minutes: post.read_time_minutes ?? null }))
    : null;

  // Only plain numbers and names go to the client; the full catalog stays on the server.
  const categories = getCategories();
  const catalog = {
    categories: categories.length,
    tools: categories.reduce((sum, category) => sum + category.tools.length, 0),
    featured: [...categories]
      .sort((a, b) => b.tools.length - a.tools.length || a.name.localeCompare(b.name))
      .slice(0, 12)
      .map((category) => ({ id: category.id, name: category.name, toolCount: category.tools.length })),
  };

  return <HomeClient initialStats={stats} initialPosts={initialPosts} catalog={catalog} />;
}
