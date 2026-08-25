import { GET } from '../app/api/nse/[...slug]/route.js';

async function testCandles() {
  console.log('Testing /api/nse/candles for RAMBHAJO and ADVIT...');

  const symbols = ['RAMBHAJO', 'ADVIT', 'NITCO', 'CUPID'];
  for (const sym of symbols) {
    const req = new Request(`http://localhost:3000/api/nse/candles?symbol=${sym}`);
    const res = await GET(req, { params: Promise.resolve({ slug: ['candles'] }) });
    const json = await res.json();
    const count = json?.grapthData?.length || 0;
    console.log(`${sym} => Found ${count} candles, status: ${res.status}`);
    if (count > 0) {
      console.log(`Sample first candle:`, json.grapthData[0], `Sample last:`, json.grapthData[count - 1]);
    }
  }
}

testCandles().catch(console.error);

