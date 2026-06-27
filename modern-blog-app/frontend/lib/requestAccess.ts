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
  const authHeader = request.headers.get('authorization') || '';
  const hasValidSecret = authHeader === `Bearer ${process.env.CRON_SECRET || ''}`;
  const userAgent = request.headers.get('user-agent') || '';
  const requestSource = request.headers.get('x-trigger-source') || '';

  return (
    hasValidSecret ||
    request.headers.has('x-vercel-id') ||
    userAgent.includes('vercel-cron') ||
    userAgent.includes('Vercel-Deploy-Check') ||
    userAgent.includes('GitHub-Hookshot') ||
    userAgent.includes('GitHub-Actions-Workflow') ||
    request.headers.get('x-vercel-cron') === '1' ||
    request.headers.get('x-vercel-deployment-url') !== null ||
    request.headers.get('x-github-event') !== null ||
    requestSource === 'github-actions' ||
    requestSource === 'deployment-check' ||
    requestSource === 'vercel-deploy'
  );
}
