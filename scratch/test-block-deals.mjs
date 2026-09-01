async function testNseBlockDeals() {
  console.log('--- Testing NSE Block Deals Endpoint ---');
  const urls = [
    'https://www.nseindia.com/api/block-deal',
    'https://www.nseindia.com/api/snapshot-capital-market-large-deal',
    'https://www.nseindia.com/api/live-analysis-large-deals',
    'https://www.nseindia.com/api/historical/bulk-deals',
  ];

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.nseindia.com/market-data/block-deal-watch',
  };

  for (const u of urls) {
    try {
      console.log(`Fetching: ${u}`);
      const res = await fetch(u, { headers, signal: AbortSignal.timeout(4000) });
      console.log(`Status: ${res.status}`);
      if (res.ok) {
        const text = await res.text();
        console.log(`Response length: ${text.length}, preview: ${text.slice(0, 200)}`);
      }
    } catch (err) {
      console.log(`Error on ${u}:`, err.message);
    }
  }
}

testNseBlockDeals();

