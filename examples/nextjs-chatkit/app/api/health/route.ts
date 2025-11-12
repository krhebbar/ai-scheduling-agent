/**
 * Next.js API Route - Health Check
 *
 * Simple health check endpoint
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    agent: 'SchedulingAgent',
    sdk: 'openai-agents-js',
    framework: 'Next.js 15',
  });
}
