const apiKey = `eyJraWQiOiJaTUtjVXciLCJhbGciOiJFUzI1NiJ9.eyJleHAiOjI1NzYxMjAxMjQsImlhdCI6MTc4NzcyMDEyNCwibmJmIjoxNzg3NzIwMTI0LCJzdWIiOiJ7XCJ0b2tlblJlZklkXCI6XCJmY2M1Njc3Yi1lOTQ2LTQ0MzctYWVlMS0yOGFkNDJlMGUyM2NcIixcInZlbmRvckludGVncmF0aW9uS2V5XCI6XCJlMzFmZjIzYjA4NmI0MDZjODg3NGIyZjZkODQ5NTMxM1wiLFwidXNlckFjY291bnRJZFwiOlwiZjgzOWE2YzItNjc3NS00ZmJmLTlmMTYtZGQyNDAwMjUyZmI4XCIsXCJkZXZpY2VJZFwiOlwiZDBhNTY0NDktNGZhNS01NTlkLTgyYTktMTVjNTNkZWY1ZTgwXCIsXCJzZXNzaW9uSWRcIjpcIjgwOTVkMjU2LTljMmMtNGNjMi04NDI1LWZiYTI1ZDcwZTk2NVwiLFwiYWRkaXRpb25hbERhdGFcIjpcIno1NC9NZzltdjE2WXdmb0gvS0EwYkRnVTVOdVpKZE1ka2R2RUNHWWw2ZlJSTkczdTlLa2pWZDNoWjU1ZStNZERhWXBOVi9UOUxIRmtQejFFQisybTdRPT1cIixcInJvbGVcIjpcImF1dGgtdG90cFwiLFwic291cmNlSXBBZGRyZXNzXCI6XCIyNDA2OmI0MDA6YjE6ZTNlNzplZDRkOmQ1OWQ6YmM1ODplMDM1LDE3Mi42OS4xNzguMjAsMzUuMjQxLjIzLjEyM1wiLFwidHdvRmFFeHBpcnlUc1wiOjI1NzYxMjAxMjQ1ODEsXCJ2ZW5kb3JOYW1lXCI6XCJncm93d0FwaVwifSIsImlzcyI6ImFwZXgtYXV0aC1wcm9kLWFwcCJ9.sX0RhFt-Rn3y7aH_scWDe999NkTi71PiTdhImqWty-kQciBJkCcTS6fdxT9L5hcWnQOYg0l5rW_mTEN63rj4PQ`;
const apiSecret = `Ghirnkpd-R_akDBPvwJMP@war4QXRK1p`;

async function testGrowwHeaders() {
  const variations = [
    {
      name: 'Bearer Token on Authorization Header',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-API-SECRET': apiSecret,
        'X-API-VERSION': '1.0',
        'Content-Type': 'application/json',
      },
    },
    {
      name: 'Bearer Token only',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    },
    {
      name: 'X-API-KEY and X-API-SECRET',
      headers: {
        'X-API-KEY': apiKey,
        'X-API-SECRET': apiSecret,
        'Content-Type': 'application/json',
      },
    },
    {
      name: 'Authorization token directly without Bearer',
      headers: {
        'Authorization': apiKey,
        'X-API-SECRET': apiSecret,
        'Content-Type': 'application/json',
      },
    },
  ];

  const testUrls = [
    'https://api.groww.in/v1/user/detail',
    'https://api.groww.in/v1/margins/user',
    'https://groww.in/v1/api/user/v1/details',
  ];

  for (const v of variations) {
    console.log(`\n--- Testing variation: ${v.name} ---`);
    for (const url of testUrls) {
      try {
        const res = await fetch(url, { headers: v.headers, signal: AbortSignal.timeout(4000) });
        console.log(`URL: ${url} -> Status: ${res.status}`);
        if (res.ok) {
          console.log(`✓ SUCCESS on ${url}:`, await res.json());
        }
      } catch (e) {
        console.log(`URL: ${url} -> Error: ${e.message}`);
      }
    }
  }
}

testGrowwHeaders();

