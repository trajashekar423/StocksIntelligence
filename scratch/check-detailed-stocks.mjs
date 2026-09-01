async function checkDetailedStocks() {
  const list = ['BODALCHEM', 'CORDSCABLE', 'PAR', 'GENUSPOWER', 'STAR'];
  for (const sym of list) {
    try {
      const res = await fetch(`http://localhost:3000/api/quote-equity?symbol=${sym}`);
      if (res.ok) {
        const d = await res.json();
        const p = d.priceInfo;
        console.log(`${sym}: LTP ₹${p.lastPrice}, Change: +${p.pChange?.toFixed(2)}%, VWAP: ₹${p.vwap}, High: ₹${p.intraDayHighLow?.max}, Low: ₹${p.intraDayHighLow?.min}`);
      }
    } catch (e) {
      console.log(e.message);
    }
  }
}

checkDetailedStocks();

