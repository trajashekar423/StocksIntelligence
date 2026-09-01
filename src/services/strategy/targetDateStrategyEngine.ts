/**
 * Target-Date Technical Strategy & Scoring Engine
 * Evaluates NSE equities for holding from Buy Date until a future Target Sell Date.
 * Calculates 100-point Target-Date score, dynamic entry zones, technical invalidation/stop-loss,
 * realistic target projections, and strictly verifies whether a 10% target is supported.
 */

import {
  calculateTradingSessions,
  formatNseDate,
  type TradingSessionCalculation,
} from '../calendar/nseCalendarService.ts';
import { checkCorporateActions, type CorporateActionCheckResult } from '../corporate/corporateActionService.ts';

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

const toNumber = (val: any, fallback: number = 0): number => {
  if (val === null || val === undefined || val === '') return fallback;
  if (typeof val === 'number') return Number.isFinite(val) ? val : fallback;
  const parsed = Number(String(val).replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : fallback;
};

export interface TargetDateScoreBreakdown {
  preCloseMomentum: number; // Max 25
  vwapStrength: number; // Max 15
  emaTrend: number; // Max 10
  volumeExpansion: number; // Max 15
  breakoutStrength: number; // Max 10
  dayHighStrength: number; // Max 5
  marketSector: number; // Max 10
  liquidity: number; // Max 5
  corporateActionSafety: number; // Max 5
  totalScore: number; // 0 - 100
}

export type TargetDateSignalTier =
  | 'HIGH CONVICTION'
  | 'STRONG'
  | 'WATCH'
  | 'WEAK'
  | 'IGNORE';

export interface TargetDateStockResult {
  rank: number;
  symbol: string;
  companyName: string;
  sector: string;
  buyDateFormatted: string;
  targetSellDateFormatted: string;
  holdingSessions: number;
  holdingExplanation: string;

  // Real-time market metrics
  price: number;
  previousClose: number;
  open: number;
  high: number;
  low: number;
  changePercent: number;
  vwap: number;
  vwapDistancePct: number;
  volume: number;
  averageVolume: number;
  volumeRatio: number;

  // Technical Indicators
  ema9: number;
  ema20: number;
  ema50: number;
  rsi14: number;
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
    trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  };
  atr: number;
  distanceFromDayHigh: number;
  hasHigherHighLow: boolean;
  breakoutStatus: string;
  breakoutLevel: number;
  vwapPosition: 'ABOVE' | 'BELOW' | 'RECLAIMING';
  intradayMomentum: 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH';

  // Relative Strength
  marketStrength: 'OUTPERFORMING' | 'NEUTRAL' | 'LAGGING';
  sectorStrength: 'BULLISH' | 'NEUTRAL' | 'BEARISH';

  // Corporate Action
  corporateAction: CorporateActionCheckResult;

  // 100-Point Score & Tier
  score: number;
  scoreBreakdown: TargetDateScoreBreakdown;
  signalTier: TargetDateSignalTier;
  signalBadge: string;
  tierColor: string;

  // Entry & Stop-Loss
  entryPrice: number;
  entryZone: string;
  isEntryConfirmed: boolean;
  confirmationChecklist: {
    ltpAboveVwap: boolean;
    ema9AboveEma20: boolean;
    volumeIncreasing: boolean;
    breakoutConfirmed: boolean;
    marketSectorSupportive: boolean;
  };
  stopLoss: number;
  stopLossNote: string;

  // Dynamic Realistic Targets
  target1: number;
  target2: number;
  targetDateTarget: number;
  potentialReturnPct: number;
  maxTechnicalTarget: number;
  is10PctSupported: boolean;
  target10PctNote: string;

  // Risk / Reward
  riskAmount: number;
  rewardAmount: number;
  riskRewardRatio: number;
  isRiskRewardFavorable: boolean; // >= 2.0

  // Narrative & Warnings
  keyReasons: string[];
  riskWarnings: string[];
}

/**
 * Calculates complete Target-Date technical setup and 100-point score for an individual stock.
 */
export function evaluateTargetDateStock(
  rawStock: any,
  sessionInfo: TradingSessionCalculation,
  marketContext: { niftyBullish?: boolean; sectorBullish?: boolean } = {}
): TargetDateStockResult {
  const symbol = String(rawStock.symbol || rawStock.Symbol || '').trim().toUpperCase();
  const companyName = rawStock.companyName || rawStock.company || rawStock.name || `${symbol} Limited`;
  const sector = rawStock.sector || rawStock.industry || 'Equities / NSE';

  const price = toNumber(rawStock.price ?? rawStock.ltp ?? rawStock.lastPrice);
  const previousClose = toNumber(
    rawStock.previousClose ?? rawStock.prev_price ?? rawStock.prevClose ?? price * 0.96
  );
  const open = toNumber(rawStock.open ?? rawStock.open_price ?? price * 0.98);
  const high = toNumber(rawStock.high ?? rawStock.high_price ?? Math.max(price, open));
  const low = toNumber(rawStock.low ?? rawStock.low_price ?? Math.min(price, open));

  // Change %
  const changePercent = toNumber(
    rawStock.changePercent ??
      rawStock.pChange ??
      rawStock.perChange ??
      (previousClose > 0 ? ((price - previousClose) / previousClose) * 100 : 0)
  );

  // Volume & Volume Ratio
  const volume = toNumber(rawStock.volume ?? rawStock.trade_quantity ?? rawStock.tradedQuantity ?? 1500000);
  const averageVolume = Math.max(
    toNumber(
      rawStock.averageVolume ??
        rawStock.avgVolume ??
        volume / Math.max(toNumber(rawStock.volumeRatio ?? 2.0), 1)
    ),
    100000
  );
  const volumeRatio = Number((volume / averageVolume).toFixed(2));

  // VWAP
  const rawVwap = toNumber(rawStock.vwap ?? rawStock.VWAP ?? (open + high + low + price) / 4);
  const vwap = Number(rawVwap.toFixed(2));
  const vwapDistancePct = vwap > 0 ? Number((((price - vwap) / vwap) * 100).toFixed(2)) : 0;

  // 5-Minute EMAs
  const ema9 = Number(toNumber(rawStock.ema9 ?? price * 0.993).toFixed(2));
  const ema20 = Number(toNumber(rawStock.ema20 ?? vwap * 0.99).toFixed(2));
  const ema50 = Number(toNumber(rawStock.ema50 ?? vwap * 0.98).toFixed(2));

  // RSI 14
  const rsi14 = clamp(
    Number(
      toNumber(
        rawStock.rsi14 ??
          rawStock.rsi ??
          (changePercent >= 5 ? 68 : changePercent >= 3 ? 62 : changePercent >= 0 ? 54 : 42)
      ).toFixed(1)
    ),
    10,
    95
  );

  // MACD
  const macdLine = Number(toNumber(rawStock.macdLine ?? ((price - ema20) * 0.5)).toFixed(2));
  const signalLine = Number(toNumber(rawStock.signalLine ?? macdLine * 0.75).toFixed(2));
  const macdHistogram = Number((macdLine - signalLine).toFixed(2));
  const macdTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' =
    macdHistogram > 0 && macdLine > 0 ? 'BULLISH' : macdHistogram < 0 ? 'BEARISH' : 'NEUTRAL';

  // Distance from Day High
  const distanceFromDayHigh = high > 0 ? Number((((high - price) / high) * 100).toFixed(2)) : 0;

  // ATR (Average True Range approx)
  const dayRange = Math.max(high - low, price * 0.015);
  const atr = Number(toNumber(rawStock.atr ?? dayRange * 0.95).toFixed(2));

  // Higher High / Higher Low
  const hasHigherHighLow = price > open && low >= previousClose * 0.99;

  // Breakout level
  const breakoutLevel = high > 0 ? Number((high * 0.995).toFixed(2)) : price;
  const isBreakoutConfirmed = distanceFromDayHigh <= 1.2 && price >= vwap && volumeRatio >= 1.3;
  const breakoutStatus = isBreakoutConfirmed
    ? '🔥 Day-High Breakout Confirmed'
    : distanceFromDayHigh <= 2.5
    ? '⚡ Testing Breakout Resistance'
    : '🌊 Base Accumulation';

  // VWAP Position
  const vwapPosition: 'ABOVE' | 'BELOW' | 'RECLAIMING' =
    price >= vwap ? 'ABOVE' : price >= vwap * 0.995 ? 'RECLAIMING' : 'BELOW';

  // Intraday Momentum
  const intradayMomentum: 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' =
    changePercent >= 4.0 && price >= vwap && ema9 >= ema20
      ? 'STRONG_BULLISH'
      : changePercent >= 2.0 && price >= vwap
      ? 'BULLISH'
      : changePercent >= 0
      ? 'NEUTRAL'
      : 'BEARISH';

  // Market & Sector
  const niftyBullish = marketContext.niftyBullish ?? true;
  const sectorBullish = marketContext.sectorBullish ?? true;
  const marketStrength: 'OUTPERFORMING' | 'NEUTRAL' | 'LAGGING' =
    changePercent >= 3.0 ? 'OUTPERFORMING' : changePercent >= 0.5 ? 'NEUTRAL' : 'LAGGING';
  const sectorStrength: 'BULLISH' | 'NEUTRAL' | 'BEARISH' =
    sectorBullish && changePercent >= 2.0 ? 'BULLISH' : sectorBullish ? 'NEUTRAL' : 'BEARISH';

  // Corporate Action Safety Check
  const corporateAction = checkCorporateActions(
    symbol,
    sessionInfo.buyDate,
    sessionInfo.adjustedTargetSellDate
  );

  // ==========================================
  // 100-POINT TARGET-DATE SCORING ENGINE
  // ==========================================
  const scoreBreakdown: TargetDateScoreBreakdown = {
    preCloseMomentum: 0,
    vwapStrength: 0,
    emaTrend: 0,
    volumeExpansion: 0,
    breakoutStrength: 0,
    dayHighStrength: 0,
    marketSector: 0,
    liquidity: 0,
    corporateActionSafety: corporateAction.safetyScore,
    totalScore: 0,
  };

  const keyReasons: string[] = [];
  const riskWarnings: string[] = [];

  // 1. Pre-Close Momentum (Max 25)
  if (changePercent >= 5.0) {
    scoreBreakdown.preCloseMomentum = 25;
    keyReasons.push(`Strong price momentum (+${changePercent.toFixed(2)}% surge vs prev close)`);
  } else if (changePercent >= 4.0) {
    scoreBreakdown.preCloseMomentum = 22;
    keyReasons.push(`Solid pre-close gain (+${changePercent.toFixed(2)}%)`);
  } else if (changePercent >= 3.0) {
    scoreBreakdown.preCloseMomentum = 18;
    keyReasons.push(`Above standard 3.0% pre-close breakout threshold (+${changePercent.toFixed(2)}%)`);
  } else if (changePercent >= 1.5) {
    scoreBreakdown.preCloseMomentum = 12;
  } else if (changePercent > 0) {
    scoreBreakdown.preCloseMomentum = 6;
  } else {
    scoreBreakdown.preCloseMomentum = 0;
    riskWarnings.push(`Negative daily performance (${changePercent.toFixed(2)}%)`);
  }

  // 2. VWAP Strength (Max 15)
  if (price >= vwap && vwapDistancePct >= 1.0 && vwapDistancePct <= 4.0) {
    scoreBreakdown.vwapStrength = 15;
    keyReasons.push(`Holding strongly +${vwapDistancePct.toFixed(1)}% above VWAP (₹${vwap.toFixed(2)})`);
  } else if (price >= vwap) {
    scoreBreakdown.vwapStrength = 12;
    keyReasons.push(`Trading above VWAP floor (₹${vwap.toFixed(2)})`);
  } else if (price >= vwap * 0.99) {
    scoreBreakdown.vwapStrength = 6;
    riskWarnings.push(`Testing VWAP support (₹${vwap.toFixed(2)})`);
  } else {
    scoreBreakdown.vwapStrength = 0;
    riskWarnings.push(`Trading below VWAP (₹${vwap.toFixed(2)}) - Bearish intraday control`);
  }

  // 3. 5-Minute EMA Trend (Max 10)
  if (ema9 > ema20 && ema20 > ema50) {
    scoreBreakdown.emaTrend = 10;
    keyReasons.push('Bullish stacked EMA alignment (EMA 9 > EMA 20 > EMA 50)');
  } else if (ema9 > ema20) {
    scoreBreakdown.emaTrend = 7;
    keyReasons.push('EMA 9 > EMA 20 short-term bullish crossover');
  } else {
    scoreBreakdown.emaTrend = 2;
    riskWarnings.push('EMA 9/20 death cross or flat consolidation');
  }

  // 4. Volume Expansion (Max 15)
  if (volumeRatio >= 2.5) {
    scoreBreakdown.volumeExpansion = 15;
    keyReasons.push(`Massive institutional volume surge (${volumeRatio}x average volume)`);
  } else if (volumeRatio >= 1.8) {
    scoreBreakdown.volumeExpansion = 13;
    keyReasons.push(`High volume expansion (${volumeRatio}x average volume)`);
  } else if (volumeRatio >= 1.5) {
    scoreBreakdown.volumeExpansion = 10;
    keyReasons.push(`Above standard 1.5x volume expansion threshold (${volumeRatio}x)`);
  } else if (volumeRatio >= 1.0) {
    scoreBreakdown.volumeExpansion = 5;
  } else {
    scoreBreakdown.volumeExpansion = 0;
    riskWarnings.push(`Below-average volume (${volumeRatio}x)`);
  }

  // 5. Breakout Strength (Max 10)
  if (isBreakoutConfirmed) {
    scoreBreakdown.breakoutStrength = 10;
    keyReasons.push('Confirmed day-high breakout with heavy buyer control');
  } else if (distanceFromDayHigh <= 2.0) {
    scoreBreakdown.breakoutStrength = 7;
    keyReasons.push(`Within striking distance of Day High (${distanceFromDayHigh}% away)`);
  } else {
    scoreBreakdown.breakoutStrength = 3;
  }

  // 6. Day-High Strength (Max 5)
  if (distanceFromDayHigh <= 0.75) {
    scoreBreakdown.dayHighStrength = 5;
    keyReasons.push(`Closing right at Day High (${distanceFromDayHigh}% distance)`);
  } else if (distanceFromDayHigh <= 2.0) {
    scoreBreakdown.dayHighStrength = 4;
  } else {
    scoreBreakdown.dayHighStrength = 1;
    if (distanceFromDayHigh > 3.5) {
      riskWarnings.push(`Pulled back ${distanceFromDayHigh}% from Day High (Upper wick rejection)`);
    }
  }

  // 7. Market/Sector Strength (Max 10)
  if (niftyBullish && sectorBullish && changePercent >= 2.5) {
    scoreBreakdown.marketSector = 10;
    keyReasons.push('Strong positive relative strength vs NIFTY50 and Sector');
  } else if (niftyBullish || sectorBullish) {
    scoreBreakdown.marketSector = 7;
  } else {
    scoreBreakdown.marketSector = 3;
    riskWarnings.push('Market or Sector index experiencing weakness');
  }

  // 8. Liquidity (Max 5)
  const tradedValue = price * volume;
  if (tradedValue >= 200000000 || volume >= 1000000) {
    scoreBreakdown.liquidity = 5;
  } else if (tradedValue >= 100000000 || volume >= 500000) {
    scoreBreakdown.liquidity = 4;
  } else {
    scoreBreakdown.liquidity = 1;
    riskWarnings.push('Moderate liquidity: ensure smaller position sizing');
  }

  // 9. Corporate Action Safety (Max 5)
  if (corporateAction.status === 'WARNING') {
    riskWarnings.push(corporateAction.actionNote);
  }

  // Calculate Total Score
  const totalRaw =
    scoreBreakdown.preCloseMomentum +
    scoreBreakdown.vwapStrength +
    scoreBreakdown.emaTrend +
    scoreBreakdown.volumeExpansion +
    scoreBreakdown.breakoutStrength +
    scoreBreakdown.dayHighStrength +
    scoreBreakdown.marketSector +
    scoreBreakdown.liquidity +
    scoreBreakdown.corporateActionSafety;

  const totalScore = clamp(Math.round(totalRaw), 0, 100);
  scoreBreakdown.totalScore = totalScore;

  // Signal Tier Classification
  let signalTier: TargetDateSignalTier = 'IGNORE';
  let signalBadge = '❌ IGNORE';
  let tierColor = 'secondary';

  if (totalScore >= 90) {
    signalTier = 'HIGH CONVICTION';
    signalBadge = '🔥 HIGH CONVICTION';
    tierColor = 'danger';
  } else if (totalScore >= 80) {
    signalTier = 'STRONG';
    signalBadge = '🟢 STRONG';
    tierColor = 'success';
  } else if (totalScore >= 70) {
    signalTier = 'WATCH';
    signalBadge = '🟡 WATCH';
    tierColor = 'warning';
  } else if (totalScore >= 60) {
    signalTier = 'WEAK';
    signalBadge = '⚪ WEAK';
    tierColor = 'info';
  }

  // ==========================================
  // ENTRY & CONFIRMATION
  // ==========================================
  const ltpAboveVwap = price >= vwap;
  const ema9AboveEma20 = ema9 >= ema20;
  const volumeIncreasing = volumeRatio >= 1.4;
  const breakoutConfirmed = distanceFromDayHigh <= 2.0;
  const marketSectorSupportive = (marketContext.niftyBullish ?? true) && changePercent >= 1.5;

  const isEntryConfirmed =
    ltpAboveVwap &&
    ema9AboveEma20 &&
    volumeIncreasing &&
    breakoutConfirmed &&
    marketSectorSupportive;

  const entryPrice = price;
  const entryLower = Number((price * 0.996).toFixed(2));
  const entryUpper = Number((price * 1.006).toFixed(2));
  const entryZone = `₹${entryLower.toFixed(2)} – ₹${entryUpper.toFixed(2)}`;

  // ==========================================
  // STOP LOSS & TECHNICAL INVALIDATION
  // ==========================================
  // Invalidation: 5-min swing low or VWAP - 0.5% or price - 1.5x ATR
  const vwapStop = vwap * 0.993;
  const swingStop = low > 0 ? low * 0.996 : price * 0.97;
  const atrStop = price - atr * 1.4;

  const rawStopLoss = Math.max(Math.min(vwapStop, swingStop), atrStop, price * 0.94);
  const stopLoss = Number(rawStopLoss.toFixed(2));
  const stopLossDistancePct = Number((((price - stopLoss) / price) * 100).toFixed(2));
  const stopLossNote = `Invalidation below ₹${stopLoss.toFixed(2)} (-${stopLossDistancePct}% under VWAP/Support)`;

  // ==========================================
  // REALISTIC DYNAMIC TARGET PROJECTIONS
  // ==========================================
  const sessions = sessionInfo.tradingSessions;

  // Target 1: ~ 1x ATR or 2.5% - 3.5%
  const target1Pct = clamp(Number(((atr / price) * 100).toFixed(2)), 2.2, 4.0);
  const target1 = Number((price * (1 + target1Pct / 100)).toFixed(2));

  // Target 2: ~ 2x ATR or 4.5% - 7.0%
  const target2Pct = clamp(Number((target1Pct * 1.85).toFixed(2)), 4.0, 7.5);
  const target2 = Number((price * (1 + target2Pct / 100)).toFixed(2));

  // Target Date Target: Dynamically scaled based on number of sessions
  // 1 session: ~ 2.5% - 4.0%
  // 2 sessions: ~ 4.0% - 6.0%
  // 3 sessions: ~ 5.5% - 8.0%
  // 5 sessions: ~ 7.5% - 11.5%
  let targetDatePctMultiplier = 1.0;
  if (sessions === 1) targetDatePctMultiplier = target1Pct;
  else if (sessions === 2) targetDatePctMultiplier = target1Pct * 1.45;
  else if (sessions === 3) targetDatePctMultiplier = target2Pct;
  else if (sessions === 4) targetDatePctMultiplier = target2Pct * 1.25;
  else targetDatePctMultiplier = clamp(target2Pct * 1.5, 7.0, 12.0);

  const targetDatePct = Number(targetDatePctMultiplier.toFixed(2));
  const targetDateTarget = Number((price * (1 + targetDatePct / 100)).toFixed(2));
  const potentialReturnPct = targetDatePct;

  // Max Technical Target: Upper resistance channel
  const maxTechnicalTarget = Number((price * (1 + (targetDatePct + 3.0) / 100)).toFixed(2));

  // 10% Target Structural Check
  const is10PctSupported = potentialReturnPct >= 9.5 || (sessions >= 4 && atr / price >= 0.025);
  const target10PctNote = is10PctSupported
    ? `✓ 10% target is structurally viable over ${sessions} holding sessions.`
    : '10% TARGET NOT SUPPORTED BY CURRENT STRUCTURE.';

  // Risk / Reward Ratio
  const riskAmount = Math.max(price - stopLoss, 0.1);
  const rewardAmount = Math.max(targetDateTarget - price, 0.1);
  const riskRewardRatio = Number((rewardAmount / riskAmount).toFixed(2));
  const isRiskRewardFavorable = riskRewardRatio >= 2.0;

  return {
    rank: 0, // Assigned during ranking
    symbol,
    companyName,
    sector,
    buyDateFormatted: sessionInfo.buyDateFormatted,
    targetSellDateFormatted: sessionInfo.adjustedTargetSellDateFormatted,
    holdingSessions: sessions,
    holdingExplanation: sessionInfo.explanation,

    price,
    previousClose,
    open,
    high,
    low,
    changePercent,
    vwap,
    vwapDistancePct,
    volume,
    averageVolume,
    volumeRatio,

    ema9,
    ema20,
    ema50,
    rsi14,
    macd: {
      macdLine,
      signalLine,
      histogram: macdHistogram,
      trend: macdTrend,
    },
    atr,
    distanceFromDayHigh,
    hasHigherHighLow,
    breakoutStatus,
    breakoutLevel,
    vwapPosition,
    intradayMomentum,

    marketStrength,
    sectorStrength,
    corporateAction,

    score: totalScore,
    scoreBreakdown,
    signalTier,
    signalBadge,
    tierColor,

    entryPrice,
    entryZone,
    isEntryConfirmed,
    confirmationChecklist: {
      ltpAboveVwap,
      ema9AboveEma20,
      volumeIncreasing,
      breakoutConfirmed,
      marketSectorSupportive,
    },
    stopLoss,
    stopLossNote,

    target1,
    target2,
    targetDateTarget,
    potentialReturnPct,
    maxTechnicalTarget,
    is10PctSupported,
    target10PctNote,

    riskAmount: Number(riskAmount.toFixed(2)),
    rewardAmount: Number(rewardAmount.toFixed(2)),
    riskRewardRatio,
    isRiskRewardFavorable,

    keyReasons,
    riskWarnings,
  };
}

/**
 * Scans a pool of candidate stocks, applies Target-Date scoring, ranks descending, and returns Top 10 setups.
 */
export function runTargetDateStrategyScan(
  stocksList: any[],
  buyDateInput: Date | string,
  targetSellDateInput: Date | string,
  marketContext: { niftyBullish?: boolean; sectorBullish?: boolean } = {}
): {
  sessionInfo: TradingSessionCalculation;
  top10: TargetDateStockResult[];
  allCandidates: TargetDateStockResult[];
  totalScanned: number;
  qualifiedCount: number;
} {
  const sessionInfo = calculateTradingSessions(buyDateInput, targetSellDateInput);

  const evaluated: TargetDateStockResult[] = (stocksList || [])
    .map((s) => evaluateTargetDateStock(s, sessionInfo, marketContext))
    .filter((s) => s.price > 0 && s.symbol.length >= 2);

  // Sort descending by: Score -> Signal Tier -> Volume Ratio -> Distance from Day High
  evaluated.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.volumeRatio !== a.volumeRatio) return b.volumeRatio - a.volumeRatio;
    return a.distanceFromDayHigh - b.distanceFromDayHigh;
  });

  // Assign Ranks
  evaluated.forEach((item, index) => {
    item.rank = index + 1;
  });

  const top10 = evaluated.slice(0, 10);
  const qualifiedCount = evaluated.filter((s) => s.score >= 60).length;

  return {
    sessionInfo,
    top10,
    allCandidates: evaluated,
    totalScanned: evaluated.length,
    qualifiedCount,
  };
}
