import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateGlobalShortCues,
  evaluateShortStock,
  runShortSellScan,
  SHORT_CATALYST_DIRECTORY,
} from './shortSellEngine.js';

test('Short Sell Radar Engine Suite', async (t) => {
  await t.test('evaluates Global Short Cues correctly', () => {
    // Weak global cues (GIFT Nifty -75, US Bearish, VIX 16.5, Crude +2.0%)
    const cues = evaluateGlobalShortCues({
      giftNiftyChange: -75,
      usMarketSentiment: 'BEARISH',
      indiaVix: 16.5,
      crudeOilChange: 2.0,
    });

    assert.ok(cues.score >= 12);
    assert.equal(cues.regime, 'STRONG_SHORT_TAILWIND');
    assert.ok(cues.factors.length >= 3);
  });

  await t.test('evaluates SWIGGY as High Conviction Short with MSCI exclusion catalyst', () => {
    const swiggyStock = {
      symbol: 'SWIGGY',
      companyName: 'Swiggy Limited',
      price: 276.1,
      previousClose: 282.9,
      open: 280.0,
      high: 284.4,
      low: 269.3,
      vwap: 278.0,
      rvol: 2.8,
      blockOutflowCr: 450,
    };

    const res = evaluateShortStock(swiggyStock);
    assert.ok(res.score >= 80);
    assert.equal(res.conviction, 'HIGH_CONVICTION_SHORT');
    assert.equal(res.badgeColor, 'danger');
    // Stop loss should be placed ABOVE entry
    assert.ok(res.stopLoss > res.entryPrice);
    // Targets should be placed BELOW entry
    assert.ok(res.target1 < res.entryPrice);
    assert.ok(res.target2 < res.target1);
    assert.ok(res.shortChecklist.length >= 3);
  });

  await t.test('calculates accurate risk:reward for short selling trades', () => {
    const stock = {
      symbol: 'ZEEL',
      price: 100.0,
      previousClose: 103.0,
      open: 101.5,
      high: 102.0,
      low: 98.0,
      vwap: 101.2,
      rvol: 2.2,
    };

    const res = evaluateShortStock(stock);
    assert.ok(res.stopLoss > 100.0);
    assert.ok(res.target1 < 100.0);
    const risk = res.stopLoss - res.entryPrice;
    const reward = res.entryPrice - res.target1;
    // Reward to risk ratio is ~1.8
    assert.ok(reward > risk * 1.5);
  });

  await t.test('runs full scan and ranks candidates descending by Short Score', () => {
    const scan = runShortSellScan([], {
      giftNiftyChange: -60,
      usMarketSentiment: 'BEARISH',
      indiaVix: 15.5,
    });

    assert.ok(scan.candidates.length >= 5);
    assert.ok(scan.highConvictionCount >= 1);
    // Verified sorted descending
    for (let i = 0; i < scan.candidates.length - 1; i++) {
      assert.ok(scan.candidates[i].score >= scan.candidates[i + 1].score);
    }
  });
});
