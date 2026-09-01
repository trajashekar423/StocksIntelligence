async function scanIntradayOutperformers() {
  console.log('--- Scanning Live NSE Outperformers for Monday Intraday ---');
  
  const endpoints = [
    'http://localhost:3000/api/nse/top-ten',
    'http://localhost:3000/api/nse/most-active',
  ];

  const candidateSymbols = new Set();
  
  for (const ep of endpoints) {
    try {
      const res = await fetch(ep);
      if (res.ok) {
        const json = await res.json();
        const rows = Array.isArray(json?.allSec?.data) ? json.allSec.data : Array.isArray(json?.data) ? json.data : [];
        rows.forEach(r => {
          const sym = String(r.symbol || '').trim().toUpperCase();
          if (sym) candidateSymbols.add(sym);
        });
      }
    } catch (e) {
      console.log('Error fetching', ep, e.message);
    }
  }

  console.log(`Found ${candidateSymbols.size} symbols from market movers. Evaluating quotes...`);
  
  const evaluated = [];
  
  for (const sym of Array.from(candidateSymbols).slice(0, 25)) {
    try {
      const u = `http://localhost:3000/api/quote-equity?symbol=${sym}`;
      const res = await fetch(u);
      if (res.ok) {
        const json = await res.json();
        const p = json.priceInfo;
        if (p && p.lastPrice > 0) {
          const ltp = p.lastPrice;
          const vwap = p.vwap || ltp;
          const high = p.intraDayHighLow?.max || p.high || ltp;
          const low = p.intraDayHighLow?.min || p.low || ltp;
          const prev = p.previousClose || ltp;
          const changePct = p.pChange || (prev > 0 ? ((ltp - prev)/prev)*100 : 0);
          
          const isAboveVwap = ltp >= vwap;
          const distFromHigh = high > 0 ? (((high - ltp)/high)*100) : 0;
          
          if (changePct >= 1.5 && isAboveVwap) {
            evaluated.push({
              symbol: sym,
              companyName: json.info?.companyName || `${sym} Ltd`,
              price: ltp,
              vwap: Number(vwap.toFixed(2)),
              vwapBufferPct: Number((((ltp - vwap)/vwap)*100).toFixed(2)),
              high,
              low,
              changePct: Number(changePct.toFixed(2)),
              distFromHigh: Number(distFromHigh.toFixed(2)),
            });
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }

  // Sort descending by Change % and closeness to high
  evaluated.sort((a, b) => b.changePct - a.changePct);
  console.log('TOP CANDIDATES:', JSON.stringify(evaluated.slice(0, 6), null, 2));
}

scanIntradayOutperformers();

