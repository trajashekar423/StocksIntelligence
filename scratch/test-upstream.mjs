import { GET } from '../app/api/nse/[...slug]/route.js';

async function testStatus() {
  const req = new Request('http://localhost:3000/api/nse/candles?symbol=RAMBHAJO');
  const res = await GET(req, { params: Promise.resolve({ slug: ['candles'] }) });
  console.log('Response status:', res.status);
  const data = await res.json();
  console.log('Response data:', data);
}

testStatus().catch(console.error);

