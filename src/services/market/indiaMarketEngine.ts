/**
 * Indian Domestic Market & Regime Classification Engine
 *
 * Evaluates 9 core domestic factors:
 * - NIFTY 50 Trend: 20%
 * - BANK NIFTY Trend: 10%
 * - India VIX: 15% (Inverted)
 * - Advance / Decline Ratio: 15%
 * - FII Net Flow: 15%
 * - DII Net Flow: 5%
 * - NIFTY vs VWAP: 10%
 * - NIFTY EMA20 vs EMA50: 5%
 * - Market Traded Volume: 5%
 * Total: 100% (Weight = 1.0)
 *
 * Classifies the active Market Regime:
 * - STRONG_BULL: 80 - 100
 * - BULL: 65 - 79
 * - NEUTRAL: 50 - 64
 * - BEAR: 35 - 49
 * - STRONG_BEAR: 0 - 34
 */

import { SCANNER_CONFIG, type MarketRegimeType } from './scannerConfig.ts';

export interface IndiaMarketInput {
  niftyChangePct?: number;         // e.g. +0.85%
  niftyPrice?: number;
  niftyVwap?: number;
  niftyEma20?: number;
  niftyEma50?: number;
  bankNiftyChangePct?: number;     // e.g. +0.65%
  indiaVix?: number;               // e.g. 13.8 (Normal), 17.5 (Elevated), 22+ (High fear)
  indiaVixChangePct?: number;      // e.g. -2.5%
  advances?: number;               // e.g. 1420
  declines?: number;               // e.g. 680
  fiiNetCrores?: number;           // e.g. +1850 (Inflow) or -2900 (Heavy outflow)
  diiNetCrores?: number;           // e.g. +950
  marketVolumeRatio?: number;      // e.g. 1.2x (Participation intensity)
}

export interface IndiaMarketResult {
  marketScore: number;             // 0 - 100
  regime: MarketRegimeType;
  regimeDescription: string;
  regimeGuidance: string;
  prioritizedStrategies: string[];
  metrics: {
    niftyTrendScore: number;
    bankNiftyScore: number;
    vixScore: number;
    advanceDeclineScore: number;
    fiiFlowScore: number;
    diiFlowScore: number;
    niftyVwapScore: number;
    niftyEmaScore: number;
    volumeScore: number;
  };
  details: {
    isNiftyAboveVwap: boolean;
    isNiftyEmaBullish: boolean;
    advanceDeclineRatio: number;
    fiiSentiment: 'NET_BUYERS' | 'NEUTRAL' | 'NET_SELLERS';
    allowLongBreakouts: boolean;
    allowIntradayShorts: boolean;
  };
}

/**
 * Normalizes Advance/Decline ratio into a 0 - 100 score.
 * A/D >= 2.5: 100; A/D = 1.0: 50; A/D <= 0.4: 0.
 */
function normalizeAdvanceDecline(advances: number, declines: number): number {
  if (advances <= 0 && declines <= 0) return 50;
  const ratio = declines > 0 ? advances / declines : advances > 0 ? 3.0 : 0.2;
  // Map ratio: 0.3 -> 10, 1.0 -> 50, 2.0 -> 85, 3.0+ -> 100
  if (ratio >= 2.5) return 95;
  if (ratio >= 1.8) return 85;
  if (ratio >= 1.3) return 70;
  if (ratio >= 1.0) return 55;
  if (ratio >= 0.7) return 40;
  if (ratio >= 0.4) return 25;
  return 10;
}

/**
 * Normalizes India VIX (0 - 100).
 * Lower India VIX = higher institutional stability and trend continuation.
 */
function normalizeIndiaVix(vix: number, vixChgPct: number): number {
  let score = 50;
  if (vix <= 12.0) score = 95;
  else if (vix <= 14.0) score = 85;
  else if (vix <= 16.0) score = 70;
  else if (vix <= 18.5) score = 50;
  else if (vix <= 22.0) score = 30;
  else score = 10;

  // Intraday VIX softening adds points; VIX surging subtracts points
  const chgAdj = Math.max(Math.min(-vixChgPct * 2.0, 12), -12);
  return Math.max(Math.min(Math.round(score + chgAdj), 100), 0);
}

/**
 * Normalizes FII/DII institutional net flow in ₹ Crores.
 * +₹2,000 Cr = 95; +₹500 Cr = 70; -₹500 Cr = 40; -₹2,000 Cr = 10.
 */
function normalizeFlow(netCrores: number): number {
  if (netCrores >= 2000) return 95;
  if (netCrores >= 1000) return 85;
  if (netCrores >= 300) return 70;
  if (netCrores >= -300) return 50;
  if (netCrores >= -1000) return 35;
  if (netCrores >= -2000) return 20;
  return 10;
}

export function computeIndiaMarketScore(input: IndiaMarketInput = {}): IndiaMarketResult {
  const w = SCANNER_CONFIG.INDIAN_WEIGHTS;

  // 1. NIFTY 50 Trend Score (0 - 100)
  const niftyChg = input.niftyChangePct ?? 0.35;
  const niftyTrendScore = Math.max(Math.min(Math.round(((Math.max(Math.min(niftyChg, 1.5), -1.5) + 1.5) / 3.0) * 100), 100), 0);

  // 2. BANK NIFTY Trend Score (0 - 100)
  const bankNiftyChg = input.bankNiftyChangePct ?? 0.25;
  const bankNiftyScore = Math.max(Math.min(Math.round(((Math.max(Math.min(bankNiftyChg, 1.8), -1.8) + 1.8) / 3.6) * 100), 100), 0);

  // 3. India VIX Score (0 - 100)
  const vixScore = normalizeIndiaVix(input.indiaVix ?? 14.1, input.indiaVixChangePct ?? -1.2);

  // 4. Advance / Decline Score (0 - 100)
  const advances = input.advances ?? 1250;
  const declines = input.declines ?? 750;
  const advanceDeclineScore = normalizeAdvanceDecline(advances, declines);
  const advanceDeclineRatio = declines > 0 ? Number((advances / declines).toFixed(2)) : 1.5;

  // 5. FII & DII Institutional Net Flow Scores (0 - 100)
  const fiiCrores = input.fiiNetCrores ?? 650;
  const diiCrores = input.diiNetCrores ?? 420;
  const fiiFlowScore = normalizeFlow(fiiCrores);
  const diiFlowScore = normalizeFlow(diiCrores);

  // 6. NIFTY VWAP Position (0 - 100)
  const nPrice = input.niftyPrice ?? 24500;
  const nVwap = input.niftyVwap ?? 24450;
  const isNiftyAboveVwap = nPrice >= nVwap;
  const niftyVwapScore = isNiftyAboveVwap ? 85 : 15;

  // 7. NIFTY EMA Alignment (EMA20 vs EMA50)
  const ema20 = input.niftyEma20 ?? 24420;
  const ema50 = input.niftyEma50 ?? 24350;
  const isNiftyEmaBullish = ema20 >= ema50;
  const niftyEmaScore = isNiftyEmaBullish ? 80 : 25;

  // 8. Market Participation Volume (0 - 100)
  const volRatio = input.marketVolumeRatio ?? 1.15;
  const volumeScore = Math.max(Math.min(Math.round(Math.min(volRatio / 1.8, 1.0) * 100), 100), 20);

  // ── COMPOSITE INDIAN MARKET SCORE (0 - 100) ──
  const compositeScore =
    (niftyTrendScore * w.NIFTY_TREND) +
    (bankNiftyScore * w.BANK_NIFTY_TREND) +
    (vixScore * w.INDIA_VIX) +
    (advanceDeclineScore * w.ADVANCE_DECLINE) +
    (fiiFlowScore * w.FII_FLOW) +
    (diiFlowScore * w.DII_FLOW) +
    (niftyVwapScore * w.NIFTY_VWAP) +
    (niftyEmaScore * w.NIFTY_EMA_ALIGNMENT) +
    (volumeScore * w.MARKET_VOLUME);

  const marketScore = Math.max(Math.min(Math.round(compositeScore), 100), 0);

  // ── MARKET REGIME CLASSIFICATION ──
  const r = SCANNER_CONFIG.REGIMES;
  let regime: MarketRegimeType = 'NEUTRAL';
  let regimeDescription = 'Neutral Market Conditions';
  let regimeGuidance = 'Selective high-confluence trades only. Protect capital.';
  let prioritizedStrategies = ['VWAP Reclaim with Volume', 'Selective Strong Stocks'];
  let allowLongBreakouts = true;
  let allowIntradayShorts = false;

  if (marketScore >= r.STRONG_BULL_MIN) {
    regime = 'STRONG_BULL';
    regimeDescription = 'Aggressive Bullish Momentum';
    regimeGuidance = 'Broad institutional participation. Long breakouts, trend-following, and strong sector leaders have highest odds.';
    prioritizedStrategies = ['Long Breakouts', 'VWAP Pullback Buys', 'Sector Leaders', 'High RVOL Runners'];
    allowLongBreakouts = true;
    allowIntradayShorts = false; // Do not fight the strong bull tide
  } else if (marketScore >= r.BULL_MIN) {
    regime = 'BULL';
    regimeDescription = 'Bullish Trend with Moderate Momentum';
    regimeGuidance = 'Favorable environment for Long setups above VWAP. Confirm with sector strength before entering.';
    prioritizedStrategies = ['Long Dip Buys Above VWAP', 'High Conviction Breakouts', 'Leading Sector Stocks'];
    allowLongBreakouts = true;
    allowIntradayShorts = false;
  } else if (marketScore >= r.NEUTRAL_MIN) {
    regime = 'NEUTRAL';
    regimeDescription = 'Range-Bound / Mixed Market Breadth';
    regimeGuidance = 'Index choppy or consolidating. Only trade exceptional individual setups with strong volume confluence.';
    prioritizedStrategies = ['VWAP Bounce Candidates', 'Independent Volume Breakouts', 'Tight Trailing Stop-Loss'];
    allowLongBreakouts = true;
    allowIntradayShorts = true; // Both directions allowed with high selectivity
  } else if (marketScore >= r.BEAR_MIN) {
    regime = 'BEAR';
    regimeDescription = 'Bearish Pressure / Weak Market Breadth';
    regimeGuidance = 'Caution on Buy trades! Long breakouts frequently fail. Prioritize Intraday Short candidates or preserve cash.';
    prioritizedStrategies = ['Short Breakdown Setups', 'VWAP Rejection Shorts', 'Cash Preservation'];
    allowLongBreakouts = false; // SUPPRESS Long breakouts to prevent traps!
    allowIntradayShorts = true;
  } else {
    regime = 'STRONG_BEAR';
    regimeDescription = 'Aggressive Institutional Selling & Panic';
    regimeGuidance = 'Severe market liquidation. Strict NO BUYING rule! Execute only Short candidates in weakest sectors below VWAP.';
    prioritizedStrategies = ['Short Sell Weakest Stocks', 'VWAP Breakdown Shorts', 'High Cash Reserve'];
    allowLongBreakouts = false; // Strict block
    allowIntradayShorts = true;
  }

  const fiiSentiment = fiiCrores >= 300 ? 'NET_BUYERS' : fiiCrores <= -300 ? 'NET_SELLERS' : 'NEUTRAL';

  return {
    marketScore,
    regime,
    regimeDescription,
    regimeGuidance,
    prioritizedStrategies,
    metrics: {
      niftyTrendScore,
      bankNiftyScore,
      vixScore,
      advanceDeclineScore,
      fiiFlowScore,
      diiFlowScore,
      niftyVwapScore,
      niftyEmaScore,
      volumeScore,
    },
    details: {
      isNiftyAboveVwap,
      isNiftyEmaBullish,
      advanceDeclineRatio,
      fiiSentiment,
      allowLongBreakouts,
      allowIntradayShorts,
    },
  };
}
