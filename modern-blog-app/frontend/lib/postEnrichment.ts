/**
 * Post enrichment for the AI report generator:
 *  - CVE verification against NVD (with a CVE.org fallback, because NVD lags behind brand-new CVEs),
 *  - a "CVE Details" section for verified CVEs,
 *  - a "Sources" section listing the links the model was given.
 *
 * Everything is time-boxed and fails open: if NVD / CVE.org are slow or down the post is still saved unchanged.
 * No database schema is involved; the details live in the post's markdown.
 */

export interface CveDetail {
  id: string;
  description: string;
  severity: string | null;
  score: number | null;
  cvssVersion: string | null;
  published: string | null;
  knownExploited: boolean;
  kevDueDate: string | null;
  url: string;
}

export interface SourceLink {
  title: string;
  url: string;
  published_date?: string;
}

type CveLookup =
  | { status: 'found'; detail: CveDetail }
  | { status: 'not_found' }
  | { status: 'unavailable' };

export interface EnrichmentResult {
  markdown: string;
  /** CVE identifiers that remain in the published text (verified or not checked). */
  cveCount: number;
  verified: CveDetail[];
  removed: string[];
}

const CVE_PATTERN = /\bCVE-\d{4}-\d{4,7}\b/gi;
const NVD_URL = 'https://services.nvd.nist.gov/rest/json/cves/2.0';
const CVE_ORG_URL = 'https://cveawg.mitre.org/api/cve';
const REQUEST_TIMEOUT_MS = 6000;
const MIN_BUDGET_MS = 1500;

export function extractCveIds(markdown: string): string[] {
  return Array.from(new Set((markdown.match(CVE_PATTERN) || []).map((id) => id.toUpperCase())));
}

async function fetchJson(url: string, timeoutMs: number, headers: Record<string, string> = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json', ...headers },
      signal: controller.signal,
      cache: 'no-store',
    });
    return { status: response.status, json: response.ok ? await response.json() : null };
  } catch {
    return { status: 0, json: null };
  } finally {
    clearTimeout(timer);
  }
}

function pickCvss(metrics: any): { severity: string | null; score: number | null; version: string | null } {
  // Newest scoring system first.
  for (const key of ['cvssMetricV40', 'cvssMetricV31', 'cvssMetricV30', 'cvssMetricV2']) {
    const entry = metrics?.[key]?.[0]?.cvssData;
    if (entry && typeof entry.baseScore === 'number') {
      const severity = entry.baseSeverity || metrics[key][0].baseSeverity || null;
      return { severity: severity ? String(severity).toUpperCase() : null, score: entry.baseScore, version: String(entry.version || '') || null };
    }
  }
  return { severity: null, score: null, version: null };
}

function shorten(text: string, max = 360): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

async function lookupCve(id: string, timeoutMs: number): Promise<CveLookup> {
  const apiKey = process.env.NVD_API_KEY;
  const nvd = await fetchJson(`${NVD_URL}?cveId=${encodeURIComponent(id)}`, timeoutMs, apiKey ? { apiKey } : {});

  if (nvd.status === 200 && nvd.json) {
    const cve = nvd.json.vulnerabilities?.[0]?.cve;
    if (cve && String(cve.vulnStatus || '').toLowerCase() !== 'rejected') {
      const description = (cve.descriptions || []).find((item: any) => item.lang === 'en')?.value || '';
      const cvss = pickCvss(cve.metrics);
      return {
        status: 'found',
        detail: {
          id,
          description: shorten(String(description)),
          severity: cvss.severity,
          score: cvss.score,
          cvssVersion: cvss.version,
          published: cve.published ? String(cve.published).slice(0, 10) : null,
          knownExploited: Boolean(cve.cisaExploitAdd),
          kevDueDate: cve.cisaActionDue ? String(cve.cisaActionDue).slice(0, 10) : null,
          url: `https://nvd.nist.gov/vuln/detail/${id}`,
        },
      };
    }
    if (cve) return { status: 'not_found' }; // rejected record
  } else if (nvd.status !== 404 && !(nvd.status === 200 && !nvd.json)) {
    // Rate limit, outage or timeout: do not guess.
    return { status: 'unavailable' };
  }

  // NVD has no record: brand-new CVEs show up in CVE.org first, so check there before calling it unknown.
  const record = await fetchJson(`${CVE_ORG_URL}/${encodeURIComponent(id)}`, timeoutMs);
  if (record.status === 404) return { status: 'not_found' };
  if (record.status !== 200 || !record.json) return { status: 'unavailable' };

  const cna = record.json.containers?.cna;
  if (String(record.json.cveMetadata?.state || '').toUpperCase() === 'REJECTED') return { status: 'not_found' };
  const description = (cna?.descriptions || []).find((item: any) => String(item.lang || '').startsWith('en'))?.value || '';
  return {
    status: 'found',
    detail: {
      id,
      description: shorten(String(description)),
      severity: null,
      score: null,
      cvssVersion: null,
      published: record.json.cveMetadata?.datePublished ? String(record.json.cveMetadata.datePublished).slice(0, 10) : null,
      knownExploited: false,
      kevDueDate: null,
      url: `https://www.cve.org/CVERecord?id=${id}`,
    },
  };
}

function cveLine(detail: CveDetail): string {
  const facts: string[] = [];
  if (detail.severity && detail.score !== null) {
    facts.push(`${detail.severity} (CVSS ${detail.score.toFixed(1)}${detail.cvssVersion ? `, v${detail.cvssVersion}` : ''})`);
  }
  if (detail.published) facts.push(`published ${detail.published}`);
  if (detail.knownExploited) {
    facts.push(`CISA known exploited${detail.kevDueDate ? ` (remediation due ${detail.kevDueDate})` : ''}`);
  }
  const prefix = facts.length ? ` — ${facts.join(' · ')}.` : '.';
  return `- [${detail.id}](${detail.url})${prefix}${detail.description ? ` ${detail.description}` : ''}`;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function verifyCves(markdown: string, budgetMs: number) {
  const ids = extractCveIds(markdown);
  if (ids.length === 0 || budgetMs < MIN_BUDGET_MS) {
    return { markdown, verified: [] as CveDetail[], removed: [] as string[] };
  }

  // NVD allows 5 requests / 30 s without an API key and 50 with one.
  const maxLookups = process.env.NVD_API_KEY ? 8 : 3;
  const timeoutMs = Math.min(REQUEST_TIMEOUT_MS, budgetMs);
  const results = await Promise.all(ids.slice(0, maxLookups).map(async (id) => ({ id, result: await lookupCve(id, timeoutMs) })));

  const verified = results.flatMap(({ result }) => (result.status === 'found' ? [result.detail] : []));
  const removed = results.filter(({ result }) => result.status === 'not_found').map(({ id }) => id);

  let cleaned = markdown;
  for (const id of removed) {
    cleaned = cleaned.replace(new RegExp(`\\b${escapeRegExp(id)}\\b`, 'gi'), 'an unverified CVE identifier');
  }

  return { markdown: cleaned, verified, removed };
}

function cveSection(verified: CveDetail[], removedCount: number): string {
  const sorted = [...verified].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  const lines = ['## CVE Details', '', ...sorted.map(cveLine), ''];
  const notes = [
    'CVE data from NVD (nvd.nist.gov) and CVE.org; provided as-is, so verify before acting. CVE® is a registered trademark of The MITRE Corporation, used under the CVE Terms of Use (https://www.cve.org/Legal/TermsOfUse).',
  ];
  if (removedCount > 0) {
    notes.push('CVE identifiers that could not be found in NVD or CVE.org were removed from this report.');
  }
  lines.push(`_${notes.join(' ')}_`);
  return lines.join('\n');
}

function safeMarkdownText(value: string) {
  return value.replace(/[\r\n]+/g, ' ').replace(/[[\]]/g, '').trim().slice(0, 160);
}

export function buildSourcesSection(sources: SourceLink[]): string {
  const seen = new Set<string>();
  const items = sources
    .filter((source) => /^https?:\/\//i.test(source.url) && !seen.has(source.url) && seen.add(source.url))
    .slice(0, 6)
    .map((source) => {
      const when = source.published_date ? ` (${String(source.published_date).slice(0, 10)})` : '';
      return `- [${safeMarkdownText(source.title) || source.url}](${source.url.replace(/[()\s]/g, encodeURIComponent)})${when}`;
    });

  if (items.length === 0) return '';

  return [
    '## Sources',
    '',
    ...items,
    '',
    '_This report was generated with AI assistance from the sources above. Verify critical details against the vendor advisories before acting._',
  ].join('\n');
}

export async function enrichPost(markdown: string, sources: SourceLink[], deadlineAt: number): Promise<EnrichmentResult> {
  let content = markdown.trim();
  let verified: CveDetail[] = [];
  let removed: string[] = [];

  try {
    // Leave room for the database save that follows.
    const budgetMs = Math.min(9000, deadlineAt - Date.now() - 5000);
    const checked = await verifyCves(content, budgetMs);
    content = checked.markdown;
    verified = checked.verified;
    removed = checked.removed;
  } catch (error) {
    console.warn('[ENRICHMENT] CVE verification skipped:', (error as Error)?.message || error);
  }

  const sections: string[] = [];
  if (verified.length > 0) sections.push(cveSection(verified, removed.length));
  const sourcesSection = buildSourcesSection(sources);
  if (sourcesSection) sections.push(sourcesSection);

  const finalMarkdown = sections.length > 0 ? `${content}\n\n${sections.join('\n\n')}` : content;

  return {
    markdown: finalMarkdown,
    cveCount: extractCveIds(content).length,
    verified,
    removed,
  };
}
