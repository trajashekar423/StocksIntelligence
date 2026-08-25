async function testRowDetails() {
  const res = await fetch('https://www.nseindia.com/api/live-analysis-variations?index=gainers', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
    }
  });
  const json = await res.json();
  const rows = json?.allSec?.data || json?.data || [];
  console.log('Row 0 sample:', JSON.stringify(rows[0], null, 2));
}

testRowDetails().catch(console.error);

