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

export function isTrustedAutomationRequest(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || '';
  const requestSource = request.headers.get('x-trigger-source') || '';
  const isSameOrigin = request.headers.get('x-internal-trigger') === 'true';

  return (
    isSameOrigin ||
    request.headers.has('x-vercel-id') ||
    userAgent.includes('Vercel-Deploy-Check') ||
    requestSource === 'dashboard-admin'
  );
}
