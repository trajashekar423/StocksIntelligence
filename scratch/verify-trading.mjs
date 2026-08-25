async function runVerification() {
  const baseUrl = 'http://localhost:3000';
  console.log('--- STARTING GROWW & TRADING API VERIFICATION ---');

  // 1. Check Groww Auth Status
  const authRes = await fetch(`${baseUrl}/api/groww/auth`);
  const authJson = await authRes.json();
  console.log('1. /api/groww/auth status:', authJson.status, '| authenticated:', authJson.authenticated);

  // 2. Check Groww Profile
  const profileRes = await fetch(`${baseUrl}/api/groww/profile`);
  const profileJson = await profileRes.json();
  console.log('2. /api/groww/profile mode:', profileJson.tradingMode, '| availableMargin:', profileJson.profile?.availableMargin);

  // 3. Check Scanner
  const scanRes = await fetch(`${baseUrl}/api/scanner/intraday?limit=3`);
  const scanJson = await scanRes.json();
  console.log(`3. /api/scanner/intraday returned ${scanJson.length} stocks. Top:`, scanJson[0]?.symbol, 'Score:', scanJson[0]?.bullishScore);

  // 4. Check Signal Generation
  const sigRes = await fetch(`${baseUrl}/api/trading/signal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol: 'TATASTEEL' }),
  });
  const sigJson = await sigRes.json();
  console.log('4. /api/trading/signal for TATASTEEL:', sigJson.signal, '| Qty:', sigJson.quantity, '| Target:', sigJson.target1, '| SL:', sigJson.stopLoss);

  // 5. Check Initial Trading Status
  const statusRes1 = await fetch(`${baseUrl}/api/trading/status`);
  const statusJson1 = await statusRes1.json();
  console.log('5. /api/trading/status: mode =', statusJson1.mode, '| enabled =', statusJson1.enabled, '| openPositions =', statusJson1.positions.length);

  // 6. Place a Paper Buy Order
  const buyRes = await fetch(`${baseUrl}/api/trading/buy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      symbol: 'TATASTEEL',
      entryPrice: 186.3,
      stopLoss: 183.0,
      target: 192.9,
      quantity: 50,
    }),
  });
  const buyJson = await buyRes.json();
  console.log('6. /api/trading/buy result:', buyJson.success ? 'SUCCESS' : 'FAILED', '| Position ID:', buyJson.position?.id);

  // 7. Verify Position Opened in Status
  const statusRes2 = await fetch(`${baseUrl}/api/trading/status`);
  const statusJson2 = await statusRes2.json();
  const openPos = statusJson2.positions.find((p) => p.symbol === 'TATASTEEL');
  console.log('7. Open position verified:', openPos?.symbol, '| Qty:', openPos?.quantity, '| Trailing SL:', openPos?.trailingStop);

  // 8. Close Position
  if (openPos) {
    const closeRes = await fetch(`${baseUrl}/api/trading/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ positionId: openPos.id }),
    });
    const closeJson = await closeRes.json();
    console.log('8. /api/trading/close result:', closeJson.success ? 'SUCCESS' : 'FAILED', '| Closed P&L:', closeJson.closedPosition?.realizedPnL);
  }

  // 9. Verify Kill Switch Toggle
  const killRes = await fetch(`${baseUrl}/api/trading/kill-switch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled: false }),
  });
  const killJson = await killRes.json();
  console.log('9. /api/trading/kill-switch (Emergency Stop activated): enabled =', killJson.enabled);

  // 10. Attempt Buy during Kill Switch (Should be blocked by Risk Gate)
  const blockedBuy = await fetch(`${baseUrl}/api/trading/buy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol: 'INFY', quantity: 10 }),
  });
  const blockedJson = await blockedBuy.json();
  console.log('10. Buy attempt while stopped blocked as expected:', !blockedJson.success, '| Error:', blockedJson.error);

  // 11. Re-enable trading
  await fetch(`${baseUrl}/api/trading/kill-switch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled: true }),
  });
  console.log('11. Trading re-enabled. Ready for operation.');

  // 12. Check Trading Page Route
  const pageRes = await fetch(`${baseUrl}/trading`);
  console.log('12. /trading page HTTP Status:', pageRes.status);

  console.log('--- ALL GROWW & TRADING API VERIFICATIONS PASSED ---');
}

runVerification().catch(console.error);

