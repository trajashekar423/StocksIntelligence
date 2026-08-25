/**
 * Groww Market Data Service
 * Normalizes live market data from Groww API and falls back to NSE data when required.
 */

import { GROWW_BASE_URL, buildGrowwHeaders, isGrowwConfigured } from './config.ts';
import type { GrowwQuote } from '../../types/groww.ts';

export interface MarketData {
  symbol: string;
  tradingSymbol: string;
  exchange: string;
  segment: string;
  ltp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  previousClose: number;
  volume: number;
  dayChange: number;
  dayChangePercentage: number;
  totalBuyQuantity: number;
  totalSellQuantity: number;
  depth?: {
    buy?: Array<{ price: number; quantity: number; orders?: number }>;
    sell?: Array<{ price: number; quantity: number; orders?: number }>;
  };
  timestamp: number;
}

export function normalizeGrowwQuote(raw: any, symbol: string): MarketData {
  const ltp = Number(raw?.ltp ?? raw?.last_price ?? raw?.price ?? 0);
  const open = Number(raw?.open ?? raw?.open_price ?? ltp);
  const high = Number(raw?.high ?? raw?.high_price ?? ltp);
  const low = Number(raw?.low ?? raw?.low_price ?? ltp);
  const close = Number(raw?.close ?? raw?.close_price ?? ltp);
  const previousClose = Number(raw?.previous_close ?? raw?.prev_close ?? raw?.prevClose ?? close);
  const volume = Number(raw?.volume ?? raw?.total_traded_volume ?? raw?.trade_quantity ?? 0);
  const dayChange = Number(raw?.day_change ?? (previousClose ? ltp - previousClose : 0));
  const dayChangePercentage = Number(
    raw?.day_change_percentage ?? (previousClose ? ((ltp - previousClose) / previousClose) * 100 : 0)
  );

  return {
    symbol: String(symbol).trim().toUpperCase(),
    tradingSymbol: String(raw?.trading_symbol || symbol).trim().toUpperCase(),
    exchange: raw?.exchange || 'NSE',
    segment: raw?.segment || 'CASH',
    ltp,
    open,
    high,
    low,
    close,
    previousClose,
    volume,
    dayChange,
    dayChangePercentage,
    totalBuyQuantity: Number(raw?.total_buy_quantity ?? raw?.totalBuyQty ?? 0),
    totalSellQuantity: Number(raw?.total_sell_quantity ?? raw?.totalSellQty ?? 0),
    depth: raw?.depth || undefined,
    timestamp: Number(raw?.timestamp || Date.now()),
  };
}

export async function fetchGrowwQuote(symbol: string): Promise<MarketData | null> {
  const cleanSymbol = String(symbol).trim().toUpperCase().replace(/^NSE:/, '').replace(/:.*$/, '');
  if (!cleanSymbol) return null;

  if (isGrowwConfigured()) {
    try {
      const headers = buildGrowwHeaders();
      const url = `${GROWW_BASE_URL}/v1/live-data/quote?exchange=NSE&segment=CASH&trading_symbol=${encodeURIComponent(cleanSymbol)}`;

      const response = await fetch(url, { headers, signal: AbortSignal.timeout(4000) });
      if (response.ok) {
        const json = await response.json();
        const data = json?.data || json;
        if (data) {
          return normalizeGrowwQuote(data, cleanSymbol);
        }
      }
    } catch {
      // Continue to fallback
    }
  }

  // Fallback to internal NSE quote route if Groww is unconfigured or rate limited
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL && process.env.NEXT_PUBLIC_BASE_URL.startsWith('http')
        ? process.env.NEXT_PUBLIC_BASE_URL
        : 'http://127.0.0.1:3000';
    const nseRes = await fetch(`${baseUrl}/api/nse/quote-equity?symbol=${encodeURIComponent(cleanSymbol)}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (nseRes.ok) {
      const nseData = await nseRes.json();
      const priceInfo = nseData?.priceInfo || nseData;
      const ltp = Number(priceInfo?.lastPrice || priceInfo?.ltp || 0);
      if (ltp > 0) {
        return normalizeGrowwQuote({
          trading_symbol: cleanSymbol,
          ltp,
          open: Number(priceInfo?.open || ltp),
          high: Number(priceInfo?.intraDayHighLow?.max || priceInfo?.high || ltp),
          low: Number(priceInfo?.intraDayHighLow?.min || priceInfo?.low || ltp),
          previous_close: Number(priceInfo?.previousClose || ltp),
          volume: Number(nseData?.preOpenMarket?.totalTradedVolume || 0),
          day_change: Number(priceInfo?.change || 0),
          day_change_percentage: Number(priceInfo?.pChange || 0),
          timestamp: Date.now(),
        }, cleanSymbol);
      }
    }
  } catch {
    // ignore
  }

  return null;
}
