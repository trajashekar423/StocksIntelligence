import { runPreCloseMomentumScanner } from '../src/services/preCloseScannerEngine.js';

const CANDIDATE_SYMBOLS = [
  // High-momentum & Pre-close candidates
  'WEL', 'GENCON', 'PVP', 'RAMBHAJO', 'NITCO', 'SUZLON', 'COCHINSHIP', 'MAZDOCK',
  'BDL', 'HAL', 'BEL', 'GRSE', 'IRFC', 'RVNL', 'TITAGARH', 'JWL', 'KAYNES',
  'DIXON', 'POLYCAB', 'CDSL', 'BSE', 'MCX', 'ANANTRAJ', 'DLF', 'PRESTIGE',
  'RADICO', 'AMBER', 'ANGELONE', 'CENTURYTEX', 'TRENT', 'ZOMATO', 'VBL',
  'RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'INFY', 'BHARTIARTL', 'SBIN',
  'TATAMOTORS', 'M&M', 'SUNPHARMA', 'TITAN', 'MARUTI', 'TATASTEEL', 'JSWSTEEL',
  'HINDALCO', 'COALINDIA', 'NTPC', 'ONGC', 'POWERGRID', 'ADANIENT', 'ADANIPORTS'
];

async function scanBestStocksForTomorrow() {
  console.log('--- Scanning Live NSE Stocks at 3:13 PM for Tomorrow (28-Aug-2026) ---');

  const liveQuotes = await Promise.all(
    CANDIDATE_SYMBOLS.map(async (symbol) => {
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
              averageVolume: Math.round(vol / 2.2) || 400000,
              vwap,
              buyQty,
              sellQty,
              isRealtime: true,
            };
          }
        }
      } catch {
        // ignore
      }
      return null;
    })
  );

  const validQuotes = liveQuotes.filter(Boolean);
  const result = runPreCloseMomentumScanner(validQuotes);

  console.log(`\nFound ${result.top10.length} Pre-Close Momentum Breakouts for Tomorrow:`);
  result.top10.slice(0, 7).forEach((stock, idx) => {
    console.log(
      `#${idx + 1} ${stock.symbol} | Stage: ${stock.stage} | Score: ${stock.score}/100 | LTP: ₹${stock.price} (+${stock.changePercent.toFixed(2)}%) | High: ₹${stock.high} | DistFromHigh: ${stock.distanceFromHigh}% | Target: ₹${stock.target} (+${stock.potentialGain}%) | SL: ₹${stock.stopLoss} | Vol: ${(stock.volume / 100000).toFixed(1)}L`
    );
  });
}

scanBestStocksForTomorrow();

