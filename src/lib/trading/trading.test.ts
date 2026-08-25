import test from 'node:test';
import assert from 'node:assert/strict';

import { calculatePositionSize } from './positionSizer.ts';
import { validatePreTrade } from './riskManager.ts';
import { computeBullishScore, classifySignalLevel } from './scanner.ts';
import { executePaperBuy, updatePositionPrice, closePaperPosition } from './paperEngine.ts';

test('calculatePositionSize enforces risk per trade and maximum position value', () => {
  // Capital = 35,000, Risk = 1% (350), Max Pos = 25,000
  // Entry = 250, StopLoss = 246.25 (Risk/share = 3.75)
  // Max shares by risk = floor(350 / 3.75) = 93
  // Max shares by pos value = floor(25,000 / 250) = 100
  const sizing = calculatePositionSize({
    capital: 35000,
    riskPerTradePct: 1.0,
    maxPositionValue: 25000,
    entryPrice: 250,
    stopLoss: 246.25,
    target: 257.5,
  });

  assert.equal(sizing.quantity, 93);
  assert.equal(sizing.riskPerShare, 3.75);
  assert.equal(sizing.totalPositionValue, 23250); // 93 * 250
  assert.equal(sizing.potentialLoss, 348.75); // 93 * 3.75 <= 350
  assert.equal(sizing.potentialProfit, 697.5); // 93 * 7.5
  assert.equal(sizing.riskReward, 2.0);
});

test('validatePreTrade blocks orders when Kill Switch is active', () => {
  const check = validatePreTrade({
    symbol: 'RELIANCE',
    side: 'LONG',
    entryPrice: 2900,
    stopLoss: 2850,
    target: 3000,
    quantity: 10,
    config: {
      mode: 'PAPER',
      enabled: false, // Kill switch active
      capital: 50000,
      riskPerTradePct: 1.0,
      maxPositionValue: 30000,
      maxTradesPerDay: 10,
      maxDailyLoss: 2000,
      maxOpenPositions: 3,
      minBullishScore: 80,
      minRsi: 45,
      maxRsi: 75,
      minVolume: 50000,
      minVolumeRatio: 1.2,
      minBreakoutPercent: 0.5,
      stopLossPct: 1.5,
      targetPct: 3.0,
      trailingStopTriggerPct: 1.0,
      trailingStopDistancePct: 1.0,
      useAtrStop: false,
    },
  });

  assert.equal(check.allowed, false);
  assert.equal(check.code, 'KILL_SWITCH_ACTIVE');
});

test('classifySignalLevel returns appropriate tiers', () => {
  assert.equal(classifySignalLevel(92), 'STRONG_BULLISH');
  assert.equal(classifySignalLevel(75), 'BULLISH');
  assert.equal(classifySignalLevel(58), 'NEUTRAL');
  assert.equal(classifySignalLevel(42), 'WEAK');
  assert.equal(classifySignalLevel(15), 'BEARISH');
});

test('computeBullishScore accurately rewards momentum, volume, and VWAP position', () => {
  const stock = {
    symbol: 'TATASTEEL',
    price: 186,
    previousClose: 180, // +3.3% change
    vwap: 183, // price > vwap
    rvol: 2.2, // high volume
    rsi: 65, // sweet spot
    prevDayHigh: 184, // breakout above PDH
  };

  const breakdown = computeBullishScore(stock);
  assert.ok(breakdown.score >= 80, `Expected score >= 80, got ${breakdown.score}`);
  assert.ok(breakdown.reasons.length >= 3);
});

test('paperEngine simulates buy, trailing stop progression, and target hit', () => {
  const config = {
    mode: 'PAPER' as const,
    enabled: true,
    capital: 50000,
    riskPerTradePct: 1.0,
    maxPositionValue: 25000,
    maxTradesPerDay: 10,
    maxDailyLoss: 2000,
    maxOpenPositions: 3,
    minBullishScore: 80,
    minRsi: 45,
    maxRsi: 75,
    minVolume: 50000,
    minVolumeRatio: 1.2,
    minBreakoutPercent: 0.5,
    stopLossPct: 1.5,
    targetPct: 3.0,
    trailingStopTriggerPct: 1.0,
    trailingStopDistancePct: 1.0,
    useAtrStop: false,
  };

  // 1. Open paper position
  const pos = executePaperBuy({
    symbol: 'INFY',
    entryPrice: 2000,
    quantity: 10,
    stopLoss: 1970,
    target: 2060,
    config,
  });

  assert.equal(pos.symbol, 'INFY');
  assert.equal(pos.entryPrice, 2000);
  assert.equal(pos.trailingStop, 1970);

  // 2. Price rises to 2040 -> Trailing stop moves up (2040 - 1% = 2019.60)
  const step1 = updatePositionPrice(pos, 2040, config);
  assert.equal(step1.shouldExit, false);
  assert.ok(step1.position.trailingStop > 1970, 'Trailing stop should have moved upward');

  // 3. Price drops to 2030 -> Trailing stop must NOT move downward
  const step2 = updatePositionPrice(step1.position, 2030, config);
  assert.equal(step2.position.trailingStop, step1.position.trailingStop);

  // 4. Price reaches 2065 -> Target Hit exit
  const step3 = updatePositionPrice(step2.position, 2065, config);
  assert.equal(step3.shouldExit, true);
  assert.equal(step3.exitStatus, 'TARGET_HIT');

  // 5. Close position
  const closed = closePaperPosition(pos.id, 2065, 'Target Hit');
  assert.ok(closed !== null);
  assert.equal(closed?.realizedPnL, 650); // (2065 - 2000) * 10
});

import { analyzeCandleAnatomy, detectAllCandlePatterns } from '../../services/candlestickPatterns.js';

test('analyzeCandleAnatomy decomposes green/red candles and calculates buyer control', () => {
  // 1. Strong Bullish Green Candle (O: 100, H: 106, L: 99.5, C: 105)
  const green = analyzeCandleAnatomy({ open: 100, high: 106, low: 99.5, close: 105, volume: 50000 });
  assert.equal(green?.isGreen, true);
  assert.equal(green?.color, 'green');
  assert.ok((green?.buyerControlPercent ?? 0) >= 70, 'Buyer control should exceed 70%');
  assert.ok(green?.story.includes('Bullish'), 'Story should indicate bullishness');

  // 2. Strong Bearish Red Candle (O: 105, H: 106, L: 99, C: 100)
  const red = analyzeCandleAnatomy({ open: 105, high: 106, low: 99, close: 100, volume: 50000 });
  assert.equal(red?.isRed, true);
  assert.equal(red?.color, 'red');
  assert.ok((red?.sellerControlPercent ?? 0) >= 70, 'Seller control should exceed 70%');
});

test('detectAllCandlePatterns accurately identifies Bullish Engulfing, Hammer and Morning Star', () => {
  // 1. Bullish Engulfing: c1 (Red: O: 105, C: 100), c2 (Green: O: 99, C: 107)
  const engulfingCandles = [
    { open: 105, high: 106, low: 99, close: 100 },
    { open: 99, high: 108, low: 98.5, close: 107 },
  ];
  const engulfing = detectAllCandlePatterns(engulfingCandles);
  assert.ok(engulfing.some((p) => p.name === 'Bullish Engulfing'));

  // 2. Hammer: c1 (Green: O: 100, H: 102, L: 90, C: 101) -> Lower wick is 10, Body is 1
  const hammerCandles = [
    { open: 100, high: 102, low: 90, close: 101 },
  ];
  const hammer = detectAllCandlePatterns(hammerCandles);
  assert.ok(hammer.some((p) => p.name === 'Hammer'));

  // 3. Morning Star: c1 (Red), c2 (small star), c3 (strong Green closing > 50% of c1)
  const morningStarCandles = [
    { open: 110, high: 111, low: 98, close: 100 },
    { open: 98, high: 99, low: 96, close: 97 },
    { open: 98, high: 109, low: 97.5, close: 108 },
  ];
  const morningStar = detectAllCandlePatterns(morningStarCandles);
  assert.ok(morningStar.some((p) => p.name === 'Morning Star'));
});

