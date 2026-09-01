import { GET as nseGet } from '../nse/[...slug]/route.js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const url = new URL(req.url);
  const symbol = (url.searchParams.get('symbol') || '').trim().toUpperCase();

  if (!symbol) {
    return new Response(JSON.stringify({ error: 'symbol query parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 1. Try real-time stream from Groww Accord API for instantaneous live NSE quotes
  try {
    const liveUrl = `https://groww.in/v1/api/stocks_data/v1/accord_points/exchange/NSE/segment/CASH/latest_prices_ohlc/${encodeURIComponent(
      symbol
    )}`;
    const liveRes = await fetch(liveUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(3000),
    });

    if (liveRes.ok) {
      const d = await liveRes.json();
      if (d && Number(d.ltp) > 0) {
        const price = Number(d.ltp);
        const prev = Number(d.close || price);
        const open = Number(d.open || price);
        const high = Number(d.high || price);
        const low = Number(d.low || price);
        const chg = Number(d.dayChange || (prev ? price - prev : 0));
        const chgPct = Number(d.dayChangePerc || (prev ? (chg / prev) * 100 : 0));

        const payload = {
          info: {
            symbol: symbol,
            companyName: `${symbol} Limited`,
            activeSeries: ['EQ'],
            isFNOSec: true,
          },
          priceInfo: {
            lastPrice: price,
            change: chg,
            pChange: chgPct,
            previousClose: prev,
            open: open,
            close: price,
            intraDayHighLow: {
              min: low,
              max: high,
            },
            vwap: Number(((open + high + low + price) / 4).toFixed(2)),
          },
          securityInfo: {
            boardStatus: 'Main',
            tradingStatus: 'Active',
            tradingSegment: 'Normal Market',
          },
          metadata: {
            series: 'EQ',
            symbol: symbol,
            companyName: `${symbol} Limited`,
            lastUpdateTime: new Date().toLocaleTimeString('en-IN'),
          },
          source: 'LIVE_NSE_STREAM',
        };

        return new Response(JSON.stringify(payload), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=5',
          },
        });
      }
    }
  } catch {
    // Continue to internal proxy fallback
  }

  // 2. Delegate directly to the resilient NSE route handler
  return nseGet(req, {
    params: Promise.resolve({ slug: ['quote-equity'] }),
  });
}
