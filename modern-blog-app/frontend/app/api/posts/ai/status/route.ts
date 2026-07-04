/**
 * ============================================================================
 * CHECK GENERATION STATUS ENDPOINT
 * ============================================================================
 * Purpose:
 * - Check if AI post generation should run
 * - Looks at ai_generated_posts table (not posts table)
 * - Returns true if no AI posts exist OR if it's Monday 3 AM
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({
    shouldGenerate: false,
    reason: 'Manual admin trigger only',
  });
}
