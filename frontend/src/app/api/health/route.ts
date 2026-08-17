import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'Autergo Frontend Web App',
    timestamp: new Date().toISOString(),
  });
}
