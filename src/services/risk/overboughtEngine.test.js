import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calcRSIseries,
  detectUpperWickRejection,
  calculateDynamicExitStopLoss,
  evaluateOverboughtStatus,
} from './overboughtEngine.js';

test('Overbought Safe Exit Engine Suite', async (t) => {
  await t.test('calculates RSI series accurately', () => {
    // 15 candles rising consistently
    const prices = [100, 102, 104, 106, 108, 110, 112, 114, 116, 118, 120, 122, 124, 126, 128, 130];
    const rsi = calcRSIseries(prices, 14);
    assert.equal(Array.isArray(rsi), true);
    assert.equal(rsi.length, prices.length);
    const lastRsi = rsi.at(-1);
    assert.equal(lastRsi, 100); // pure gains
  });

  await t.test('detects Upper Wick Rejection / Shooting Star pattern correctly', () => {
    // Shooting Star: Open 280, High 284, Close 280.5, Low 279.8
    const shootingStarCandle = {
      open: 280.0,
      high: 284.0,
      low: 279.8,
      close: 280.5,
    };
    assert.equal(detectUpperWickRejection(shootingStarCandle), true);

    // Full Bullish Marubozu: Open 280, High 284, Close 284, Low 280
    const fullBullCandle = {
      open: 280.0,
      high: 284.0,
      low: 280.0,
      close: 284.0,
    };
    assert.equal(detectUpperWickRejection(fullBullCandle), false);
  });

  await t.test('calculates dynamic trailing stop loss to protect profit', () => {
    // User Entry ₹278, Peak ₹283.50 (Gain = ₹5.50, +1.98%)
    const trailingStop = calculateDynamicExitStopLoss({
      entryPrice: 278.0,
      currentPrice: 283.5,
      peakPrice: 283.5,
      vwap: 276.0,
    });
    // For +1.98% gain, locks 50% gain = 278 + (5.50 * 0.5) = ₹280.75
    assert.ok(trailingStop >= 280.0);
    assert.ok(trailingStop <= 283.5);

    // Minor gain (+0.7%) -> Moves to Breakeven (+0.2%)
    const beStop = calculateDynamicExitStopLoss({
      entryPrice: 100.0,
      currentPrice: 100.7,
      peakPrice: 100.7,
      vwap: 99.5,
    });
    assert.equal(beStop, 100.2);
  });

  await t.test('SWIGGY Scenario: Triggers OVERBOUGHT_CRITICAL and Bearish Reversal Safe Exit', () => {
    // SWIGGY at 2:35 PM: Entry 278, Current 283.50, VWAP 276, RSI 78, Long upper wick candle
    const res = evaluateOverboughtStatus({
      currentPrice: 283.5,
      entryPrice: 278.0,
      peakPrice: 283.5,
      vwap: 276.0,
      rsi: 78.5,
      timeStr: '14:35',
      candle: {
        open: 281.0,
        high: 284.0,
        close: 281.5,
        low: 280.8,
      },
    });

    assert.equal(res.isOverbought, true);
    assert.equal(res.hasUpperWickRejection, true);
    assert.equal(res.level, 'BEARISH_REVERSAL_EXIT');
    assert.ok(res.trailingStopPrice >= 280.5);
    assert.equal(res.pnlAmount, 5.5);
    assert.equal(res.pnlPct, 1.98);
    assert.ok(res.actionAdvice.includes('FULL EXIT'));
  });

  await t.test('Healthy Uptrend: Reports NORMAL and advises holding', () => {
    const res = evaluateOverboughtStatus({
      currentPrice: 278.5,
      entryPrice: 277.0,
      peakPrice: 278.5,
      vwap: 276.5,
      rsi: 58.0,
      timeStr: '11:15',
    });

    assert.equal(res.isOverbought, false);
    assert.equal(res.level, 'NORMAL');
    assert.ok(res.actionAdvice.includes('HEALTHY MOMENTUM'));
  });
});
