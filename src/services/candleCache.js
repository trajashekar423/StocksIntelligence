/**
 * Candle Cache
 * Throttled, deduplicated, stale-aware per-symbol candle fetcher.
 * Max CONCURRENT_LIMIT simultaneous requests.
 * Caches results for STALE_MS milliseconds.
 */

import { fetchStockCandles } from './stocksService.js';
import { normalizeCandles } from './indicatorEngine.js';

const STALE_MS = 30_000;        // 30 s
const CONCURRENT_LIMIT = 4;
const RETRY_DELAY_MS = 1_500;

const cache = new Map();        // symbol → { candles, fetchedAt, status }
const inFlight = new Map();     // symbol → Promise
let activeCount = 0;
const queue = [];               // { symbol, resolve, reject }

function processQueue() {
  while (queue.length && activeCount < CONCURRENT_LIMIT) {
    const { symbol, resolve, reject } = queue.shift();
    activeCount++;
    _doFetch(symbol)
      .then(resolve)
      .catch(reject)
      .finally(() => {
        activeCount--;
        processQueue();
      });
  }
}

async function _doFetch(symbol) {
  const sym = symbol.trim().toUpperCase();
  try {
    const res = await fetchStockCandles(sym);
    const candles = normalizeCandles(res.data, sym);
    const entry = {
      candles,
      fetchedAt: Date.now(),
      status: candles.length ? 'valid' : 'empty',
      error: candles.length ? null : 'No candles returned',
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

/**
 * Get candles for a symbol.
 * Returns cached data if fresh, otherwise fetches (deduplicated).
 */
export async function getCandles(symbol) {
  const sym = String(symbol || '').trim().toUpperCase();
  if (!sym) return { candles: [], status: 'no_symbol' };

  const cached = cache.get(sym);
  if (cached && Date.now() - cached.fetchedAt < STALE_MS) {
    return cached;
  }

  // Deduplicate in-flight requests
  if (inFlight.has(sym)) {
    return inFlight.get(sym);
  }

  const promise = enqueue(sym);
  inFlight.set(sym, promise);
  return promise;
}

/**
 * Prefetch candles for a list of symbols concurrently (respects limit).
 * Non-blocking — returns immediately, fills cache in background.
 */
export function prefetchCandles(symbols) {
  for (const sym of symbols) {
    const s = String(sym || '').trim().toUpperCase();
    if (!s) continue;
    const cached = cache.get(s);
    if (cached && Date.now() - cached.fetchedAt < STALE_MS) continue;
    if (inFlight.has(s)) continue;
    const promise = enqueue(s);
    inFlight.set(s, promise);
  }
}

/**
 * Force-invalidate a symbol's cache entry.
 */
export function invalidate(symbol) {
  const sym = String(symbol || '').trim().toUpperCase();
  cache.delete(sym);
}

/**
 * Return stale status for a symbol.
 */
export function getCacheStatus(symbol) {
  const sym = String(symbol || '').trim().toUpperCase();
  const entry = cache.get(sym);
  if (!entry) return { cached: false };
  const ageMs = Date.now() - entry.fetchedAt;
  return {
    cached: true,
    stale: ageMs > STALE_MS,
    ageMs,
    status: entry.status,
    candleCount: entry.candles.length,
  };
}

/**
 * Retry a failed fetch after a short delay.
 */
export async function retryCandles(symbol) {
  await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
  invalidate(symbol);
  return getCandles(symbol);
}
