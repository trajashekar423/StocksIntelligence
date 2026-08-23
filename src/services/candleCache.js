/**
 * Candle Cache — throttled, deduplicated, stale-aware per-symbol fetcher.
 * Cache key: normalizeSymbol(symbol) — always clean, no series suffix.
 *
 * Each cache entry: { candles, fetchedAt, status, error, tradingDate, sessionType }
 * status: 'valid' | 'empty' | 'error' | 'no_symbol'
 */

import { fetchIntradayCandles } from './stocksService.js';
import { normalizeCandles } from './indicatorEngine.js';

const STALE_MS = 30_000;
const CONCURRENT_LIMIT = 4;
const RETRY_DELAY_MS = 1_500;

// Diagnostics — exported so UI can display them
export const diagnostics = {
  requested: 0,
  successful: 0,
  empty: 0,
  failed: 0,
  bySymbol: new Map(), // symbol → { status, candleCount, error, tradingDate }
};

const cache = new Map();    // symbol → entry
const inFlight = new Map(); // symbol → Promise
let activeCount = 0;
const queue = [];

/** Strip series suffix and uppercase: MOTISONS:1 → MOTISONS */
export function normalizeSymbol(symbol) {
  return String(symbol || '').trim().toUpperCase().replace(/:.*$/, '').replace(/\.NS$/, '').replace(/^NSE:/, '');
}

function processQueue() {
  while (queue.length && activeCount < CONCURRENT_LIMIT) {
    const { symbol, resolve, reject } = queue.shift();
    activeCount++;
    _doFetch(symbol)
      .then(resolve)
      .catch(reject)
      .finally(() => { activeCount--; processQueue(); });
  }
}

async function _doFetch(symbol) {
  const sym = normalizeSymbol(symbol);
  diagnostics.requested++;
  try {
    const res = await fetchIntradayCandles(sym);

    // fetchIntradayCandles returns { ok, symbol, raw, candles:[] }
    // raw is the full parsed NSE JSON — pass it through normalizeCandles
    const rawPayload = res.raw ?? res.data ?? null;
    const candles = normalizeCandles(rawPayload, sym);

    // Determine trading date from first candle timestamp
    let tradingDate = null;
    if (candles.length) {
      const ts = candles[0].timestamp;
      const d = ts instanceof Date ? ts : new Date(ts);
      if (!isNaN(d.getTime())) {
        const pad = (n) => String(n).padStart(2, '0');
        tradingDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      }
    }

    const status = candles.length ? 'valid' : 'empty';
    const entry = {
      candles,
      fetchedAt: Date.now(),
      status,
      error: candles.length ? null : (res.error || 'No candles in response'),
      tradingDate,
      sessionType: candles.length ? 'LAST_AVAILABLE' : 'NONE',
    };
    cache.set(sym, entry);

    // Update diagnostics
    if (candles.length) diagnostics.successful++;
    else diagnostics.empty++;
    diagnostics.bySymbol.set(sym, { status, candleCount: candles.length, error: entry.error, tradingDate });

    return entry;
  } catch (err) {
    diagnostics.failed++;
    const entry = { candles: [], fetchedAt: Date.now(), status: 'error', error: err?.message || String(err), tradingDate: null, sessionType: 'NONE' };
    cache.set(sym, entry);
    diagnostics.bySymbol.set(sym, { status: 'error', candleCount: 0, error: entry.error, tradingDate: null });
    return entry;
  } finally {
    inFlight.delete(sym);
  }
}

function enqueue(symbol) {
  return new Promise((resolve, reject) => {
    queue.push({ symbol, resolve, reject });
    processQueue();
  });
}

export async function getCandles(symbol) {
  const sym = normalizeSymbol(symbol);
  if (!sym) return { candles: [], status: 'no_symbol', tradingDate: null };
  const cached = cache.get(sym);
  if (cached && Date.now() - cached.fetchedAt < STALE_MS) return cached;
  if (inFlight.has(sym)) return inFlight.get(sym);
  const promise = enqueue(sym);
  inFlight.set(sym, promise);
  return promise;
}

export function prefetchCandles(symbols) {
  for (const sym of symbols) {
    const s = normalizeSymbol(sym);
    if (!s) continue;
    const cached = cache.get(s);
    if (cached && Date.now() - cached.fetchedAt < STALE_MS) continue;
    if (inFlight.has(s)) continue;
    const promise = enqueue(s);
    inFlight.set(s, promise);
  }
}

export function invalidate(symbol) {
  cache.delete(normalizeSymbol(symbol));
}

export function getCacheStatus(symbol) {
  const sym = normalizeSymbol(symbol);
  const entry = cache.get(sym);
  if (!entry) return { cached: false, status: 'not_fetched' };
  return {
    cached: true,
    stale: Date.now() - entry.fetchedAt > STALE_MS,
    ageMs: Date.now() - entry.fetchedAt,
    status: entry.status,
    candleCount: entry.candles.length,
    tradingDate: entry.tradingDate,
    error: entry.error,
  };
}

export function getDiagnostics() {
  return {
    requested: diagnostics.requested,
    successful: diagnostics.successful,
    empty: diagnostics.empty,
    failed: diagnostics.failed,
    bySymbol: Object.fromEntries(diagnostics.bySymbol),
  };
}

export async function retryCandles(symbol) {
  await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
  invalidate(symbol);
  return getCandles(symbol);
}
