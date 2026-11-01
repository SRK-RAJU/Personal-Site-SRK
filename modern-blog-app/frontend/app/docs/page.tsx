import type { Metadata } from 'next';
import Link from 'next/link';
import { FaBookOpen, FaCode, FaRss } from 'react-icons/fa';
import DocsIndex from '@/components/DocsIndex';
import { getCategories, getCatalogTotals } from '@/lib/toolCatalog';
import { SITE_NAME } from '@/lib/siteMeta';

const totals = getCatalogTotals();

export const metadata: Metadata = {
  title: `Tool documentation by category | ${SITE_NAME}`,
  description: `A static knowledge base for ${totals.tools} distinct tools across ${totals.categories} categories, with catalog descriptions, category context, evaluation checklists, and official links.`,
  alternates: { canonical: '/docs' },
};

export default function DocsPage() {
  const categories = getCategories().map((category) => ({
    id: category.id,
    name: category.name,
    tools: category.tools.map((tool) => ({ name: tool.name, slug: tool.slug })),
  }));

  return (
    <div className="page-wrapper">
      <div className="page-frame max-w-6xl">
        <header className="page-hero">
          <p className="eyebrow">
            <FaBookOpen className="text-sm" />
            Knowledge base
          </p>
          <h1 className="gradient-text mt-3 break-words text-3xl font-bold sm:text-5xl">Tool documentation by category</h1>
          <p className="mt-4 max-w-3xl text-lg text-[var(--fg-muted)]">
            {totals.tools} distinct tool names ({totals.catalogEntries} category listings) across {totals.categories} categories.
            Category playbooks introduce workflows and selection criteria; individual entries explain the product or standard and link to primary references.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--fg-subtle)]">
            These are editorial learning resources, not vendor-authored implementation manuals. Catalog groups may contain software, services, standards, or methods; check each entry type and verify current product details with its official source.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/blog" className="btn-primary">
              Weekly reports
            </Link>
            <Link href="/developers" className="btn-secondary">
              <FaCode /> Public API
            </Link>
            <a href="/feed.xml" className="btn-ghost">
              <FaRss /> RSS
            </a>
          </div>
        </header>

        <DocsIndex categories={categories} />
      </div>
    </div>
  );
}
