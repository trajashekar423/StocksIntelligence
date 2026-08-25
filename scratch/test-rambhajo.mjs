async function testRambhajo() {
  console.log('Testing live fetch for RAMBHAJO...');

  // 1. Yahoo Finance chart API for Indian equities (.NS)
  try {
    const yfRes = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/RAMBHAJO.NS?interval=1d&range=5d', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });
    console.log('Yahoo Finance status:', yfRes.status);
    if (yfRes.ok) {
      const json = await yfRes.json();
      const meta = json?.chart?.result?.[0]?.meta;
      console.log('Yahoo Finance RAMBHAJO:', {
        symbol: meta?.symbol,
        regularMarketPrice: meta?.regularMarketPrice,
        previousClose: meta?.chartPreviousClose || meta?.previousClose,
        high: meta?.regularMarketDayHigh,
        low: meta?.regularMarketDayLow,
      });
    }
  } catch (err) {
    console.log('Yahoo Finance error:', err.message);
  }

  // 2. NSE quote-equity
  try {
    const sessionRes = await fetch('https://www.nseindia.com/get-quote/equity?symbol=RAMBHAJO', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    const setCookie = sessionRes.headers.getSetCookie?.() || [];
    const cookie = setCookie.map(c => c.split(';')[0]).join('; ');
    console.log('NSE cookie received:', cookie ? 'YES' : 'NO');

    const quoteRes = await fetch('https://www.nseindia.com/api/quote-equity?symbol=RAMBHAJO&section=trade_info', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://www.nseindia.com/get-quote/equity?symbol=RAMBHAJO',
        'Cookie': cookie,
        'X-Requested-With': 'XMLHttpRequest',
      }
    });
    console.log('NSE quote status:', quoteRes.status);
    if (quoteRes.ok) {
      const q = await quoteRes.json();
      console.log('NSE RAMBHAJO LTP:', q?.priceInfo?.lastPrice, q?.priceInfo?.change);
    }
  } catch (err) {
    console.log('NSE quote error:', err.message);
  }
}

testRambhajo().catch(console.error);

