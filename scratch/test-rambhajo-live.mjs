import { GET as getQuote } from '../app/api/nse/[...slug]/route.js';

async function testRambhajoDirect() {
  console.log('Testing RAMBHAJO and ADVIT symbol resolution...');

  // Test quote-equity with RAMBHAJO
  const req1 = new Request('http://localhost:3000/api/nse/quote-equity?symbol=RAMBHAJO');
  const res1 = await getQuote(req1, { params: Promise.resolve({ slug: ['quote-equity'] }) });
  const data1 = await res1.json();
  console.log('RAMBHAJO quote result:', JSON.stringify(data1?.priceInfo, null, 2));

  // Test quote-equity with ADVIT (should auto-resolve to RAMBHAJO)
  const req2 = new Request('http://localhost:3000/api/nse/quote-equity?symbol=ADVIT');
  const res2 = await getQuote(req2, { params: Promise.resolve({ slug: ['quote-equity'] }) });
  const data2 = await res2.json();
  console.log('ADVIT quote result:', JSON.stringify(data2?.priceInfo, null, 2));
}

testRambhajoDirect().catch(console.error);

