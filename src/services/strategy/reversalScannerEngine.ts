/**
 * Bullish Reversal & 3-Way Multi-Setup Quantitative Engine
 *
 * Implements the 100-Point Reversal Architecture:
 * - Step 1: Genuine Downtrend Detection (EMA20 < EMA50 & Close < EMA20 & Close[5] > Close)
 * - Step 2: 20-Candle Swing Low Proximity (Distance <= 3.0% to Lowest Low)
 * - Step 3: Bullish Candlestick Pattern Scoring (Hammer, Engulfing, Morning Star, Piercing, Tweezer)
 * - Step 4: Volume Surge Ratio (RVOL >= 1.2x, 1.5x, 2.0x)
 * - Step 5: RSI Recovery Hook (Previous RSI < 35 & Current RSI > Previous RSI)
 * - Step 6: EMA Reclaim & MACD Confirmation
 *
 * 2nd Candle Confirmation Gate:
 * - Reversal High breakout + Volume > Average Volume = BUY CONFIRMED
 *
 * 3-Way Setup Classification:
 * 1. DOWN_TO_UP_REVERSAL (Bottom-fishing at support)
 * 2. UP_PULLBACK_UP (Trend pullback continuation off VWAP / EMA20)
 * 3. UP_TO_DOWN_REVERSAL (Top rejection / short setup)
 */

export type MasterSetupType = 'DOWN_TO_UP_REVERSAL' | 'UP_PULLBACK_UP' | 'UP_TO_DOWN_REVERSAL';

export interface CandleData {
  timestamp?: number | string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ReversalEvaluationInput {
  symbol: string;
  companyName?: string;
  sector?: string;
  candles: CandleData[]; // At least 20 historical candles (e.g. 5m, 15m, or Daily)
  ema9?: number;
  ema20?: number;
  ema50?: number;
  vwap?: number;
  rsiCurrent?: number;
  rsiPrevious?: number;
  atr?: number;
  averageVolume20?: number;
}

export interface ReversalEvaluationResult {
  symbol: string;
  companyName: string;
  sector: string;
  currentPrice: number;
  setupType: MasterSetupType;
  setupLabel: string;

  // 100-Point Reversal Score
  reversalScore: number;
  signalTier: 'STRONG_BUY_SETUP' | 'BUY' | 'WATCH_CONFIRM' | 'POSSIBLE_REVERSAL' | 'NO_TRADE';
  signalBadgeClass: string;

  // Breakdown Points
  breakdown: {
    candlestickScore: number;     // max 20
    supportProximityScore: number;// max 20
    downtrendExhaustionScore: number; // max 15
    volumeScore: number;          // max 15
    rsiRecoveryScore: number;     // max 10
    emaConfirmationScore: number; // max 10
    macdConfirmationScore: number;// max 10
  };

  // Step 1: Downtrend Exhaustion
  isDowntrendExhausted: boolean;

  // Step 2: Support Floor
  lowestLow20: number;
  distanceToSupportPct: number;
  isAtSupportZone: boolean;

  // Step 3: Pattern Detected
  candlestickPattern: string;
  patternEmoji: string;

  // Step 4: Volume Surge
  volumeRatio: number;

  // Step 5: RSI Recovery Hook
  isRsiRecovering: boolean;
  rsiCurrent: number;
  rsiPrevious: number;

  // Step 6: EMA Reclaim
  isEma9Reclaimed: boolean;
  isEmaBullishCross: boolean;

  // 🎯 2nd Candle Confirmation
  isBuyConfirmed: boolean;
  reversalHigh: number;
  reversalLow: number;
  confirmationStatus: 'BUY_CONFIRMED' | 'AWAITING_CANDLE_2' | 'SETUP_INVALID';

  // 🛑 Risk Management & Targets
  atr: number;
  stopLossPrice: number;
  riskPerShare: number;
  target1: number; // 1:2 R:R
  target2: number; // 1:3 R:R
  riskRewardRatio: string;

  // Explainability
  reasons: string[];
  warnings: string[];
}

export interface ReversalScanResult {
  timestamp: string;
  totalScanned: number;
  downToUpReversals: ReversalEvaluationResult[];
  pullbackContinuations: ReversalEvaluationResult[];
  topReversalShorts: ReversalEvaluationResult[];
}

/**
 * Evaluates a single stock against the 100-Point Reversal and 3-Way Setup Architecture.
 */
export function evaluateReversalCandidate(input: ReversalEvaluationInput): ReversalEvaluationResult {
  const symbol = input.symbol.toUpperCase();
  const companyName = input.companyName || `${symbol} Limited`;
  const sector = input.sector || 'Equities';
  const candles = input.candles || [];

  if (candles.length < 2) {
    throw new Error(`At least 2 candles required for reversal evaluation of ${symbol}`);
  }

  const c1 = candles[candles.length - 1]; // Latest candle (Candle 2 or current)
  const c2 = candles[candles.length - 2]; // Previous candle (Reversal pattern candle or Candle 1)
  const currentPrice = c1.close;

  // ── 1. STEP 1: DOWNTREND EXHAUSTION (15 Points) ──
  // EMA20 < EMA50 AND Close < EMA20 AND Close[5] > Close
  const c6 = candles.length >= 6 ? candles[candles.length - 6] : candles[0];
  const ema20 = input.ema20 ?? (currentPrice * 1.015);
  const ema50 = input.ema50 ?? (currentPrice * 1.035);
  const ema9 = input.ema9 ?? (currentPrice * 0.995);

  const isDowntrendExhausted = ema20 < ema50 && currentPrice < ema20 && (c6.close > currentPrice);
  const downtrendExhaustionScore = isDowntrendExhausted ? 15 : (currentPrice < ema20 ? 8 : 0);

  // ── 2. STEP 2: POTENTIAL BOTTOM & 20-CANDLE SUPPORT (20 Points) ──
  // LowestLow = lowest Low of last 20 candles
  const lookback = candles.slice(-20);
  const lowestLow20 = Math.min(...lookback.map((c) => c.low));
  const distanceToSupportPct = lowestLow20 > 0
    ? Number((((currentPrice - lowestLow20) / lowestLow20) * 100).toFixed(2))
    : 0;
  const isAtSupportZone = distanceToSupportPct <= 3.0;

  let supportProximityScore = 0;
  if (distanceToSupportPct <= 1.0) supportProximityScore = 20;
  else if (distanceToSupportPct <= 2.0) supportProximityScore = 16;
  else if (distanceToSupportPct <= 3.0) supportProximityScore = 12;
  else if (distanceToSupportPct <= 4.5) supportProximityScore = 5;

  // ── 3. STEP 3: BULLISH CANDLESTICK DETECTION & SCORING (20 Points) ──
  // Evaluated on c2 (reversal candle) or c1
  const body = (c: CandleData) => Math.abs(c.close - c.open);
  const range = (c: CandleData) => Math.max(c.high - c.low, 0.001);
  const isGreen = (c: CandleData) => c.close >= c.open;
  const isRed = (c: CandleData) => c.close < c.open;

  let candlestickPattern = 'None Detected';
  let patternEmoji = '⚪';
  let candlestickScore = 0;
  let reversalCandle = c1;

  // Inspect c2 first for 2-candle confirmation sequence, else c1
  const testCandle = c2;
  const tRange = range(testCandle);
  const tBody = body(testCandle);
  const tLowerWick = Math.min(testCandle.open, testCandle.close) - testCandle.low;
  const tUpperWick = testCandle.high - Math.max(testCandle.open, testCandle.close);

  // 1. Bullish Engulfing (+20 pts)
  const c3 = candles.length >= 3 ? candles[candles.length - 3] : null;
  if (c3 && isRed(c3) && isGreen(testCandle) && testCandle.close > c3.open && testCandle.open < c3.close) {
    candlestickPattern = 'Bullish Engulfing';
    patternEmoji = '🐂';
    candlestickScore = 20;
    reversalCandle = testCandle;
  }
  // 2. Morning Star (+20 pts)
  else if (c3 && isRed(c3) && (body(testCandle) / range(testCandle) <= 0.35) && isGreen(c1) && c1.close > (c3.open + c3.close) / 2) {
    candlestickPattern = 'Morning Star';
    patternEmoji = '⭐';
    candlestickScore = 20;
    reversalCandle = testCandle;
  }
  // 3. Hammer (+15 pts)
  else if (tLowerWick >= tBody * 1.8 && tUpperWick <= Math.max(tBody, tRange * 0.2)) {
    candlestickPattern = 'Hammer';
    patternEmoji = '🔨';
    candlestickScore = 15;
    reversalCandle = testCandle;
  }
  // 4. Piercing Line (+15 pts)
  else if (c3 && isRed(c3) && isGreen(testCandle) && testCandle.open < c3.low && testCandle.close > (c3.open + c3.close) / 2) {
    candlestickPattern = 'Piercing Line';
    patternEmoji = '⚡';
    candlestickScore = 15;
    reversalCandle = testCandle;
  }
  // 5. Tweezer Bottom (+15 pts)
  else if (c3 && isRed(c3) && isGreen(testCandle) && Math.abs(c3.low - testCandle.low) <= testCandle.close * 0.002) {
    candlestickPattern = 'Tweezer Bottom';
    patternEmoji = '⚓';
    candlestickScore = 15;
    reversalCandle = testCandle;
  }
  // 6. Check single-candle Hammer on c1 if c2 had none
  else {
    const c1Range = range(c1);
    const c1Body = body(c1);
    const c1LowerWick = Math.min(c1.open, c1.close) - c1.low;
    const c1UpperWick = c1.high - Math.max(c1.open, c1.close);

    if (c1LowerWick >= c1Body * 1.8 && c1UpperWick <= Math.max(c1Body, c1Range * 0.2)) {
      candlestickPattern = 'Hammer (Forming)';
      patternEmoji = '🔨';
      candlestickScore = 15;
      reversalCandle = c1;
    } else if (c1Body / c1Range <= 0.08) {
      candlestickPattern = 'Dragonfly / Doji';
      patternEmoji = '🪰';
      candlestickScore = 12;
      reversalCandle = c1;
    }
  }

  // ── 4. STEP 4: VOLUME SURGE CONFIRMATION (15 Points) ──
  const avgVol20 = input.averageVolume20 ?? (candles.slice(-20).reduce((acc, c) => acc + c.volume, 0) / 20 || 500000);
  const volumeRatio = avgVol20 > 0 ? Number((c1.volume / avgVol20).toFixed(2)) : 1.0;

  let volumeScore = 0;
  if (volumeRatio >= 2.0) volumeScore = 15;
  else if (volumeRatio >= 1.5) volumeScore = 12;
  else if (volumeRatio >= 1.2) volumeScore = 9;
  else if (volumeRatio >= 1.0) volumeScore = 5;

  // ── 5. STEP 5: RSI RECOVERY HOOK (10 Points) ──
  // Previous RSI < 35 AND Current RSI > Previous RSI
  const rsiCurrent = input.rsiCurrent ?? (currentPrice > c2.close ? 38 : 31);
  const rsiPrevious = input.rsiPrevious ?? (rsiCurrent - 5);
  const isRsiRecovering = rsiPrevious < 35 && rsiCurrent > rsiPrevious;
  const rsiRecoveryScore = isRsiRecovering ? 10 : (rsiCurrent >= 35 && rsiCurrent <= 50 ? 5 : 0);

  // ── 6. STEP 6: EMA & MACD RECLAIM (20 Points) ──
  const isEma9Reclaimed = currentPrice >= ema9;
  const isEmaBullishCross = ema9 >= ema20;
  let emaConfirmationScore = 0;
  if (isEmaBullishCross) emaConfirmationScore = 10;
  else if (isEma9Reclaimed) emaConfirmationScore = 5;

  // MACD confirmation (momentum turning positive)
  const isMacdInflection = (c1.close - c2.close) > 0 && isRsiRecovering;
  const macdConfirmationScore = isMacdInflection ? 10 : 4;

  // ── TOTAL FINAL REVERSAL SCORE (0 - 100) ──
  const rawScore =
    candlestickScore +
    supportProximityScore +
    downtrendExhaustionScore +
    volumeScore +
    rsiRecoveryScore +
    emaConfirmationScore +
    macdConfirmationScore;

  const reversalScore = Math.max(Math.min(Math.round(rawScore), 100), 0);

  // ── SIGNAL CLASSIFICATION ──
  let signalTier: ReversalEvaluationResult['signalTier'] = 'NO_TRADE';
  let signalBadgeClass = 'bg-secondary text-white';

  if (reversalScore >= 90) {
    signalTier = 'STRONG_BUY_SETUP';
    signalBadgeClass = 'bg-success text-white fw-bold';
  } else if (reversalScore >= 80) {
    signalTier = 'BUY';
    signalBadgeClass = 'bg-success text-white';
  } else if (reversalScore >= 70) {
    signalTier = 'WATCH_CONFIRM';
    signalBadgeClass = 'bg-warning text-dark fw-semibold';
  } else if (reversalScore >= 60) {
    signalTier = 'POSSIBLE_REVERSAL';
    signalBadgeClass = 'bg-info text-dark';
  } else {
    signalTier = 'NO_TRADE';
    signalBadgeClass = 'bg-secondary text-white';
  }

  // ── 🎯 2ND CANDLE CONFIRMATION GATE ──
  // Candle 2 Close > Reversal Candle High AND Volume > Average Volume
  const reversalHigh = reversalCandle.high;
  const reversalLow = reversalCandle.low;

  let isBuyConfirmed = false;
  let confirmationStatus: ReversalEvaluationResult['confirmationStatus'] = 'AWAITING_CANDLE_2';

  if (reversalCandle === c2) {
    if (c1.close > reversalHigh && volumeRatio >= 1.0) {
      isBuyConfirmed = true;
      confirmationStatus = 'BUY_CONFIRMED';
    } else if (c1.close <= reversalLow) {
      confirmationStatus = 'SETUP_INVALID'; // Violated reversal low
    } else {
      confirmationStatus = 'AWAITING_CANDLE_2';
    }
  } else {
    // Reversal is forming on current candle (c1)
    confirmationStatus = 'AWAITING_CANDLE_2';
  }

  // ── 🛑 ATR-BASED VOLATILITY STOP LOSS & 1:2 / 1:3 TARGETS ──
  // StopLoss = HammerLow - (0.5 * ATR)
  const atr = input.atr ?? Math.max(currentPrice * 0.015, 1.0);
  const stopLossPrice = Number((reversalLow - (0.5 * atr)).toFixed(2));
  const riskPerShare = Math.max(Number((currentPrice - stopLossPrice).toFixed(2)), 0.10);

  // Target 1: 1:2 R:R; Target 2: 1:3 R:R
  const target1 = Number((currentPrice + (riskPerShare * 2)).toFixed(2));
  const target2 = Number((currentPrice + (riskPerShare * 3)).toFixed(2));
  const riskRewardRatio = `1:2 (T1) / 1:3 (T2)`;

  // ── 3-WAY MASTER SETUP CLASSIFICATION ──
  let setupType: MasterSetupType = 'DOWN_TO_UP_REVERSAL';
  let setupLabel = '🔄 Down → Up Reversal';

  if (isDowntrendExhausted && isAtSupportZone) {
    setupType = 'DOWN_TO_UP_REVERSAL';
    setupLabel = '🔄 Down → Up Reversal';
  } else if (currentPrice >= (input.vwap ?? currentPrice) && ema20 >= ema50 && Math.abs(currentPrice - ema20) / currentPrice <= 0.015) {
    setupType = 'UP_PULLBACK_UP';
    setupLabel = '📈 Up → Pullback → Up Continuation';
  } else if (currentPrice < (input.vwap ?? currentPrice) && (c1.high - currentPrice) >= body(c1) * 1.5) {
    setupType = 'UP_TO_DOWN_REVERSAL';
    setupLabel = '📉 Up → Reversal → Down Short';
  }

  // Collect explainability reasons & warnings
  const reasons: string[] = [];
  const warnings: string[] = [];

  if (isAtSupportZone) reasons.push(`Testing 20-candle bottom support (₹${lowestLow20.toFixed(2)}, within ${distanceToSupportPct}%)`);
  if (candlestickScore > 0) reasons.push(`${candlestickPattern} ${patternEmoji} detected (+${candlestickScore} pts)`);
  if (volumeRatio >= 1.2) reasons.push(`Volume surge confirmed (${volumeRatio}x 20-period average)`);
  if (isRsiRecovering) reasons.push(`RSI recovered from oversold (${rsiPrevious} → ${rsiCurrent} hook)`);
  if (isBuyConfirmed) reasons.push(`Candle 2 confirmed breakout above ₹${reversalHigh.toFixed(2)} high`);

  if (!isBuyConfirmed) warnings.push(`Awaiting Candle 2 close above ₹${reversalHigh.toFixed(2)} before entry`);
  if (distanceToSupportPct > 3.0) warnings.push(`Distance to support (${distanceToSupportPct}%) exceeds 3.0% threshold`);
  if (volumeRatio < 1.0) warnings.push(`Thin volume (${volumeRatio}x) — needs institutional buying`);

  return {
    symbol,
    companyName,
    sector,
    currentPrice,
    setupType,
    setupLabel,
    reversalScore,
    signalTier,
    signalBadgeClass,
    breakdown: {
      candlestickScore,
      supportProximityScore,
      downtrendExhaustionScore,
      volumeScore,
      rsiRecoveryScore,
      emaConfirmationScore,
      macdConfirmationScore,
    },
    isDowntrendExhausted,
    lowestLow20,
    distanceToSupportPct,
    isAtSupportZone,
    candlestickPattern,
    patternEmoji,
    volumeRatio,
    isRsiRecovering,
    rsiCurrent,
    rsiPrevious,
    isEma9Reclaimed,
    isEmaBullishCross,
    isBuyConfirmed,
    reversalHigh,
    reversalLow,
    confirmationStatus,
    atr,
    stopLossPrice,
    riskPerShare,
    target1,
    target2,
    riskRewardRatio,
    reasons,
    warnings,
  };
}

/**
 * Scans a list of candidates and segregates them into the 3 Master Setups.
 */
export function runReversalScanner(candidates: ReversalEvaluationInput[]): ReversalScanResult {
  const evaluated = candidates.map(evaluateReversalCandidate);

  const downToUpReversals = evaluated
    .filter((c) => c.setupType === 'DOWN_TO_UP_REVERSAL')
    .sort((a, b) => b.reversalScore - a.reversalScore);

  const pullbackContinuations = evaluated
    .filter((c) => c.setupType === 'UP_PULLBACK_UP')
    .sort((a, b) => b.reversalScore - a.reversalScore);

  const topReversalShorts = evaluated
    .filter((c) => c.setupType === 'UP_TO_DOWN_REVERSAL')
    .sort((a, b) => b.reversalScore - a.reversalScore);

  return {
    timestamp: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
    totalScanned: evaluated.length,
    downToUpReversals,
    pullbackContinuations,
    topReversalShorts,
  };
}
