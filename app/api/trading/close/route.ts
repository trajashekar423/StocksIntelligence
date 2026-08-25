import { NextResponse } from 'next/server';
import { submitCloseOrder } from '@/src/lib/trading/orderService';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const positionId = body?.positionId;

    if (!positionId) {
      return NextResponse.json({ success: false, error: 'positionId is required' }, { status: 400 });
    }

    const result = await submitCloseOrder(positionId);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to close position' },
      { status: 500 }
    );
  }
}

