import { GET } from '../app/api/nse/[...slug]/route.js';

async function testNSEProxy() {
  console.log('Testing internal NSE proxy routes for RAMBHAJO...');

  const quoteReq = new Request('http://localhost:3000/api/nse/quote-equity?symbol=RAMBHAJO');
  const quoteRes = await GET(quoteReq, { params: Promise.resolve({ slug: ['quote-equity'] }) });
  console.log('RAMBHAJO quote status:', quoteRes.status, 'source:', quoteRes.headers.get('x-source'));
  const json = await quoteRes.json();
  console.log('RAMBHAJO Live Data:', {
    symbol: json?.info?.symbol,
    companyName: json?.info?.companyName,
    lastPrice: json?.priceInfo?.lastPrice,
    change: json?.priceInfo?.change,
    pChange: json?.priceInfo?.pChange,
    high: json?.priceInfo?.intraDayHighLow?.max,
    low: json?.priceInfo?.intraDayHighLow?.min,
    prevClose: json?.priceInfo?.previousClose,
  });
}

testNSEProxy().catch(console.error);
