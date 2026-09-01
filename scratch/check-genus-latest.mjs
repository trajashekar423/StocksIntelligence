async function checkGenusPowerLatest() {
  const u = 'http://localhost:3000/api/quote-equity?symbol=GENUSPOWER';
  const res = await fetch(u);
  const json = await res.json();
  console.log('GENUSPOWER Latest 2:42 PM:', JSON.stringify(json.priceInfo, null, 2));
}

checkGenusPowerLatest();

