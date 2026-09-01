const apiKey = `eyJraWQiOiJaTUtjVXciLCJhbGciOiJFUzI1NiJ9.eyJleHAiOjI1NzYxMjAxMjQsImlhdCI6MTc4NzcyMDEyNCwibmJmIjoxNzg3NzIwMTI0LCJzdWIiOiJ7XCJ0b2tlblJlZklkXCI6XCJmY2M1Njc3Yi1lOTQ2LTQ0MzctYWVlMS0yOGFkNDJlMGUyM2NcIixcInZlbmRvckludGVncmF0aW9uS2V5XCI6XCJlMzFmZjIzYjA4NmI0MDZjODg3NGIyZjZkODQ5NTMxM1wiLFwidXNlckFjY291bnRJZFwiOlwiZjgzOWE2YzItNjc3NS00ZmJmLTlmMTYtZGQyNDAwMjUyZmI4XCIsXCJkZXZpY2VJZFwiOlwiZDBhNTY0NDktNGZhNS01NTlkLTgyYTktMTVjNTNkZWY1ZTgwXCIsXCJzZXNzaW9uSWRcIjpcIjgwOTVkMjU2LTljMmMtNGNjMi04NDI1LWZiYTI1ZDcwZTk2NVwiLFwiYWRkaXRpb25hbERhdGFcIjpcIno1NC9NZzltdjE2WXdmb0gvS0EwYkRnVTVOdVpKZE1ka2R2RUNHWWw2ZlJSTkczdTlLa2pWZDNoWjU1ZStNZERhWXBOVi9UOUxIRmtQejFFQisybTdRPT1cIixcInJvbGVcIjpcImF1dGgtdG90cFwiLFwic291cmNlSXBBZGRyZXNzXCI6XCIyNDA2OmI0MDA6YjE6ZTNlNzplZDRkOmQ1OWQ6YmM1ODplMDM1LDE3Mi42OS4xNzguMjAsMzUuMjQxLjIzLjEyM1wiLFwidHdvRmFFeHBpcnlUc1wiOjI1NzYxMjAxMjQ1ODEsXCJ2ZW5kb3JOYW1lXCI6XCJncm93d0FwaVwifSIsImlzcyI6ImFwZXgtYXV0aC1wcm9kLWFwcCJ9.sX0RhFt-Rn3y7aH_scWDe999NkTi71PiTdhImqWty-kQciBJkCcTS6fdxT9L5hcWnQOYg0l5rW_mTEN63rj4PQ`;
const apiSecret = `Ghirnkpd-R_akDBPvwJMP@war4QXRK1p`;

const payload = {
  trading_symbol: 'INFY',
  quantity: 1,
  price: 0,
  validity: 'DAY',
  exchange: 'NSE',
  segment: 'CASH',
  product: 'MIS',
  order_type: 'MARKET',
  transaction_type: 'BUY',
  order_reference_id: `ORD-${Date.now()}`,
};

async function testVariations() {
  const headerVariations = [
    {
      name: 'Bearer Token + X-API-VERSION 1.0',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-API-VERSION': '1.0',
      },
    },
    {
      name: 'Bearer Token + X-API-KEY + X-API-SECRET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-API-KEY': 'e31ff23b086b406c8874b2f6d8495313',
        'X-API-SECRET': apiSecret,
        'X-API-VERSION': '1.0',
      },
    },
    {
      name: 'Bearer Token + X-Forwarded-For IPv6',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-API-VERSION': '1.0',
        'X-Forwarded-For': '2406:b400:b1:e3e7:ed4d:d59d:bc58:e035',
      },
    },
    {
      name: 'Bearer Token + X-Forwarded-For IPv4',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-API-VERSION': '1.0',
        'X-Forwarded-For': '183.83.231.209',
      },
    },
  ];

  for (const v of headerVariations) {
    console.log(`\nTesting: ${v.name}...`);
    try {
      const res = await fetch('https://api.groww.in/v1/order/create', {
        method: 'POST',
        headers: v.headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });
      console.log('HTTP Status:', res.status);
      const text = await res.text();
      console.log('Response body:', text);
    } catch (e) {
      console.log('Error:', e.message);
    }
  }
}

testVariations();

