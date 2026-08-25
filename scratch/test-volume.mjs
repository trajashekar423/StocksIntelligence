async function testActiveSecurities() {
  const res = await fetch('https://www.nseindia.com/api/live-analysis-most-active-securities?index=volume', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
    }
  });
  console.log('Most active status:', res.status);
  if (res.ok) {
    const json = await res.json();
    const rows = json?.data || [];
    console.log(`Found ${rows.length} volume leaders:`, rows.slice(0, 5).map(r => r.symbol));
  }
}

testActiveSecurities().catch(console.error);

