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
  a: ({ node, ...props }: any) => <a className="text-[rgb(var(--accent-rgb))] underline underline-offset-4" {...props} />,
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
    <div className="page-panel my-8 overflow-hidden !p-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[rgb(var(--accent-rgb))]">
            Ecosystem Overview
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-[rgb(var(--fg-rgb))]">
            Technology Stack
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--fg-muted)]">
            A compact view of the platforms, services, and operational tooling shaping the current landscape.
          </p>
        </div>
        <div className="futurist-pill">
          {cards.length} focus areas
        </div>
      </div>

      {featuredTools.length > 0 && (
        <div className="mb-5 rounded-2xl border border-[rgb(var(--accent-rgb)/0.2)] bg-[rgb(var(--fg-rgb)/0.03)] p-3 backdrop-blur-sm">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[rgb(var(--accent-rgb))]">
            <FaStar className="text-[rgb(var(--accent-rgb))]" />
            Highlighted tools
          </div>
          <div className="flex flex-wrap gap-2">
            {featuredTools.map((tool) => (
              <span
                key={tool}
                className="futurist-pill !px-2.5 !py-1 !text-xs"
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
              className="futurist-card group !p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[rgb(var(--accent-rgb)/0.25)] bg-[rgb(var(--accent-rgb)/0.1)] text-[rgb(var(--accent-rgb))] transition-transform duration-300 group-hover:scale-105">
                  <Icon className="text-lg" />
                </div>
                <div>
                  <h4 className="font-semibold text-[rgb(var(--fg-rgb))]">{card.title}</h4>
                  <p className="text-sm text-[var(--fg-muted)]">{card.tools.length} tools</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {card.tools.slice(0, 8).map((tool) => (
                  <span
                    key={tool}
                    className="futurist-pill !px-2.5 !py-1 !text-xs"
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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rjexa.com';
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
    alternates: {
      canonical: `${baseUrl}/blog/${encodeURIComponent(post.slug)}`,
    },
    robots: {
      index: true,
      follow: true,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt || 'Read this article',
      images: post.featured_image_url ? [post.featured_image_url] : undefined,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt || 'Read this article',
      type: 'article',
      url: `${baseUrl}/blog/${encodeURIComponent(post.slug)}`,
      publishedTime: post.published_at,
      modifiedTime: post.updated_at || post.published_at,
      section: post.category || 'Technology',
      tags: Array.isArray(post.tags) ? post.tags : undefined,
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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rjexa.com';
  const post = await getPost(params.slug);

  if (!post) {
    notFound();
  }

  // Increment view count (non-blocking)
  incrementViews(post.id).catch(console.error);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || post.content?.substring(0, 160) || '',
    datePublished: post.published_at,
    dateModified: post.updated_at || post.published_at,
    mainEntityOfPage: `${baseUrl}/blog/${encodeURIComponent(post.slug)}`,
    author: {
      '@type': 'Person',
      name: post.author_name || post.author || 'Raju',
    },
    publisher: {
      '@type': 'Organization',
      name: process.env.NEXT_PUBLIC_SITE_NAME || 'Raju Tech',
      url: baseUrl,
    },
    image: post.featured_image_url ? [post.featured_image_url] : undefined,
    articleSection: post.category || 'Technology',
    keywords: Array.isArray(post.tags) ? post.tags.join(', ') : undefined,
  };

  const { introText, sections } = parseMarkdownSections(post.content || '');

  return (
    <article className="w-full">
      <script
        type="application/ld+json"
        // Escape "<" so post content can never break out of the script tag (stored-XSS hardening)
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      {/* Hero Section */}
      <section className="border-b border-cyan-500/20 py-12">
        <div className="container-max">
          <div className="futurist-hero mx-auto max-w-4xl">
            {/* Back Button */}
            <Link
              href="/blog"
              className="mb-6 inline-flex items-center gap-2 font-semibold text-[rgb(var(--accent-rgb))] transition-opacity hover:opacity-80"
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
                  <FaUser className="text-[rgb(var(--accent-rgb))]" />
                  <span className="font-semibold">{post.author_name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <FaCalendar className="text-[rgb(var(--accent-rgb))]" />
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
            <div className="futurist-card mx-auto max-w-4xl !p-0">
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
                  <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-[rgb(var(--accent-rgb))]">
                    Table of Contents
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {sections.map((section, index) => (
                      <a
                        key={`${section.title}-${index}`}
                        href={`#section-${index}`}
                        className="futurist-pill"
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
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-semibold text-[rgb(var(--fg-rgb))] transition hover:bg-[rgb(var(--accent-rgb)/0.06)]">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgb(var(--accent-rgb)/0.25)] bg-[rgb(var(--accent-rgb)/0.1)] text-sm font-bold text-[rgb(var(--accent-rgb))]">
                            {getSectionIcon(index)}
                          </span>
                          <span>{section.title}</span>
                        </div>
                        <FaChevronDown className="text-lg text-[rgb(var(--accent-rgb))] transition duration-300 group-open:rotate-180" />
                      </summary>
                      <div className="overflow-hidden border-t border-[var(--line)] bg-[rgb(var(--fg-rgb)/0.02)] px-4 pb-4 pt-3 transition-all duration-300">
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
                      className="futurist-pill"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Call to Action */}
            <div className="futurist-card mt-12">
              <h3 className="mb-4 text-2xl font-bold text-[rgb(var(--fg-rgb))]">
                Want More Tech Insights?
              </h3>
              <p className="mb-6 text-[var(--fg-muted)]">
                Subscribe to my blog for the latest updates on web development, cloud architecture, and DevOps practices.
              </p>
              <button className="btn-primary">
                Subscribe Now
              </button>
            </div>

            {/* More Posts */}
            <div className="mt-12 border-t border-slate-200 pt-12 dark:border-slate-700">
              <h3 className="mb-6 text-2xl font-bold text-[rgb(var(--fg-rgb))]">
                More from Blog
              </h3>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 font-semibold text-[rgb(var(--accent-rgb))] transition-opacity hover:opacity-80"
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
