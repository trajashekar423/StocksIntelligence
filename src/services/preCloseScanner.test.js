import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkLiquidityFilter,
  evaluatePreCloseStock,
  runPreCloseMomentumScanner,
} from './preCloseScannerEngine.js';

test('checkLiquidityFilter: enforces 500k volume or ₹10 Crore traded value', () => {
  // Low liquidity stock (e.g. 50,000 volume @ ₹10 = ₹5 Lakhs traded value) -> REJECT
  const lowLiq = checkLiquidityFilter({ price: 10, volume: 50000, averageVolume: 40000 });
  assert.equal(lowLiq.passes, false);

  // High volume stock (e.g. 600,000 volume @ ₹50 = ₹3 Crore traded value) -> PASS
  const highVol = checkLiquidityFilter({ price: 50, volume: 600000, averageVolume: 550000 });
  assert.equal(highVol.passes, true);

  // High turnover stock (e.g. 200,000 volume @ ₹3000 = ₹60 Crore traded value) -> PASS
  const highTurnover = checkLiquidityFilter({ price: 3000, volume: 200000, averageVolume: 150000 });
  assert.equal(highTurnover.passes, true);
  assert.ok(highTurnover.tradedValueCrores >= 10);
});

test('evaluatePreCloseStock: accurately calculates momentum score & stage classification', () => {
  // Top tier Stage 3 breakout candidate (e.g. RAMBHAJO at day high with 3.5x volume and above VWAP)
  const strongStock = {
    symbol: 'RAMBHAJO',
    companyName: 'Advit Jewels Limited',
    price: 240.0,
    previousClose: 220.0, // +9.09% gain
    open: 222.0,
    high: 241.0, // distance from high = 0.41% (<1%)
    low: 221.5,
    vwap: 232.0, // price is +3.4% above VWAP
    volume: 5000000,
    averageVolume: 1400000, // 3.57x volume ratio
    ema9: 235.0,
    ema20: 228.0,
    ema50: 215.0, // Bullish EMA Stack (EMA9 > 20 > 50)
    buySellRatio: 2.4, // Order book > 2.0
  };

  const evaluated = evaluatePreCloseStock(strongStock, { niftyBullish: true, sectorBullish: true });

  assert.equal(evaluated.symbol, 'RAMBHAJO');
  assert.ok(evaluated.momentumScore >= 85, `Score should be >= 85, got ${evaluated.momentumScore}`);
  assert.equal(evaluated.stageKey, 3);
  assert.ok(evaluated.stage.includes('STAGE 3: BREAKOUT CONFIRMED'));
  assert.ok(evaluated.keyReasons.length >= 4);
  assert.ok(evaluated.target1 > evaluated.ltp);
  assert.ok(evaluated.target2 > evaluated.target1);
  assert.ok(evaluated.stopLoss < evaluated.ltp);
  assert.ok(evaluated.riskReward >= 1.5);
});

test('evaluatePreCloseStock: penalizes sub-3% gains and large upper wick rejections', () => {
  const weakStock = {
    symbol: 'WEAKSTOCK',
    price: 101.0,
    previousClose: 100.0, // only +1% gain (< 3%)
    open: 100.5,
    high: 110.0, // pulled back from 110 to 101 (huge upper wick rejection > 80%)
    low: 99.5,
    vwap: 103.0, // trading below VWAP
    volume: 800000,
    averageVolume: 750000,
    ema9: 100.5,
    ema20: 102.0,
    ema50: 103.5,
    buySellRatio: 0.8,
  };

  const evaluated = evaluatePreCloseStock(weakStock);
  assert.ok(evaluated.momentumScore < 60, `Score should be below 60, got ${evaluated.momentumScore}`);
  assert.ok(evaluated.keyRisks.length >= 2);
});

test('runPreCloseMomentumScanner: filters, ranks by Stage and Score, and returns Top 10', () => {
  const pool = [
    { symbol: 'STK1', price: 200, previousClose: 185, high: 201, low: 186, open: 188, vwap: 194, volume: 3000000, averageVolume: 900000 },
    { symbol: 'STK2', price: 500, previousClose: 460, high: 502, low: 465, open: 470, vwap: 485, volume: 2000000, averageVolume: 700000 },
    { symbol: 'LOW_LIQ', price: 5, previousClose: 4.8, high: 5.1, low: 4.8, open: 4.8, volume: 10000, averageVolume: 8000 }, // should be rejected by liquidity
    { symbol: 'STK3', price: 100, previousClose: 92, high: 100.5, low: 93, open: 94, vwap: 97, volume: 4000000, averageVolume: 1500000 },
    { symbol: 'STK4', price: 150, previousClose: 140, high: 151, low: 141, open: 142, vwap: 146, volume: 1800000, averageVolume: 700000 },
  ];

  const result = runPreCloseMomentumScanner(pool, { niftyBullish: true, sectorBullish: true });

  assert.ok(Array.isArray(result.top10));
  assert.ok(result.top10.length <= 10);
  assert.ok(!result.top10.some((s) => s.symbol === 'LOW_LIQ')); // Liquidity gate test

  // Verify rank ordering
  result.top10.forEach((s, idx) => {
    assert.equal(s.rank, idx + 1);
  });
});

