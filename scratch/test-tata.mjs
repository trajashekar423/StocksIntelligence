async function testTata() {
  const candidates = ['TATAMOTORS', 'TATAMTRDVR', 'TATA-MOTORS', 'TATAMOTORS-EQ'];
  for (const sym of candidates) {
    try {
      const url = `https://groww.in/v1/api/stocks_data/v1/accord_points/exchange/NSE/segment/CASH/latest_prices_ohlc/${encodeURIComponent(sym)}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      console.log(sym, 'Status:', res.status);
      if (res.ok) {
        console.log('Data:', await res.json());
      }
    } catch (e) {
      console.log(sym, 'Err:', e.message);
    }
  }

  // Also test Groww search
  try {
    const sUrl = 'https://groww.in/v1/api/search/v1/entity?app=false&entity_type=stocks&page=0&q=Tata%20Motors&size=5';
    const sRes = await fetch(sUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    console.log('Search Tata Motors status:', sRes.status);
    if (sRes.ok) {
      const sJson = await sRes.json();
      console.log('Search results:', sJson?.content?.map((c) => ({ name: c.name, nse_script_code: c.nse_script_code, groww_contract_id: c.groww_contract_id })));
    }
  } catch (e) {
    console.log('Search err:', e);
  }
}

testTata();

