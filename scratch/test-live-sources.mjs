async function testLiveSources() {
  console.log('--- 1. Testing Yahoo Finance Live Bulk NSE Quotes ---');
  const symbols = ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS', 'SBIN.NS', 'ITC.NS', 'BHARTIARTL.NS'];
  try {
    const yUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(',')}`;
    const yRes = await fetch(yUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });
    console.log('Yahoo status:', yRes.status);
    if (yRes.ok) {
      const yJson = await yRes.json();
      const results = yJson?.quoteResponse?.result || [];
      console.log(`Received ${results.length} live stock quotes from Yahoo:`);
      results.forEach((r) => {
        console.log(`  ${r.symbol}: LTP ₹${r.regularMarketPrice}, Prev ₹${r.regularMarketPreviousClose}, Chg ${r.regularMarketChangePercent?.toFixed(2)}%, Vol ${r.regularMarketVolume}, DayHigh ₹${r.regularMarketDayHigh}, DayLow ₹${r.regularMarketDayLow}`);
      });
    }
  } catch (e) {
    console.error('Yahoo error:', e.message);
  }

  console.log('\n--- 2. Testing Groww Public Live Quote ---');
  try {
    const gUrl = `https://groww.in/v1/api/stocks_data/v1/accord_points/exchange/NSE/segment/CASH/latest_prices_ohlc/RELIANCE`;
    const gRes = await fetch(gUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json',
      },
    });
    console.log('Groww status:', gRes.status);
    if (gRes.ok) {
      const gJson = await gRes.json();
      console.log('Groww quote data:', JSON.stringify(gJson, null, 2));
    }
  } catch (e) {
    console.error('Groww error:', e.message);
  }
}

testLiveSources();

