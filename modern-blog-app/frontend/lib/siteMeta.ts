export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://rjexa.com').replace(/\/+$/, '');
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Raju Tech';

export const DEFAULT_DESCRIPTION =
  'Weekly AI-assisted reports on cloud, DevOps, security and AI tools, with research links when available, CVE checks, a 455-tool catalog, RSS and a read-only API.';

/**
 * The env var is sometimes filled with a long multi-paragraph "about" text. Search engines and link previews
 * need one short sentence, so anything over 200 characters falls back to the built-in description.
 */
export function getSiteDescription(): string {
  const configured = (process.env.NEXT_PUBLIC_SITE_DESCRIPTION || '').trim();
  return configured && configured.length <= 200 ? configured : DEFAULT_DESCRIPTION;
}
