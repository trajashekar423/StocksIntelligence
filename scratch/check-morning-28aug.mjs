async function checkLiveMorningQuotes() {
  const symbols = ['WHIRLPOOL', 'TEJASNET', 'JUSTDIAL', 'PVP', 'AMBER', 'WEL', 'GENCON'];
  console.log('--- Checking Live Quotes at 9:35 AM (28-Aug-2026) ---');
  for (const sym of symbols) {
    try {
      const url = `https://groww.in/v1/api/stocks_data/v1/accord_points/exchange/NSE/segment/CASH/latest_prices_ohlc/${encodeURIComponent(sym)}`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(3500) });
      if (res.ok) {
        const d = await res.json();
        const price = Number(d.ltp);
        const prev = Number(d.close || price);
        const open = Number(d.open || price);
        const high = Number(d.high || price);
        const low = Number(d.low || price);
        const chg = Number(d.dayChangePerc ?? (prev ? ((price - prev) / prev) * 100 : 0));
        console.log(`[${sym}] LTP: ₹${price} (${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%) | Open: ₹${open} | High: ₹${high} | Low: ₹${low} | PrevClose: ₹${prev}`);
      } else {
        console.log(`[${sym}] Failed fetch HTTP ${res.status}`);
      }
    } catch (err) {
      console.log(`[${sym}] Error:`, err.message);
    }
  }
}

checkLiveMorningQuotes();

