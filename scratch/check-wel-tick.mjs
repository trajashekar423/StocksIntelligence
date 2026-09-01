async function checkWELTick() {
  const url = `https://groww.in/v1/api/stocks_data/v1/accord_points/exchange/NSE/segment/CASH/latest_prices_ohlc/WEL`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (res.ok) {
    const data = await res.json();
    console.log('WEL Live at 1:19 PM:', JSON.stringify(data, null, 2));
  }
}

checkWELTick();

