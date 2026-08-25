import { fetchQuoteEquity } from '../src/services/stocksService.js';

async function checkData() {
  console.log('--- CHECKING LIVE NSE / STOCKS DATA STATUS ---');
  try {
    const res = await fetch('https://www.nseindia.com/api/quote-equity?symbol=INFY', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    console.log(`NSE direct fetch status: ${res.status}`);
    if (res.ok) {
      const data = await res.json();
      console.log('LIVE NSE INFY LTP:', data?.priceInfo?.lastPrice, 'Change:', data?.priceInfo?.change);
    }
  } catch (err) {
    console.log('NSE direct fetch failed:', err.message);
  }
}

checkData().catch(console.error);

