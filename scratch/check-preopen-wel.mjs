async function checkPreOpenWEL() {
  console.log('Fetching Pre-Open live quote for WEL...');
  try {
    const url = `https://groww.in/v1/api/stocks_data/v1/accord_points/exchange/NSE/segment/CASH/latest_prices_ohlc/WEL`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (res.ok) {
      const data = await res.json();
      console.log('WEL Live Pre-Open Data at 9:04 AM:', JSON.stringify(data, null, 2));
    } else {
      console.log('Groww status:', res.status);
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

checkPreOpenWEL();

