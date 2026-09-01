const NSE_ORIGIN = 'https://www.nseindia.com';

const COMMON_HEADERS = {
  accept: 'application/json, text/plain, */*',
  'accept-language': 'en-US,en;q=0.9',
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
};

async function testIndices() {
  console.log('Testing index constituents fetching...');
  const testIndices = [
    'NIFTY 50',
    'NIFTY NEXT 50',
    'NIFTY BANK',
    'NIFTY IT',
    'NIFTY AUTO',
    'NIFTY MIDCAP 100',
    'NIFTY SMALLCAP 100',
    'NIFTY DEFENCE',
  ];

  try {
    const homeRes = await fetch(NSE_ORIGIN, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const setCookie = homeRes.headers.getSetCookie?.() || [];
    const cookie = setCookie.map((c) => c.split(';')[0]).join('; ');

    const allIndicesRes = await fetch(`${NSE_ORIGIN}/api/allIndices`, {
      headers: { ...COMMON_HEADERS, cookie, referer: `${NSE_ORIGIN}/` },
    });
    if (allIndicesRes.ok) {
      const json = await allIndicesRes.json();
      console.log(`✓ Total indices available on NSE: ${json?.data?.length}`);
      const sample = json?.data?.slice(0, 15).map((d) => ({ name: d.index || d.indexSymbol, last: d.last, change: d.variation, pChange: d.percentChange }));
      console.log('Sample indices:', sample);
    }
  } catch (e) {
    console.error('Err:', e);
  }
}

testIndices();

