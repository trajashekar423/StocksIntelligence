import { NIFTY50_CONSTITUENTS } from '../src/services/nifty50StrategyEngine.js';

async function checkMissing() {
  const missing = [];
  for (const c of NIFTY50_CONSTITUENTS) {
    try {
      const url = `https://groww.in/v1/api/stocks_data/v1/accord_points/exchange/NSE/segment/CASH/latest_prices_ohlc/${encodeURIComponent(c.symbol)}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'application/json',
        },
      });
      if (!res.ok) {
        missing.push(c.symbol);
      } else {
        const d = await res.json();
        if (!d || !Number(d.ltp)) missing.push(c.symbol);
      }
    } catch {
      missing.push(c.symbol);
    }
  }
  console.log('Missing symbols in Groww Accord:', missing);
}

checkMissing();

