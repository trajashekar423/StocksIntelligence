import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isNseTradingDay,
  calculateTradingSessions,
  formatNseDate,
  getNextNseTradingDay,
} from '../calendar/nseCalendarService.ts';
import { checkCorporateActions } from '../corporate/corporateActionService.ts';
import {
  evaluateTargetDateStock,
  runTargetDateStrategyScan,
} from './targetDateStrategyEngine.ts';

describe('NSE Trading Calendar & Session Engine', () => {
  it('isNseTradingDay: correctly identifies trading days, weekends, and holidays', () => {
    // 28-Aug-2026 is a Friday (Trading day)
    assert.strictEqual(isNseTradingDay('2026-08-28'), true);

    // 29-Aug-2026 is a Saturday (Weekend)
    assert.strictEqual(isNseTradingDay('2026-08-29'), false);

    // 30-Aug-2026 is a Sunday (Weekend)
    assert.strictEqual(isNseTradingDay('2026-08-30'), false);

    // 15-Aug-2026 is Independence Day (NSE Holiday)
    assert.strictEqual(isNseTradingDay('2026-08-15'), false);

    // 02-Oct-2026 is Gandhi Jayanti (NSE Holiday)
    assert.strictEqual(isNseTradingDay('2026-10-02'), false);
  });

  it('calculateTradingSessions: Friday to Monday calculates exactly 1 trading session', () => {
    const buyDate = '2026-08-28'; // Friday
    const targetDate = '2026-08-31'; // Monday

    const result = calculateTradingSessions(buyDate, targetDate);

    assert.strictEqual(result.tradingSessions, 1);
    assert.strictEqual(result.weekendDaysExcluded, 2);
    assert.strictEqual(result.buyDateFormatted, '28-August-2026');
    assert.strictEqual(result.targetSellDateFormatted, '31-August-2026');
  });

  it('calculateTradingSessions: automatically adjusts weekend target date to next trading day', () => {
    const buyDate = '2026-08-28'; // Friday
    const weekendTarget = '2026-08-30'; // Sunday

    const result = calculateTradingSessions(buyDate, weekendTarget);

    assert.strictEqual(result.isTargetSellDateValid, false);
    assert.strictEqual(result.adjustedTargetSellDateFormatted, '31-August-2026');
    assert.strictEqual(result.tradingSessions, 1);
  });
});

describe('Corporate Action Safety Check', () => {
  it('returns clean safety score 5 when no corporate action is scheduled before target date', () => {
    const res = checkCorporateActions('WHIRLPOOL', '2026-08-28', '2026-08-31');
    assert.strictEqual(res.hasEventBeforeTargetDate, false);
    assert.strictEqual(res.safetyScore, 5);
    assert.strictEqual(res.status, 'NONE');
  });
});

describe('Target-Date Technical Strategy & 100-Pt Scoring', () => {
  const sessionInfo = calculateTradingSessions('2026-08-28', '2026-08-31');

  it('evaluateTargetDateStock: high momentum stock receives High Conviction or Strong score', () => {
    const sampleStock = {
      symbol: 'PVP',
      companyName: 'PVP Ventures Limited',
      sector: 'Media & Real Estate',
      price: 65.22,
      previousClose: 62.12,
      open: 65.00,
      high: 65.22,
      low: 63.90,
      changePercent: 4.99,
      volume: 6800000,
      averageVolume: 1500000,
      volumeRatio: 4.5,
      vwap: 64.80,
      ema9: 64.50,
      ema20: 61.50,
      ema50: 58.00,
      atr: 2.10,
    };

    const res = evaluateTargetDateStock(sampleStock, sessionInfo, { niftyBullish: true, sectorBullish: true });

    assert.ok(res.score >= 80, `Expected score >= 80, got ${res.score}`);
    assert.strictEqual(res.holdingSessions, 1);
    assert.strictEqual(res.isEntryConfirmed, true);
    assert.ok(res.targetDateTarget > res.price);
    assert.ok(res.stopLoss < res.price);
  });

  it('evaluateTargetDateStock: explicitly flags 10% target unsupported on short holding sessions', () => {
    const largeCapStock = {
      symbol: 'TCS',
      companyName: 'Tata Consultancy Services',
      sector: 'IT Services',
      price: 4200.00,
      previousClose: 4160.00,
      open: 4180.00,
      high: 4210.00,
      low: 4175.00,
      changePercent: 0.96,
      volume: 1200000,
      averageVolume: 1000000,
      vwap: 4195.00,
      atr: 45.00,
    };

    const res = evaluateTargetDateStock(largeCapStock, sessionInfo);

    assert.strictEqual(res.is10PctSupported, false);
    assert.strictEqual(res.target10PctNote, '10% TARGET NOT SUPPORTED BY CURRENT STRUCTURE.');
  });

  it('runTargetDateStrategyScan: ranks descending and returns Top 10 setups', () => {
    const list = [
      { symbol: 'PVP', price: 65.22, previousClose: 62.12, high: 65.22, low: 63.9, open: 65.0, vwap: 64.8, volume: 5000000 },
      { symbol: 'AMBER', price: 7781.5, previousClose: 7701.0, high: 7788.0, low: 7700.0, open: 7750.5, vwap: 7745.0, volume: 800000 },
      { symbol: 'TEJASNET', price: 564.25, previousClose: 511.15, high: 567.8, low: 538.0, open: 538.0, vwap: 556.2, volume: 4000000 },
      { symbol: 'JUSTDIAL', price: 704.55, previousClose: 640.5, high: 704.55, low: 653.35, open: 655.0, vwap: 688.5, volume: 3500000 },
    ];

    const result = runTargetDateStrategyScan(list, '2026-08-28', '2026-08-31');

    assert.strictEqual(result.top10.length, 4);
    assert.strictEqual(result.top10[0].rank, 1);
    assert.ok(result.top10[0].score >= result.top10[1].score);
    assert.strictEqual(result.sessionInfo.tradingSessions, 1);
  });
});
