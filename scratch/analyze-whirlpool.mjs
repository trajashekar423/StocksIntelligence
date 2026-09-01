import { evaluatePreCloseStock } from '../src/services/preCloseScannerEngine.js';

async function analyzeWhirlpool() {
  console.log('--- Fetching Live Technicals for WHIRLPOOL (Whirlpool of India Ltd) ---');
  try {
    const res = await fetch(
      'https://groww.in/v1/api/stocks_data/v1/accord_points/exchange/NSE/segment/CASH/latest_prices_ohlc/WHIRLPOOL',
      { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(4000) }
    );
    if (res.ok) {
      const d = await res.json();
      console.log('Raw Data:', JSON.stringify(d, null, 2));

      const price = Number(d.ltp);
      const prev = Number(d.close || price);
      const open = Number(d.open || price);
      const high = Number(d.high || price);
      const low = Number(d.low || price);
      const chg = Number(d.dayChangePerc ?? (prev ? ((price - prev) / prev) * 100 : 0));
      const vol = Number(d.volume || 100000);
      const vwap = Number(((open + high + low + price) / 4).toFixed(2));
      const buyQty = Number(d.totalBuyQty || d.cumulativeBuyQty || 10000);
      const sellQty = Number(d.totalSellQty || d.cumulativeSellQty || 10000);
      const buySellRatio = sellQty > 0 ? Number((buyQty / sellQty).toFixed(2)) : 1.2;

      const evalResult = evaluatePreCloseStock({
        symbol: 'WHIRLPOOL',
        companyName: 'Whirlpool of India Limited',
        price,
        previousClose: prev,
        changePercent: chg,
        open,
        high,
        low,
        volume: vol,
        averageVolume: Math.round(vol / 1.5) || 50000,
        vwap,
        buySellRatio,
        isRealtime: true,
      });

      console.log('\n=== WHIRLPOOL TECHNICAL AUDIT ===');
      console.log(`LTP: ₹${price.toFixed(2)} (${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%)`);
      console.log(`Day Range: Low ₹${low.toFixed(2)} — High ₹${high.toFixed(2)}`);
      console.log(`VWAP: ₹${vwap.toFixed(2)} (Diff from VWAP: ${(((price - vwap) / vwap) * 100).toFixed(2)}%)`);
      console.log(`Distance from Day High: ${evalResult.distanceFromHigh}%`);
      console.log(`Traded Volume: ${(vol / 100000).toFixed(2)} Lakh shares`);
      console.log(`Order Book Bid/Ask Ratio: ${buySellRatio}x`);
      console.log(`Momentum Score: ${evalResult.momentumScore}/100 | Classification: ${evalResult.classification}`);
      console.log(`Stage: ${evalResult.stage}`);
      console.log(`Entry Zone: ${evalResult.entryZone}`);
      console.log(`Stop Loss: ₹${evalResult.stopLoss}`);
      console.log(`Target 1: ₹${evalResult.target1} (+${(((evalResult.target1 - price) / price) * 100).toFixed(1)}%)`);
      console.log(`Target 2: ₹${evalResult.target2} (+${(((evalResult.target2 - price) / price) * 100).toFixed(1)}%)`);
      console.log(`Key Reasons:`, evalResult.keyReasons);
      console.log(`Key Risks:`, evalResult.keyRisks);
    } else {
      console.log('Failed to fetch from Groww API');
    }
  } catch (err) {
    console.error(err);
  }
}

analyzeWhirlpool();

