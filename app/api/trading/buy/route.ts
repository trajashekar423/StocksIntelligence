import { NextResponse } from 'next/server';
import { submitBuyOrder } from '@/src/lib/trading/orderService';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { symbol, entryPrice, stopLoss, target, quantity, customConfig } = body;

    if (!symbol) {
      return NextResponse.json({ success: false, error: 'Symbol is required' }, { status: 400 });
    }

    const result = await submitBuyOrder({
      symbol,
      entryPrice: entryPrice ? Number(entryPrice) : undefined,
      stopLoss: stopLoss ? Number(stopLoss) : undefined,
      target: target ? Number(target) : undefined,
      quantity: quantity ? Number(quantity) : undefined,
      customConfig,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to process buy order' },
      { status: 500 }
    );
  }
}

