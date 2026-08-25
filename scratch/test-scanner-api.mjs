import { GET } from '../app/api/scanner/intraday/route.ts';

async function testScannerAPI() {
  console.log('Testing /api/scanner/intraday route handler...');
  const req = new Request('http://localhost:3000/api/scanner/intraday?minScore=0&limit=10');
  const res = await GET(req);
  console.log('Scanner status:', res.status);
  const data = await res.json();
  console.log(`Returned ${data.length} stocks:`);
  data.slice(0, 6).forEach((s) => {
    console.log(`Rank ${s.rank}: ${s.symbol} | LTP: ₹${s.ltp} | Change%: ${s.changePercent.toFixed(2)}% | Score: ${s.bullishScore}/100 | Signal: ${s.signal}`);
  });
}

testScannerAPI().catch(console.error);

