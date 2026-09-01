async function testIndexLive() {
  console.log('Testing live index from Groww and NSE...');
  try {
    const url = 'https://groww.in/v1/api/stocks_data/v1/accord_points/exchange/NSE/segment/CASH/latest_prices_ohlc/NIFTY';
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json',
      },
    });
    console.log('Groww NIFTY status:', res.status);
    if (res.ok) {
      const data = await res.json();
      console.log('Groww NIFTY index:', JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.error('Error:', e);
  }

  try {
    const nseUrl = 'https://www.nseindia.com/api/allIndices';
    const homeRes = await fetch('https://www.nseindia.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': '*/*',
      },
    });
    const setCookie = homeRes.headers.getSetCookie?.() || [];
    const cookie = setCookie.map((c) => c.split(';')[0]).join('; ');
    const res = await fetch(nseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json',
        cookie,
        referer: 'https://www.nseindia.com/',
        origin: 'https://www.nseindia.com',
      },
    });
    if (res.ok) {
      const data = await res.json();
      const nifty = data?.data?.find((d) => d.index === 'NIFTY 50' || d.indexSymbol === 'NIFTY 50');
      console.log('NSE Live NIFTY 50:', nifty);
    }
  } catch (e) {
    console.error('NSE error:', e);
  }
}

testIndexLive();

