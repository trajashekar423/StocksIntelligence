/**
 * Groww Trading API Type Definitions
 * Based on official Groww API documentation & schemas
 */

export interface GrowwCredentials {
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  baseUrl: string;
}

export interface GrowwAuthStatus {
  authenticated: boolean;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'MOCK';
  lastChecked: string;
  accountName?: string;
  growwUserId?: string;
  error?: string;
}

export interface GrowwProfile {
  name: string;
  email: string;
  clientCode?: string;
  userId?: string;
  segments?: string[];
  active: boolean;
  availableMargin?: number;
  usedMargin?: number;
  totalBalance?: number;
}

export interface GrowwQuote {
  symbol: string;
  tradingSymbol: string;
  exchange: 'NSE' | 'BSE';
  segment: 'CASH' | 'FNO';
  ltp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  previousClose: number;
  volume: number;
  dayChange?: number;
  dayChangePercentage?: number;
  totalBuyQuantity?: number;
  totalSellQuantity?: number;
  depth?: {
    buy?: Array<{ price: number; quantity: number; orders?: number }>;
    sell?: Array<{ price: number; quantity: number; orders?: number }>;
  };
  timestamp: number;
}

export type GrowwOrderType = 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
export type GrowwProduct = 'MIS' | 'CNC' | 'NRML';
export type GrowwTransactionType = 'BUY' | 'SELL';
export type GrowwOrderState =
  | 'PENDING'
  | 'SUBMITTED'
  | 'OPEN'
  | 'COMPLETE'
  | 'CANCELLED'
  | 'REJECTED'
  | 'TRIGGER_PENDING';

export interface GrowwOrderRequest {
  trading_symbol: string;
  quantity: number;
  price?: number;
  trigger_price?: number;
  exchange?: 'NSE' | 'BSE';
  segment?: 'CASH' | 'FNO';
  order_type: GrowwOrderType;
  product: GrowwProduct;
  transaction_type: GrowwTransactionType;
  order_reference_id?: string;
}

export interface GrowwOrderResponse {
  groww_order_id?: string;
  order_reference_id?: string;
  status: GrowwOrderState;
  message?: string;
  filled_quantity?: number;
  pending_quantity?: number;
  average_price?: number;
  order_timestamp?: string;
  error?: string;
}

export interface GrowwPosition {
  trading_symbol: string;
  exchange: 'NSE' | 'BSE';
  segment: 'CASH' | 'FNO';
  product: GrowwProduct;
  quantity: number;
  buy_price: number;
  buy_quantity: number;
  sell_price: number;
  sell_quantity: number;
  multiplier?: number;
  realized_pnl: number;
  unrealized_pnl: number;
  ltp: number;
  close_price?: number;
}

export interface GrowwMargin {
  equity_margin_available: number;
  equity_margin_used: number;
  total_margin: number;
}

