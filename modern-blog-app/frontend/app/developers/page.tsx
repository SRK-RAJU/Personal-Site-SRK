import type { Metadata } from 'next';
import Link from 'next/link';
import { FaCode, FaRss, FaFileCode } from 'react-icons/fa';
import { SITE_NAME, SITE_URL } from '@/lib/siteMeta';

export const metadata: Metadata = {
  title: `Public API | ${SITE_NAME}`,
  description: 'Read-only JSON API for weekly AI-assisted reports and the tool catalog. OpenAPI spec, caching and usage terms.',
  alternates: { canonical: '/developers' },
};

const curlList = `curl "${SITE_URL}/api/v1/posts?limit=5&category=Cloud%20Platform"`;
const curlOne = `curl "${SITE_URL}/api/v1/posts/<slug>"`;
const curlCategories = `curl "${SITE_URL}/api/v1/categories?include=tools"`;
const jsExample = `const res = await fetch('${SITE_URL}/api/v1/posts?limit=10');
const { data, meta } = await res.json();
for (const post of data) console.log(post.title, post.url);`;

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--code-bg)] p-4 text-sm leading-6 text-slate-100">
      <code className="font-mono">{children}</code>
    </pre>
  );
}

const endpoints = [
  {
    path: '/api/v1/posts',
    description: 'Published reports, newest first. Filters: page, limit (max 50), category, q (title text).',
  },
  {
    path: '/api/v1/posts/{slug}',
    description: 'One report with its full markdown, tags and attribution details.',
  },
  {
    path: '/api/v1/categories',
    description: 'The tool categories. Add ?include=tools for every tool with description and official links.',
  },
  {
    path: '/api/v1/openapi.json',
    description: 'OpenAPI 3.1 specification for code generators and API clients.',
  },
];

export default function DevelopersPage() {
  return (
    <div className="page-wrapper">
      <div className="page-frame max-w-5xl">
        <header className="page-hero">
          <p className="eyebrow">
            <FaCode className="text-sm" />
            Developers
          </p>
          <h1 className="gradient-text mt-3 break-words text-3xl font-bold sm:text-5xl">Public API</h1>
          <p className="mt-4 max-w-3xl text-lg text-[var(--fg-muted)]">
            Read-only JSON access to reports and the tool catalog. No API key is required. API access does not grant permission to republish or redistribute the content.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/api/v1/openapi.json" className="btn-primary">
              <FaFileCode /> OpenAPI spec
            </a>
            <a href="/feed.xml" className="btn-secondary">
              <FaRss /> RSS feed
            </a>
            <Link href="/docs" className="btn-ghost">
              Knowledge base
            </Link>
          </div>
        </header>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold">Endpoints</h2>
          <div className="space-y-3">
            {endpoints.map((endpoint) => (
              <div key={endpoint.path} className="page-panel !p-4">
                <p className="font-mono text-sm font-semibold text-[rgb(var(--accent-rgb))]">GET {endpoint.path}</p>
                <p className="mt-1 text-sm text-[var(--fg-muted)]">{endpoint.description}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-[var(--fg-muted)]">
            Base URL: <code className="font-mono">{SITE_URL}</code>. All responses are JSON with CORS enabled, so you can call the API from a browser.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold">Examples</h2>
          <div className="space-y-4">
            <Code>{curlList}</Code>
            <Code>{curlOne}</Code>
            <Code>{curlCategories}</Code>
            <Code>{jsExample}</Code>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold">Limits and caching</h2>
          <ul className="list-disc space-y-2 pl-6 text-[var(--fg-muted)]">
            <li>Responses are cached for a few minutes at the edge; the category list is cached for a day. Please cache on your side too.</li>
            <li>Up to 120 requests per 5 minutes per IP address. Above that you receive HTTP 429 with a Retry-After header.</li>
            <li>Errors use the shape {'{ "error": { "status": 404, "message": "…" } }'}.</li>
          </ul>
        </section>

        <section id="terms" className="page-panel scroll-mt-28">
          <h2 className="mb-3 text-2xl font-bold">Terms of use</h2>
          <ul className="list-disc space-y-2 pl-6 text-[var(--fg-muted)]">
            <li>This API provides read-only access only. All reports and catalog content remain protected; reproduction, redistribution or republication (including bulk or commercial use) requires prior written permission.</li>
            <li>Attribution details are provided in responses for reference. Attribution alone does not grant a right to reproduce or republish any content.</li>
            <li>For personal viewing, use the API response or link to the original report. Do not copy, republish or redistribute report text or catalog data without prior written permission.</li>
            <li>Content is AI-assisted and provided as-is, without warranty. Verify security details against vendor advisories.</li>
            <li>
              CVE data comes from NVD and CVE.org. CVE® is a registered trademark of The MITRE Corporation, used under the{' '}
              <a href="https://www.cve.org/Legal/TermsOfUse" target="_blank" rel="noopener noreferrer" className="text-[rgb(var(--accent-rgb))] underline">
                CVE Terms of Use
              </a>
              .
            </li>
            <li>We may change or limit the API to protect the service.</li>
          </ul>
          <p className="mt-4 text-sm text-[var(--fg-subtle)]">
            Questions? <Link href="/contact" className="text-[rgb(var(--accent-rgb))] underline">Contact us</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
