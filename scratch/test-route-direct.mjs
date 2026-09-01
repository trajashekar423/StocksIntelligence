import { GET } from '../app/api/nse/[...slug]/route.js';

async function testDirect() {
  console.log('Testing GET direct call...');
  try {
    const req = new Request('http://localhost:3000/api/nse/large-deals?mode=block_deals');
    const context = { params: Promise.resolve({ slug: ['large-deals'] }) };
    const res = await GET(req, context);
    console.log('Direct status:', res.status);
    const json = await res.json();
    console.log('Direct json:', JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('Direct error:', err);
  }
}

testDirect();

