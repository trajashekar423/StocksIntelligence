/**
 * Paper Trading Simulation Engine
 * Simulates realistic order fills, tick-by-tick position monitoring, monotonic trailing stop-loss, and exit conditions.
 */

import type { Position, PositionStatus, TradingConfig } from '../../types/trading.ts';
import { getStore, savePosition, removeOpenPosition, addLog } from './store.ts';
import { getTradingConfig } from './config.ts';

export function executePaperBuy(params: {
  symbol: string;
  entryPrice: number;
  quantity: number;
  stopLoss?: number;
  target?: number;
  config?: TradingConfig;
}): Position {
  const { symbol, entryPrice, quantity, config = getTradingConfig() } = params;
  const cleanSymbol = symbol.trim().toUpperCase();

  const sl = params.stopLoss ?? Number((entryPrice * (1 - config.stopLossPct / 100)).toFixed(2));
  const riskPerShare = Math.max(entryPrice - sl, entryPrice * 0.005);
  const tgt = params.target ?? Number((entryPrice + riskPerShare * 2).toFixed(2));

  const position: Position = {
    id: `PAPER-${Date.now()}-${cleanSymbol}`,
    symbol: cleanSymbol,
    exchange: 'NSE',
    side: 'LONG',
    mode: 'PAPER',
    entryPrice: Number(entryPrice.toFixed(2)),
    currentPrice: Number(entryPrice.toFixed(2)),
    quantity: Math.max(1, Math.floor(quantity)),
    stopLoss: Number(sl.toFixed(2)),
    target1: Number(tgt.toFixed(2)),
    target2: Number((entryPrice + riskPerShare * 3).toFixed(2)),
    trailingStop: Number(sl.toFixed(2)),
    trailingHighWater: Number(entryPrice.toFixed(2)),
    unrealizedPnL: 0,
    unrealizedPnLPercent: 0,
    status: 'OPEN',
    entryTime: new Date().toISOString(),
    orderReferenceId: `SIM-ORD-${Date.now()}`,
  };

  savePosition(position);

  addLog(
    'SUCCESS',
    'ORDER',
    `PAPER BUY ${position.quantity} shares of ${position.symbol} @ ₹${position.entryPrice} (SL: ₹${position.stopLoss}, Target: ₹${position.target1})`,
    position.symbol,
    { quantity: position.quantity, entryPrice: position.entryPrice, stopLoss: position.stopLoss, target: position.target1 }
  );

  return position;
}

export function updatePositionPrice(
  position: Position,
  currentPrice: number,
  config = getTradingConfig()
): { position: Position; shouldExit: boolean; exitReason?: string; exitStatus?: PositionStatus } {
  const pnl = (currentPrice - position.entryPrice) * position.quantity * (position.side === 'LONG' ? 1 : -1);
  const pnlPct = ((currentPrice - position.entryPrice) / position.entryPrice) * 100 * (position.side === 'LONG' ? 1 : -1);

  let trailingHighWater = position.trailingHighWater;
  let trailingStop = position.trailingStop;

  // Monotonic Trailing Stop: Move upward as price makes new highs (Never move downward)
  if (position.side === 'LONG' && currentPrice > trailingHighWater) {
    trailingHighWater = currentPrice;
    const trailDistance = currentPrice * (config.trailingStopDistancePct / 100);
    const newTrailingSL = Number((currentPrice - trailDistance).toFixed(2));
    if (newTrailingSL > trailingStop) {
      trailingStop = newTrailingSL;
    }
  }

  const updated: Position = {
    ...position,
    currentPrice: Number(currentPrice.toFixed(2)),
    unrealizedPnL: Number(pnl.toFixed(2)),
    unrealizedPnLPercent: Number(pnlPct.toFixed(2)),
    trailingHighWater,
    trailingStop,
  };

  // Exit Check 1: Target 1 Hit
  if (position.side === 'LONG' && currentPrice >= position.target1) {
    return {
      position: updated,
      shouldExit: true,
      exitReason: `Target reached @ ₹${currentPrice} (Target ₹${position.target1})`,
      exitStatus: 'TARGET_HIT',
    };
  }

  // Exit Check 2: Trailing Stop Hit
  if (position.side === 'LONG' && currentPrice <= trailingStop && trailingStop > position.stopLoss) {
    return {
      position: updated,
      shouldExit: true,
      exitReason: `Trailing Stop hit @ ₹${currentPrice} (Trailing SL ₹${trailingStop})`,
      exitStatus: 'TRAILING_STOP_HIT',
    };
  }

  // Exit Check 3: Initial Stop Loss Hit
  if (position.side === 'LONG' && currentPrice <= position.stopLoss) {
    return {
      position: updated,
      shouldExit: true,
      exitReason: `Stop Loss hit @ ₹${currentPrice} (SL ₹${position.stopLoss})`,
      exitStatus: 'STOP_LOSS_HIT',
    };
  }

  savePosition(updated);
  return { position: updated, shouldExit: false };
}

export function closePaperPosition(positionId: string, currentPrice?: number, reason = 'Manual Exit'): Position | null {
  const store = getStore();
  const pos = store.positions.find((p) => p.id === positionId);
  if (!pos) return null;

  const exitPrice = currentPrice ?? pos.currentPrice;
  const closed = removeOpenPosition(positionId, exitPrice, reason);

  if (closed) {
    addLog(
      closed.realizedPnL && closed.realizedPnL >= 0 ? 'SUCCESS' : 'WARNING',
      'POSITION',
      `CLOSED ${closed.symbol} @ ₹${closed.exitPrice} | Realized P&L: ₹${closed.realizedPnL?.toFixed(2)} (${reason})`,
      closed.symbol,
      { realizedPnL: closed.realizedPnL, exitPrice: closed.exitPrice, reason }
    );
  }

  return closed;
}
