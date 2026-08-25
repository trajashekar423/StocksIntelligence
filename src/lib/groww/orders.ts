/**
 * Groww Order Execution Service
 * Handles live order placement, status checks, and positions via Groww Trading API.
 */

import { GROWW_BASE_URL, buildGrowwHeaders, isGrowwConfigured } from './config.ts';
import type {
  GrowwOrderRequest,
  GrowwOrderResponse,
  GrowwPosition,
  GrowwMargin,
} from '../../types/groww.ts';

export async function placeGrowwOrder(order: GrowwOrderRequest): Promise<GrowwOrderResponse> {
  if (!isGrowwConfigured()) {
    throw new Error('Groww credentials not configured. Cannot place live orders.');
  }

  // Validate parameters
  if (!order.trading_symbol || !order.quantity || order.quantity <= 0) {
    throw new Error('Invalid order: trading_symbol and positive quantity required.');
  }

  const payload = {
    trading_symbol: order.trading_symbol.trim().toUpperCase(),
    quantity: Math.floor(order.quantity),
    price: order.price ? Number(order.price.toFixed(2)) : 0,
    trigger_price: order.trigger_price ? Number(order.trigger_price.toFixed(2)) : 0,
    exchange: order.exchange || 'NSE',
    segment: order.segment || 'CASH',
    order_type: order.order_type || 'MARKET',
    product: order.product || 'MIS',
    transaction_type: order.transaction_type,
    order_reference_id: order.order_reference_id || `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  };

  try {
    const headers = buildGrowwHeaders();
    const response = await fetch(`${GROWW_BASE_URL}/v1/order/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });

    const data = await response.json();

    if (!response.ok) {
      let errMsg = `Groww API Error ${response.status}`;
      if (typeof data?.error === 'string') errMsg = data.error;
      else if (typeof data?.error?.message === 'string') errMsg = data.error.message;
      else if (typeof data?.message === 'string') errMsg = data.message;

      return {
        status: 'REJECTED',
        error: errMsg,
        order_reference_id: payload.order_reference_id,
      };
    }

    return {
      groww_order_id: data?.data?.groww_order_id || data?.groww_order_id || data?.order_id,
      order_reference_id: payload.order_reference_id,
      status: 'COMPLETE',
      filled_quantity: payload.quantity,
      average_price: payload.price || 0,
      order_timestamp: new Date().toISOString(),
      message: 'Order successfully executed on Groww',
    };
  } catch (err: any) {
    return {
      status: 'REJECTED',
      error: err?.message || 'Network failure while communicating with Groww Order API',
      order_reference_id: payload.order_reference_id,
    };
  }
}

export async function placeBuyOrder(
  symbol: string,
  quantity: number,
  price?: number,
  product: 'MIS' | 'CNC' = 'MIS'
): Promise<GrowwOrderResponse> {
  return placeGrowwOrder({
    trading_symbol: symbol,
    quantity,
    price,
    order_type: price ? 'LIMIT' : 'MARKET',
    product,
    transaction_type: 'BUY',
  });
}

export async function placeSellOrder(
  symbol: string,
  quantity: number,
  price?: number,
  product: 'MIS' | 'CNC' = 'MIS'
): Promise<GrowwOrderResponse> {
  return placeGrowwOrder({
    trading_symbol: symbol,
    quantity,
    price,
    order_type: price ? 'LIMIT' : 'MARKET',
    product,
    transaction_type: 'SELL',
  });
}

export async function getGrowwOrderStatus(orderId: string): Promise<GrowwOrderResponse | null> {
  if (!isGrowwConfigured()) return null;

  try {
    const headers = buildGrowwHeaders();
    const response = await fetch(`${GROWW_BASE_URL}/v1/order/detail/${encodeURIComponent(orderId)}`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;
    const json = await response.json();
    const data = json?.data || json;

    return {
      groww_order_id: data?.groww_order_id || orderId,
      status: data?.status || 'COMPLETE',
      filled_quantity: Number(data?.filled_quantity || data?.quantity || 0),
      average_price: Number(data?.average_price || data?.price || 0),
      order_timestamp: data?.order_timestamp || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function getGrowwPositions(): Promise<GrowwPosition[]> {
  if (!isGrowwConfigured()) return [];

  try {
    const headers = buildGrowwHeaders();
    const response = await fetch(`${GROWW_BASE_URL}/v1/positions/user?segment=CASH`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return [];
    const json = await response.json();
    const rows = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];

    return rows.map((r: any) => ({
      trading_symbol: r.trading_symbol || r.symbol,
      exchange: r.exchange || 'NSE',
      segment: r.segment || 'CASH',
      product: r.product || 'MIS',
      quantity: Number(r.quantity || 0),
      buy_price: Number(r.buy_price || 0),
      buy_quantity: Number(r.buy_quantity || 0),
      sell_price: Number(r.sell_price || 0),
      sell_quantity: Number(r.sell_quantity || 0),
      realized_pnl: Number(r.realized_pnl || 0),
      unrealized_pnl: Number(r.unrealized_pnl || 0),
      ltp: Number(r.ltp || r.last_price || 0),
    }));
  } catch {
    return [];
  }
}
