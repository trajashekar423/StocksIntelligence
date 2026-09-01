async function getGenusPowerQuote() {
  console.log('--- Fetching GENUSPOWER Quote ---');
  const symbol = 'GENUSPOWER';
  const urls = [
    `http://localhost:3000/api/quote-equity?symbol=${symbol}`,
    `https://groww.in/v1/api/stocks_data/v1/accord_points/exchange/NSE/segment/CASH/latest_prices_ohlc/${symbol}`,
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.NS?interval=5m&range=1d`,
  ];

  for (const u of urls) {
    try {
      console.log(`Trying URL: ${u}`);
      const res = await fetch(u, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(4000),
      });
      console.log(`Status: ${res.status}`);
      if (res.ok) {
        const json = await res.json();
        console.log('Result payload preview:', JSON.stringify(json, null, 2).slice(0, 1000));
      }
    } catch (err) {
      console.log(`Error on ${u}:`, err.message);
    }
  }
}

getGenusPowerQuote();

