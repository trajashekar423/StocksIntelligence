async function testRambhajoCandles() {
  const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/RAMBHAJO.NS?interval=5m&range=1d', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  const json = await res.json();
  const ts = json?.chart?.result?.[0]?.timestamp || [];
  const quote = json?.chart?.result?.[0]?.indicators?.quote?.[0] || {};
  
  const candles = ts.map((t, i) => ({
    timestamp: new Date(t * 1000).toISOString(),
    timeStr: new Date(t * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    open: Number(quote.open?.[i]?.toFixed(2) || 0),
    high: Number(quote.high?.[i]?.toFixed(2) || 0),
    low: Number(quote.low?.[i]?.toFixed(2) || 0),
    close: Number(quote.close?.[i]?.toFixed(2) || 0),
    volume: quote.volume?.[i] || 0,
  })).filter(c => c.close > 0);

  console.log(`Extracted ${candles.length} REAL LIVE CANDLES for RAMBHAJO:`);
  console.log('Last 3 candles:', JSON.stringify(candles.slice(-3), null, 2));
}

testRambhajoCandles().catch(console.error);

