import { NextResponse } from 'next/server';
import { fetchGrowwQuote } from '@/src/lib/groww/marketData';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const symbol = url.searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json({ error: 'symbol query parameter is required' }, { status: 400 });
    }

    const quote = await fetchGrowwQuote(symbol);
    if (!quote) {
      return NextResponse.json({ error: `Could not find quote for ${symbol}` }, { status: 404 });
    }

    return NextResponse.json(quote, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch quote' }, { status: 500 });
  }
}

