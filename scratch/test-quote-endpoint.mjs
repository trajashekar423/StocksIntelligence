async function testInternalQuote() {
  const symbol = 'WHIRLPOOL';
  const url = `http://localhost:3000/api/quote-equity?symbol=${symbol}`;
  console.log('Testing endpoint:', url);
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log('Returned data:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testInternalQuote();

