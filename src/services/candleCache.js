/**
 * Candle Cache — throttled, deduplicated, stale-aware per-symbol fetcher.
 * Uses fetchIntradayCandles → normalizeCandles pipeline.
 * Cache key: symbol (clean, no series suffix).
 */

import { fetchIntradayCandles } from './stocksService.js';
import { normalizeCandles } from './indicatorEngine.js';

const STALE_MS = 30_000;
const CONCURRENT_LIMIT = 4;
const RETRY_DELAY_MS = 1_500;

const cache = new Map();    // symbol → { candles, fetchedAt, status, error }
const inFlight = new Map(); // symbol → Promise
let activeCount = 0;
const queue = [];           // { symbol, resolve, reject }

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
  const sym = symbol.trim().toUpperCase().replace(/:.*$/, '');
  try {
    const res = await fetchIntradayCandles(sym);
    // res.raw is the raw NSE JSON; normalize it into [{timestamp,open,high,low,close,volume}]
    const candles = normalizeCandles(res.raw ?? res.data ?? null, sym);
    const entry = {
      candles,
      fetchedAt: Date.now(),
      status: candles.length ? 'valid' : 'empty',
      error: candles.length ? null : (res.error || 'No candles returned'),
    };
    cache.set(sym, entry);
    return entry;
  } catch (err) {
    const entry = { candles: [], fetchedAt: Date.now(), status: 'error', error: err?.message || String(err) };
    cache.set(sym, entry);
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
  const sym = String(symbol || '').trim().toUpperCase().replace(/:.*$/, '');
  if (!sym) return { candles: [], status: 'no_symbol' };
  const cached = cache.get(sym);
  if (cached && Date.now() - cached.fetchedAt < STALE_MS) return cached;
  if (inFlight.has(sym)) return inFlight.get(sym);
  const promise = enqueue(sym);
  inFlight.set(sym, promise);
  return promise;
}

export function prefetchCandles(symbols) {
  for (const sym of symbols) {
    const s = String(sym || '').trim().toUpperCase().replace(/:.*$/, '');
    if (!s) continue;
    const cached = cache.get(s);
    if (cached && Date.now() - cached.fetchedAt < STALE_MS) continue;
    if (inFlight.has(s)) continue;
    const promise = enqueue(s);
    inFlight.set(s, promise);
  }
}

export function invalidate(symbol) {
  cache.delete(String(symbol || '').trim().toUpperCase().replace(/:.*$/, ''));
}

export function getCacheStatus(symbol) {
  const sym = String(symbol || '').trim().toUpperCase().replace(/:.*$/, '');
  const entry = cache.get(sym);
  if (!entry) return { cached: false };
  return { cached: true, stale: Date.now() - entry.fetchedAt > STALE_MS, ageMs: Date.now() - entry.fetchedAt, status: entry.status, candleCount: entry.candles.length };
}

export async function retryCandles(symbol) {
  await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
  invalidate(symbol);
  return getCandles(symbol);
}
