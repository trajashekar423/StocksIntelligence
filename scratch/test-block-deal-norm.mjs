import { normalizeDealRows } from '../src/components/stocks/marketIntelligence.js';

async function testInternalProxy() {
  console.log('--- Testing Block Deal Normalization ---');
  const sampleNseData = {
    "timestamp": "28-Aug-2026 08:51:27",
    "data": [
      {
        "session": "Session 1",
        "symbol": "LENSKART",
        "series": "BL",
        "open": 630,
        "dayHigh": 630,
        "dayLow": 630,
        "lastPrice": 630,
        "previousClose": 640.6,
        "change": -10.6,
        "pchange": -1.65,
        "totalTradedVolume": 29472670,
        "totalTradedValue": 18567782100,
        "lastUpdateTime": "28-Aug-2026 08:46:28",
        "exDate": null
      },
      {
        "session": "Session 1",
        "symbol": "ATHERENERG",
        "series": "BL",
        "open": 1480,
        "dayHigh": 1480,
        "dayLow": 1480,
        "lastPrice": 1480,
        "previousClose": 1495.3,
        "change": -15.3,
        "pchange": -1.02,
        "totalTradedVolume": 11880000,
        "totalTradedValue": 17582400000,
        "lastUpdateTime": "28-Aug-2026 08:51:27",
        "exDate": null
      }
    ]
  };

  const normalized = normalizeDealRows(sampleNseData, 'block_deals');
  console.log('Normalized Block Deals:', JSON.stringify(normalized, null, 2));
}

testInternalProxy();

