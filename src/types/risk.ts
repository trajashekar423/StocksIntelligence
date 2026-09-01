export const RISK_LEVELS = ['NORMAL', 'CAUTION', 'HIGH_RISK', 'EXIT_WARNING', 'CRITICAL_EXIT'] as const;

export type RiskLevel =
  | 'NORMAL'
  | 'CAUTION'
  | 'HIGH_RISK'
  | 'EXIT_WARNING'
  | 'CRITICAL_EXIT';

export type AlertSeverity = 'INFO' | 'WARNING' | 'EXIT_WARNING' | 'CRITICAL';

export interface IndicatorStatus {
  id: string;
  name: string;
  isFailed: boolean;
  score: number; // 0 to 20
  message: string;
  icon: string;
}

export interface TradeTimelineEvent {
  id: string;
  timestamp: string;
  timeMs: number;
  type: 'ENTRY' | 'INFO' | 'PEAK' | 'WARNING' | 'GIVEBACK' | 'EXIT_ALERT' | 'EXIT_CONFIRMED';
  title: string;
  description: string;
  price?: number;
  pnl?: number;
  riskScore?: number;
  severity: AlertSeverity;
}

export interface OpenRiskPosition {
  id: string;
  symbol: string;
  companyName: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  entryTime: string;
  entryTimeMs: number;
  product: 'MIS' | 'CNC';
  exchange: 'NSE' | 'BSE';

  // P&L & Profit Protection
  currentPnL: number;
  peakPnL: number;
  peakPrice: number;
  profitGiveback: number;
  profitGivebackPct: number;
  protectedProfit: number;
  isGivebackExceeded: boolean;

  // Stops & Targets
  initialStopLoss: number;
  trailingStopLoss: number;
  target1: number;
  target2: number;

  // Technical Indicators
  vwap: number;
  ema9: number;
  ema20: number;
  ema50: number;
  candle5mTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  supportLevel: number;
  resistanceLevel: number;
  volume: number;
  averageVolume: number;
  volumeRatio: number;
  buySellRatio: number;
  orderBookImbalancePct: number; // Positive = buyers, Negative = sellers

  // Market Confirmation
  niftyTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  sectorTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';

  // Risk Score & Exit Signals
  riskScore: number; // 0 to 100
  riskLevel: RiskLevel;
  exitRiskReasons: string[];
  failedIndicators: IndicatorStatus[];
  isExitWarningConfirmed: boolean;
  status: 'OPEN' | 'CLOSING' | 'CLOSED';

  // Timestamps & Stale Protection
  lastUpdatedMs: number;
  isDataStale: boolean;

  // Event Log
  timeline: TradeTimelineEvent[];
}

export interface ProfitProtectionConfig {
  activationPnL: number; // Minimum profit (e.g. ₹1000) before giveback tracking locks in
  maxAllowedGivebackPnL: number; // Max ₹ giveback allowed (e.g. ₹1500)
  maxGivebackPct: number; // Max % giveback from peak (e.g. 25%)
  minProtectedProfitPct: number; // Guarantee at least X% of peak profit (e.g. 60%)
  enable130Tightening: boolean; // Increase sensitivity after 13:30 IST
  dailyMaxGivebackPnL: number; // Circuit breaker limit for entire day
}

export interface DailyRiskSummary {
  startingCapital: number;
  realizedPnL: number;
  unrealizedPnL: number;
  dailyPeakPnL: number;
  currentDailyPnL: number;
  dailyProfitGiveback: number;
  maxDailyLoss: number;
  isDailyProtectionActive: boolean;
  isAfter130Mode: boolean;
}
