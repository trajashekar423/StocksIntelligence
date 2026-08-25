import { NextResponse } from 'next/server';
import { verifyGrowwConnection } from '@/src/lib/groww/auth';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    const status = await verifyGrowwConnection(forceRefresh);

    return NextResponse.json(status, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        authenticated: false,
        status: 'ERROR',
        lastChecked: new Date().toISOString(),
        error: err?.message || 'Failed to check Groww authentication',
      },
      { status: 500 }
    );
  }
}

