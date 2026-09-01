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
};

async function testQuoteWithProperReferer(symbol) {
  console.log(`1. Navigating to https://www.nseindia.com/get-quote/equity?symbol=${symbol}...`);
  const pageRes = await fetch(`${NSE_ORIGIN}/get-quote/equity?symbol=${encodeURIComponent(symbol)}`, {
    headers: COMMON_HEADERS,
  });
  const setCookie = pageRes.headers.getSetCookie?.() || [];
  const cookie = setCookie.map((c) => c.split(';')[0]).join('; ');
  console.log('Page response status:', pageRes.status, 'Cookie count:', setCookie.length);

  console.log(`2. Calling /api/quote-equity?symbol=${symbol} with referer...`);
  const apiRes = await fetch(`${NSE_ORIGIN}/api/quote-equity?symbol=${encodeURIComponent(symbol)}`, {
    headers: {
      ...COMMON_HEADERS,
      accept: 'application/json, text/plain, */*',
      cookie,
      referer: `${NSE_ORIGIN}/get-quote/equity?symbol=${encodeURIComponent(symbol)}`,
      origin: NSE_ORIGIN,
      'x-requested-with': 'XMLHttpRequest',
    },
  });

  console.log('API response status:', apiRes.status);
  if (apiRes.ok) {
    const json = await apiRes.json();
    console.log('Symbol:', json?.info?.symbol);
    console.log('Company:', json?.info?.companyName);
    console.log('PriceInfo:', JSON.stringify(json?.priceInfo, null, 2));
    console.log('SecurityInfo:', JSON.stringify(json?.securityInfo, null, 2));
  } else {
    console.log('Error text:', await apiRes.text().catch(() => ''));
  }
}

testQuoteWithProperReferer('RELIANCE');

