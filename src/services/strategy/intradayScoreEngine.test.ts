import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateIntradayScore } from './intradayScoreEngine.ts';

describe('Standardized 100-Pt Intraday Scoring Engine', () => {
  it('accurately computes maximum score for a perfect high-conviction breakout stock', () => {
    const perfectStock = {
      price: 105.0,
      open: 101.0,
      previousClose: 100.0,
      vwap: 102.0,
      volume: 2000000,
      averageVolume: 800000,
      relativeVolume: 2.5, // > 2.0 -> V = 1.0 (20 pts)
      previousDayHigh: 103.0, // price 105 > 103 -> Breakout = 1.0 (10 pts)
      bullishTrend: true, // Trend = 1.0 (10 pts)
      entry: 105.0,
      target: 111.0, // Reward = 6
      stopLoss: 103.0, // Risk = 2 -> RR = 3.0 -> R = 1.0 (10 pts)
      niftyBullish: true, // Sector = 1.0 (5 pts)
    };

    const result = calculateIntradayScore(perfectStock);

    // Score should be high (>= 90) and signal STRONG
    assert.ok(result.score >= 90, `Expected score >= 90, got ${result.score}`);
    assert.strictEqual(result.signal, 'STRONG');
    assert.strictEqual(result.canTrade, true);
    assert.strictEqual(result.breakdown.volumeScore, 20);
    assert.strictEqual(result.breakdown.momentumScore, 15);
    assert.strictEqual(result.breakdown.vwapScore, 15);
    assert.strictEqual(result.breakdown.breakoutScore, 10);
    assert.strictEqual(result.breakdown.trendScore, 10);
    assert.strictEqual(result.breakdown.riskRewardScore, 10);
    assert.strictEqual(result.breakdown.sectorScore, 5);
  });

  it('strictly assigns 0 to VWAP score when price is below VWAP', () => {
    const belowVwapStock = {
      price: 98.0,
      open: 100.0,
      previousClose: 102.0,
      vwap: 101.0, // Price 98 < VWAP 101!
      volume: 1000000,
      relativeVolume: 1.8,
      previousDayHigh: 103.0,
    };

    const result = calculateIntradayScore(belowVwapStock);

    assert.strictEqual(result.breakdown.vwapScore, 0);
    assert.strictEqual(result.metrics.isAboveVwap, false);
    assert.strictEqual(result.canTrade, false);
    assert.ok(result.gateReasons.some((r) => r.includes('<= VWAP')));
  });

  it('enforces institutional canTrade gate requires score >= 80, RVOL >= 1.5, breakout, and RR >= 2', () => {
    // Score is 75 (WATCH), so canTrade must be false
    const watchStock = {
      price: 101.0,
      open: 100.5,
      previousClose: 100.0,
      vwap: 100.8,
      volume: 600000,
      relativeVolume: 1.2, // < 1.5 RVOL!
      previousDayHigh: 102.0, // Not broken out!
      entry: 101.0,
      target: 102.5,
      stopLoss: 100.0,
    };

    const result = calculateIntradayScore(watchStock);
    assert.strictEqual(result.canTrade, false);
    assert.ok(result.gateReasons.length > 0);
  });

  it('scales volume score linearly up to 2x relative volume', () => {
    const stock1x = {
      price: 100,
      relativeVolume: 1.0, // 1x RVOL -> factor = 0.5 -> 10 pts
    };
    const res1 = calculateIntradayScore(stock1x);
    assert.strictEqual(res1.breakdown.volumeScore, 10);

    const stock2x = {
      price: 100,
      relativeVolume: 2.0, // 2x RVOL -> factor = 1.0 -> 20 pts
    };
    const res2 = calculateIntradayScore(stock2x);
    assert.strictEqual(res2.breakdown.volumeScore, 20);
  });
});
