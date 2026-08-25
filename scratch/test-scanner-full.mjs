import { evaluateStockScanner } from '../src/lib/trading/scanner.ts';
import { getTradingConfig } from '../src/lib/trading/config.ts';

async function testFullScanner() {
  console.log('Testing full live scanner on live NSE gainers and volume movers...');

  const config = getTradingConfig();
  const candidateMap = new Map();

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
  };

  const [gainersRes, volRes] = await Promise.allSettled([
    fetch('https://www.nseindia.com/api/live-analysis-variations?index=gainers', { headers, signal: AbortSignal.timeout(4000) }),
    fetch('https://www.nseindia.com/api/live-analysis-most-active-securities?index=volume', { headers, signal: AbortSignal.timeout(4000) }),
  ]);

  if (gainersRes.status === 'fulfilled' && gainersRes.value.ok) {
    const json = await gainersRes.value.json();
    const rows = json?.allSec?.data || json?.data || [];
    rows.forEach(r => {
      const sym = String(r.symbol || '').trim().toUpperCase();
      if (sym && r.ltp > 0) {
        const ltp = Number(r.ltp);
        const prev = Number(r.prev_price || ltp);
        const open = Number(r.open_price || ltp);
        const high = Number(r.high_price || ltp);
        const low = Number(r.low_price || ltp);
        const chgPct = prev > 0 ? ((ltp - prev) / prev) * 100 : 0;
        const vwap = Number(((open + high + low + ltp) / 4).toFixed(2));
        candidateMap.set(sym, {
          symbol: sym,
          companyName: r.companyName || `${sym} Limited`,
          price: ltp,
          previousClose: prev,
          dayHigh: high,
          dayLow: low,
          volume: Number(r.trade_quantity || 500000),
          vwap,
          rsi: chgPct >= 5 ? 72 : chgPct >= 2 ? 65 : 55,
          rvol: 2.5,
          prevDayHigh: prev * 1.01,
        });
      }
    });
  }

  if (volRes.status === 'fulfilled' && volRes.value.ok) {
    const json = await volRes.value.json();
    const rows = json?.data || [];
    rows.forEach(r => {
      const sym = String(r.symbol || '').trim().toUpperCase();
      if (sym && r.ltp > 0 && !candidateMap.has(sym)) {
        const ltp = Number(r.ltp);
        const prev = Number(r.prev_price || r.previousClose || ltp);
        const open = Number(r.open_price || ltp);
        const high = Number(r.high_price || ltp);
        const low = Number(r.low_price || ltp);
        const vwap = Number(((open + high + low + ltp) / 4).toFixed(2));
        candidateMap.set(sym, {
          symbol: sym,
          companyName: r.companyName || `${sym} Limited`,
          price: ltp,
          previousClose: prev,
          dayHigh: high,
          dayLow: low,
          volume: Number(r.volume || r.trade_quantity || 1000000),
          vwap,
          rsi: 60,
          rvol: 2.0,
          prevDayHigh: prev * 1.01,
        });
      }
    });
  }

  const rawList = Array.from(candidateMap.values());
  console.log(`Extracted ${rawList.length} unique live NSE stocks!`);

  const scanned = rawList
    .map(stock => evaluateStockScanner(stock, config))
    .filter(s => s.ltp > 0)
    .sort((a, b) => b.bullishScore - a.bullishScore || b.changePercent - a.changePercent);

  console.log('\nTop 5 Scanned Live Intraday Stocks:');
  scanned.slice(0, 5).forEach((s, i) => {
    console.log(`${i + 1}. ${s.symbol} | LTP: ₹${s.ltp} | Change%: ${s.changePercent.toFixed(2)}% | Score: ${s.bullishScore}/100 | Signal: ${s.signal} | R:R: ${s.riskReward}:1`);
  });
}

testFullScanner().catch(console.error);

