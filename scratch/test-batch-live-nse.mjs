async function testBatchLiveNse() {
  const symbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'SBIN', 'ITC', 'BHARTIARTL', 'TATAMOTORS', 'BAJFINANCE'];
  console.log(`Fetching live real-time NSE data for ${symbols.length} stocks from Groww Accord API...`);

  const results = await Promise.all(
    symbols.map(async (sym) => {
      try {
        const url = `https://groww.in/v1/api/stocks_data/v1/accord_points/exchange/NSE/segment/CASH/latest_prices_ohlc/${encodeURIComponent(sym)}`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Accept': 'application/json',
          },
        });
        if (res.ok) {
          const data = await res.json();
          return {
            symbol: sym,
            ltp: data.ltp,
            previousClose: data.close,
            open: data.open,
            high: data.high,
            low: data.low,
            change: data.dayChange,
            changePercent: data.dayChangePerc,
            volume: data.volume,
            ts: data.tsInMillis,
          };
        }
      } catch (e) {
        // error
      }
      return null;
    })
  );

  console.log('Results:');
  results.filter(Boolean).forEach((r) => {
    console.log(`  ${r.symbol.padEnd(12)} LTP: ₹${r.ltp?.toFixed(2).padStart(8)} | PrevClose: ₹${r.previousClose?.toFixed(2).padStart(8)} | Chg: ${r.changePercent >= 0 ? '+' : ''}${r.changePercent?.toFixed(2)}% | Vol: ${r.volume?.toLocaleString()}`);
  });
}

testBatchLiveNse();

