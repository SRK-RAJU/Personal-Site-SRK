import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FaArrowLeft, FaExternalLinkAlt, FaNewspaper } from 'react-icons/fa';
import { getCategories, getCategory, getCategoryPlaybook, type CatalogTool } from '@/lib/toolCatalog';
import { SITE_NAME, SITE_URL } from '@/lib/siteMeta';

// Built once at deploy time from local data files (no database access, no runtime cost).
export const dynamicParams = false;

export function generateStaticParams() {
  return getCategories().map((category) => ({ category: category.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category: id } = await params;
  const category = getCategory(id);
  if (!category) return {};

  const sample = category.tools.slice(0, 5).map((tool) => tool.name).join(', ');
  return {
    title: `${category.name}: tools explained | ${SITE_NAME} Docs`,
    description: `Guide to ${category.tools.length} ${category.name} tools (${sample}${category.tools.length > 5 ? ' and more' : ''}): what they are, where they fit and where to find official documentation.`,
    alternates: { canonical: `/docs/${category.id}` },
  };
}

function ToolSection({ tool, currentCategory }: { tool: CatalogTool; currentCategory: string }) {
  const guide = tool.guide;
  return (
    <section id={tool.slug} className="futurist-card scroll-mt-28">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold">{tool.name}</h2>
        <div className="flex flex-wrap gap-2">
          {guide && (
            <span className="badge-secondary">{guide.entryKind || 'Editorial guide'}</span>
          )}
          {tool.officialUrl && (
            <a href={tool.officialUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary !px-3 !py-1.5 !text-xs">
              Official site <FaExternalLinkAlt className="text-[0.6rem]" />
            </a>
          )}
          {tool.docsUrls.map((url) => (
            <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="btn-secondary !px-3 !py-1.5 !text-xs">
              Official docs <FaExternalLinkAlt className="text-[0.6rem]" />
            </a>
          ))}
          <Link href={`/blog?search=${encodeURIComponent(tool.name)}`} className="btn-ghost !px-3 !py-1.5 !text-xs">
            <FaNewspaper /> Weekly coverage
          </Link>
        </div>
      </div>

      {tool.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tool.tags.map((tag) => (
            <span key={tag} className="badge-secondary !text-[0.7rem]">
              {tag}
            </span>
          ))}
        </div>
      )}

      <h3 className="mt-5 font-mono text-xs uppercase tracking-[0.16em] text-[var(--fg-subtle)]">What it is</h3>
      <p className="mt-1.5 leading-7 text-[var(--fg-muted)]">{guide?.what || tool.description}</p>

      {guide && (
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <div>
            <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--fg-subtle)]">Why to consider it</h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-[var(--fg-muted)]">
              {guide.why.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--fg-subtle)]">Where it is used</h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-[var(--fg-muted)]">
              {guide.where.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--fg-subtle)]">Evaluation and safe starting steps</h3>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-6 text-[var(--fg-muted)]">
              {guide.how.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {guide && (
        <p className="mt-4 rounded-lg border border-[var(--line)] bg-[rgb(var(--fg-rgb)/0.025)] p-3 text-xs leading-5 text-[var(--fg-subtle)]">
          Editorial guide, not a vendor-authored setup manual. Confirm current product status, edition, region, licensing, and implementation details in the official references below.
        </p>
      )}

      {guide && guide.catalogCategories.length > 1 && (
        <p className="mt-4 text-xs text-[var(--fg-subtle)]">
          Also listed in: {guide.catalogCategories.filter((name) => name !== currentCategory).join(' · ')}
        </p>
      )}

      {guide && guide.alternatives.length > 0 && (
        <p className="mt-5 text-sm text-[var(--fg-muted)]">
          <span className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--fg-subtle)]">Related tools or approaches </span>
          {guide.alternatives.join(' · ')}
        </p>
      )}

      {guide && guide.references.length > 0 && (
        <div className="mt-5 border-t border-[var(--line)] pt-4">
          <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--fg-subtle)]">Official references</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {guide.references.map((url) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noopener noreferrer" className="badge-secondary !text-[0.7rem]">
                  {new URL(url).hostname.replace(/^www\./, '')}
                  <FaExternalLinkAlt className="ml-1 inline text-[0.55rem]" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tool.components.length > 0 && (
        <div className="mt-5 rounded-xl border border-[var(--line)] bg-[rgb(var(--fg-rgb)/0.03)] p-4">
          <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--fg-subtle)]">What is inside</h3>
          <ul className="mt-2 space-y-2 text-sm text-[var(--fg-muted)]">
            {tool.components.map((component) => (
              <li key={component.name}>
                <span className="font-semibold text-[rgb(var(--fg-rgb))]">{component.name}</span>
                {component.role ? ` — ${component.role}` : ''}
                {component.modules.length > 0 && (
                  <span className="mt-1 flex flex-wrap gap-1.5">
                    {component.modules.slice(0, 6).map((module) => (
                      <span key={module} className="badge-secondary !text-[0.68rem]">
                        {module}
                      </span>
                    ))}
                  </span>
                )}
              </li>
            ))}
          </ul>
          {tool.family && tool.family.layers.length > 0 && (
            <p className="mt-3 text-xs text-[var(--fg-subtle)]">
              Typical {tool.family.title.toLowerCase()} building blocks: {tool.family.layers.join(' → ')}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

export default async function DocsCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: id } = await params;
  const category = getCategory(id);
  if (!category) notFound();

  const playbook = getCategoryPlaybook(id);

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Docs', item: `${SITE_URL}/docs` },
      { '@type': 'ListItem', position: 2, name: category.name, item: `${SITE_URL}/docs/${category.id}` },
    ],
  };

  return (
    <div className="page-wrapper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs).replace(/</g, '\\u003c') }}
      />
      <div className="page-frame max-w-5xl">
        <Link href="/docs" className="mb-6 inline-flex items-center gap-2 font-semibold text-[rgb(var(--accent-rgb))] transition-opacity hover:opacity-80">
          <FaArrowLeft className="text-sm" />
          All categories
        </Link>

        <header className="page-hero">
          <p className="eyebrow">Knowledge base</p>
          <h1 className="gradient-text mt-3 break-words text-3xl font-bold sm:text-5xl">{category.name}</h1>
          <p className="mt-4 max-w-3xl text-lg text-[var(--fg-muted)]">
            {category.tools.length} category listings, with {new Set(category.tools.map((tool) => tool.name.toLowerCase())).size} distinct tool names.
            Each entry links to its official product/documentation sources and weekly coverage.
          </p>
          <p className="mt-3 max-w-3xl text-sm text-[var(--fg-subtle)]">
            These are editorial learning guides, not vendor-authored manuals. Verify current product features, regional availability, versions, terms, and implementation steps with the official references.
          </p>
          <div className="mt-5 flex flex-wrap gap-2" aria-label="Tools in this category">
            {category.tools.map((tool) => (
              <a key={tool.slug} href={`#${tool.slug}`} className="chip">
                {tool.name}
              </a>
            ))}
          </div>
        </header>

        <section className="page-panel mb-8">
          <h2 className="mb-3 text-xl font-bold">Choose your learning path</h2>
          <p className="mb-4 text-sm leading-6 text-[var(--fg-muted)]">
            These paths explain how to use this guide at different experience levels. They are general learning advice, not a substitute for product-specific instructions or local legal requirements.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h3 className="font-semibold">Student or beginner</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--fg-muted)]">
                Start with “What it is” and the category overview. Learn the key terms, then follow the vendor’s beginner tutorial in a free or isolated practice environment. Do not use real customer, employer, or sensitive data.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Working practitioner</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--fg-muted)]">
                Compare the stated use case with your task. Check supported versions, integrations, permissions, failure handling, accessibility, and operating cost. Test a representative workflow before changing production.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Enterprise team</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--fg-muted)]">
                Validate architecture and data boundaries, identity and access, residency and retention, availability and recovery, audit needs, procurement terms, support, migration, and exit. Get security, privacy, legal, compliance, and business-owner review where applicable.
              </p>
            </div>
          </div>
        </section>

        {playbook && (
          <div className="mb-8 space-y-5">
            <section className="page-panel">
              <h2 className="mb-3 text-2xl font-bold">Category overview</h2>
              <p className="leading-7 text-[var(--fg-muted)]">{playbook.overview}</p>
              <p className="mt-3 text-sm text-[var(--fg-subtle)]">{playbook.operations}</p>
            </section>

            <section className="page-panel">
              <h2 className="mb-3 text-2xl font-bold">Architecture and workflow</h2>
              <p className="leading-7 text-[var(--fg-muted)]">{playbook.architecture}</p>
              <h3 className="mt-5 font-mono text-xs uppercase tracking-[0.16em] text-[var(--fg-subtle)]">Common use cases</h3>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-[var(--fg-muted)]">
                {playbook.useCases.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <h3 className="mt-5 font-mono text-xs uppercase tracking-[0.16em] text-[var(--fg-subtle)]">Lifecycle</h3>
              <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6 text-[var(--fg-muted)]">
                {playbook.workflow.map((item) => <li key={item}>{item}</li>)}
              </ol>
            </section>

            <section className="page-panel">
              <h2 className="mb-3 text-2xl font-bold">How to evaluate tools</h2>
              <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-[var(--fg-muted)]">
                {playbook.decisionQuestions.map((item) => <li key={item}>{item}</li>)}
              </ol>
              <h3 className="mt-5 font-mono text-xs uppercase tracking-[0.16em] text-[var(--fg-subtle)]">Security and governance</h3>
              <p className="mt-2 leading-7 text-[var(--fg-muted)]">{playbook.controls}</p>
              <h3 className="mt-5 font-mono text-xs uppercase tracking-[0.16em] text-[var(--fg-subtle)]">Pilot and production rollout</h3>
              <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6 text-[var(--fg-muted)]">
                {playbook.rollout.map((item) => <li key={item}>{item}</li>)}
              </ol>
            </section>
          </div>
        )}

        <div className="space-y-6">
          {category.tools.map((tool) => (
            <ToolSection key={tool.slug} tool={tool} currentCategory={category.name} />
          ))}
        </div>
      </div>
    </div>
  );
}
