async function testLiveGainers() {
  console.log('Testing live NSE gainers & scanner fetch...');

  // 1. Fetch live NSE gainers
  try {
    const res = await fetch('https://www.nseindia.com/api/live-analysis-variations?index=gainers', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    });
    console.log('NSE Variations status:', res.status);
    if (res.ok) {
      const json = await res.json();
      const rows = json?.allSec?.data || json?.data || [];
      console.log(`Found ${rows.length} LIVE NSE Gainers:`);
      rows.slice(0, 8).forEach(r => {
        console.log(`- ${r.symbol}: ₹${r.ltp || r.lastPrice} (+${r.per_change || r.pChange}%) Vol: ${r.trade_quantity || r.volume}`);
      });
    }
  } catch (err) {
    console.log('Direct fetch error:', err.message);
  }
}

testLiveGainers().catch(console.error);

