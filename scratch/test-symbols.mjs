async function testSymbols() {
  const symbols = ['RAMBHAJO', 'CUPID', 'INFY', 'TATASTEEL', 'RELIANCE'];
  for (const sym of symbols) {
    try {
      const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}.NS?interval=5m&range=1d`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      if (res.ok) {
        const json = await res.json();
        const meta = json?.chart?.result?.[0]?.meta;
        const quotes = json?.chart?.result?.[0]?.indicators?.quote?.[0];
        const timestamps = json?.chart?.result?.[0]?.timestamp || [];
        console.log(`${sym} => LTP: ₹${meta?.regularMarketPrice}, High: ₹${meta?.regularMarketDayHigh}, Low: ₹${meta?.regularMarketDayLow}, Candles Count: ${timestamps.length}`);
      }
    } catch (e) {
      console.log(`${sym} failed:`, e.message);
    }
  }
}

testSymbols().catch(console.error);

