import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTomorrowScanner, renderTomorrowSetup } from './tomorrowScanner.js';

test('Tomorrow Scanner Engine Suite', async (t) => {
  await t.test('evaluates safe entry with anti-chase and dynamic R:R in tomorrow setups', () => {
    const mockStocks = [
      {
        symbol: 'RELIANCE',
        companyName: 'Reliance Industries',
        price: 2500,
        previousClose: 2470,
        changePercent: 1.21,
        volume: 2000000,
        averageVolume: 1000000,
        vwap: 2490,
        dayLow: 2475,
        dayHigh: 2510,
        previousDayHigh: 2495,
        supportLevel: 2475,
        resistanceLevel: 2550,
      },
      {
        symbol: 'TCS',
        companyName: 'Tata Consultancy Services',
        price: 3500,
        previousClose: 3480,
        changePercent: 0.57,
        volume: 1200000,
        averageVolume: 1000000,
        vwap: 3520, // Price is below VWAP!
        dayLow: 3470,
        dayHigh: 3530,
        previousDayHigh: 3510,
        supportLevel: 3470,
        resistanceLevel: 3560,
      },
    ];

    const result = buildTomorrowScanner(mockStocks, { marketBullish: true, marketSummary: 'STRONG BULLISH' });

    assert.ok(result.top10.length >= 1, 'Should return top candidates');
    const rel = result.top10.find((s) => s.symbol === 'RELIANCE');
    assert.ok(rel, 'Should find RELIANCE in candidates');
    assert.ok(rel.safeEntry, 'Should have safeEntry evaluated');
    assert.ok(rel.score > 50, 'Should have bullish score');

    const setup = renderTomorrowSetup(rel);
    assert.ok(setup.entry, 'Should format entry');
    assert.ok(setup.stopLoss, 'Should format stop loss');
    assert.ok(setup.target1, 'Should format target1');
    assert.ok(setup.safeStatus, 'Should have safe status');
    assert.ok(setup.breakevenTrigger, 'Should calculate breakeven trigger');
    assert.ok(setup.bookHalfAt, 'Should calculate book half at');
  });

  await t.test('triggers DO NOT CHASE warning when price exceeds entry threshold', () => {
    const mockStock = {
      symbol: 'INFY',
      companyName: 'Infosys Ltd',
      price: 1600, // significantly above support/entry
      previousClose: 1550,
      changePercent: 3.2,
      volume: 3000000,
      averageVolume: 1000000,
      vwap: 1580,
      dayLow: 1540,
      dayHigh: 1605,
      previousDayHigh: 1570,
      supportLevel: 1540,
      resistanceLevel: 1620,
    };

    const result = buildTomorrowScanner([mockStock]);
    const infy = result.top10[0];
    assert.ok(infy, 'Should find INFY');
    
    // In our calculation: entryZone is around (1540 + 1600)/2 = 1570.
    // Price = 1600 -> Slippage = (1600 - 1570)/1570 * 100 = 1.91% > 0.35% -> ⛔ DO NOT CHASE
    assert.equal(infy.safeEntry.status, '⛔ DO NOT CHASE');
    assert.equal(infy.safeEntry.safe, false);
    assert.match(infy.safeEntry.reason, /Wait for pullback/);
  });
});
