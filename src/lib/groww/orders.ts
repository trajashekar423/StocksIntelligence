/**
 * Groww Order Execution Service
 * Handles live order placement, status checks, and positions via Groww Trading API.
 */

import https from 'node:https';
import { GROWW_BASE_URL, buildGrowwHeaders, isGrowwConfigured } from './config.ts';
import type {
  GrowwOrderRequest,
  GrowwOrderResponse,
  GrowwPosition,
  GrowwMargin,
} from '../../types/groww.ts';

async function executeGrowwRequestIpv4(
  urlStr: string,
  method: string,
  headers: Record<string, string>,
  bodyObj?: any
): Promise<{ ok: boolean; status: number; data: any }> {
  const url = new URL(urlStr);
  const data = bodyObj ? JSON.stringify(bodyObj) : '';

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: method,
        family: 4, // Enforce IPv4 whitelisted network interface
        headers: {
          ...headers,
          ...(data ? { 'Content-Length': String(Buffer.byteLength(data)) } : {}),
        },
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => (responseBody += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseBody);
            resolve({
              ok: (res.statusCode ?? 500) >= 200 && (res.statusCode ?? 500) < 300,
              status: res.statusCode ?? 500,
              data: parsed,
            });
          } catch {
            resolve({
              ok: false,
              status: res.statusCode ?? 500,
              data: { error: responseBody },
            });
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    req.setTimeout(8000, () => {
      req.destroy(new Error('Groww API request timed out'));
    });
    if (data) {
      req.write(data);
    }
    req.end();
  });
}

export async function placeGrowwOrder(order: GrowwOrderRequest): Promise<GrowwOrderResponse> {
  if (!isGrowwConfigured()) {
    throw new Error('Groww credentials not configured. Cannot place live orders.');
  }

  // Validate parameters
  if (!order.trading_symbol || !order.quantity || order.quantity <= 0) {
    throw new Error('Invalid order: trading_symbol and positive quantity required.');
  }

  const refId =
    order.order_reference_id && order.order_reference_id.length <= 20
      ? order.order_reference_id
      : `ORD-${Date.now().toString().slice(-10)}-${Math.floor(Math.random() * 899 + 100)}`;

  const payload = {
    trading_symbol: order.trading_symbol.trim().toUpperCase(),
    quantity: Math.floor(order.quantity),
    price: order.price ? Number(order.price.toFixed(2)) : 0,
    trigger_price: order.trigger_price ? Number(order.trigger_price.toFixed(2)) : 0,
    validity: 'DAY',
    exchange: order.exchange || 'NSE',
    segment: order.segment || 'CASH',
    order_type: order.order_type || 'MARKET',
    product: order.product || 'MIS',
    transaction_type: order.transaction_type,
    order_reference_id: refId,
  };

  try {
    const headers = buildGrowwHeaders();
    const result = await executeGrowwRequestIpv4(
      `${GROWW_BASE_URL}/v1/order/create`,
      'POST',
      headers,
      payload
    );

    const data = result.data;

    if (!result.ok || data?.status === 'FAILURE') {
      let errMsg = `Groww API Error ${result.status}`;
      if (typeof data?.error === 'string') errMsg = data.error;
      else if (typeof data?.error?.message === 'string') errMsg = data.error.message;
      else if (typeof data?.message === 'string') errMsg = data.message;

      if (result.status === 403 || result.status === 401) {
        errMsg = `Groww API Auth/IP Issue: "${errMsg}".`;
      }

      return {
        status: 'REJECTED',
        error: errMsg,
        order_reference_id: payload.order_reference_id,
      };
    }

    const orderId =
      data?.payload?.groww_order_id ||
      data?.data?.groww_order_id ||
      data?.groww_order_id ||
      data?.order_id;

    return {
      groww_order_id: orderId,
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

export async function getGrowwPositions(): Promise<GrowwPosition[]> {
  if (!isGrowwConfigured()) return [];

  try {
    const headers = buildGrowwHeaders();
    const res = await executeGrowwRequestIpv4(`${GROWW_BASE_URL}/v1/positions/user`, 'GET', headers);
    if (!res.ok) return [];

    const rawPositions = res.data?.data || res.data?.positions || [];
    return rawPositions.map((p: any) => ({
      trading_symbol: p.trading_symbol || p.symbol,
      exchange: p.exchange || 'NSE',
      segment: p.segment || 'CASH',
      product: p.product || 'MIS',
      quantity: Number(p.quantity || p.net_quantity || 0),
      buy_price: Number(p.buy_price || p.average_buy_price || 0),
      buy_quantity: Number(p.buy_quantity || p.quantity || 0),
      sell_price: Number(p.sell_price || p.average_sell_price || 0),
      sell_quantity: Number(p.sell_quantity || 0),
      realized_pnl: Number(p.realized_pnl || 0),
      unrealized_pnl: Number(p.unrealized_pnl || p.pnl || 0),
      ltp: Number(p.ltp || p.last_price || 0),
      close_price: Number(p.close_price || p.ltp || 0),
    }));
  } catch {
    return [];
  }
}

export async function getGrowwMargins(): Promise<GrowwMargin | null> {
  if (!isGrowwConfigured()) return null;

  try {
    const headers = buildGrowwHeaders();
    const res = await executeGrowwRequestIpv4(`${GROWW_BASE_URL}/v1/margins/user`, 'GET', headers);
    if (!res.ok) return null;

    const data = res.data?.data || res.data;
    return {
      equity_margin_available: Number(data?.equity_margin_available ?? data?.available_margin ?? 0),
      equity_margin_used: Number(data?.equity_margin_used ?? data?.used_margin ?? 0),
      total_margin: Number(data?.total_margin ?? data?.total_balance ?? 0),
    };
  } catch {
    return null;
  }
}
