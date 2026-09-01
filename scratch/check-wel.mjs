async function checkWEL() {
  const candidates = ['WEL', 'WONDERELE', 'WONDER'];
  for (const sym of candidates) {
    try {
      const url = `https://groww.in/v1/api/stocks_data/v1/accord_points/exchange/NSE/segment/CASH/latest_prices_ohlc/${sym}`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      console.log(sym, 'Status:', res.status);
      if (res.ok) {
        console.log('Quote:', await res.json());
      }
    } catch (e) {
      console.log(sym, 'Error:', e.message);
    }
  }

  // Also search Groww entity for Wonder Electricals
  try {
    const sUrl = 'https://groww.in/v1/api/search/v1/entity?app=false&entity_type=stocks&page=0&q=Wonder%20Electricals&size=5';
    const sRes = await fetch(sUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (sRes.ok) {
      const sJson = await sRes.json();
      console.log('Groww search Wonder Electricals:', sJson?.content?.map((c) => ({
        name: c.name,
        symbol: c.nse_script_code || c.search_id,
        bse_script_code: c.bse_script_code,
      })));
    }
  } catch (e) {
    console.log('Search err:', e);
  }
}

checkWEL();

