import { GET } from '../app/api/nse/[...slug]/route.js';

async function testAllModes() {
  console.log('--- Testing All Deal Modes ---');
  for (const mode of ['bulk_deals', 'short_deals', 'block_deals']) {
    try {
      const req = new Request(`http://localhost:3000/api/nse/large-deals?mode=${mode}`);
      const context = { params: Promise.resolve({ slug: ['large-deals'] }) };
      const res = await GET(req, context);
      const json = await res.json();
      console.log(`Mode: ${mode} => Status ${res.status}, Deals count: ${json.data?.length || 0}`);
    } catch (e) {
      console.log(`Mode ${mode} error:`, e.message);
    }
  }
}

testAllModes();

