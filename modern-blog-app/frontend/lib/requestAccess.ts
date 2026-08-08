import { NextRequest } from 'next/server';

export function getClientIp(request: NextRequest): string {
  const candidateHeaders = [
    'cf-connecting-ip',
    'x-real-ip',
    'true-client-ip',
  ];

  for (const headerName of candidateHeaders) {
    const value = request.headers.get(headerName);
    if (value) {
      return value.split(',')[0].trim();
    }
  }

  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return 'unknown';
}

export interface GeoInfo {
  country: string;
  region: string;
  city: string;
}

/**
 * Reads Vercel's edge-injected geo headers (no external geo-IP API/cost needed).
 * Falls back to 'Unknown' when running locally or off Vercel.
 */
export function getGeoInfo(request: NextRequest): GeoInfo {
  return {
    country: request.headers.get('x-vercel-ip-country') || 'Unknown',
    region: request.headers.get('x-vercel-ip-country-region') || 'Unknown',
    city: request.headers.get('x-vercel-ip-city') || 'Unknown',
  };
}
