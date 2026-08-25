import { GET } from '../app/api/nse/[...slug]/route.js';

async function testNitco() {
  console.log('Testing NITCO and RAMBHAJO quotes...');

  const symbols = ['RAMBHAJO', 'NITCO', 'CUPID', 'INFY'];
  for (const sym of symbols) {
    const req = new Request(`http://localhost:3000/api/nse/quote-equity?symbol=${sym}`);
    const res = await GET(req, { params: Promise.resolve({ slug: ['quote-equity'] }) });
    const json = await res.json();
    console.log(`${sym} => LTP: ₹${json?.priceInfo?.lastPrice}, PrevClose: ₹${json?.priceInfo?.previousClose}, Change%: ${json?.priceInfo?.pChange}%, High: ₹${json?.priceInfo?.intraDayHighLow?.max}, Low: ₹${json?.priceInfo?.intraDayHighLow?.min}`);
  }
}

testNitco().catch(console.error);

