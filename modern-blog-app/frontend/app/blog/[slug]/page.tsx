import Link from 'next/link';
import Image from 'next/image';
import { FaArrowLeft, FaCalendar, FaChevronDown, FaCloud, FaCodeBranch, FaCogs, FaCube, FaDatabase, FaLayerGroup, FaRocket, FaServer, FaShieldAlt, FaStar, FaTools, FaUser } from 'react-icons/fa';
import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

export const revalidate = 60; // Revalidate every 60 seconds
export const dynamic = 'force-dynamic';
export const dynamicParams = true; // Enable dynamic route generation

// Detect placeholder environment values and avoid creating a live Supabase client when not configured
function isSupabasePlaceholder(value?: string) {
  return !value || /your_project_id|YOUR_PROJECT_ID|YOUR_ANON_KEY_HERE|YOUR_SERVICE_ROLE_KEY_HERE|yourdomain\.com/i.test(value);
}

function getSupabaseServer() {
  const supabaseUrl = process.env.DIRECT_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || isSupabasePlaceholder(supabaseUrl) || isSupabasePlaceholder(supabaseKey)) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function generateStaticParams() {
  return [];
}

const markdownComponents = {
  h1: ({ node, ...props }: any) => <h1 className="text-3xl font-bold mt-8 mb-4" {...props} />,
  h2: ({ node, ...props }: any) => <h2 className="text-2xl font-semibold mt-6 mb-3" {...props} />,
  h3: ({ node, ...props }: any) => <h3 className="text-xl font-semibold mt-5 mb-2" {...props} />,
  p: ({ node, ...props }: any) => <p className="text-lg leading-8 text-slate-800 dark:text-slate-200 my-4" {...props} />,
  ul: ({ node, ...props }: any) => <ul className="list-disc pl-6 my-4 space-y-2" {...props} />,
  ol: ({ node, ...props }: any) => <ol className="list-decimal pl-6 my-4 space-y-2" {...props} />,
  li: ({ node, ...props }: any) => <li className="text-lg leading-8 text-slate-800 dark:text-slate-200" {...props} />,
  strong: ({ node, ...props }: any) => <strong className="font-semibold text-slate-900 dark:text-white" {...props} />,
  a: ({ node, ...props }: any) => <a className="text-violet-600 dark:text-violet-400 underline" {...props} />,
};

function buildSlugCandidates(slug: string): string[] {
  const trimmed = decodeURIComponent(slug || '').trim();
  const variants = new Set<string>();
  const normalized = trimmed.toLowerCase();

  [trimmed, normalized, normalized.replace(/_/g, '-'), normalized.replace(/-+/g, '-')].forEach((value) => {
    if (value) variants.add(value);
  });

  const legacyMatch = normalized.match(/^devops-report-(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (legacyMatch) {
    const [, year, month, day] = legacyMatch;
    const paddedMonth = String(Number(month)).padStart(2, '0');
    const paddedDay = String(Number(day)).padStart(2, '0');
    variants.add(`devops-report-${year}-${paddedMonth}-${paddedDay}`);
    variants.add(`devops-report-${year}-${month}-${day}`);
  }

  return Array.from(variants).filter(Boolean);
}

async function getPost(slug: string) {
  try {
    const supabase = getSupabaseServer();
    if (supabase) {
      const slugCandidates = buildSlugCandidates(slug);

      const { data: post, error } = await supabase
        .from('posts')
        .select('*')
        .in('slug', slugCandidates)
        .eq('published', true)
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && post) {
        return post;
      }

      const { data: aiPost, error: aiError } = await supabase
        .from('ai_generated_posts')
        .select('*')
        .in('slug', slugCandidates)
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!aiError && aiPost) {
        const isPublicAiPost = ['published', 'live', 'active', ''].includes(aiPost.status) || !!aiPost.published_at;

        if (isPublicAiPost) {
          return {
            ...aiPost,
            published: true,
            author_name: aiPost.author_name || aiPost.author || 'Raju',
            published_at: aiPost.published_at || aiPost.created_at,
            read_time_minutes: aiPost.read_time_minutes || Math.ceil((aiPost.content?.length || 0) / 200),
          };
        }
      }
    }
  } catch (err) {
    console.warn('Error fetching post from database:', err);
  }

  return null;
}

function getSectionIcon(index: number) {
  const icons = [FaRocket, FaShieldAlt, FaTools, FaCube];
  const Icon = icons[index % icons.length];
  return <Icon className="text-sm" />;
}

function getTechnologyStackIcon(category: string) {
  const normalized = category.toLowerCase();

  if (normalized.includes('cloud')) return FaCloud;
  if (normalized.includes('security') || normalized.includes('identity') || normalized.includes('ops')) return FaShieldAlt;
  if (normalized.includes('data') || normalized.includes('database')) return FaDatabase;
  if (normalized.includes('infra') || normalized.includes('container') || normalized.includes('network')) return FaServer;
  if (normalized.includes('dev') || normalized.includes('delivery') || normalized.includes('tool')) return FaCodeBranch;
  if (normalized.includes('ai') || normalized.includes('ml')) return FaRocket;
  if (normalized.includes('crm') || normalized.includes('erp') || normalized.includes('hr')) return FaLayerGroup;

  return FaCogs;
}

function renderTechnologyStackContent(content: string): JSX.Element | null {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const cards = lines
    .map((line) => line.match(/^[-*]\s+\*\*(.+?)\*\*:\s*(.+)$/))
    .filter(Boolean)
    .map((match) => ({
      title: match?.[1]?.trim() || 'Focus Area',
      tools: (match?.[2] || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    }))
    .filter((card) => card.tools.length > 0);

  if (cards.length === 0) {
    return renderMarkdownContent(content);
  }

  const featuredTools = cards.flatMap((card) => card.tools.slice(0, 2)).slice(0, 8);

  return (
    <div className="my-8 overflow-hidden rounded-3xl border border-violet-300/40 bg-gradient-to-br from-slate-950 via-violet-950/90 to-slate-900 p-6 shadow-[0_20px_60px_rgba(109,40,217,0.2)] dark:border-violet-700/40">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-violet-300">
            Ecosystem Overview
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            Technology Stack
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            A compact view of the platforms, services, and operational tooling shaping the current landscape.
          </p>
        </div>
        <div className="rounded-full border border-violet-400/30 bg-white/10 px-3 py-1 text-sm font-medium text-violet-100">
          {cards.length} focus areas
        </div>
      </div>

      {featuredTools.length > 0 && (
        <div className="mb-5 rounded-2xl border border-violet-400/20 bg-white/10 p-3 backdrop-blur-sm">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-violet-200">
            <FaStar className="text-violet-300" />
            Highlighted tools
          </div>
          <div className="flex flex-wrap gap-2">
            {featuredTools.map((tool) => (
              <span
                key={tool}
                className="rounded-full border border-violet-400/20 bg-gradient-to-r from-violet-500/20 to-cyan-500/20 px-2.75 py-1 text-xs font-semibold text-violet-50"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card, index) => {
          const Icon = getTechnologyStackIcon(card.title);
          return (
            <div
              key={`${card.title}-${index}`}
              className="group rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/40 hover:bg-white/15"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 text-white shadow-lg transition-transform duration-300 group-hover:scale-105">
                  <Icon className="text-lg" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">{card.title}</h4>
                  <p className="text-sm text-slate-300">{card.tools.length} tools</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {card.tools.slice(0, 8).map((tool) => (
                  <span
                    key={tool}
                    className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-100 transition-colors duration-300 hover:bg-violet-500/20"
                  >
                    {tool}
                  </span>
                ))}
                {card.tools.length > 8 && (
                  <span className="rounded-full border border-white/10 bg-slate-800/70 px-2.5 py-1 text-xs font-medium text-slate-300">
                    +{card.tools.length - 8} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function renderMarkdownContent(content: string) {
  if (!content?.trim()) {
    return null;
  }

  if (/technology stack/i.test(content) || /^\s*[-*]\s+\*\*(.+?)\*\*:\s*(.+)$/m.test(content)) {
    return renderTechnologyStackContent(content);
  }

  return (
    <div className="space-y-2">
      <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
    </div>
  );
}

function parseMarkdownSections(content: string) {
  const lines = content.split(/\r?\n/);
  const introLines: string[] = [];
  const sections: Array<{ title: string; body: string; level: number }> = [];
  let currentSection: { title: string; body: string[]; level: number } | null = null;

  const flushSection = () => {
    if (!currentSection) return;
    const bodyText = currentSection.body.join('\n').trim();
    if (currentSection.title || bodyText) {
      sections.push({
        title: currentSection.title,
        body: bodyText,
        level: currentSection.level,
      });
    }
    currentSection = null;
  };

  lines.forEach((line) => {
    const headingMatch = line.match(/^(#{2,3})\s+(.*)$/);
    if (headingMatch) {
      flushSection();
      currentSection = {
        title: headingMatch[2].trim(),
        body: [],
        level: headingMatch[1].length,
      };
      return;
    }

    if (currentSection) {
      currentSection.body.push(line);
    } else {
      introLines.push(line);
    }
  });

  flushSection();

  return {
    introText: introLines.join('\n').trim(),
    sections,
  };
}

async function incrementViews(postId: string) {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return;
  }

  try {
    const { data } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single();

    if (data) {
      try {
        await supabase.rpc('increment_views', { post_id: postId });
      } catch (_rpcError) {
        // If RPC doesn't exist, ignore.
      }
    }
  } catch (err) {
    console.warn('Could not increment views or update post metadata:', err);
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPost(params.slug);

  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The blog post you are looking for does not exist.',
    };
  }

  return {
    title: `${post.title} | Blog`,
    description: post.excerpt || post.content?.substring(0, 160) || 'Read this article',
    openGraph: {
      title: post.title,
      description: post.excerpt || 'Read this article',
      type: 'article',
      publishedTime: post.published_at,
      authors: [post.author_name || 'Raju'],
      images: post.featured_image_url ? [{ url: post.featured_image_url, width: 1200, height: 400 }] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPost(params.slug);

  if (!post) {
    notFound();
  }

  // Increment view count (non-blocking)
  incrementViews(post.id).catch(console.error);

  const { introText, sections } = parseMarkdownSections(post.content || '');

  return (
    <article className="w-full futurist-grid-bg">
      {/* Hero Section */}
      <section className="border-b border-cyan-500/20 py-12">
        <div className="container-max">
          <div className="futurist-hero mx-auto max-w-4xl">
            {/* Back Button */}
            <Link
              href="/blog"
              className="mb-6 inline-flex items-center gap-2 font-semibold text-cyan-600 transition-colors hover:text-cyan-700 dark:text-cyan-300 dark:hover:text-cyan-200"
            >
              <FaArrowLeft className="text-sm" />
              Back to Articles
            </Link>

            {/* Category Badge */}
            {post.category && (
              <div className="mb-4">
                <span className="futurist-pill">
                  {post.category}
                </span>
              </div>
            )}

            {/* Title */}
            <h1 className="mb-4 text-4xl font-bold leading-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
              {post.title}
            </h1>

            {/* Meta Info */}
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-slate-800 dark:text-slate-200 sm:text-base">
              {post.author_name && (
                <div className="flex items-center gap-2">
                  <FaUser className="text-violet-500" />
                  <span className="font-semibold">{post.author_name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <FaCalendar className="text-violet-500" />
                <span>
                  {new Date(post.published_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              {post.reading_time && (
                <div className="flex items-center gap-2">
                  <span>📖</span>
                  <span>{post.reading_time} min read</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Image */}
      {post.featured_image_url && (
        <section className="py-8">
          <div className="container-max">
            <div className="mx-auto max-w-4xl overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/70 shadow-2xl shadow-violet-500/10 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/70">
              <Image
                src={post.featured_image_url}
                alt={post.title}
                width={1200}
                height={400}
                className="w-full h-96 object-cover"
                priority
              />
            </div>
          </div>
        </section>
      )}

      {/* Content */}
      <section className="section-padding">
        <div className="container-max">
          <div className="max-w-3xl mx-auto">
            {/* Excerpt */}
            {post.excerpt && (
              <div className="futurist-card mb-8">
                <p className="text-lg font-semibold italic leading-8 text-slate-800 dark:text-slate-100">
                  {post.excerpt}
                </p>
              </div>
            )}

            {/* Main Content */}
            <div className="prose prose-slate dark:prose-invert mb-12 max-w-none">
              {sections.length > 0 && (
                <div className="futurist-card mb-6 p-4">
                  <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-violet-700 dark:text-violet-300">
                    Table of Contents
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {sections.map((section, index) => (
                      <a
                        key={`${section.title}-${index}`}
                        href={`#section-${index}`}
                        className="rounded-full border border-violet-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700 dark:border-violet-800 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-violet-500 dark:hover:bg-violet-950/40"
                      >
                        {section.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {introText && renderMarkdownContent(introText)}

              {sections.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {sections.map((section, index) => (
                    <details
                      key={`${section.title}-${index}`}
                      id={`section-${index}`}
                      open={index === 0}
                      className="group futurist-card overflow-hidden"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-semibold text-slate-900 transition hover:bg-violet-50 dark:text-white dark:hover:bg-violet-950/30">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-500 text-sm font-bold text-white shadow-lg">
                            {getSectionIcon(index)}
                          </span>
                          <span>{section.title}</span>
                        </div>
                        <FaChevronDown className="text-lg text-violet-600 transition duration-300 group-open:rotate-180 dark:text-violet-300" />
                      </summary>
                      <div className="overflow-hidden border-t border-slate-200 bg-gradient-to-b from-slate-50/80 to-white/70 px-4 pb-4 pt-3 transition-all duration-300 dark:border-slate-700 dark:from-slate-900/80 dark:to-slate-950/70">
                        {renderMarkdownContent(section.body)}
                      </div>
                    </details>
                  ))}
                </div>
              ) : (
                renderMarkdownContent(post.content || '')
              )}
            </div>

            {/* Tags */}
            {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
              <div className="mb-12 border-t border-slate-200 pt-8 dark:border-slate-700">
                <div className="flex flex-wrap gap-3">
                  {post.tags.map((tag: string) => (
                    <Link
                      key={tag}
                      href={`/blog?tag=${encodeURIComponent(tag)}`}
                      className="px-4 py-2 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-sm font-semibold hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Call to Action */}
            <div className="futurist-card mt-12 bg-[linear-gradient(135deg,_rgba(14,165,233,0.12),_rgba(236,72,153,0.1))] dark:bg-[linear-gradient(135deg,_rgba(14,165,233,0.2),_rgba(236,72,153,0.16))]">
              <h3 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">
                Want More Tech Insights?
              </h3>
              <p className="text-slate-800 dark:text-slate-200 mb-6">
                Subscribe to my blog for the latest updates on web development, cloud architecture, and DevOps practices.
              </p>
              <button className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 font-semibold text-white transition-all hover:from-violet-700 hover:to-blue-700 hover:shadow-lg">
                Subscribe Now
              </button>
            </div>

            {/* More Posts */}
            <div className="mt-12 border-t border-slate-200 pt-12 dark:border-slate-700">
              <h3 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">
                More from Blog
              </h3>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold transition-colors"
              >
                View All Articles →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}
