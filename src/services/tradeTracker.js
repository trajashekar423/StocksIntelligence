/**
 * Trade Tracker & Exit Engine
 * Universal — works for any NSE equity.
 * No symbol-specific code.
 */

export const TRADE_STATUS = {
  TRACKING: 'TRACKING',
  TARGET_HIT: 'TARGET_HIT',
  STOP_HIT: 'STOP_HIT',
  TIME_EXIT: 'TIME_EXIT',
  MANUAL_EXIT: 'MANUAL_EXIT',
  VWAP_EXIT: 'VWAP_EXIT',
  MOMENTUM_EXIT: 'MOMENTUM_EXIT',
  ORB_FAIL_EXIT: 'ORB_FAIL_EXIT',
};

export const DAILY_TARGET = 2000; // ₹

/**
 * Create a new trade object when user clicks START TRACKING.
 */
export function createTrade({ symbol, side = 'LONG', entryPrice, quantity, stopLoss, target1, target2, atr }) {
  const now = new Date();
  const risk = Math.max(entryPrice - stopLoss, 0.01);
  return {
    symbol: String(symbol).trim().toUpperCase(),
    side,
    entryPrice,
    quantity: quantity || 1,
    entryTime: now.toISOString(),
    stopLoss,
    target1: target1 || entryPrice + risk * 2,
    target2: target2 || entryPrice + risk * 3,
    trailingStop: stopLoss,
    trailingHighWater: entryPrice,
    currentPrice: entryPrice,
    pnl: 0,
    pnlPercent: 0,
    momentumScore: null,
    status: TRADE_STATUS.TRACKING,
    exitReason: null,
    exitTime: null,
    exitPrice: null,
    scoreHistory: [],
    atr: atr || risk,
  };
}

/**
 * Update trade with latest price and indicators.
 * Returns updated trade object (immutable — does not mutate input).
 */
export function updateTrade(trade, currentPrice, momentumScore) {
  const pnl = (currentPrice - trade.entryPrice) * trade.quantity * (trade.side === 'LONG' ? 1 : -1);
  const pnlPercent = ((currentPrice - trade.entryPrice) / trade.entryPrice) * 100 * (trade.side === 'LONG' ? 1 : -1);

  // Update trailing stop: move up as price rises (LONG)
  let trailingStop = trade.trailingStop;
  let trailingHighWater = trade.trailingHighWater;
  if (trade.side === 'LONG' && currentPrice > trailingHighWater) {
    trailingHighWater = currentPrice;
    trailingStop = Math.max(trailingStop, currentPrice - trade.atr * 1.5);
  }

  const scoreHistory = [...(trade.scoreHistory || []), momentumScore].filter((s) => s !== null).slice(-10);

  return {
    ...trade,
    currentPrice,
    pnl,
    pnlPercent,
    trailingStop,
    trailingHighWater,
    momentumScore,
    scoreHistory,
  };
}

/**
 * Evaluate whether the trade should exit.
 * Returns { shouldExit, reason, exitType } or null.
 */
export function evaluateExit(trade, indicators = {}, options = {}) {
  const { currentPrice, stopLoss, target1, target2, trailingStop, side, entryTime, scoreHistory } = trade;
  const { vwap, momentumScore, orbHigh, orbLow } = indicators;
  const { timeStopMinutes = 60, momentumCollapseThreshold = 55 } = options;

  // 1. Hard stop loss
  if (side === 'LONG' && currentPrice <= stopLoss) {
    return { shouldExit: true, reason: `Price ₹${currentPrice.toFixed(2)} hit stop loss ₹${stopLoss.toFixed(2)}`, exitType: TRADE_STATUS.STOP_HIT };
  }

  // 2. Trailing stop
  if (side === 'LONG' && currentPrice <= trailingStop && trailingStop > stopLoss) {
    return { shouldExit: true, reason: `Trailing stop hit at ₹${trailingStop.toFixed(2)}`, exitType: TRADE_STATUS.STOP_HIT };
  }

  // 3. Target 1
  if (side === 'LONG' && currentPrice >= target1) {
    return { shouldExit: true, reason: `Target 1 reached ₹${target1.toFixed(2)}`, exitType: TRADE_STATUS.TARGET_HIT };
  }

  // 4. VWAP failure (LONG: price crosses below VWAP with weakening momentum)
  if (side === 'LONG' && vwap && currentPrice < vwap && momentumScore !== null && momentumScore < 50) {
    return { shouldExit: true, reason: `Price fell below VWAP ₹${vwap.toFixed(2)} with weak momentum (${momentumScore})`, exitType: TRADE_STATUS.VWAP_EXIT };
  }

  // 5. ORB failure (price returns inside opening range after breakout)
  if (side === 'LONG' && orbHigh && trade.entryPrice > orbHigh && currentPrice < orbHigh) {
    return { shouldExit: true, reason: `ORB breakout failed — price returned below ORB high ₹${orbHigh.toFixed(2)}`, exitType: TRADE_STATUS.ORB_FAIL_EXIT };
  }

  // 6. Momentum collapse
  if (scoreHistory.length >= 4) {
    const recent = scoreHistory.slice(-4);
    const dropping = recent.every((s, i) => i === 0 || s < recent[i - 1]);
    if (dropping && recent.at(-1) < momentumCollapseThreshold) {
      return { shouldExit: true, reason: `Momentum collapsed: ${recent.join(' → ')}`, exitType: TRADE_STATUS.MOMENTUM_EXIT };
    }
  }

  // 7. Time stop
  if (entryTime && timeStopMinutes) {
    const elapsed = (Date.now() - new Date(entryTime).getTime()) / 60000;
    if (elapsed >= timeStopMinutes && momentumScore !== null && momentumScore < 50) {
      return { shouldExit: true, reason: `Time stop: ${Math.round(elapsed)}min elapsed, momentum ${momentumScore}`, exitType: TRADE_STATUS.TIME_EXIT };
    }
  }

  return null;
}

/**
 * Daily P&L tracker.
 */
export function createDailyTracker(target = DAILY_TARGET, maxLoss = 1000) {
  return { realizedPnl: 0, target, maxLoss, trades: [], targetReached: false, maxLossHit: false };
}

export function recordTradePnl(tracker, pnl) {
  const next = { ...tracker, realizedPnl: tracker.realizedPnl + pnl, trades: [...tracker.trades, { pnl, time: new Date().toISOString() }] };
  next.targetReached = next.realizedPnl >= next.target;
  next.maxLossHit = next.realizedPnl <= -Math.abs(next.maxLoss);
  return next;
}

export function canTrade(tracker) {
  return !tracker.targetReached && !tracker.maxLossHit;
}

export function getElapsedTime(entryTime) {
  if (!entryTime) return '—';
  const ms = Date.now() - new Date(entryTime).getTime();
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}m ${s}s`;
}
