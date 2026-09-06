import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRiskScore,
  classifyRiskLevel,
} from './riskEngine.ts';
import {
  calculateProfitGiveback,
  calculateTrailingStop,
  evaluateProfitProtection,
  DEFAULT_PROFIT_PROTECTION_CONFIG,
} from './profitProtectionEngine.ts';
import {
  registerNewOpenPosition,
  updatePositionMarketData,
  parseStockUrlOrSymbol,
} from './positionTracker.ts';
import {
  detectFailedBreakout,
  detectVolumeClimax,
  detectEMASlopeFlattening,
} from './indicatorEngine.ts';
import type { OpenRiskPosition } from '../../types/risk.ts';

const createMockPosition = (overrides: Partial<OpenRiskPosition> = {}): OpenRiskPosition => ({
  id: 'pos_test_1',
  symbol: 'WEL',
  companyName: 'Wonder Electricals Ltd',
  quantity: 500,
  entryPrice: 150,
  currentPrice: 155,
  entryTime: '09:30:00 AM',
  entryTimeMs: Date.now() - 60000,
  product: 'MIS',
  exchange: 'NSE',
  currentPnL: 2500,
  peakPnL: 3500,
  peakPrice: 157,
  profitGiveback: 1000,
  profitGivebackPct: 28.57,
  protectedProfit: 2275,
  isGivebackExceeded: false,
  initialStopLoss: 147,
  trailingStopLoss: 151,
  target1: 154.5,
  target2: 157.5,
  vwap: 154,
  ema9: 154.5,
  ema20: 153.5,
  ema50: 151,
  candle5mTrend: 'BULLISH',
  supportLevel: 152,
  resistanceLevel: 158,
  volume: 1000000,
  averageVolume: 800000,
  volumeRatio: 1.25,
  buySellRatio: 1.6,
  orderBookImbalancePct: 25,
  niftyTrend: 'BULLISH',
  sectorTrend: 'BULLISH',
  riskScore: 10,
  riskLevel: 'NORMAL',
  exitRiskReasons: [],
  failedIndicators: [],
  isExitWarningConfirmed: false,
  status: 'OPEN',
  lastUpdatedMs: Date.now(),
  isDataStale: false,
  timeline: [],
  ...overrides,
});

test('calculateProfitGiveback: accurately calculates giveback and percentage from peak', () => {
  const { profitGiveback, profitGivebackPct } = calculateProfitGiveback(8000, 6500);
  assert.equal(profitGiveback, 1500);
  assert.equal(profitGivebackPct, 18.75);

  const zeroGiveback = calculateProfitGiveback(0, 0);
  assert.equal(zeroGiveback.profitGiveback, 0);
  assert.equal(zeroGiveback.profitGivebackPct, 0);
});

test('calculateTrailingStop: moves to Breakeven at +0.8% and locks gains at +1.5%', () => {
  // Peak price unchanged -> stays at initial SL
  const slInitial = calculateTrailingStop(100, 100, 97);
  assert.equal(slInitial, 97);

  // Peak price +1% (101) -> moves to Breakeven + buffer (100.20)
  const slBreakeven = calculateTrailingStop(100, 101, 97);
  assert.equal(slBreakeven, 100.2);

  // Peak price +5% (105) -> locks 60% of profit (103.00)
  const slProfitLock = calculateTrailingStop(100, 105, 97, false);
  assert.equal(slProfitLock, 103.0);

  // After 1:30 PM, locks tighter 75% of profit (103.75)
  const slAfter130 = calculateTrailingStop(100, 105, 97, true);
  assert.equal(slAfter130, 103.75);
});

test('evaluateProfitProtection: triggers giveback exceeded alert when peak profit is given back', () => {
  const pos = createMockPosition({
    peakPnL: 8000,
    currentPnL: 5500, // Gave back ₹2,500 (> ₹1,200 max allowed)
  });

  const evalResult = evaluateProfitProtection(pos, DEFAULT_PROFIT_PROTECTION_CONFIG, false);
  assert.equal(evalResult.isGivebackExceeded, true);
  assert.ok(evalResult.riskScorePenalty >= 25);
  assert.ok(evalResult.reason?.includes('Profit giveback exceeded'));
});

test('calculateRiskScore: healthy trade receives NORMAL risk score (0-25)', () => {
  const pos = createMockPosition({
    currentPrice: 156,
    vwap: 154,
    ema9: 155,
    ema20: 153,
    ema50: 150,
    candle5mTrend: 'BULLISH',
    supportLevel: 152,
    trailingStopLoss: 152.5,
    orderBookImbalancePct: 30,
    niftyTrend: 'BULLISH',
  });

  const result = calculateRiskScore(pos, DEFAULT_PROFIT_PROTECTION_CONFIG, false);
  assert.ok(result.riskScore <= 25);
  assert.equal(result.riskLevel, 'NORMAL');
  assert.equal(result.isExitWarningConfirmed, false);
});

test('calculateRiskScore: multi-condition breakdown triggers EXIT_WARNING (66-80)', () => {
  const pos = createMockPosition({
    currentPrice: 149,
    vwap: 153, // Failed
    ema9: 150,
    ema20: 152, // Failed: EMA 9 < 20
    supportLevel: 151, // Failed: Support broken
    volumeRatio: 2.4, // Heavy volume
    buySellRatio: 0.6, // Seller dominant
    orderBookImbalancePct: -60, // Heavy sell wall
    peakPnL: 6000,
    currentPnL: 2000, // Heavy giveback
  });

  const result = calculateRiskScore(pos, DEFAULT_PROFIT_PROTECTION_CONFIG, false);
  assert.ok(result.riskScore >= 66);
  assert.ok(result.riskLevel === 'EXIT_WARNING' || result.riskLevel === 'CRITICAL_EXIT');
  assert.equal(result.isExitWarningConfirmed, true);
  assert.ok(result.failedIndicators.length >= 3);
});

test('calculateRiskScore: enforces multi-condition confirmation (single indicator does not trigger Exit Warning)', () => {
  // Only 1 minor indicator failure (e.g. slight sector weakness only)
  const pos = createMockPosition({
    currentPrice: 155,
    vwap: 154,
    ema9: 155,
    ema20: 153,
    sectorTrend: 'BEARISH', // Only sector weak
    peakPnL: 3000,
    currentPnL: 2500,
  });

  const result = calculateRiskScore(pos, DEFAULT_PROFIT_PROTECTION_CONFIG, false);
  assert.notEqual(result.riskLevel, 'EXIT_WARNING');
  assert.notEqual(result.riskLevel, 'CRITICAL_EXIT');
  assert.equal(result.isExitWarningConfirmed, false);
});

test('calculateRiskScore: 1:30 PM mode increases risk score sensitivity by 25%', () => {
  const pos = createMockPosition({
    currentPrice: 151,
    vwap: 153,
    ema9: 151,
    ema20: 152,
    peakPnL: 4000,
    currentPnL: 2000,
  });

  const morningResult = calculateRiskScore(pos, DEFAULT_PROFIT_PROTECTION_CONFIG, false);
  const after130Result = calculateRiskScore(pos, DEFAULT_PROFIT_PROTECTION_CONFIG, true);

  assert.ok(after130Result.riskScore >= morningResult.riskScore);
  assert.ok(after130Result.exitRiskReasons.some((r) => r.includes('1:30 PM High-Risk Mode')));
});

test('parseStockUrlOrSymbol: accurately extracts symbol and company from NSE and Groww URLs', () => {
  // NSE India URL
  const nseResult = parseStockUrlOrSymbol(
    'https://www.nseindia.com/get-quote/equity/WEL/Wonder-Electricals-Limited'
  );
  assert.equal(nseResult.symbol, 'WEL');
  assert.equal(nseResult.companyName, 'Wonder Electricals Limited');

  // Groww URL
  const growwResult = parseStockUrlOrSymbol(
    'https://groww.in/stocks/wonder-electricals-ltd'
  );
  assert.equal(growwResult.symbol, 'WONDERELECTRICALS');
  assert.ok(growwResult.companyName.includes('Wonder Electricals'));

  // Plain Symbol
  const plainResult = parseStockUrlOrSymbol('GENCON');
  assert.equal(plainResult.symbol, 'GENCON');
});

test('detectFailedBreakout: accurately triggers bull trap when price pierces resistance and fails', () => {
  const recentCandles = [
    { close: 279, high: 281 },
    { close: 283, high: 285 }, // pierced 284 resistance
  ];

  // Price failed to sustain and fell to 281
  const failed = detectFailedBreakout(281, 284, 285, recentCandles);
  assert.equal(failed.isFailed, true);
  assert.equal(failed.score, 35);
  assert.ok(failed.message.includes('BULL TRAP'));

  // Sustained breakout holding above 284.5
  const sustained = detectFailedBreakout(285, 284, 285, recentCandles);
  assert.equal(sustained.isFailed, false);
  assert.equal(sustained.score, 0);
});

test('detectVolumeClimax: detects smart money offloading on high volume with small body / upper wick', () => {
  // Volume 3x normal, small body (open 100, close 100.5, high 104, low 99.8)
  const climax = detectVolumeClimax(300000, 100000, 104, 99.8, 100, 100.5);
  assert.equal(climax.isClimax, true);
  assert.equal(climax.score, 25);
  assert.ok(climax.message.includes('VOLUME CLIMAX'));

  // Normal bullish volume expansion with full body
  const normal = detectVolumeClimax(120000, 100000, 105, 100, 100, 104.8);
  assert.equal(normal.isClimax, false);
  assert.equal(normal.score, 0);
});

test('detectEMASlopeFlattening: flags trend momentum stalling flat', () => {
  // Current EMA 150.02, 3 bars ago 150.00 (slope = +0.013% < 0.05%)
  const flat = detectEMASlopeFlattening(150.02, 150.0);
  assert.equal(flat.isFlattening, true);
  assert.equal(flat.score, 15);
  assert.ok(flat.message.includes('stalled flat'));

  // Strong upward slope (153.0 vs 150.0 = +2.0%)
  const strong = detectEMASlopeFlattening(153.0, 150.0);
  assert.equal(strong.isFlattening, false);
  assert.equal(strong.score, 0);
});

