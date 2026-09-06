import type { IndicatorStatus } from '../../types/risk.ts';

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

/**
 * 1. VWAP Breakdown Detector
 * Checks if price has fallen below the intraday VWAP.
 */
export function detectVWAPBreakdown(price: number, vwap: number): IndicatorStatus {
  if (vwap <= 0) {
    return {
      id: 'vwap',
      name: 'VWAP Position',
      isFailed: false,
      score: 0,
      message: 'VWAP benchmark tracking active',
      icon: '📈',
    };
  }

  const isBelow = price < vwap;
  const pctBelow = ((vwap - price) / vwap) * 100;

  let score = 0;
  let message = 'Above intraday VWAP (Bullish)';
  let icon = '🟢';

  if (isBelow) {
    score = pctBelow > 1.0 ? 18 : 12;
    message = `Below VWAP by ${pctBelow.toFixed(2)}% (Loss of buyer control)`;
    icon = '❌';
  }

  return {
    id: 'vwap',
    name: 'VWAP Breakdown',
    isFailed: isBelow,
    score,
    message,
    icon,
  };
}

/**
 * 2. EMA Trend & Breakdown Detector (EMA 9, 20, 50)
 * Detects EMA9 < EMA20 (Death Cross) or Price < EMA50 (Major trend failure).
 */
export function detectEMABreakdown(
  price: number,
  ema9: number,
  ema20: number,
  ema50: number
): IndicatorStatus {
  if (ema9 <= 0 || ema20 <= 0) {
    return {
      id: 'ema',
      name: 'Moving Averages',
      isFailed: false,
      score: 0,
      message: 'EMA trend stable',
      icon: '🟢',
    };
  }

  const isEma9Below20 = ema9 < ema20;
  const isBelow50 = ema50 > 0 && price < ema50;

  let score = 0;
  const reasons: string[] = [];

  if (isEma9Below20) {
    score += 10;
    reasons.push('EMA 9 crossed below EMA 20 (Short-term momentum dead)');
  }
  if (isBelow50) {
    score += 8;
    reasons.push('Price trading below EMA 50 (Structural support lost)');
  }

  const isFailed = isEma9Below20 || isBelow50;

  return {
    id: 'ema',
    name: 'EMA 9/20/50 Breakdown',
    isFailed,
    score: clamp(score, 0, 18),
    message: isFailed ? reasons.join('; ') : 'EMA 9 > EMA 20 (Bullish trend intact)',
    icon: isFailed ? '❌' : '🟢',
  };
}

/**
 * 3. Support Breakdown Detector
 * Detects if price has breached key intraday support or 5m swing low.
 */
export function detectSupportBreak(
  price: number,
  supportLevel: number,
  candle5mTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
): IndicatorStatus {
  if (supportLevel <= 0) {
    return {
      id: 'support',
      name: 'Support & Structure',
      isFailed: candle5mTrend === 'BEARISH',
      score: candle5mTrend === 'BEARISH' ? 8 : 0,
      message: candle5mTrend === 'BEARISH' ? '5m candle trend turned Bearish' : 'Support holding',
      icon: candle5mTrend === 'BEARISH' ? '🟡' : '🟢',
    };
  }

  const isBroken = price < supportLevel;
  let score = 0;
  let message = `Holding above support level (₹${supportLevel.toFixed(2)})`;
  let icon = '🟢';

  if (isBroken) {
    score = candle5mTrend === 'BEARISH' ? 18 : 14;
    message = `Support broken at ₹${supportLevel.toFixed(2)} with 5m ${candle5mTrend} pressure`;
    icon = '❌';
  } else if (candle5mTrend === 'BEARISH') {
    score = 6;
    message = `Testing support (₹${supportLevel.toFixed(2)}) with bearish 5m candle`;
    icon = '🟡';
  }

  return {
    id: 'support',
    name: 'Support & Structure',
    isFailed: isBroken,
    score,
    message,
    icon,
  };
}

/**
 * 4. Volume Selling & Distribution Detector
 * Detects heavy volume during price drops (Institutional unloading).
 */
export function detectVolumeSelling(
  volumeRatio: number,
  isPriceDropping: boolean,
  buySellRatio: number
): IndicatorStatus {
  const isHeavyVolume = volumeRatio >= 1.5;
  const isHighSelling = buySellRatio < 0.8;

  let score = 0;
  let isFailed = false;
  let message = 'Normal volume flow';
  let icon = '🟢';

  if (isPriceDropping && isHeavyVolume) {
    score = 16;
    isFailed = true;
    message = `Heavy selling volume (${volumeRatio.toFixed(1)}x average) during decline`;
    icon = '🔴';
  } else if (isHighSelling) {
    score = 10;
    isFailed = true;
    message = `Sellers dominating order volume (B/S ratio: ${buySellRatio.toFixed(2)})`;
    icon = '🟠';
  }

  return {
    id: 'volume',
    name: 'Volume & Seller Pressure',
    isFailed,
    score,
    message,
    icon,
  };
}

/**
 * 5. Order Book Imbalance Detector
 * Checks bid-ask queue balance.
 */
export function detectOrderBookRisk(orderBookImbalancePct: number): IndicatorStatus {
  // Negative percentage means more sellers on the ask than buyers on the bid
  const isSellerHeavy = orderBookImbalancePct <= -25;
  let score = 0;
  let message = 'Healthy buyer queue on order book';
  let icon = '🟢';

  if (orderBookImbalancePct <= -50) {
    score = 14;
    message = `Severe sell wall on order book (${Math.abs(orderBookImbalancePct).toFixed(0)}% seller dominance)`;
    icon = '🔴';
  } else if (isSellerHeavy) {
    score = 8;
    message = `Sell queue outweighing bids (${Math.abs(orderBookImbalancePct).toFixed(0)}% sellers)`;
    icon = '🟡';
  }

  return {
    id: 'orderbook',
    name: 'Order Book Depth',
    isFailed: isSellerHeavy,
    score,
    message,
    icon,
  };
}

/**
 * 6. Market & Sector Alignment Risk Detector
 * Detects if NIFTY or the specific sector is dragging down the trade.
 */
export function detectMarketRisk(
  niftyTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL',
  sectorTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
): IndicatorStatus {
  let score = 0;
  const reasons: string[] = [];

  if (niftyTrend === 'BEARISH') {
    score += 6;
    reasons.push('NIFTY 50 dragging down market sentiment');
  }
  if (sectorTrend === 'BEARISH') {
    score += 6;
    reasons.push('Sector index under selling pressure');
  }

  const isFailed = score >= 6;

  return {
    id: 'market',
    name: 'Market & Sector Alignment',
    isFailed,
    score,
    message: isFailed ? reasons.join('; ') : 'NIFTY & Sector tailwinds supportive',
    icon: isFailed ? '🔴' : '🟢',
  };
}

/**
 * 7. Failed Breakout / Bull Trap Detector
 * Triggers CRITICAL EXIT when price pierces resistance but fails within 1-2 candles
 */
export function detectFailedBreakout(
  currentPrice: number,
  resistanceLevel: number,
  prevCandleHigh: number,
  recentCandles: { close: number; high: number }[]
): { isFailed: boolean; message: string; score: number } {
  if (!resistanceLevel || !Array.isArray(recentCandles) || recentCandles.length < 2) {
    return { isFailed: false, message: 'Breakout check stable', score: 0 };
  }

  const piercedResistance =
    prevCandleHigh >= resistanceLevel ||
    (recentCandles[recentCandles.length - 2]?.high !== undefined &&
      recentCandles[recentCandles.length - 2].high >= resistanceLevel);
  const closedBackInside = currentPrice < resistanceLevel * 0.998; // 0.2% buffer

  if (piercedResistance && closedBackInside) {
    return {
      isFailed: true,
      message: `🚨 BULL TRAP: Pierced ₹${resistanceLevel} but failed to sustain. Re-entered range.`,
      score: 35, // Massive risk score boost -> Triggers CRITICAL EXIT
    };
  }

  return { isFailed: false, message: 'Breakout structure holding', score: 0 };
}

/**
 * 8. Volume Climax / Absorption Detector
 * Detects massive volume bar with tiny candle body (Smart Money offloading)
 */
export function detectVolumeClimax(
  currentVolume: number,
  avgVolume: number,
  candleHigh: number,
  candleLow: number,
  candleOpen: number,
  candleClose: number
): { isClimax: boolean; message: string; score: number } {
  const volRatio = currentVolume / Math.max(avgVolume, 1);
  const totalRange = candleHigh - candleLow || 1;
  const body = Math.abs(candleClose - candleOpen);
  const upperWick = candleHigh - Math.max(candleOpen, candleClose);

  // Volume > 2.5x normal, but body is < 35% of total range OR upper wick is > 50%
  const isAbsorption = volRatio >= 2.5 && (body / totalRange < 0.35 || upperWick / totalRange > 0.5);

  if (isAbsorption) {
    return {
      isClimax: true,
      message: `📊 VOLUME CLIMAX: ${volRatio.toFixed(1)}x Volume with heavy upper wick. Institutional absorption detected.`,
      score: 25,
    };
  }

  return { isClimax: false, message: 'Volume expansion normal', score: 0 };
}

/**
 * 9. Moving Average Slope Flattening Detector
 * Measures rate of change of EMA 9 over 3 periods
 */
export function detectEMASlopeFlattening(
  ema9Current: number,
  ema9ThreeBarsAgo: number
): { isFlattening: boolean; message: string; score: number } {
  if (!ema9Current || !ema9ThreeBarsAgo) return { isFlattening: false, message: '', score: 0 };

  const slopePct = ((ema9Current - ema9ThreeBarsAgo) / ema9ThreeBarsAgo) * 100;

  // Slope near zero (< 0.05% change over 3 candles) after an uptrend
  if (Math.abs(slopePct) < 0.05) {
    return {
      isFlattening: true,
      message: '🗒 EMA 9 momentum has stalled flat (0° slope). Trend entering consolidation.',
      score: 15,
    };
  }

  return { isFlattening: false, message: 'EMA 9 angle healthy', score: 0 };
}

