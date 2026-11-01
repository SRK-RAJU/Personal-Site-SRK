import { NextRequest, NextResponse } from 'next/server';
import { getClientIp } from '@/lib/requestAccess';

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export function apiOptions() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/** Successful responses are cacheable by the CDN, so repeated requests do not reach the database. */
export function apiJson(body: unknown, options: { maxAge?: number; staleWhileRevalidate?: number } = {}) {
  const { maxAge = 300, staleWhileRevalidate = 3600 } = options;
  return NextResponse.json(body, {
    headers: { ...CORS_HEADERS, 'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}` },
  });
}

export function apiError(status: number, message: string, extraHeaders: Record<string, string> = {}) {
  return NextResponse.json(
    { error: { status, message } },
    { status, headers: { ...CORS_HEADERS, 'Cache-Control': 'no-store', ...extraHeaders } }
  );
}

// Light per-instance limiter on top of CDN caching: 120 requests / 5 minutes per IP.
const WINDOW_MS = 5 * 60 * 1000;
const MAX_REQUESTS = 120;
const hits = new Map<string, number[]>();

export function isRateLimited(request: NextRequest): boolean {
  const ip = getClientIp(request);
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((timestamp) => now - timestamp < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);

  if (hits.size > 5000) {
    for (const [key, timestamps] of hits) {
      if (timestamps.every((timestamp) => now - timestamp >= WINDOW_MS)) hits.delete(key);
    }
  }

  return recent.length > MAX_REQUESTS;
}

export function rateLimitResponse() {
  return apiError(429, 'Too many requests. Please slow down and retry in a few minutes.', { 'Retry-After': '300' });
}
