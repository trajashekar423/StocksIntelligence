async function testNifty() {
  try {
    const res = await fetch('http://localhost:3000/api/nse/equity-stockIndices?index=NIFTY%2050');
    console.log('equity-stockIndices status:', res.status);
    const json = await res.json().catch(() => ({}));
    console.log('Returned data keys:', Object.keys(json));
    if (Array.isArray(json?.data)) {
      console.log('Constituents count:', json.data.length);
      console.log('Sample stock 0:', json.data[0]);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}
testNifty();

