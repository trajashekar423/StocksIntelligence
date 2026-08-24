import { getNSEParts } from '../utils/nseTime.js';
/**
 * Universal NSE Indicator Engine
 * Computes VWAP, RSI(14), ADX(14), RVOL, ORB, EMA9/20/50, MACD, ATR, candle patterns
 * from a normalized candle array: [{ timestamp, open, high, low, close, volume }]
 */

const NSE_OPEN_HOUR = 9;
const NSE_OPEN_MIN = 15;
const ORB_MINUTES = 15;

function toN(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const p = Number(String(v).replace(/,/g, ''));
  return Number.isFinite(p) ? p : 0;
}

function valid(v) { return typeof v === 'number' && Number.isFinite(v) && v !== 0; }

/* ── Candle normalizer ─────────────────────────────────── */

/**
 * Normalize any NSE chart-databyindex response into
 * [{ timestamp: Date, open, high, low, close, volume }]
 * Handles all known NSE response shapes exhaustively.
 */
export function normalizeCandles(raw, symbol) {
  if (!raw) return [];

  // Walk every possible nesting level NSE uses
  const candidates = [
    raw?.grapthData,
    raw?.graphData,
    raw?.data?.grapthData,
    raw?.data?.graphData,
    raw?.candles,
    raw?.data?.candles,
    // Some NSE responses wrap in { data: { data: [...] } }
    raw?.data?.data,
    // Top-level array
    Array.isArray(raw) ? raw : null,
  ];

  const graph = candidates.find((c) => Array.isArray(c) && c.length > 0);

  if (graph) {
    // Each element is either [ts, o, h, l, c, v] or an object
    const result = [];
    for (const row of graph) {
      let ts, open, high, low, close, volume;
      if (Array.isArray(row)) {
        if (row.length < 4) continue;
        ts = row[0];
        open  = toN(row[1]);
        high  = toN(row[2]);
        low   = toN(row[3]);
        close = toN(row[4] ?? row[3]);
        volume = toN(row[5] ?? 0);
      } else if (row && typeof row === 'object') {
        ts = row.timestamp ?? row.time ?? row.date ?? row.t;
        open  = toN(row.open  ?? row.o);
        high  = toN(row.high  ?? row.h);
        low   = toN(row.low   ?? row.l);
        close = toN(row.close ?? row.c ?? row.ltp);
        volume = toN(row.volume ?? row.v ?? row.vol ?? 0);
      } else {
        continue;
      }
      if (!open || !high || !low || !close) continue;
      // Parse timestamp — NSE uses epoch ms, ISO strings, or DD-MMM-YYYY HH:MM
      let timestamp;
      if (ts instanceof Date) {
        timestamp = ts;
      } else if (typeof ts === 'number') {
        // epoch ms or epoch seconds
        timestamp = new Date(ts > 1e10 ? ts : ts * 1000);
      } else if (typeof ts === 'string') {
        // Try direct parse first
        timestamp = new Date(ts);
        if (isNaN(timestamp.getTime())) {
          // NSE format: "21-Aug-2026 09:15" or "21-Aug-2026"
          const m = ts.match(/(\d{1,2})[-/](\w+)[-/](\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
          if (m) {
            const months = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
            const mo = months[m[2]] ?? parseInt(m[2], 10) - 1;
            const y = parseInt(m[3], 10);
            const day = parseInt(m[1], 10);
            const hour = parseInt(m[4] || '9', 10);
            const minute = parseInt(m[5] || '15', 10);
            // NSE timestamps without an offset are IST. Convert IST to UTC explicitly.
            timestamp = new Date(Date.UTC(y, mo, day, hour, minute) - (5.5 * 60 * 60 * 1000));
          }
        }
      } else {
        continue;
      }
      if (!timestamp || isNaN(timestamp.getTime())) continue;
      result.push({ symbol, timestamp, open, high, low, close, volume });
    }
    if (result.length) return result;
  }

  // Parallel arrays format: { timestamp: [...], open: [...], high: [...], ... }
  const timestamps = raw?.timestamp || raw?.data?.timestamp || raw?.timestamps || [];
  const opens   = raw?.open   || raw?.data?.open   || [];
  const highs   = raw?.high   || raw?.data?.high   || [];
  const lows    = raw?.low    || raw?.data?.low    || [];
  const closes  = raw?.close  || raw?.data?.close  || [];
  const volumes = raw?.volume || raw?.data?.volume || [];

  if (Array.isArray(timestamps) && timestamps.length) {
    const result = [];
    for (let i = 0; i < timestamps.length; i++) {
      const open  = toN(opens[i]);
      const high  = toN(highs[i]);
      const low   = toN(lows[i]);
      const close = toN(closes[i]);
      const volume = toN(volumes[i] ?? 0);
      if (!open || !high || !low || !close) continue;
      const ts = timestamps[i];
      let timestamp = ts instanceof Date ? ts : new Date(ts);
      if (isNaN(timestamp.getTime())) continue;
      result.push({ symbol, timestamp, open, high, low, close, volume });
    }
    return result;
  }

  return [];
}

/* ── EMA series ────────────────────────────────────────── */

export function emaSeries(values, period) {
  const result = Array(values.length).fill(null);
  if (values.length < period) return result;
  const k = 2 / (period + 1);
  let ema = values.slice(0, period).reduce((s, v) => s + v, 0) / period;
  result[period - 1] = ema;
  for (let i = period; i < values.length; i++) {
    ema = (values[i] - ema) * k + ema;
    result[i] = ema;
  }
  return result;
}

export function emaLast(values, period) {
  const s = emaSeries(values, period);
  return s.at(-1) ?? null;
}

/* ── VWAP ──────────────────────────────────────────────── */

export function calcVWAP(candles) {
  let pv = 0, vol = 0;
  for (const c of candles) {
    const v = toN(c.volume);
    if (!v) continue;
    pv += ((c.high + c.low + c.close) / 3) * v;
    vol += v;
  }
  if (!vol) return { value: null, status: 'no_volume' };
  return { value: pv / vol, status: 'valid', source: 'intraday_candles' };
}

/* ── RSI(14) Wilder ────────────────────────────────────── */

export function calcRSI(closes, period = 14) {
  if (!Array.isArray(closes) || closes.length <= period) {
    return { value: null, status: 'insufficient_history', required: period + 1, got: closes?.length ?? 0 };
  }
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gains += d; else losses -= d;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    const g = d > 0 ? d : 0;
    const l = d < 0 ? -d : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
  }
  if (avgLoss === 0) return { value: 100, status: 'valid' };
  const rs = avgGain / avgLoss;
  return { value: 100 - 100 / (1 + rs), status: 'valid' };
}

/* ── ADX(14) Wilder ────────────────────────────────────── */

export function calcADX(candles, period = 14) {
  if (!Array.isArray(candles) || candles.length < period * 2) {
    return {
      adx: null, plusDI: null, minusDI: null,
      status: 'insufficient_history', required: period * 2, got: candles?.length ?? 0,
    };
  }

  const trs = [], plusDMs = [], minusDMs = [];
  for (let i = 1; i < candles.length; i++) {
    const cur = candles[i], prev = candles[i - 1];
    const upMove   = cur.high  - prev.high;
    const downMove = prev.low  - cur.low;
    const plusDM   = upMove > downMove && upMove > 0 ? upMove : 0;
    const minusDM  = downMove > upMove && downMove > 0 ? downMove : 0;
    const tr = Math.max(cur.high - cur.low, Math.abs(cur.high - prev.close), Math.abs(cur.low - prev.close));
    trs.push(tr);
    plusDMs.push(plusDM);
    minusDMs.push(minusDM);
  }

  // Wilder smoothing
  function wilderSmooth(arr, p) {
    let sum = arr.slice(0, p).reduce((s, v) => s + v, 0);
    const out = [sum];
    for (let i = p; i < arr.length; i++) {
      sum = sum - sum / p + arr[i];
      out.push(sum);
    }
    return out;
  }

  const smoothTR  = wilderSmooth(trs, period);
  const smoothPDM = wilderSmooth(plusDMs, period);
  const smoothMDM = wilderSmooth(minusDMs, period);

  const dxArr = [];
  for (let i = 0; i < smoothTR.length; i++) {
    const tr = smoothTR[i];
    if (!tr) continue;
    const pdi = (smoothPDM[i] / tr) * 100;
    const mdi = (smoothMDM[i] / tr) * 100;
    const dx  = Math.abs(pdi - mdi) / (pdi + mdi || 1) * 100;
    dxArr.push({ pdi, mdi, dx });
  }

  if (dxArr.length < period) {
    return { adx: null, plusDI: null, minusDI: null, status: 'insufficient_history' };
  }

  let adx = dxArr.slice(0, period).reduce((s, d) => s + d.dx, 0) / period;
  for (let i = period; i < dxArr.length; i++) {
    adx = (adx * (period - 1) + dxArr[i].dx) / period;
  }

  const last = dxArr.at(-1);
  return { adx, plusDI: last.pdi, minusDI: last.mdi, status: 'valid' };
}

/* ── ATR(14) ───────────────────────────────────────────── */

export function calcATR(candles, period = 14) {
  if (!Array.isArray(candles) || candles.length < period + 1) {
    return { value: null, status: 'insufficient_history' };
  }
  const trs = [];
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i], p = candles[i - 1];
    trs.push(Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close)));
  }
  let atr = trs.slice(0, period).reduce((s, v) => s + v, 0) / period;
  for (let i = period; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
  }
  return { value: atr, status: 'valid' };
}

/* ── RVOL ──────────────────────────────────────────────── */

/**
 * Time-of-day normalized RVOL.
 * Groups candles by minute-of-day, computes average volume per slot,
 * compares current candle volume to that average.
 */
export function calcRVOL(candles, currentVolume, averageVolume) {
  // Prefer time-normalized if we have enough candles
  if (Array.isArray(candles) && candles.length >= 10) {
    const byMinute = new Map();
    for (const c of candles) {
      if (!c.timestamp) continue;
      const d = c.timestamp instanceof Date ? c.timestamp : new Date(c.timestamp);
      if (isNaN(d.getTime())) continue;
      const n = getNSEParts(d);
        const key = n.minutes;
      if (!byMinute.has(key)) byMinute.set(key, []);
      byMinute.get(key).push(toN(c.volume));
    }
    // Use last candle's time slot
    const last = candles.at(-1);
    if (last?.timestamp) {
      const d = last.timestamp instanceof Date ? last.timestamp : new Date(last.timestamp);
      if (!isNaN(d.getTime())) {
        const n = getNSEParts(d);
        const key = n.minutes;
        const slot = byMinute.get(key) || [];
        if (slot.length >= 2) {
          const avg = slot.slice(0, -1).reduce((s, v) => s + v, 0) / (slot.length - 1);
          if (avg > 0) {
            return { value: toN(last.volume) / avg, status: 'valid', source: 'time_normalized' };
          }
        }
      }
    }
    // Fallback: total volume / average candle volume
    const totalVol = candles.reduce((s, c) => s + toN(c.volume), 0);
    const avgCandleVol = totalVol / candles.length;
    const lastVol = toN(candles.at(-1)?.volume);
    if (avgCandleVol > 0 && lastVol > 0) {
      return { value: lastVol / avgCandleVol, status: 'valid', source: 'candle_average' };
    }
  }

  // Fallback: use pre-computed averageVolume from quote data
  const cv = toN(currentVolume);
  const av = toN(averageVolume);
  if (av > 0 && cv > 0) {
    return { value: cv / av, status: 'valid', source: 'quote_average' };
  }
  return { value: null, status: 'insufficient_history' };
}

/* ── ORB ───────────────────────────────────────────────── */

export function calcORB(candles, orbMinutes = ORB_MINUTES) {
  if (!Array.isArray(candles) || !candles.length) {
    return { high: null, low: null, status: 'no_candles' };
  }

  // Find market open time from first candle or use 09:15 IST
  const first = candles[0];
  const firstTs = first?.timestamp instanceof Date ? first.timestamp : new Date(first?.timestamp);
  const firstNse = isNaN(firstTs?.getTime()) ? null : getNSEParts(firstTs);
  const tradingDate = firstNse?.date || null;

  let orbCandles = candles.filter((c) => {
    const ts = c.timestamp instanceof Date ? c.timestamp : new Date(c.timestamp);
    if (isNaN(ts.getTime())) return false;
    const n = getNSEParts(ts);
    return n.date === tradingDate && n.minutes >= (NSE_OPEN_HOUR * 60 + NSE_OPEN_MIN) && n.minutes < (NSE_OPEN_HOUR * 60 + NSE_OPEN_MIN + orbMinutes);
  });

  // Fallback only when timestamp timezone/session cannot be resolved.
  if (!orbCandles.length && candles.length) {
    orbCandles = candles.slice(0, Math.max(1, Math.ceil(orbMinutes / 5)));
  }

  if (!orbCandles.length) return { high: null, low: null, status: 'no_orb_candles' };

  const highs  = orbCandles.map((c) => c.high).filter(valid);
  const lows   = orbCandles.map((c) => c.low).filter(valid);
  if (!highs.length || !lows.length) return { high: null, low: null, status: 'invalid_ohlc' };

  return {
    high: Math.max(...highs),
    low:  Math.min(...lows),
    status: 'valid',
    candleCount: orbCandles.length,
  };
}

/* ── MACD ──────────────────────────────────────────────── */

export function calcMACD(closes) {
  if (!Array.isArray(closes) || closes.length < 35) {
    return { macd: null, signal: null, histogram: null, status: 'insufficient_history' };
  }
  const ema12 = emaSeries(closes, 12);
  const ema26 = emaSeries(closes, 26);
  const macdLine = ema12.map((v, i) => (v !== null && ema26[i] !== null ? v - ema26[i] : null));
  const validMacd = macdLine.filter((v) => v !== null);
  if (validMacd.length < 9) return { macd: null, signal: null, histogram: null, status: 'insufficient_history' };
  const signalSeries = emaSeries(validMacd, 9);
  const macdVal  = validMacd.at(-1);
  const signalVal = signalSeries.at(-1);
  const hist = macdVal !== null && signalVal !== null ? macdVal - signalVal : null;
  return { macd: macdVal, signal: signalVal, histogram: hist, status: 'valid' };
}

/* ── Candle patterns ───────────────────────────────────── */

export function detectCandlePattern(candles) {
  if (!Array.isArray(candles) || candles.length < 2) return null;
  const last = candles.at(-1);
  const prev = candles.at(-2);

  const body     = (c) => Math.abs(c.close - c.open);
  const range    = (c) => Math.max(c.high - c.low, 0.001);
  const bullish  = (c) => c.close >= c.open;
  const bodyHigh = (c) => Math.max(c.open, c.close);
  const bodyLow  = (c) => Math.min(c.open, c.close);

  if (!bullish(prev) && bullish(last) && bodyHigh(last) >= bodyHigh(prev) && bodyLow(last) <= bodyLow(prev))
    return 'Bullish Engulfing';

  const lowerWick = bodyLow(last) - last.low;
  const upperWick = last.high - bodyHigh(last);
  if (lowerWick > body(last) * 2 && upperWick <= body(last) * 0.5 && bullish(last))
    return 'Hammer';

  if (upperWick > body(last) * 2 && lowerWick <= body(last) * 0.5 && !bullish(last))
    return 'Shooting Star';

  if (body(last) / range(last) < 0.15)
    return 'Doji';

  if (!bullish(prev) && bullish(last) && bodyHigh(last) < bodyHigh(prev) && bodyLow(last) > bodyLow(prev))
    return 'Bullish Harami';

  if (bullish(last) && body(last) / range(last) > 0.7)
    return 'Strong Bullish Candle';

  if (!bullish(last) && body(last) / range(last) > 0.7)
    return 'Strong Bearish Candle';

  if (bodyHigh(last) <= bodyHigh(prev) && bodyLow(last) >= bodyLow(prev))
    return 'Inside Bar';

  if (candles.length >= 3) {
    const third = candles.at(-3);
    if (!bullish(third) && body(prev) / range(prev) < 0.35 && bullish(last) && last.close > (third.open + third.close) / 2)
      return 'Morning Star';
    if (bullish(third) && bullish(prev) && bullish(last) && last.close > prev.close && prev.close > third.close)
      return 'Three White Soldiers';
  }

  return null;
}

/* ── Master compute ────────────────────────────────────── */

/**
 * Given a normalized candle array and optional quote fields,
 * compute all indicators. Returns a flat indicators object.
 */
export function computeIndicators(candles, { currentVolume = 0, averageVolume = 0 } = {}) {
  const closes = candles.map((c) => c.close).filter(valid);

  const vwapResult  = calcVWAP(candles);
  const rsiResult   = calcRSI(closes);
  const adxResult   = calcADX(candles);
  const atrResult   = calcATR(candles);
  const rvolResult  = calcRVOL(candles, currentVolume, averageVolume);
  const orbResult   = calcORB(candles);
  const macdResult  = calcMACD(closes);
  const pattern     = detectCandlePattern(candles);

  const ema9  = emaLast(closes, 9);
  const ema20 = emaLast(closes, 20);
  const ema50 = emaLast(closes, 50);

  return {
    vwap:         vwapResult.value,
    vwapStatus:   vwapResult.status,
    rsi:          rsiResult.value,
    rsiStatus:    rsiResult.status,
    adx:          adxResult.adx,
    plusDI:       adxResult.plusDI,
    minusDI:      adxResult.minusDI,
    adxStatus:    adxResult.status,
    atr:          atrResult.value,
    atrStatus:    atrResult.status,
    rvol:         rvolResult.value,
    rvolStatus:   rvolResult.status,
    rvolSource:   rvolResult.source,
    orbHigh:      orbResult.high,
    orbLow:       orbResult.low,
    orbStatus:    orbResult.status,
    macd:         macdResult.macd,
    macdSignal:   macdResult.signal,
    macdHist:     macdResult.histogram,
    macdStatus:   macdResult.status,
    ema9,
    ema20,
    ema50,
    candlePattern: pattern,
    candleCount:  candles.length,
    calculatedAt: new Date().toISOString(),
  };
}
