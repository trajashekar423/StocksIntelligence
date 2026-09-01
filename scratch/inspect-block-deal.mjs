async function inspectBlockDeal() {
  const u = 'https://www.nseindia.com/api/block-deal';
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://www.nseindia.com/market-data/block-deal-watch',
  };
  const res = await fetch(u, { headers });
  const data = await res.json();
  console.log('Block Deal payload:', JSON.stringify(data, null, 2));
}

inspectBlockDeal();

