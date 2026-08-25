import { NextResponse } from 'next/server';
import { getStore } from '@/src/lib/trading/store';
import { getGrowwPositions } from '@/src/lib/groww/orders';

export async function GET() {
  try {
    const store = getStore();

    if (store.config.mode === 'LIVE') {
      const livePositions = await getGrowwPositions();
      return NextResponse.json({
        mode: 'LIVE',
        positions: livePositions,
      });
    }

    return NextResponse.json({
      mode: 'PAPER',
      positions: store.positions,
      closedPositions: store.closedPositions,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch positions' }, { status: 500 });
  }
}

