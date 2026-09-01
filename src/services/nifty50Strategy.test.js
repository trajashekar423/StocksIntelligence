import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NIFTY50_CONSTITUENTS,
  evaluateNiftyStock,
  runNifty50StrategyScan,
} from './nifty50StrategyEngine.js';

test('NIFTY50_CONSTITUENTS: has all 50 official blue-chip members', () => {
  assert.equal(NIFTY50_CONSTITUENTS.length, 50);
  assert.ok(NIFTY50_CONSTITUENTS.some((c) => c.symbol === 'RELIANCE'));
  assert.ok(NIFTY50_CONSTITUENTS.some((c) => c.symbol === 'HDFCBANK'));
  assert.ok(NIFTY50_CONSTITUENTS.some((c) => c.symbol === 'INFY'));
  assert.ok(NIFTY50_CONSTITUENTS.some((c) => c.symbol === 'TCS'));
});

test('evaluateNiftyStock: computes 100-pt score, breakout status, and realistic profit targets', () => {
  const bullishReliance = {
    symbol: 'RELIANCE',
    companyName: 'Reliance Industries Ltd',
    price: 3000.0,
    previousClose: 2900.0, // +3.45% gain
    open: 2920.0,
    high: 3010.0, // within 0.33% of Day High
    low: 2915.0,
    vwap: 2960.0, // price is +1.35% above VWAP
    volume: 6000000,
    averageVolume: 2200000, // 2.7x volume ratio
    prevDayHigh: 2980.0, // Cleared prev day high (Breakout)
    ema9: 2985.0,
    ema20: 2955.0,
    ema50: 2910.0, // EMA9 > EMA20 > EMA50
    rsi: 66.0,
    macd: 18.5,
    macdSignal: 12.0, // MACD Bullish
  };

  const evaluated = evaluateNiftyStock(bullishReliance, { niftyBullish: true, sectorBullish: true });

  assert.equal(evaluated.symbol, 'RELIANCE');
  assert.ok(evaluated.score >= 88, `Score should be >= 88, got ${evaluated.score}`);
  assert.ok(evaluated.classification.includes('STRONG'));
  assert.ok(evaluated.keyReasons.length >= 5);

  // Targets
  assert.equal(evaluated.target1, 3090.0); // +3%
  assert.equal(evaluated.target2, 3150.0); // +5%
  assert.equal(evaluated.target3, 3300.0); // +10%
  assert.equal(evaluated.tenPercentFeasible, true);
  assert.ok(evaluated.tenPercentNote.includes('technically achievable'));

  // Risk / Reward & Invalidation
  assert.ok(evaluated.stopLoss < evaluated.ltp);
  assert.ok(evaluated.riskReward >= 1.8);
});

test('evaluateNiftyStock: marks 10% target not supported when structure is weak or overextended', () => {
  const weakStock = {
    symbol: 'WEAKNIFTY',
    price: 1000.0,
    previousClose: 995.0, // +0.5% gain
    open: 998.0,
    high: 1020.0, // pulled back 2% from high
    low: 990.0,
    vwap: 1005.0, // below VWAP
    volume: 1000000,
    averageVolume: 1200000, // 0.8x volume ratio
    rsi: 44.0,
    macd: -2.0,
    macdSignal: 1.0,
  };

  const evaluated = evaluateNiftyStock(weakStock);
  assert.ok(evaluated.score < 60, `Score should be < 60, got ${evaluated.score}`);
  assert.equal(evaluated.tenPercentFeasible, false);
  assert.ok(evaluated.tenPercentNote.includes('not supported by current structure'));
});

test('runNifty50StrategyScan: ranks descending and extracts Top 5 setups', () => {
  const sampleUniverse = [
    { symbol: 'RELIANCE', price: 3000, previousClose: 2900, high: 3010, low: 2915, open: 2920, vwap: 2960, volume: 6000000, averageVolume: 2200000 },
    { symbol: 'INFY', price: 1920, previousClose: 1860, high: 1930, low: 1870, open: 1880, vwap: 1900, volume: 5000000, averageVolume: 2000000 },
    { symbol: 'TCS', price: 4150, previousClose: 4120, high: 4160, low: 4110, open: 4115, vwap: 4135, volume: 2000000, averageVolume: 1500000 },
    { symbol: 'HDFCBANK', price: 1680, previousClose: 1640, high: 1690, low: 1645, open: 1650, vwap: 1665, volume: 12000000, averageVolume: 5000000 },
    { symbol: 'TATAMOTORS', price: 1000, previousClose: 960, high: 1005, low: 965, open: 970, vwap: 985, volume: 8000000, averageVolume: 3000000 },
    { symbol: 'WEAK1', price: 500, previousClose: 502, high: 505, low: 495, open: 500, vwap: 503, volume: 800000, averageVolume: 1000000 },
  ];

  const scan = runNifty50StrategyScan(sampleUniverse, { niftyBullish: true, sectorBullish: true });

  assert.equal(scan.totalCount, 6);
  assert.equal(scan.top5.length, 5);
  assert.equal(scan.ranked[0].rank, 1);
  assert.ok(scan.ranked[0].score >= scan.ranked[1].score);
});

