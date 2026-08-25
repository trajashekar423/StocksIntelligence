import { NextResponse } from 'next/server';
import { getStore } from '@/src/lib/trading/store';

export async function GET() {
  try {
    const store = getStore();
    return NextResponse.json({
      mode: store.config.mode,
      activePositions: store.positions,
      closedTrades: store.closedPositions,
      stats: store.stats,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch orders' }, { status: 500 });
  }
}

