import type {
  OpenRiskPosition,
  DailyRiskSummary,
  ProfitProtectionConfig,
} from '../../types/risk.ts';
import {
  calculateRiskScore,
  checkIsAfter130IST,
} from './riskEngine.ts';
import {
  updatePositionPeakPnL,
  calculateProfitGiveback,
  calculateTrailingStop,
  DEFAULT_PROFIT_PROTECTION_CONFIG,
} from './profitProtectionEngine.ts';
import {
  createTimelineEvent,
  triggerPositionAlert,
} from './alertEngine.ts';

export const STORAGE_RISK_POSITIONS_KEY = 'realtime_risk_open_positions_v1';
export const STORAGE_DAILY_RISK_SUMMARY_KEY = 'realtime_daily_risk_summary_v1';

const STALE_DATA_THRESHOLD_MS = 30000; // 30 seconds

/**
 * Universal Stock URL Parser: extracts symbol and company name from NSE India, Groww, Yahoo, or plain symbol.
 */
export function parseStockUrlOrSymbol(input: string): { symbol: string; companyName: string } {
  const trimmed = String(input || '').trim();
  if (!trimmed) return { symbol: '', companyName: '' };

  // 1. NSE URL: https://www.nseindia.com/get-quote/equity/WEL/Wonder-Electricals-Limited
  const nseMatch = trimmed.match(/nseindia\.com\/get-quote\/equity\/([^/?#]+)(?:\/([^/?#]+))?/i);
  if (nseMatch) {
    const symbol = decodeURIComponent(nseMatch[1]).trim().toUpperCase();
    const rawName = nseMatch[2] ? decodeURIComponent(nseMatch[2]).replace(/-/g, ' ').trim() : '';
    return {
      symbol,
      companyName: rawName || `${symbol} Ltd`,
    };
  }

  // 2. Groww URL: https://groww.in/stocks/wonder-electricals-ltd
  const growwMatch = trimmed.match(/groww\.in\/stocks\/([^/?#]+)/i);
  if (growwMatch) {
    const slug = decodeURIComponent(growwMatch[1]).trim();
    const symbol = slug.toUpperCase().replace(/-LTD$|-LIMITED$/i, '').replace(/-/g, '');
    const companyName = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return { symbol, companyName };
  }

  // 3. Fallback: plain symbol
  const cleanSymbol = trimmed.split(/[\s/?#]/)[0].toUpperCase();
  return { symbol: cleanSymbol, companyName: `${cleanSymbol} Ltd` };
}

/**
 * Loads all active open positions from persistent storage.
 */
export function loadOpenRiskPositions(): OpenRiskPosition[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(STORAGE_RISK_POSITIONS_KEY);
    if (!raw) return [];
    const list: OpenRiskPosition[] = JSON.parse(raw);
    return Array.isArray(list) ? list.filter((p) => p.status !== 'CLOSED') : [];
  } catch {
    return [];
  }
}

/**
 * Saves open positions to persistent storage.
 */
export function saveOpenRiskPositions(positions: OpenRiskPosition[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_RISK_POSITIONS_KEY, JSON.stringify(positions));
  } catch {
    // Storage error
  }
}

/**
 * Creates and registers a new open position.
 */
export function registerNewOpenPosition(
  symbol: string,
  companyName: string,
  quantity: number,
  entryPrice: number,
  initialStopLoss: number,
  product: 'MIS' | 'CNC' = 'MIS',
  exchange: 'NSE' | 'BSE' = 'NSE'
): OpenRiskPosition {
  const now = new Date();
  const entryTime = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
  const entryTimeMs = now.getTime();
  const id = `pos_${symbol}_${entryTimeMs}`;

  const target1 = Number((entryPrice * 1.03).toFixed(2));
  const target2 = Number((entryPrice * 1.05).toFixed(2));

  const entryEvent = createTimelineEvent(
    'ENTRY',
    `BUY Order Executed: ${quantity} shares @ ₹${entryPrice.toFixed(2)}`,
    `Initial Stop Loss set to ₹${initialStopLoss.toFixed(2)} | Target: ₹${target1.toFixed(2)}`,
    'INFO',
    entryPrice,
    0,
    0
  );

  const newPos: OpenRiskPosition = {
    id,
    symbol: symbol.toUpperCase().trim(),
    companyName: companyName || `${symbol} Ltd`,
    quantity,
    entryPrice,
    currentPrice: entryPrice,
    entryTime,
    entryTimeMs,
    product,
    exchange,
    currentPnL: 0,
    peakPnL: 0,
    peakPrice: entryPrice,
    profitGiveback: 0,
    profitGivebackPct: 0,
    protectedProfit: 0,
    isGivebackExceeded: false,
    initialStopLoss,
    trailingStopLoss: initialStopLoss,
    target1,
    target2,
    vwap: entryPrice,
    ema9: entryPrice,
    ema20: entryPrice,
    ema50: entryPrice * 0.995,
    candle5mTrend: 'BULLISH',
    supportLevel: initialStopLoss,
    resistanceLevel: target1,
    volume: 500000,
    averageVolume: 400000,
    volumeRatio: 1.25,
    buySellRatio: 1.5,
    orderBookImbalancePct: 20,
    niftyTrend: 'BULLISH',
    sectorTrend: 'BULLISH',
    riskScore: 5,
    riskLevel: 'NORMAL',
    exitRiskReasons: [],
    failedIndicators: [],
    isExitWarningConfirmed: false,
    status: 'OPEN',
    lastUpdatedMs: entryTimeMs,
    isDataStale: false,
    timeline: [entryEvent],
  };

  const existing = loadOpenRiskPositions();
  const updated = [newPos, ...existing.filter((p) => p.id !== id)];
  saveOpenRiskPositions(updated);

  return newPos;
}

/**
 * Updates an open position with real-time market data and recalculates risk.
 */
export function updatePositionMarketData(
  pos: OpenRiskPosition,
  marketQuote: {
    price: number;
    vwap?: number;
    open?: number;
    high?: number;
    low?: number;
    volume?: number;
    averageVolume?: number;
    ema9?: number;
    ema20?: number;
    ema50?: number;
    supportLevel?: number;
    buySellRatio?: number;
    orderBookImbalancePct?: number;
    candle5mTrend?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    niftyTrend?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    sectorTrend?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  },
  config: ProfitProtectionConfig = DEFAULT_PROFIT_PROTECTION_CONFIG
): OpenRiskPosition {
  const now = Date.now();
  const currentPrice = Number(marketQuote.price || pos.currentPrice);
  const currentPnL = (currentPrice - pos.entryPrice) * pos.quantity;

  const isAfter130 = checkIsAfter130IST();

  // 1. Peak & Giveback
  const { peakPrice, peakPnL } = updatePositionPeakPnL(pos, currentPrice);
  const { profitGiveback, profitGivebackPct } = calculateProfitGiveback(peakPnL, currentPnL);

  // 2. Trailing Stop
  const trailingStopLoss = calculateTrailingStop(
    pos.entryPrice,
    peakPrice,
    pos.initialStopLoss,
    isAfter130
  );

  // 3. Technical Indicators
  const vwap = Number(marketQuote.vwap ?? pos.vwap ?? currentPrice);
  const ema9 = Number(marketQuote.ema9 ?? pos.ema9 ?? currentPrice);
  const ema20 = Number(marketQuote.ema20 ?? pos.ema20 ?? currentPrice);
  const ema50 = Number(marketQuote.ema50 ?? pos.ema50 ?? currentPrice * 0.995);
  const candle5mTrend = marketQuote.candle5mTrend ?? pos.candle5mTrend;
  const supportLevel = Number(marketQuote.supportLevel ?? pos.supportLevel ?? pos.initialStopLoss);
  const volume = Number(marketQuote.volume ?? pos.volume);
  const averageVolume = Number(marketQuote.averageVolume ?? pos.averageVolume);
  const volumeRatio = averageVolume > 0 ? Number((volume / averageVolume).toFixed(2)) : 1.0;
  const buySellRatio = Number(marketQuote.buySellRatio ?? pos.buySellRatio ?? 1.2);
  const orderBookImbalancePct = Number(
    marketQuote.orderBookImbalancePct ?? pos.orderBookImbalancePct ?? 0
  );
  const niftyTrend = marketQuote.niftyTrend ?? pos.niftyTrend;
  const sectorTrend = marketQuote.sectorTrend ?? pos.sectorTrend;

  // Stale detection
  const isDataStale = now - pos.lastUpdatedMs > STALE_DATA_THRESHOLD_MS;

  const updatedDraft: OpenRiskPosition = {
    ...pos,
    currentPrice,
    currentPnL: Number(currentPnL.toFixed(2)),
    peakPrice: Number(peakPrice.toFixed(2)),
    peakPnL: Number(peakPnL.toFixed(2)),
    profitGiveback: Number(profitGiveback.toFixed(2)),
    profitGivebackPct,
    trailingStopLoss,
    vwap,
    ema9,
    ema20,
    ema50,
    candle5mTrend,
    supportLevel,
    volume,
    averageVolume,
    volumeRatio,
    buySellRatio,
    orderBookImbalancePct,
    niftyTrend,
    sectorTrend,
    lastUpdatedMs: now,
    isDataStale,
  };

  // 4. Calculate Risk Score & Exit Signals
  const riskResult = calculateRiskScore(updatedDraft, config, isAfter130);

  const updatedPos: OpenRiskPosition = {
    ...updatedDraft,
    riskScore: riskResult.riskScore,
    riskLevel: riskResult.riskLevel,
    failedIndicators: riskResult.failedIndicators,
    exitRiskReasons: riskResult.exitRiskReasons,
    isExitWarningConfirmed: riskResult.isExitWarningConfirmed,
    protectedProfit: riskResult.protectedProfit,
    isGivebackExceeded: riskResult.isGivebackExceeded,
  };

  // 5. Timeline & Alert Events
  const timeline = [...pos.timeline];

  // Peak Profit milestone event
  if (peakPnL >= 1000 && (!pos.peakPnL || peakPnL > pos.peakPnL * 1.25)) {
    timeline.push(
      createTimelineEvent(
        'PEAK',
        `New Peak Profit: +₹${Math.round(peakPnL).toLocaleString('en-IN')}`,
        `Price reached ₹${peakPrice.toFixed(2)} | Trailing stop locked at ₹${trailingStopLoss.toFixed(2)}`,
        'INFO',
        peakPrice,
        peakPnL,
        riskResult.riskScore
      )
    );
  }

  // Profit Giveback Breach event
  if (riskResult.isGivebackExceeded && !pos.isGivebackExceeded) {
    const alertMsg = `Giveback of ₹${Math.round(profitGiveback).toLocaleString('en-IN')} (${profitGivebackPct.toFixed(0)}% from peak)`;
    timeline.push(
      createTimelineEvent(
        'GIVEBACK',
        '🔴 PROFIT PROTECTION ALERT: Giveback Exceeded',
        alertMsg,
        'EXIT_WARNING',
        currentPrice,
        currentPnL,
        riskResult.riskScore
      )
    );
    triggerPositionAlert(pos.id, pos.symbol, 'EXIT_WARNING', 'Profit Giveback Limit Exceeded', alertMsg);
  }

  // Exit Warning event
  if (riskResult.isExitWarningConfirmed && !pos.isExitWarningConfirmed) {
    const reasonsStr = riskResult.exitRiskReasons.slice(0, 2).join(' | ');
    timeline.push(
      createTimelineEvent(
        'EXIT_ALERT',
        `🔴 EXIT WARNING: Risk Score ${riskResult.riskScore}/100`,
        reasonsStr,
        riskResult.riskLevel === 'CRITICAL_EXIT' ? 'CRITICAL' : 'EXIT_WARNING',
        currentPrice,
        currentPnL,
        riskResult.riskScore
      )
    );
    triggerPositionAlert(
      pos.id,
      pos.symbol,
      riskResult.riskLevel === 'CRITICAL_EXIT' ? 'CRITICAL' : 'EXIT_WARNING',
      `Exit Risk High (${riskResult.riskScore}/100)`,
      reasonsStr
    );
  }

  updatedPos.timeline = timeline;
  return updatedPos;
}

/**
 * Calculates Daily Risk Summary & Circuit Breaker status.
 */
export function calculateDailyRiskSummary(
  positions: OpenRiskPosition[],
  startingCapital = 100000,
  maxDailyLoss = 5000,
  config: ProfitProtectionConfig = DEFAULT_PROFIT_PROTECTION_CONFIG
): DailyRiskSummary {
  const realizedPnL = 0; // Filled from completed trades store
  const unrealizedPnL = positions.reduce((sum, p) => sum + p.currentPnL, 0);
  const currentDailyPnL = realizedPnL + unrealizedPnL;

  let dailyPeakPnL = 0;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_DAILY_RISK_SUMMARY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        dailyPeakPnL = Math.max(parsed.dailyPeakPnL || 0, currentDailyPnL);
      } else {
        dailyPeakPnL = Math.max(0, currentDailyPnL);
      }
    } catch {
      dailyPeakPnL = Math.max(0, currentDailyPnL);
    }
  }

  const dailyProfitGiveback = Math.max(0, dailyPeakPnL - currentDailyPnL);
  const isDailyProtectionActive =
    dailyProfitGiveback >= config.dailyMaxGivebackPnL || currentDailyPnL <= -maxDailyLoss;

  const isAfter130Mode = checkIsAfter130IST();

  const summary: DailyRiskSummary = {
    startingCapital,
    realizedPnL,
    unrealizedPnL,
    dailyPeakPnL,
    currentDailyPnL,
    dailyProfitGiveback,
    maxDailyLoss,
    isDailyProtectionActive,
    isAfter130Mode,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_DAILY_RISK_SUMMARY_KEY, JSON.stringify(summary));
    } catch {
      // Storage error
    }
  }

  return summary;
}
