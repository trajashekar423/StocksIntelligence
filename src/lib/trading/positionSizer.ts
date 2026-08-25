/**
 * Risk-Based Position Sizing Calculator
 * Ensures positions strictly adhere to account risk limits and capital constraints.
 */

export interface PositionSizingResult {
  quantity: number;
  entryPrice: number;
  stopLoss: number;
  target: number;
  riskPerShare: number;
  totalRiskAmount: number;
  totalPositionValue: number;
  potentialProfit: number;
  potentialLoss: number;
  riskReward: number;
  constrainedBy: 'RISK_PER_TRADE' | 'MAX_POSITION_VALUE' | 'AVAILABLE_CAPITAL' | 'MIN_QUANTITY';
}

export interface PositionSizingInput {
  capital: number;
  riskPerTradePct: number;
  maxPositionValue: number;
  entryPrice: number;
  stopLoss: number;
  target: number;
  availableFunds?: number;
}

export function calculatePositionSize(input: PositionSizingInput): PositionSizingResult {
  const {
    capital,
    riskPerTradePct,
    maxPositionValue,
    entryPrice,
    stopLoss,
    target,
    availableFunds = capital,
  } = input;

  if (entryPrice <= 0) {
    throw new Error('Entry price must be greater than zero.');
  }

  // Calculate maximum cash risk allowed for this trade
  const maxRiskAmount = Math.max(1, capital * (riskPerTradePct / 100));

  // Risk per share = Entry - StopLoss (enforce minimum 0.5% buffer to avoid zero division)
  const actualRiskPerShare = Math.abs(entryPrice - stopLoss);
  const minRiskPerShare = entryPrice * 0.005; // 0.5% min
  const riskPerShare = Math.max(actualRiskPerShare, minRiskPerShare);

  // Raw quantities by each constraint
  const qtyByRisk = Math.floor(maxRiskAmount / riskPerShare);
  const qtyByMaxValue = Math.floor(maxPositionValue / entryPrice);
  const qtyByCapital = Math.floor(availableFunds / entryPrice);

  let quantity = Math.min(qtyByRisk, qtyByMaxValue, qtyByCapital);
  let constrainedBy: PositionSizingResult['constrainedBy'] = 'RISK_PER_TRADE';

  if (quantity === qtyByMaxValue && qtyByMaxValue < qtyByRisk) {
    constrainedBy = 'MAX_POSITION_VALUE';
  } else if (quantity === qtyByCapital && qtyByCapital < qtyByRisk) {
    constrainedBy = 'AVAILABLE_CAPITAL';
  }

  // Ensure at least 1 share if affordable
  if (quantity < 1 && availableFunds >= entryPrice) {
    quantity = 1;
    constrainedBy = 'MIN_QUANTITY';
  } else if (quantity < 1) {
    quantity = 0;
  }

  const totalPositionValue = Number((quantity * entryPrice).toFixed(2));
  const potentialLoss = Number((quantity * riskPerShare).toFixed(2));
  const potentialProfit = Number((quantity * Math.abs(target - entryPrice)).toFixed(2));
  const riskReward = riskPerShare > 0 ? Number((Math.abs(target - entryPrice) / riskPerShare).toFixed(2)) : 1.5;

  return {
    quantity,
    entryPrice,
    stopLoss,
    target,
    riskPerShare: Number(riskPerShare.toFixed(2)),
    totalRiskAmount: potentialLoss,
    totalPositionValue,
    potentialProfit,
    potentialLoss,
    riskReward,
    constrainedBy,
  };
}

