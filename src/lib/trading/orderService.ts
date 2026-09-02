/**
 * Master Order Orchestrator
 * Dispatches orders to Paper Simulation or Groww Live API based on validated TRADING_MODE.
 */

import type { Position, TradingConfig } from '../../types/trading.ts';
import { getStore, addLog, savePosition, removeOpenPosition } from './store.ts';
import { getTradingConfig } from './config.ts';
import { validatePreTrade } from './riskManager.ts';
import { calculatePositionSize } from './positionSizer.ts';
import { executePaperBuy, closePaperPosition, updatePositionPrice } from './paperEngine.ts';
import { placeBuyOrder, placeSellOrder, getGrowwPositions } from '../groww/orders.ts';
import { fetchGrowwQuote } from '../groww/marketData.ts';

export interface BuyOrderParams {
  symbol: string;
  side?: 'LONG' | 'SHORT';
  entryPrice?: number;
  stopLoss?: number;
  target?: number;
  quantity?: number;
  customConfig?: Partial<TradingConfig>;
}

export async function submitBuyOrder(params: BuyOrderParams): Promise<{
  success: boolean;
  position?: Position;
  error?: string;
  code?: string;
  sizing?: any;
}> {
  const store = getStore();
  const config = { ...store.config, ...(params.customConfig || {}) };
  const cleanSymbol = params.symbol.trim().toUpperCase();

  // 1. Fetch current price if not provided
  let entryPrice = params.entryPrice;
  if (!entryPrice || entryPrice <= 0) {
    const quote = await fetchGrowwQuote(cleanSymbol);
    if (!quote || quote.ltp <= 0) {
      return {
        success: false,
        error: `Could not fetch live market price for ${cleanSymbol}.`,
        code: 'PRICE_UNAVAILABLE',
      };
    }
    entryPrice = quote.ltp;
  }

  // 2. Derive Stop Loss and Target if omitted
  const stopLoss = params.stopLoss ?? Number((entryPrice * (1 - config.stopLossPct / 100)).toFixed(2));
  const riskPerShare = Math.max(entryPrice - stopLoss, entryPrice * 0.005);
  const target = params.target ?? Number((entryPrice + riskPerShare * 2).toFixed(2));

  // 3. Compute Risk-based Quantity
  let quantity = params.quantity;
  const sizing = calculatePositionSize({
    capital: config.capital,
    riskPerTradePct: config.riskPerTradePct,
    maxPositionValue: config.maxPositionValue,
    entryPrice,
    stopLoss,
    target,
  });

  if (!quantity || quantity <= 0) {
    quantity = sizing.quantity;
  }

  // 4. Pre-Trade Risk Validation (11 rules)
  const validation = validatePreTrade({
    symbol: cleanSymbol,
    side: params.side || 'LONG',
    entryPrice,
    stopLoss,
    target,
    quantity,
    config,
  });

  if (!validation.allowed) {
    addLog('WARNING', 'RISK', `Order rejected: ${validation.reason} (${cleanSymbol})`, cleanSymbol, {
      code: validation.code,
      reason: validation.reason,
    });
    return {
      success: false,
      error: validation.reason,
      code: validation.code,
      sizing,
    };
  }

  // 5. Execute according to TRADING_MODE
  if (config.mode === 'PAPER') {
    const position = executePaperBuy({
      symbol: cleanSymbol,
      entryPrice,
      quantity,
      stopLoss,
      target,
      config,
    });

    return {
      success: true,
      position,
      sizing,
    };
  }

  // 6. LIVE TRADING: Execute on Groww API
  try {
    addLog('ALERT', 'ORDER', `Submitting LIVE BUY order for ${quantity}x ${cleanSymbol} @ ₹${entryPrice} to Groww API...`, cleanSymbol);
    const growwRes = await placeBuyOrder(cleanSymbol, quantity, undefined, 'MIS');

    if (growwRes.status === 'REJECTED' || !growwRes.groww_order_id) {
      addLog('ERROR', 'ORDER', `Groww LIVE order rejected: ${growwRes.error || 'Unknown error'}`, cleanSymbol);
      return {
        success: false,
        error: growwRes.error || 'Groww rejected order placement.',
        code: 'GROWW_ORDER_REJECTED',
      };
    }

    const livePosition: Position = {
      id: `LIVE-${growwRes.groww_order_id}`,
      symbol: cleanSymbol,
      exchange: 'NSE',
      side: 'LONG',
      mode: 'LIVE',
      entryPrice: Number(entryPrice.toFixed(2)),
      currentPrice: Number(entryPrice.toFixed(2)),
      quantity,
      stopLoss,
      target1: target,
      target2: Number((entryPrice + riskPerShare * 3).toFixed(2)),
      trailingStop: stopLoss,
      trailingHighWater: entryPrice,
      unrealizedPnL: 0,
      unrealizedPnLPercent: 0,
      status: 'OPEN',
      entryTime: new Date().toISOString(),
      growwOrderId: growwRes.groww_order_id,
      orderReferenceId: growwRes.order_reference_id,
    };

    savePosition(livePosition);
    addLog('SUCCESS', 'ORDER', `LIVE BUY ${quantity}x ${cleanSymbol} executed on Groww (Order ID: ${growwRes.groww_order_id})`, cleanSymbol);

    return {
      success: true,
      position: livePosition,
      sizing,
    };
  } catch (err: any) {
    addLog('ERROR', 'ORDER', `LIVE order execution failure: ${err?.message}`, cleanSymbol);
    return {
      success: false,
      error: err?.message || 'Failed to place live order on Groww.',
      code: 'LIVE_EXECUTION_ERROR',
    };
  }
}

export async function submitCloseOrder(positionId: string): Promise<{ success: boolean; closedPosition?: Position; error?: string }> {
  const store = getStore();
  const pos = store.positions.find((p) => p.id === positionId);
  if (!pos) {
    return { success: false, error: 'Position not found' };
  }

  // Fetch latest price for accurate exit
  const quote = await fetchGrowwQuote(pos.symbol);
  const exitPrice = quote?.ltp ?? pos.currentPrice;

  if (pos.mode === 'PAPER') {
    const closed = closePaperPosition(positionId, exitPrice, 'Manual Exit');
    return { success: true, closedPosition: closed || undefined };
  }

  // LIVE Close Handling
  try {
    addLog('ALERT', 'ORDER', `Closing tracking position for ${pos.quantity}x ${pos.symbol}...`, pos.symbol);
    const growwRes = await placeSellOrder(pos.symbol, pos.quantity, undefined, 'MIS');

    if (growwRes.status === 'COMPLETE' && growwRes.groww_order_id) {
      const closed = removeOpenPosition(positionId, exitPrice, `Live Exit (Groww Order ID: ${growwRes.groww_order_id})`);
      addLog('SUCCESS', 'ORDER', `LIVE position ${pos.symbol} executed on Groww (ID: ${growwRes.groww_order_id}).`, pos.symbol);
      return { success: true, closedPosition: closed || undefined };
    } else {
      const closed = removeOpenPosition(positionId, exitPrice, `Manual Dashboard Exit (Broker offline / market closed)`);
      addLog('SUCCESS', 'ORDER', `Dashboard tracking for ${pos.symbol} closed. (Note: Real shares remain in your Groww account)`, pos.symbol);
      return { success: true, closedPosition: closed || undefined };
    }
  } catch (err: any) {
    // If Groww credentials are not configured, close from local dashboard gracefully
    const closed = removeOpenPosition(positionId, exitPrice, `Dashboard Exit`);
    addLog('INFO', 'ORDER', `Dashboard position ${pos.symbol} closed. (Real shares in Groww remain untouched).`, pos.symbol);
    return { success: true, closedPosition: closed || undefined };
  }
}

export async function syncAllPositions(): Promise<Position[]> {
  const store = getStore();
  const updatedList: Position[] = [];

  for (const pos of store.positions) {
    try {
      const quote = await fetchGrowwQuote(pos.symbol);
      if (quote && quote.ltp > 0) {
        const updateResult = updatePositionPrice(pos, quote.ltp, store.config);

        if (updateResult.shouldExit) {
          // Auto exit on Target or Trailing Stop
          if (pos.mode === 'PAPER') {
            closePaperPosition(pos.id, quote.ltp, updateResult.exitReason);
          } else {
            submitCloseOrder(pos.id);
          }
        } else {
          updatedList.push(updateResult.position);
        }
      } else {
        updatedList.push(pos);
      }
    } catch {
      updatedList.push(pos);
    }
  }

  return updatedList;
}
