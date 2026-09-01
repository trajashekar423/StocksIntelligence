import type { OpenRiskPosition, ProfitProtectionConfig } from '../../types/risk.ts';

export const DEFAULT_PROFIT_PROTECTION_CONFIG: ProfitProtectionConfig = {
  activationPnL: 800, // Activate giveback protection once profit reaches ₹800
  maxAllowedGivebackPnL: 1200, // Max giveback ₹1,200
  maxGivebackPct: 25, // Max 25% giveback of peak profit
  minProtectedProfitPct: 65, // Guarantee at least 65% of peak profit
  enable130Tightening: true, // Tighten trailing and giveback limits after 1:30 PM IST
  dailyMaxGivebackPnL: 3000, // Daily profit circuit breaker
};

/**
 * Updates a position's peak price and peak P&L.
 */
export function updatePositionPeakPnL(
  pos: OpenRiskPosition,
  currentPrice: number
): { peakPrice: number; peakPnL: number } {
  const currentPnL = (currentPrice - pos.entryPrice) * pos.quantity;
  const peakPrice = Math.max(pos.peakPrice || pos.entryPrice, currentPrice);
  const peakPnL = Math.max(pos.peakPnL || 0, currentPnL);

  return { peakPrice, peakPnL };
}

/**
 * Calculates profit giveback:
 * profitGiveback = peakPnL - currentPnL
 */
export function calculateProfitGiveback(
  peakPnL: number,
  currentPnL: number
): { profitGiveback: number; profitGivebackPct: number } {
  if (peakPnL <= 0) {
    return { profitGiveback: 0, profitGivebackPct: 0 };
  }

  const profitGiveback = Math.max(0, peakPnL - currentPnL);
  const profitGivebackPct = Number(((profitGiveback / peakPnL) * 100).toFixed(2));

  return { profitGiveback, profitGivebackPct };
}

/**
 * Calculates dynamic trailing stop price.
 * As peak price increases, trails stop upwards to protect profits and guarantee breakeven+.
 */
export function calculateTrailingStop(
  entryPrice: number,
  peakPrice: number,
  initialStopLoss: number,
  isAfter130 = false
): number {
  if (peakPrice <= entryPrice) {
    return initialStopLoss;
  }

  const profitDist = peakPrice - entryPrice;

  // Once profit reaches +1.5%, trail stop above entry price to lock in a risk-free trade
  if (profitDist >= entryPrice * 0.015) {
    const lockPercentage = isAfter130 ? 0.75 : 0.6; // After 1:30 PM, lock 75% of peak gains
    const trailPrice = entryPrice + profitDist * lockPercentage;
    return Number(Math.max(initialStopLoss, trailPrice).toFixed(2));
  }

  // Once profit reaches +0.8%, move stop to Breakeven + small buffer
  if (profitDist >= entryPrice * 0.008) {
    return Number((entryPrice * 1.002).toFixed(2));
  }

  return initialStopLoss;
}

/**
 * Evaluates whether profit giveback limit is exceeded.
 */
export function evaluateProfitProtection(
  pos: OpenRiskPosition,
  config: ProfitProtectionConfig = DEFAULT_PROFIT_PROTECTION_CONFIG,
  isAfter130 = false
): {
  isGivebackExceeded: boolean;
  protectedProfit: number;
  riskScorePenalty: number;
  reason: string | null;
} {
  const peakPnL = pos.peakPnL || 0;
  const currentPnL = pos.currentPnL || 0;

  // If trade never reached activation profit (e.g. ₹800), profit protection is not breached
  if (peakPnL < config.activationPnL) {
    return {
      isGivebackExceeded: false,
      protectedProfit: 0,
      riskScorePenalty: 0,
      reason: null,
    };
  }

  const { profitGiveback, profitGivebackPct } = calculateProfitGiveback(peakPnL, currentPnL);

  // Apply tighter limits after 1:30 PM
  const allowedGivebackPct = isAfter130
    ? config.maxGivebackPct * 0.7 // e.g. 17.5% giveback allowed after 1:30 PM
    : config.maxGivebackPct;
  const allowedGivebackPnL = isAfter130
    ? config.maxAllowedGivebackPnL * 0.75
    : config.maxAllowedGivebackPnL;

  const minProtectedPct = isAfter130
    ? Math.min(85, config.minProtectedProfitPct + 15) // Protect 80% after 1:30 PM
    : config.minProtectedProfitPct;
  const protectedProfit = (peakPnL * minProtectedPct) / 100;

  const isGivebackExceeded =
    profitGiveback > allowedGivebackPnL ||
    profitGivebackPct > allowedGivebackPct ||
    currentPnL < protectedProfit;

  let riskScorePenalty = 0;
  let reason: string | null = null;

  if (isGivebackExceeded) {
    riskScorePenalty = isAfter130 ? 30 : 25;
    reason = `⚠️ Profit giveback exceeded (Peak: +₹${Math.round(
      peakPnL
    ).toLocaleString('en-IN')} | Giveback: ₹${Math.round(
      profitGiveback
    ).toLocaleString('en-IN')} / ${profitGivebackPct.toFixed(0)}%)`;
  } else if (profitGivebackPct > 15) {
    riskScorePenalty = 10;
    reason = `Profit pulling back (${profitGivebackPct.toFixed(0)}% from peak)`;
  }

  return {
    isGivebackExceeded,
    protectedProfit: Number(protectedProfit.toFixed(2)),
    riskScorePenalty,
    reason,
  };
}
