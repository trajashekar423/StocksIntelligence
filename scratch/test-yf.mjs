async function testYF() {
  console.log('Testing Yahoo Finance chart API for RAMBHAJO.NS...');

  const symbols = ['RAMBHAJO.NS', 'NITCO.NS', 'CUPID.NS', 'INFY.NS'];
  for (const s of symbols) {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${s}?interval=5m&range=1d`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    console.log(`${s} status:`, res.status);
    if (res.ok) {
      const json = await res.json();
      const meta = json?.chart?.result?.[0]?.meta;
      const ts = json?.chart?.result?.[0]?.timestamp || [];
      const quote = json?.chart?.result?.[0]?.indicators?.quote?.[0] || {};
      console.log(`${s} => LTP: ${meta?.regularMarketPrice}, Timestamps: ${ts.length}, Opens: ${quote.open?.length}`);
    }
  }
}

testYF().catch(console.error);

