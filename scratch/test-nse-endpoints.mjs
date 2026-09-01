const NSE_ORIGIN = 'https://www.nseindia.com';

const COMMON_HEADERS = {
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'accept-language': 'en-US,en;q=0.9',
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'sec-ch-ua': '"Not.A/Brand";v="8", "Chromium";v="124", "Google Chrome";v="124"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-site': 'same-origin',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-user': '?1',
  'sec-fetch-dest': 'document',
  'x-requested-with': 'XMLHttpRequest',
};

async function testAll() {
  console.log('Fetching cookie from NSE home...');
  let cookie = '';
  try {
    const homeRes = await fetch(NSE_ORIGIN, { headers: COMMON_HEADERS });
    const setCookie = homeRes.headers.getSetCookie?.() || [];
    if (setCookie.length) {
      cookie = setCookie.map((c) => c.split(';')[0]).join('; ');
    }
    console.log('Got cookie:', cookie ? 'YES' : 'NO');

    const urls = [
      '/api/allIndices',
      '/api/quote-equity?symbol=RELIANCE',
      '/api/quote-equity?symbol=TCS',
      '/api/live-analysis-variations?index=gainers',
      '/api/live-analysis-variations?index=loosers',
      '/api/live-analysis-most-active-securities?index=volume',
      '/api/live-analysis-most-active-securities?index=value',
      '/api/marketStatus',
    ];

    for (const u of urls) {
      try {
        const res = await fetch(`${NSE_ORIGIN}${u}`, {
          headers: {
            ...COMMON_HEADERS,
            cookie,
            referer: `${NSE_ORIGIN}/`,
            origin: NSE_ORIGIN,
          },
        });
        console.log(`URL: ${u} -> Status: ${res.status}`);
        if (res.ok) {
          const json = await res.json();
          const keys = Object.keys(json);
          console.log(`  Keys: ${keys.slice(0, 5).join(', ')}`);
          if (Array.isArray(json?.data)) {
            console.log(`  data length: ${json.data.length}, first: ${json.data[0]?.symbol || json.data[0]?.index}`);
          }
          if (json?.priceInfo) {
            console.log(`  Price info: LTP ${json.priceInfo.lastPrice}, prevClose ${json.priceInfo.previousClose}`);
          }
        }
      } catch (e) {
        console.log(`URL: ${u} -> Error: ${e.message}`);
      }
    }
  } catch (err) {
    console.error('Home error:', err);
  }
}

testAll();

