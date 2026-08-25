import { NextResponse } from 'next/server';
import { getStore } from '@/src/lib/trading/store';
import { syncAllPositions } from '@/src/lib/trading/orderService';
import { getMarketSessionStatus } from '@/src/services/stocksService';
import { verifyGrowwConnection } from '@/src/lib/groww/auth';

export async function GET() {
  try {
    const store = getStore();
    const updatedPositions = await syncAllPositions();
    const marketStatus = getMarketSessionStatus();
    const growwAuth = await verifyGrowwConnection();

    return NextResponse.json(
      {
        mode: store.config.mode,
        enabled: store.config.enabled,
        config: store.config,
        positions: updatedPositions,
        closedPositions: store.closedPositions,
        stats: store.stats,
        logs: store.logs,
        marketStatus,
        growwAuth,
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch trading status' }, { status: 500 });
  }
}

