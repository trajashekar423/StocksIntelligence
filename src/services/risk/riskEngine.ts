import type {
  OpenRiskPosition,
  ProfitProtectionConfig,
  RiskLevel,
  IndicatorStatus,
} from '../../types/risk.ts';
import {
  detectVWAPBreakdown,
  detectEMABreakdown,
  detectSupportBreak,
  detectVolumeSelling,
  detectOrderBookRisk,
  detectMarketRisk,
} from './indicatorEngine.ts';
import {
  evaluateProfitProtection,
  DEFAULT_PROFIT_PROTECTION_CONFIG,
} from './profitProtectionEngine.ts';

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

/**
 * Checks whether current IST time is past 13:30 (1:30 PM).
 */
export function checkIsAfter130IST(date = new Date()): boolean {
  try {
    const istString = date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const istDate = new Date(istString);
    const hours = istDate.getHours();
    const minutes = istDate.getMinutes();
    return hours > 13 || (hours === 13 && minutes >= 30);
  } catch {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return hours > 13 || (hours === 13 && minutes >= 30);
  }
}

/**
 * Classifies Risk Score (0-100) into 5 tiers:
 * 0–25 = NORMAL 🟢
 * 26–45 = CAUTION 🟡
 * 46–65 = HIGH RISK 🟠
 * 66–80 = EXIT WARNING 🔴
 * 81–100 = CRITICAL EXIT 🔴
 */
export function classifyRiskLevel(score: number): RiskLevel {
  if (score >= 81) return 'CRITICAL_EXIT';
  if (score >= 66) return 'EXIT_WARNING';
  if (score >= 46) return 'HIGH_RISK';
  if (score >= 26) return 'CAUTION';
  return 'NORMAL';
}

/**
 * Calculates aggregate 0–100 Risk Score for an open position.
 * Enforces multi-condition confirmation for Exit Warnings.
 */
export function calculateRiskScore(
  pos: OpenRiskPosition,
  config: ProfitProtectionConfig = DEFAULT_PROFIT_PROTECTION_CONFIG,
  isAfter130 = checkIsAfter130IST()
): {
  riskScore: number;
  riskLevel: RiskLevel;
  failedIndicators: IndicatorStatus[];
  exitRiskReasons: string[];
  isExitWarningConfirmed: boolean;
  protectedProfit: number;
  isGivebackExceeded: boolean;
} {
  const isPriceDropping = pos.currentPrice < (pos.peakPrice || pos.entryPrice);

  // 1. Evaluate all technical indicators
  const vwapStatus = detectVWAPBreakdown(pos.currentPrice, pos.vwap);
  const emaStatus = detectEMABreakdown(pos.currentPrice, pos.ema9, pos.ema20, pos.ema50);
  const supportStatus = detectSupportBreak(pos.currentPrice, pos.supportLevel, pos.candle5mTrend);
  const volumeStatus = detectVolumeSelling(pos.volumeRatio, isPriceDropping, pos.buySellRatio);
  const orderBookStatus = detectOrderBookRisk(pos.orderBookImbalancePct);
  const marketStatus = detectMarketRisk(pos.niftyTrend, pos.sectorTrend);

  // 2. Evaluate Profit Protection & Giveback
  const profitEval = evaluateProfitProtection(pos, config, isAfter130);

  const failedIndicators: IndicatorStatus[] = [
    vwapStatus,
    emaStatus,
    supportStatus,
    volumeStatus,
    orderBookStatus,
    marketStatus,
  ].filter((ind) => ind.isFailed);

  // 3. Aggregate Base Risk Points
  let totalScore = 0;
  const exitRiskReasons: string[] = [];

  // Trailing Stop approached / breached
  if (pos.trailingStopLoss > 0 && pos.currentPrice <= pos.trailingStopLoss) {
    totalScore += 35;
    exitRiskReasons.push(
      `🛑 Trailing Stop hit (Price ₹${pos.currentPrice.toFixed(
        2
      )} ≤ Trailing SL ₹${pos.trailingStopLoss.toFixed(2)})`
    );
  } else if (pos.trailingStopLoss > 0 && pos.currentPrice <= pos.trailingStopLoss * 1.005) {
    totalScore += 15;
    exitRiskReasons.push(
      `⚠️ Price within 0.5% of Trailing Stop (₹${pos.trailingStopLoss.toFixed(2)})`
    );
  }

  // Add Indicator Scores
  totalScore += vwapStatus.score;
  if (vwapStatus.isFailed) exitRiskReasons.push(`❌ ${vwapStatus.message}`);

  totalScore += emaStatus.score;
  if (emaStatus.isFailed) exitRiskReasons.push(`❌ ${emaStatus.message}`);

  totalScore += supportStatus.score;
  if (supportStatus.isFailed) exitRiskReasons.push(`❌ ${supportStatus.message}`);

  totalScore += volumeStatus.score;
  if (volumeStatus.isFailed) exitRiskReasons.push(`🔴 ${volumeStatus.message}`);

  totalScore += orderBookStatus.score;
  if (orderBookStatus.isFailed) exitRiskReasons.push(`🔴 ${orderBookStatus.message}`);

  totalScore += marketStatus.score;
  if (marketStatus.isFailed) exitRiskReasons.push(`🔴 ${marketStatus.message}`);

  // Add Profit Giveback Penalty
  totalScore += profitEval.riskScorePenalty;
  if (profitEval.reason) exitRiskReasons.push(profitEval.reason);

  // 4. Afternoon 1:30 PM Sensitivity Multiplier
  if (isAfter130 && config.enable130Tightening) {
    if (totalScore >= 30) {
      totalScore = Math.round(totalScore * 1.25); // +25% sensitivity after 1:30 PM
      exitRiskReasons.unshift('🕐 1:30 PM High-Risk Mode active (Tightened tolerances)');
    }
  }

  const finalScore = clamp(totalScore, 0, 100);

  // 5. Multi-Condition Confirmation Gate
  // An EXIT WARNING (>=66) must have at least 2 distinct technical failure reasons or Trailing Stop hit
  const hasTrailingStopHit = pos.trailingStopLoss > 0 && pos.currentPrice <= pos.trailingStopLoss;
  const isMultiConditionConfirmed =
    hasTrailingStopHit ||
    profitEval.isGivebackExceeded ||
    failedIndicators.length >= 2;

  let riskLevel = classifyRiskLevel(finalScore);

  // If score is high but only 1 single indicator triggered without giveback or SL hit, cap at HIGH_RISK
  if (finalScore >= 66 && !isMultiConditionConfirmed) {
    riskLevel = 'HIGH_RISK';
  }

  return {
    riskScore: finalScore,
    riskLevel,
    failedIndicators,
    exitRiskReasons,
    isExitWarningConfirmed: isMultiConditionConfirmed && finalScore >= 66,
    protectedProfit: profitEval.protectedProfit,
    isGivebackExceeded: profitEval.isGivebackExceeded,
  };
}
