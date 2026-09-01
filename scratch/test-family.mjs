import http from 'http';
import https from 'https';

const accessToken = `eyJraWQiOiJaTUtjVXciLCJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3ODc3OTA2MDAsImlhdCI6MTc4NzcyMjQ0OCwibmJmIjoxNzg3NzIyNDQ4LCJzdWIiOiJ7XCJ0b2tlblJlZklkXCI6XCJlMTc5Yzg1Mi01MWI3LTQ5OTgtOTU4ZC0zOGU0YTNmZTA4NmZcIixcInZlbmRvckludGVncmF0aW9uS2V5XCI6XCJlMzFmZjIzYjA4NmI0MDZjODg3NGIyZjZkODQ5NTMxM1wiLFwidXNlckFjY291bnRJZFwiOlwiZjgzOWE2YzItNjc3NS00ZmJmLTlmMTYtZGQyNDAwMjUyZmI4XCIsXCJkZXZpY2VJZFwiOlwiZDBhNTY0NDktNGZhNS01NTlkLTgyYTktMTVjNTNkZWY1ZTgwXCIsXCJzZXNzaW9uSWRcIjpcImZiZTc1YmMwLTEwYTctNGM4OS1hZDE4LWM0NzBkMGM3MDk5ZlwiLFwiYWRkaXRpb25hbERhdGFcIjpcIno1NC9NZzltdjE2WXdmb0gvS0EwYkRnVTVOdVpKZE1ka2R2RUNHWWw2ZlJSTkczdTlLa2pWZDNoWjU1ZStNZERhWXBOVi9UOUxIRmtQejFFQisybTdRPT1cIixcInJvbGVcIjpcIm9yZGVyLWJhc2ljLG5vbl90cmFkaW5nLWJhc2ljLG9yZGVyX3JlYWRfb25seS1iYXNpY1wiLFwic291cmNlSXBBZGRyZXNzXCI6XCIyNDA2OmI0MDA6YjE6ZTNlNzplZDRkOmQ1OWQ6YmM1ODplMDM1LDE3Mi43MC4yMTguOTgsMzUuMjQxLjIzLjEyM1wiLFwidHdvRmFFeHBpcnlUc1wiOjE3ODc3OTA2MDAwMDAsXCJ2ZW5kb3JOYW1lXCI6XCJncm93d0FwaVwifSIsImlzcyI6ImFwZXgtYXV0aC1wcm9kLWFwcCJ9.JivdnIAp5eI6_mx5qqmjw5FDY_5WQP8iqGKpMOy4MZ321QGfFkZP3ZhGX0zVyEa82uGCqtLddJQ_ZZR_0X3A8Q`;

const payload = JSON.stringify({
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
});

async function testFamily(family, label) {
  console.log(`Testing with IP family: ${label} (family: ${family})...`);
  return new Promise((resolve) => {
    const req = https.request(
      'https://api.groww.in/v1/order/create',
      {
        method: 'POST',
        family, // 4 for IPv4, 6 for IPv6
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-API-VERSION': '1.0',
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          console.log(`[${label}] Status ${res.statusCode}:`, body);
          resolve(body);
        });
      }
    );
    req.on('error', (err) => {
      console.log(`[${label}] Error:`, err.message);
      resolve(null);
    });
    req.write(payload);
    req.end();
  });
}

async function run() {
  await testFamily(4, 'IPv4 (183.83.231.209)');
  await testFamily(6, 'IPv6 (2406:b400:...)');
}

run();

