import { runPreCloseMomentumScanner } from '../src/services/preCloseScannerEngine.js';

const CANDIDATES = [
  'PVP', 'AMBER', 'ADANIENT', 'ICICIBANK', 'POWERGRID', 'ADANIPORTS', 'SUNPHARMA',
  'GENCON', 'WEL', 'SUZLON', 'COCHINSHIP', 'MAZDOCK', 'BDL', 'HAL', 'BEL', 'GRSE',
  'IRFC', 'RVNL', 'TITAGARH', 'KAYNES', 'DIXON', 'POLYCAB', 'CDSL', 'BSE', 'MCX',
  'DLF', 'PRESTIGE', 'RADICO', 'ANGELONE', 'TRENT', 'ZOMATO', 'VBL', 'RELIANCE',
  'TCS', 'HDFCBANK', 'INFY', 'BHARTIARTL', 'SBIN', 'TATAMOTORS', 'M&M', 'TATASTEEL'
];

async function scan() {
  const quotes = await Promise.all(
    CANDIDATES.map(async (symbol) => {
      try {
        const url = `https://groww.in/v1/api/stocks_data/v1/accord_points/exchange/NSE/segment/CASH/latest_prices_ohlc/${encodeURIComponent(symbol)}`;
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(3500) });
        if (res.ok) {
          const d = await res.json();
          if (d && Number(d.ltp) > 0) {
            const price = Number(d.ltp);
            const prev = Number(d.close || price);
            const open = Number(d.open || price);
            const high = Number(d.high || price);
            const low = Number(d.low || price);
            const chg = Number(d.dayChangePerc ?? (prev ? ((price - prev) / prev) * 100 : 0));
            const vol = Number(d.volume || 1000000);
            const vwap = Number(((open + high + low + price) / 4).toFixed(2));
            const buyQty = Number(d.totalBuyQty || d.cumulativeBuyQty || 100000);
            const sellQty = Number(d.totalSellQty || d.cumulativeSellQty || 100000);

            return {
              symbol,
              companyName: `${symbol} Ltd`,
              price,
              previousClose: prev,
              changePercent: chg,
              open,
              high,
              low,
              volume: vol,
              averageVolume: Math.round(vol / 2.0) || 400000,
              vwap,
              buyQty,
              sellQty,
              isRealtime: true,
            };
          }
        }
      } catch {}
      return null;
    })
  );

  const valid = quotes.filter(Boolean);
  const result = runPreCloseMomentumScanner(valid);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('TOP PRE-CLOSE MOMENTUM BREAKOUTS FOR TOMORROW (28-AUG-2026)');
  console.log('═══════════════════════════════════════════════════════════');
  result.top10.slice(0, 5).forEach((s, idx) => {
    console.log(`\n#${idx + 1} 🚀 ${s.symbol} — ${s.company}`);
    console.log(`   • Score: ${s.momentumScore}/100 | ${s.stage} (${s.classification})`);
    console.log(`   • Live LTP: ₹${s.ltp.toFixed(2)} (+${s.changePercent.toFixed(2)}%) | High: ₹${s.high.toFixed(2)} (within ${s.distanceFromHigh}% of High)`);
    console.log(`   • VWAP: ₹${s.vwap.toFixed(2)} | Traded Volume: ${(s.volume / 100000).toFixed(1)} Lakh shares`);
    console.log(`   • Target 1: ₹${s.target1.toFixed(2)} (+${(((s.target1 - s.ltp)/s.ltp)*100).toFixed(1)}%) | Target 2: ₹${s.target2.toFixed(2)} (+${(((s.target2 - s.ltp)/s.ltp)*100).toFixed(1)}%)`);
    console.log(`   • Stop Loss: ₹${s.stopLoss.toFixed(2)} (Risk:Reward: ${s.riskReward.toFixed(1)})`);
    console.log(`   • Key Catalyst: ${s.keyReasons.slice(0, 2).join('; ')}`);
  });
}

scan();

