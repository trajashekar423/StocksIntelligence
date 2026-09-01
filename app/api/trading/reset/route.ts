import { NextResponse } from 'next/server';
import { resetStore } from '@/src/lib/trading/store';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    let body = {};
    try {
      body = await req.json();
    } catch {
      // default empty
    }
    const capital = Number((body as any)?.capital) || 50000;
    const store = resetStore(capital);
    return NextResponse.json({
      success: true,
      message: `Paper Trading Mode reset successfully. Capital initialized to ₹${capital.toLocaleString('en-IN')}.`,
      stats: store.stats,
      positions: store.positions,
      closedPositions: store.closedPositions,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to reset paper trading mode' },
      { status: 500 }
    );
  }
}

