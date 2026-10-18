'use client';

import { useEffect, useMemo, useState } from 'react';
import { FaSearch, FaTimes, FaExternalLinkAlt } from 'react-icons/fa';
import toolsData from '@/data/industry-tools.json';

interface Tool {
  name: string;
  officialUrl: string;
  description: string;
  tags: string[];
}

interface Category {
  id: string;
  displayName: string;
  tools: Tool[];
}

const categories = (toolsData as any).categories as Category[];

export const TOTAL_CATALOG_TOOLS = categories.reduce((sum, cat) => sum + cat.tools.length, 0);

export default function ToolsCatalogModal({ onClose }: { onClose: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return categories;

    return categories
      .map((cat) => ({
        ...cat,
        tools: cat.tools.filter(
          (tool) =>
            tool.name.toLowerCase().includes(query) ||
            tool.description.toLowerCase().includes(query) ||
            tool.tags.some((tag) => tag.toLowerCase().includes(query))
        ),
      }))
      .filter((cat) => cat.tools.length > 0);
  }, [searchQuery]);

  const matchingTools = filteredCategories.reduce((sum, cat) => sum + cat.tools.length, 0);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/70 p-3 pt-6 backdrop-blur-sm sm:p-6 sm:pt-10"
      role="dialog"
      aria-modal="true"
      aria-label="Industry tools catalog"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="glass-strong flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-[rgb(var(--bg-rgb))] text-left shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4 sm:px-6">
          <div>
            <p className="eyebrow">Catalog</p>
            <h2 className="mt-1 font-display text-xl font-bold sm:text-2xl">Industry tools catalog</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--fg-muted)] transition hover:bg-[rgb(var(--fg-rgb)/0.08)] hover:text-[rgb(var(--fg-rgb))]"
            aria-label="Close tools catalog"
          >
            <FaTimes />
          </button>
        </div>

        <div className="border-b border-[var(--line)] px-5 py-3 sm:px-6">
          <div className="field flex items-center gap-2 !py-2">
            <FaSearch className="text-sm text-[var(--fg-subtle)]" />
            <input
              type="text"
              placeholder="Search tools by name, description, or tags…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border-none bg-transparent text-sm outline-none"
              autoFocus
            />
          </div>
          <p className="mt-2 h-4 text-xs text-[var(--fg-subtle)]">{searchQuery && `Showing ${matchingTools} matching tools`}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {filteredCategories.map((category) => (
            <div key={category.id} className="mb-8">
              <h3 className="mb-3 flex items-center gap-2 font-display text-base font-semibold sm:text-lg">
                <span className="inline-block h-5 w-1 rounded-full bg-gradient-to-b from-[rgb(var(--accent-rgb))] to-[rgb(var(--accent2-rgb))]" />
                {category.displayName}
                <span className="ml-auto font-mono text-xs font-normal text-[var(--fg-subtle)]">{category.tools.length} tools</span>
              </h3>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {category.tools.map((tool, idx) => (
                  <a
                    key={idx}
                    href={tool.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block rounded-xl border border-[var(--line)] bg-[rgb(var(--fg-rgb)/0.03)] p-3.5 transition hover:border-[rgb(var(--accent-rgb)/0.45)] hover:bg-[rgb(var(--accent-rgb)/0.06)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-semibold transition group-hover:text-[rgb(var(--accent-rgb))]">{tool.name}</h4>
                        <p className="mt-1 line-clamp-2 text-sm text-[var(--fg-muted)]">{tool.description}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {tool.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="badge !text-[0.68rem]">
                              {tag}
                            </span>
                          ))}
                          {tool.tags.length > 3 && <span className="inline-block text-xs text-[var(--fg-subtle)]">+{tool.tags.length - 3}</span>}
                        </div>
                      </div>
                      <FaExternalLinkAlt className="mt-1 shrink-0 text-xs text-[var(--fg-subtle)] transition group-hover:text-[rgb(var(--accent-rgb))]" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}

          {filteredCategories.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-[var(--fg-muted)]">No tools found matching &quot;{searchQuery}&quot;</p>
            </div>
          )}
        </div>

        <div className="border-t border-[var(--line)] px-5 py-3 text-sm text-[var(--fg-muted)] sm:px-6">
          <p>
            Total: <strong className="text-[rgb(var(--fg-rgb))]">{TOTAL_CATALOG_TOOLS} tools</strong> across{' '}
            <strong className="text-[rgb(var(--fg-rgb))]">{categories.length} categories</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
