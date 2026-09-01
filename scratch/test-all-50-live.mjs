import { NIFTY50_CONSTITUENTS } from '../src/services/nifty50StrategyEngine.js';

async function testFetchAll50() {
  console.log(`Fetching all ${NIFTY50_CONSTITUENTS.length} NIFTY50 constituents simultaneously...`);
  const t0 = Date.now();

  const results = await Promise.all(
    NIFTY50_CONSTITUENTS.map(async (c) => {
      try {
        const url = `https://groww.in/v1/api/stocks_data/v1/accord_points/exchange/NSE/segment/CASH/latest_prices_ohlc/${encodeURIComponent(c.symbol)}`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Accept': 'application/json',
          },
        });
        if (res.ok) {
          const d = await res.json();
          if (d && Number(d.ltp) > 0) {
            return {
              symbol: c.symbol,
              companyName: c.companyName,
              sector: c.sector,
              price: Number(d.ltp),
              previousClose: Number(d.close || d.ltp),
              open: Number(d.open || d.ltp),
              high: Number(d.high || d.ltp),
              low: Number(d.low || d.ltp),
              change: Number(d.dayChange || 0),
              changePercent: Number(d.dayChangePerc || 0),
              volume: Number(d.volume || 0),
              isLive: true,
            };
          }
        }
      } catch (e) {
        // error
      }
      return null;
    })
  );

  const duration = Date.now() - t0;
  const liveCount = results.filter(Boolean).length;
  console.log(`Fetched ${liveCount} / ${NIFTY50_CONSTITUENTS.length} LIVE stocks in ${duration}ms!`);

  console.log('\nSample Live Data:');
  results.filter(Boolean).slice(0, 10).forEach((s, idx) => {
    console.log(`[${idx + 1}] ${s.symbol.padEnd(12)} LTP: ₹${s.price.toFixed(2).padStart(8)} | PrevClose: ₹${s.previousClose.toFixed(2).padStart(8)} | Chg: ${s.changePercent >= 0 ? '+' : ''}${s.changePercent.toFixed(2)}% | High: ₹${s.high.toFixed(2)} | Low: ₹${s.low.toFixed(2)} | Vol: ${s.volume.toLocaleString()}`);
  });
}

testFetchAll50();

