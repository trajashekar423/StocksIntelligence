async function checkStarLive() {
  console.log('--- Checking STAR & GENUSPOWER Live ---');
  for (const sym of ['STAR', 'GENUSPOWER']) {
    try {
      const u = `http://localhost:3000/api/quote-equity?symbol=${sym}`;
      const res = await fetch(u);
      if (res.ok) {
        const json = await res.json();
        console.log(`\n=== ${sym} Live ===`);
        console.log('LTP:', json.priceInfo?.lastPrice);
        console.log('Change %:', json.priceInfo?.pChange);
        console.log('VWAP:', json.priceInfo?.vwap);
        console.log('Day High/Low:', json.priceInfo?.intraDayHighLow);
      }
    } catch (err) {
      console.log(`Error on ${sym}:`, err.message);
    }
  }
}

checkStarLive();

