'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { FaArrowRight, FaSearch } from 'react-icons/fa';

export interface DocsIndexCategory {
  id: string;
  name: string;
  tools: Array<{ name: string; slug: string }>;
}

export default function DocsIndex({ categories }: { categories: DocsIndexCategory[] }) {
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!needle) return categories.map((category) => ({ category, matches: [] as DocsIndexCategory['tools'] }));
    return categories
      .map((category) => ({
        category,
        matches: category.tools.filter((tool) => tool.name.toLowerCase().includes(needle)),
      }))
      .filter(({ category, matches }) => category.name.toLowerCase().includes(needle) || matches.length > 0);
  }, [categories, needle]);

  return (
    <div>
      <label htmlFor="docs-search" className="sr-only">
        Search categories and tools
      </label>
      <div className="relative mb-8">
        <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)]" aria-hidden="true" />
        <input
          id="docs-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search a category or tool, e.g. Kubernetes, CRM, Terraform"
          className="field !pl-11"
          autoComplete="off"
        />
      </div>

      <p className="mb-4 font-mono text-xs uppercase tracking-[0.16em] text-[var(--fg-subtle)]" aria-live="polite">
        {results.length} {results.length === 1 ? 'category' : 'categories'}
      </p>

      {results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--line-strong)] p-10 text-center text-[var(--fg-muted)]">
          Nothing matches “{query}”. Try a shorter name.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map(({ category, matches }) => {
            const shown = (needle && matches.length > 0 ? matches : category.tools).slice(0, 4);
            const rest = category.tools.length - shown.length;
            return (
              <article key={category.id} className="futurist-card flex h-full flex-col">
                <h2 className="font-display text-lg font-semibold leading-snug">
                  <Link href={`/docs/${category.id}`} className="transition-colors hover:text-[rgb(var(--accent-rgb))]">
                    {category.name}
                  </Link>
                </h2>
                <p className="mt-1 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[var(--fg-subtle)]">
                  {category.tools.length} tools
                  {needle && matches.length > 0 && ` · ${matches.length} match${matches.length === 1 ? '' : 'es'}`}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {shown.map((tool) => (
                    <Link
                      key={tool.name}
                      href={`/docs/${category.id}#${tool.slug}`}
                      className="badge-secondary !text-[0.7rem] transition-colors hover:border-[var(--line-strong)] hover:text-[rgb(var(--fg-rgb))]"
                    >
                      {tool.name}
                    </Link>
                  ))}
                  {!needle && rest > 0 && <span className="badge-secondary !text-[0.7rem]">+{rest} more</span>}
                </div>
                <Link
                  href={`/docs/${category.id}`}
                  className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-[rgb(var(--accent-rgb))] hover:underline"
                >
                  Browse category
                  <FaArrowRight className="text-xs" />
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
