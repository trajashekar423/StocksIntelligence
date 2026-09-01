async function searchGencon() {
  console.log('--- Searching GENCON Limited ---');
  const queries = ['GENCON', 'Generic Engineering Construction', 'Gencon Limited', 'GENCON'];
  for (const q of queries) {
    try {
      const url = `https://groww.in/v1/api/search/v1/entity?app=false&entity_type=stocks&page=0&q=${encodeURIComponent(q)}&size=5`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.ok) {
        const json = await res.json();
        console.log(`Query: "${q}" results:`, json?.content?.map((c) => ({
          name: c.name,
          symbol: c.nse_script_code || c.search_id,
          bse_script_code: c.bse_script_code,
          groww_contract_id: c.groww_contract_id,
        })));
      }
    } catch (e) {
      console.log(`Query: "${q}" err:`, e.message);
    }
  }

  // Also test direct symbol queries
  const symCandidates = ['GENCON', 'GENESIS', 'GENUSPOWER', 'GENUSPAPER', 'GENSOL'];
  for (const s of symCandidates) {
    try {
      const url = `https://groww.in/v1/api/stocks_data/v1/accord_points/exchange/NSE/segment/CASH/latest_prices_ohlc/${s}`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.ok) {
        const d = await res.json();
        if (d && Number(d.ltp) > 0) {
          console.log(`✓ Direct quote found for ${s}: LTP ₹${d.ltp}, PrevClose ₹${d.close}, Chg ${d.dayChangePerc}%, Vol ${d.volume}`);
        }
      }
    } catch (e) {
      // ignore
    }
  }
}

searchGencon();

