import type { Metadata } from 'next';
import Link from 'next/link';
import { FaBookOpen, FaCode, FaRss } from 'react-icons/fa';
import DocsIndex from '@/components/DocsIndex';
import { getCategories, getCatalogTotals } from '@/lib/toolCatalog';
import { SITE_NAME } from '@/lib/siteMeta';

const totals = getCatalogTotals();

export const metadata: Metadata = {
  title: `Tool documentation by category | ${SITE_NAME}`,
  description: `A free knowledge base for ${totals.tools} enterprise tools in ${totals.categories} categories: what each tool is, where it fits and where to find its official documentation.`,
  alternates: { canonical: '/docs' },
};

export default function DocsPage() {
  const categories = getCategories().map((category) => ({
    id: category.id,
    name: category.name,
    toolNames: category.tools.map((tool) => tool.name),
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
            {totals.tools} tools across {totals.categories} categories. Find short descriptions and official links for every tool, with architecture context
            where available. Step-by-step “why, where and how” guides are being added progressively; tools also appear in weekly reports.
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
