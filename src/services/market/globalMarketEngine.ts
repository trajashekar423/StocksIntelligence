/**
 * Global Market Scoring Engine
 *
 * Normalizes 10 global macro components (0 - 100) before applying quantitative weights:
 * - GIFT Nifty: 25%
 * - S&P 500: 15%
 * - Nasdaq: 10%
 * - US VIX: 10% (Inverted)
 * - US 10Y Yield: 10% (Inverted)
 * - Nikkei 225: 5%
 * - Hang Seng: 5%
 * - Shanghai Composite: 5%
 * - USD/INR: 5% (Inverted)
 * - Brent Crude: 5% (Inverted)
 * Total: 100% (Weight = 1.0)
 */

import { SCANNER_CONFIG } from './scannerConfig.ts';

export interface GlobalMarketInput {
  giftNiftyChangePct?: number;   // e.g. +0.45% or -0.80%
  sp500ChangePct?: number;       // e.g. +0.60%
  nasdaqChangePct?: number;      // e.g. +0.75%
  usVix?: number;                // e.g. 13.5 (Normal), 22.0 (Fear)
  usVixChangePct?: number;       // e.g. -3.2%
  us10YRate?: number;            // e.g. 4.15%
  us10YChangeBps?: number;       // e.g. +2 bps
  nikkeiChangePct?: number;      // e.g. +0.5%
  hangSengChangePct?: number;    // e.g. -0.2%
  shanghaiChangePct?: number;    // e.g. +0.1%
  usdInrChangePct?: number;      // e.g. -0.05%
  brentCrudePrice?: number;      // e.g. 78.5 $/bbl
  brentCrudeChangePct?: number;  // e.g. -1.2%
}

export interface GlobalMarketResult {
  globalScore: number;           // 0 - 100
  sentiment: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
  metrics: {
    giftNiftyScore: number;
    sp500Score: number;
    nasdaqScore: number;
    usVixScore: number;
    us10YScore: number;
    nikkeiScore: number;
    hangSengScore: number;
    shanghaiScore: number;
    usdInrScore: number;
    brentCrudeScore: number;
  };
  macroFactors: {
    isGiftNiftyPositive: boolean;
    isUsMarketBullish: boolean;
    isVixCalm: boolean;
    isCrudeBenign: boolean;
  };
  summary: string;
}

/**
 * Normalizes an equity index percent change into a 0 - 100 score.
 * -1.5% or worse = 0; 0% = 50; +1.5% or better = 100.
 */
function normalizeEquityIndex(chgPct: number): number {
  const bounded = Math.max(Math.min(chgPct, 1.5), -1.5);
  // Map [-1.5, +1.5] -> [0, 100]
  return Math.round(((bounded + 1.5) / 3.0) * 100);
}

/**
 * Normalizes US VIX (0 - 100).
 * Lower VIX is bullish for equity risk assets.
 * VIX <= 12 -> 95; VIX = 15 -> 70; VIX = 20 -> 45; VIX >= 30 -> 10.
 */
function normalizeUsVix(vix: number, vixChgPct: number = 0): number {
  let baseScore = 50;
  if (vix <= 12) baseScore = 95;
  else if (vix <= 14) baseScore = 85;
  else if (vix <= 17) baseScore = 70;
  else if (vix <= 20) baseScore = 55;
  else if (vix <= 25) baseScore = 35;
  else baseScore = 15;

  // Modulate with intraday direction (-5% chg is bullish, +5% chg is bearish)
  const dirAdj = Math.max(Math.min(-vixChgPct * 1.5, 10), -10);
  return Math.max(Math.min(Math.round(baseScore + dirAdj), 100), 0);
}

/**
 * Normalizes USD/INR (0 - 100).
 * Rupee appreciation / stability (chg <= 0) is bullish for FII inflows.
 * Sharp Rupee depreciation (chg >= +0.35%) is bearish.
 */
function normalizeUsdInr(chgPct: number): number {
  if (chgPct <= -0.20) return 90; // Rupee strengthening
  if (chgPct <= 0.0) return 75;   // Stable
  if (chgPct <= 0.20) return 50;  // Mild depreciation
  if (chgPct <= 0.40) return 30;  // Moderate depreciation
  return 15;                      // Sharp depreciation shock
}

/**
 * Normalizes Brent Crude Oil (0 - 100).
 * Lower / falling crude is a major positive for India's trade deficit and inflation.
 * Crude spiking (+2% or above $90) is negative.
 */
function normalizeBrentCrude(price: number, chgPct: number): number {
  let score = 50;
  if (price < 75) score += 20;
  else if (price > 90) score -= 25;

  if (chgPct <= -1.5) score += 20;
  else if (chgPct >= 2.0) score -= 25;
  else if (chgPct < 0) score += 10;

  return Math.max(Math.min(Math.round(score), 100), 0);
}

/**
 * Normalizes US 10-Year Treasury Yield (0 - 100).
 * Rising US yields trigger capital flight from emerging markets like India.
 */
function normalizeUs10Y(bpsChange: number): number {
  // -5 bps = bullish (80), 0 bps = neutral (55), +5 bps = bearish (30)
  const boundedBps = Math.max(Math.min(bpsChange, 8), -8);
  return Math.round(55 - (boundedBps * 4.5));
}

export function computeGlobalMarketScore(input: GlobalMarketInput = {}): GlobalMarketResult {
  const w = SCANNER_CONFIG.GLOBAL_WEIGHTS;

  // 1. Compute Individual Normalized Scores (0 - 100)
  const giftNiftyScore = normalizeEquityIndex(input.giftNiftyChangePct ?? 0.25);
  const sp500Score = normalizeEquityIndex(input.sp500ChangePct ?? 0.15);
  const nasdaqScore = normalizeEquityIndex(input.nasdaqChangePct ?? 0.20);
  const usVixScore = normalizeUsVix(input.usVix ?? 14.2, input.usVixChangePct ?? -1.0);
  const us10YScore = normalizeUs10Y(input.us10YChangeBps ?? 0);
  const nikkeiScore = normalizeEquityIndex(input.nikkeiChangePct ?? 0.10);
  const hangSengScore = normalizeEquityIndex(input.hangSengChangePct ?? 0.0);
  const shanghaiScore = normalizeEquityIndex(input.shanghaiChangePct ?? 0.05);
  const usdInrScore = normalizeUsdInr(input.usdInrChangePct ?? 0.0);
  const brentCrudeScore = normalizeBrentCrude(input.brentCrudePrice ?? 78.0, input.brentCrudeChangePct ?? -0.5);

  // 2. Compute Weighted Composite Score
  const compositeScore =
    (giftNiftyScore * w.GIFT_NIFTY) +
    (sp500Score * w.SP500) +
    (nasdaqScore * w.NASDAQ) +
    (usVixScore * w.US_VIX) +
    (us10YScore * w.US_10Y_YIELD) +
    (nikkeiScore * w.NIKKEI) +
    (hangSengScore * w.HANG_SENG) +
    (shanghaiScore * w.SHANGHAI) +
    (usdInrScore * w.USD_INR) +
    (brentCrudeScore * w.BRENT_CRUDE);

  const globalScore = Math.max(Math.min(Math.round(compositeScore), 100), 0);

  // 3. Classify Sentiment
  let sentiment: 'BULLISH' | 'NEUTRAL' | 'BEARISH' = 'NEUTRAL';
  if (globalScore >= 65) sentiment = 'BULLISH';
  else if (globalScore <= 42) sentiment = 'BEARISH';

  // 4. Macro Conditions Summary
  const isGiftNiftyPositive = (input.giftNiftyChangePct ?? 0) >= 0;
  const isUsMarketBullish = sp500Score >= 55;
  const isVixCalm = usVixScore >= 60;
  const isCrudeBenign = brentCrudeScore >= 55;

  const summary = `${sentiment} Macro Setup (${globalScore}/100) — GIFT Nifty ${
    isGiftNiftyPositive ? '▲ Positive' : '▼ Negative'
  }, US Sentiment ${isUsMarketBullish ? 'Bullish' : 'Cautious'}, Crude/VIX ${
    isVixCalm && isCrudeBenign ? 'Stable' : 'Volatile'
  }`;

  return {
    globalScore,
    sentiment,
    metrics: {
      giftNiftyScore,
      sp500Score,
      nasdaqScore,
      usVixScore,
      us10YScore,
      nikkeiScore,
      hangSengScore,
      shanghaiScore,
      usdInrScore,
      brentCrudeScore,
    },
    macroFactors: {
      isGiftNiftyPositive,
      isUsMarketBullish,
      isVixCalm,
      isCrudeBenign,
    },
    summary,
  };
}
