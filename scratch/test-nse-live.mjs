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

async function testNseIndices() {
  console.log('1. Fetching cookie from NSE home...');
  let cookie = '';
  try {
    const homeRes = await fetch(NSE_ORIGIN, { headers: COMMON_HEADERS });
    const setCookie = homeRes.headers.getSetCookie?.() || [];
    if (setCookie.length) {
      cookie = setCookie.map((c) => c.split(';')[0]).join('; ');
    }
    console.log('Got cookie:', cookie ? 'YES' : 'NO');

    console.log('2. Fetching NIFTY 50 equity stock indices...');
    const nseRes = await fetch(`${NSE_ORIGIN}/api/equity-stockIndices?index=NIFTY%2050`, {
      headers: {
        ...COMMON_HEADERS,
        cookie,
        referer: `${NSE_ORIGIN}/`,
        origin: NSE_ORIGIN,
      },
    });

    console.log('Response status:', nseRes.status);
    if (nseRes.ok) {
      const data = await nseRes.json();
      console.log('Data timestamp:', data?.timestamp);
      console.log('Total items in data array:', data?.data?.length);
      if (data?.data && data.data.length > 0) {
        console.log('Sample stock 1:', JSON.stringify(data.data[0], null, 2));
        console.log('Sample stock 2:', JSON.stringify(data.data[1], null, 2));
      }
    } else {
      console.log('Error text:', await nseRes.text().catch(() => ''));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

testNseIndices();

