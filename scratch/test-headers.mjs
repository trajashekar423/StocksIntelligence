const jwtToken = process.env.GROWW_API_KEY;
const apiSecret = process.env.GROWW_API_SECRET;
const vendorKey = "e31ff23b086b406c8874b2f6d8495313";

async function testCombinations() {
  const tests = [
    {
      name: 'Bearer JWT only',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Accept': 'application/json',
        'X-API-VERSION': '1.0'
      }
    },
    {
      name: 'Bearer JWT + X-API-KEY (vendorKey) + X-API-SECRET',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'X-API-KEY': vendorKey,
        'X-API-SECRET': apiSecret,
        'Accept': 'application/json',
        'X-API-VERSION': '1.0'
      }
    },
    {
      name: 'X-API-KEY (vendorKey) + X-API-SECRET only',
      headers: {
        'X-API-KEY': vendorKey,
        'X-API-SECRET': apiSecret,
        'Accept': 'application/json',
        'X-API-VERSION': '1.0'
      }
    },
    {
      name: 'X-API-KEY (JWT) + X-API-SECRET only',
      headers: {
        'X-API-KEY': jwtToken,
        'X-API-SECRET': apiSecret,
        'Accept': 'application/json',
        'X-API-VERSION': '1.0'
      }
    },
    {
      name: 'Bearer JWT + X-API-KEY (JWT) + X-API-SECRET',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'X-API-KEY': jwtToken,
        'X-API-SECRET': apiSecret,
        'Accept': 'application/json',
        'X-API-VERSION': '1.0'
      }
    }
  ];

  for (const t of tests) {
    console.log(`\nTesting: ${t.name}`);
    try {
      const res = await fetch('https://api.groww.in/v1/user/detail', { headers: t.headers });
      console.log(`Response status: ${res.status}`);
      const text = await res.text();
      console.log(`Response body: ${text.slice(0, 150)}`);
    } catch (err) {
      console.log(`Error: ${err.message}`);
    }
  }
}

testCombinations().catch(console.error);

