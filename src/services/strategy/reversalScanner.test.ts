import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateReversalCandidate,
  evaluateSafeEntry,
  runReversalScanner,
  type CandleData,
  type ReversalEvaluationInput,
} from './reversalScannerEngine.ts';

// Helper to generate a 20-candle series with a downtrend base
function createCandleSeries(basePrice: number, count: number = 20): CandleData[] {
  const candles: CandleData[] = [];
  let price = basePrice;
  for (let i = 0; i < count; i++) {
    const open = price;
    price -= 2; // general decline
    const close = price;
    const high = open + 1;
    const low = close - 1;
    candles.push({
      open,
      high,
      low,
      close,
      volume: 100000,
    });
  }
  return candles;
}

describe('Bullish Reversal & 3-Way Setup Engine', () => {
  it('detects genuine downtrend exhaustion and support proximity <= 3.0%', () => {
    const candles = createCandleSeries(200, 20);
    // At end of series, price is ~160.
    const lastCandle = candles[candles.length - 1];
    const lowestLow = Math.min(...candles.map((c) => c.low));

    const input: ReversalEvaluationInput = {
      symbol: 'TATAMOTORS',
      candles,
      ema20: 175,
      ema50: 185,
      ema9: 161,
      averageVolume20: 100000,
    };

    const result = evaluateReversalCandidate(input);

    assert.strictEqual(result.symbol, 'TATAMOTORS');
    assert.strictEqual(result.isDowntrendExhausted, true);
    assert.ok(result.breakdown.downtrendExhaustionScore >= 15);
    assert.ok(result.lowestLow20 <= lowestLow);
    assert.ok(result.distanceToSupportPct <= 3.0);
    assert.strictEqual(result.isAtSupportZone, true);
  });

  it('detects Hammer candlestick and calculates correct pattern score (+15)', () => {
    const candles = createCandleSeries(300, 20);

    // Make candle 19 (c2) a textbook Hammer:
    // Open 250, Close 252 (body 2), High 252.5 (upper wick 0.5 <= body), Low 245 (lower wick 5 >= 2 * body)
    candles[18] = {
      open: 250,
      close: 252,
      high: 252.5,
      low: 245,
      volume: 250000, // 2.5x volume
    };
    // Candle 20 (c1): Confirmation candle
    candles[19] = {
      open: 252.5,
      close: 256,
      high: 257,
      low: 251,
      volume: 220000,
    };

    const input: ReversalEvaluationInput = {
      symbol: 'RELIANCE',
      candles,
      ema20: 270,
      ema50: 285,
      rsiCurrent: 36,
      rsiPrevious: 29,
      atr: 4.0,
      averageVolume20: 100000,
    };

    const result = evaluateReversalCandidate(input);

    assert.strictEqual(result.candlestickPattern, 'Hammer');
    assert.strictEqual(result.patternEmoji, '🔨');
    assert.strictEqual(result.breakdown.candlestickScore, 15);
    assert.strictEqual(result.isRsiRecovering, true);
    assert.strictEqual(result.breakdown.rsiRecoveryScore, 10);
    assert.ok(result.volumeRatio >= 2.0);
  });

  it('detects Bullish Engulfing pattern with highest candlestick score (+20)', () => {
    const candles = createCandleSeries(500, 21);

    // Candle 18: Red candle
    candles[18] = { open: 420, close: 410, high: 422, low: 408, volume: 100000 };
    // Candle 19: Large Green Engulfing candle
    candles[19] = { open: 408, close: 425, high: 426, low: 406, volume: 200000 };
    // Candle 20: Follow-through
    candles[20] = { open: 425, close: 430, high: 432, low: 424, volume: 180000 };

    const input: ReversalEvaluationInput = {
      symbol: 'INFY',
      candles,
      ema20: 450,
      ema50: 460,
      averageVolume20: 100000,
    };

    const result = evaluateReversalCandidate(input);

    assert.strictEqual(result.candlestickPattern, 'Bullish Engulfing');
    assert.strictEqual(result.patternEmoji, '🐂');
    assert.strictEqual(result.breakdown.candlestickScore, 20);
  });

  it('validates 2nd Candle Confirmation Gate: BUY_CONFIRMED vs AWAITING_CANDLE_2 vs SETUP_INVALID', () => {
    const baseCandles = createCandleSeries(1000, 20);

    // Reversal Hammer on Candle 18
    baseCandles[18] = {
      open: 920,
      close: 922,
      high: 923,
      low: 910,
      volume: 150000,
    };

    // Case A: Confirmed Breakout (c1 close > c2 high and volume >= avg)
    const confirmedCandles = [...baseCandles];
    confirmedCandles[19] = {
      open: 922,
      close: 928, // > 923
      high: 930,
      low: 921,
      volume: 120000, // > 100k
    };

    const confirmedResult = evaluateReversalCandidate({
      symbol: 'HDFCBANK',
      candles: confirmedCandles,
      averageVolume20: 100000,
    });
    assert.strictEqual(confirmedResult.isBuyConfirmed, true);
    assert.strictEqual(confirmedResult.confirmationStatus, 'BUY_CONFIRMED');

    // Case B: Awaiting breakout (c1 close <= c2 high but > c2 low)
    const awaitingCandles = [...baseCandles];
    awaitingCandles[19] = {
      open: 922,
      close: 921, // <= 923
      high: 922.5,
      low: 918,
      volume: 120000,
    };

    const awaitingResult = evaluateReversalCandidate({
      symbol: 'HDFCBANK',
      candles: awaitingCandles,
      averageVolume20: 100000,
    });
    assert.strictEqual(awaitingResult.isBuyConfirmed, false);
    assert.strictEqual(awaitingResult.confirmationStatus, 'AWAITING_CANDLE_2');

    // Case C: Invalidated (c1 close breaks below reversal low of 910)
    const invalidCandles = [...baseCandles];
    invalidCandles[19] = {
      open: 918,
      close: 905, // < 910
      high: 919,
      low: 904,
      volume: 150000,
    };

    const invalidResult = evaluateReversalCandidate({
      symbol: 'HDFCBANK',
      candles: invalidCandles,
      averageVolume20: 100000,
    });
    assert.strictEqual(invalidResult.isBuyConfirmed, false);
    assert.strictEqual(invalidResult.confirmationStatus, 'SETUP_INVALID');
  });

  it('calculates precise ATR-based Stop Loss and 1:2 / 1:3 profit targets', () => {
    const candles = createCandleSeries(500, 20);
    // Candle 18 (Reversal candle): low is 440, high is 452
    candles[18] = { open: 448, close: 450, high: 452, low: 440, volume: 150000 };
    // Candle 19: current close is 455
    candles[19] = { open: 451, close: 455, high: 456, low: 450, volume: 180000 };

    const atr = 6.0;
    // Expected StopLoss = ReversalLow - (0.5 * ATR) = 440 - (0.5 * 6) = 437.00
    // RiskPerShare = 455 - 437 = 18.00
    // Target 1 (1:2) = 455 + (18 * 2) = 491.00
    // Target 2 (1:3) = 455 + (18 * 3) = 509.00

    const result = evaluateReversalCandidate({
      symbol: 'SBIN',
      candles,
      atr,
      averageVolume20: 100000,
    });

    assert.strictEqual(result.stopLossPrice, 437.0);
    assert.strictEqual(result.riskPerShare, 18.0);
    assert.strictEqual(result.target1, 491.0);
    assert.strictEqual(result.target2, 509.0);
    assert.strictEqual(result.riskRewardRatio, '1:2 (T1) / 1:3 (T2)');
  });

  it('correctly executes runReversalScanner and categorizes into 3 Master Setups', () => {
    // 1. Candidate A: Bottom reversal
    const candlesA = createCandleSeries(200, 20);
    candlesA[18] = { open: 160, close: 162, high: 163, low: 155, volume: 200000 };
    candlesA[19] = { open: 162, close: 165, high: 166, low: 161, volume: 220000 };

    // 2. Candidate B: Pullback continuation (uptrend, near VWAP/EMA20)
    const candlesB: CandleData[] = [];
    let p = 300;
    for (let i = 0; i < 20; i++) {
      p += 2;
      candlesB.push({ open: p - 2, high: p + 1, low: p - 3, close: p, volume: 100000 });
    }
    const lastB = candlesB[candlesB.length - 1];

    // 3. Candidate C: Top rejection / short setup (below VWAP, long upper wick)
    const candlesC = [...candlesB];
    candlesC[candlesC.length - 1] = {
      open: 350,
      close: 340,
      high: 360,
      low: 338,
      volume: 180000,
    };

    const candidates: ReversalEvaluationInput[] = [
      {
        symbol: 'REVERSAL_STOCK',
        candles: candlesA,
        ema20: 180,
        ema50: 190,
        averageVolume20: 100000,
      },
      {
        symbol: 'PULLBACK_STOCK',
        candles: candlesB,
        ema20: lastB.close,
        ema50: lastB.close - 20,
        vwap: lastB.close - 1,
        averageVolume20: 100000,
      },
      {
        symbol: 'SHORT_STOCK',
        candles: candlesC,
        vwap: 355,
        ema20: 330,
        ema50: 320,
        averageVolume20: 100000,
      },
    ];

    const scanResult = runReversalScanner(candidates);

    assert.strictEqual(scanResult.totalScanned, 3);
    assert.ok(scanResult.downToUpReversals.length >= 1);
    assert.strictEqual(scanResult.downToUpReversals[0].symbol, 'REVERSAL_STOCK');
    assert.ok(scanResult.pullbackContinuations.some((c) => c.symbol === 'PULLBACK_STOCK'));
    assert.ok(scanResult.topReversalShorts.some((c) => c.symbol === 'SHORT_STOCK'));
  });

  it('Safe Logic Guard: triggers ⛔ DO NOT CHASE when price is > 0.35% above recommended entry', () => {
    // Recommended entry 1000, current price 1005 (0.50% slippage)
    const result = evaluateSafeEntry({
      recommendedEntry: 1000,
      currentPrice: 1005,
      stopLoss: 980,
      target1: 1050,
      vwap: 995,
    });

    assert.strictEqual(result.safe, false);
    assert.strictEqual(result.status, '⛔ DO NOT CHASE');
    assert.ok(result.reason?.includes('above ideal entry'));
    assert.ok(result.reason?.includes('Wait for pullback'));
  });

  it('Safe Logic Guard: triggers ⚠️ POOR RISK/REWARD when remaining R:R is < 1.5:1', () => {
    // Current price 1002, Stop loss 990 (Risk = 12), Target1 = 1014 (Reward = 12) -> R:R = 1.0 < 1.5
    const result = evaluateSafeEntry({
      recommendedEntry: 1000,
      currentPrice: 1002,
      stopLoss: 990,
      target1: 1014,
      vwap: 995,
    });

    assert.strictEqual(result.safe, false);
    assert.strictEqual(result.status, '⚠️ POOR RISK/REWARD');
    assert.ok(result.reason?.includes('Must be >= 1.5:1 to enter'));
  });

  it('Safe Logic Guard: triggers ❌ BELOW VWAP when current price is below VWAP', () => {
    const result = evaluateSafeEntry({
      recommendedEntry: 1000,
      currentPrice: 1001,
      stopLoss: 985,
      target1: 1040,
      vwap: 1008, // Price 1001 < VWAP 1008
    });

    assert.strictEqual(result.safe, false);
    assert.strictEqual(result.status, '❌ BELOW VWAP');
    assert.ok(result.reason?.includes('below institutional VWAP'));
  });

  it('Safe Logic Guard: triggers ✅ SAFE TO ENTER when slippage <= 0.35%, R:R >= 1.5, and price >= VWAP', () => {
    // Entry 1648, Current price 1650 (slippage 0.12%), SL 1625 (Risk 25), Target1 1700 (Reward 50) -> R:R 2.0, VWAP 1645
    const result = evaluateSafeEntry({
      recommendedEntry: 1648,
      currentPrice: 1650,
      stopLoss: 1625,
      target1: 1700,
      vwap: 1645,
    });

    assert.strictEqual(result.safe, true);
    assert.strictEqual(result.status, '✅ SAFE TO ENTER');
    assert.strictEqual(result.stopLoss, 1625);
    assert.strictEqual(result.breakevenTrigger, 1675); // 1650 + 25
    assert.strictEqual(result.bookHalfAt, 1700);
    assert.strictEqual(result.entryZone, '₹1648.00 - ₹1651.30');
  });
});

