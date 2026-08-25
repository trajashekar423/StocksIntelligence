const jwtToken = process.env.GROWW_API_KEY;
const apiSecret = process.env.GROWW_API_SECRET;

async function testEndpoints() {
  const endpoints = [
    'https://api.groww.in/v1/live-data/quote?exchange=NSE&segment=CASH&trading_symbol=INFY',
    'https://api.groww.in/v1/order/orders',
    'https://api.groww.in/v1/positions/user',
    'https://api.groww.in/v1/margins/user',
  ];

  for (const url of endpoints) {
    console.log(`\nTesting endpoint: ${url}`);
    try {
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'X-API-KEY': jwtToken,
          'X-API-SECRET': apiSecret,
          'X-API-VERSION': '1.0',
          'Accept': 'application/json'
        }
      });
      console.log(`Status: ${res.status}`);
      const text = await res.text();
      console.log(`Body: ${text.slice(0, 150)}`);
    } catch (err) {
      console.log(`Error: ${err.message}`);
    }
  }
}

testEndpoints().catch(console.error);

