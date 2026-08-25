/**
 * Trading Engine Configuration & Constants
 * Fully configurable via environment variables or runtime settings.
 */

import type { TradingConfig, TradingMode } from '../../types/trading';

export const DEFAULT_TRADING_CONFIG: TradingConfig = {
  mode: (process.env.TRADING_MODE as TradingMode) || 'PAPER',
  enabled: process.env.TRADING_ENABLED !== 'false', // Kill Switch
  capital: Number(process.env.TRADING_CAPITAL || 50000),
  riskPerTradePct: Number(process.env.RISK_PER_TRADE || 1.0), // 1%
  maxPositionValue: Number(process.env.MAX_POSITION_VALUE || 25000),
  maxTradesPerDay: Number(process.env.MAX_TRADES_PER_DAY || 10),
  maxDailyLoss: Number(process.env.MAX_DAILY_LOSS || 2000),
  maxOpenPositions: Number(process.env.MAX_OPEN_POSITIONS || 3),
  minBullishScore: Number(process.env.MIN_BULLISH_SCORE || 80),
  minRsi: Number(process.env.MIN_RSI || 45),
  maxRsi: Number(process.env.MAX_RSI || 75),
  minVolume: Number(process.env.MIN_VOLUME || 50000),
  minVolumeRatio: Number(process.env.MIN_RELATIVE_VOLUME || 1.2),
  minBreakoutPercent: Number(process.env.MIN_BREAKOUT_PERCENT || 0.5),
  stopLossPct: Number(process.env.DEFAULT_STOP_LOSS_PCT || 1.5),
  targetPct: Number(process.env.DEFAULT_TARGET_PCT || 3.0),
  trailingStopTriggerPct: Number(process.env.TRAILING_STOP_TRIGGER_PCT || 1.0),
  trailingStopDistancePct: Number(process.env.TRAILING_STOP_DISTANCE_PCT || 1.0),
  useAtrStop: process.env.USE_ATR_STOP === 'true',
};

export function getTradingConfig(): TradingConfig {
  return { ...DEFAULT_TRADING_CONFIG };
}
