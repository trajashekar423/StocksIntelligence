'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchChartDataByIndex, fetchScannerMarketData, getMarketSessionStatus } from '../../services/stocksService';
import {
  emaSeries, calcRSI, calcADX, calcATR, calcMACD, normalizeCandles,
} from '../../services/indicatorEngine.js';

const TIMEFRAMES = [
  { label: '1m', minutes: 1 },
  { label: '3m', minutes: 3 },
  { label: '5m', minutes: 5 },
  { label: '15m', minutes: 15 },
  { label: '30m', minutes: 30 },
  { label: '1h', minutes: 60 },
];

const SCANNER_TABS = [
  { key: 'top', label: '🔥 Top Intraday' },
  { key: 'bullish', label: '🟢 Strong Bullish' },
  { key: 'breakout', label: '🚀 Breakout' },
  { key: 'active', label: '📊 Most Active' },
  { key: 'industries', label: '🏭 Strong Industries' },
  { key: 'avoid', label: '⚠️ Avoid Today' },
  { key: 'learning', label: '📚 Learning Mode' },
];

const PATTERN_LIBRARY = {
  'Bullish Engulfing': {
    side: 'BUY',
    control: 'Buyers showed strength',
    meaning: 'A bullish candle covered the previous bearish body, showing demand returned.',
    confirmation: ['Price above VWAP', 'Volume increasing', 'EMA 9 > EMA 21', 'RSI preferably above 50', 'No immediate resistance nearby'],
    action: 'Potential BUY setup after confirmation above the signal candle high.',
    warning: 'Do not buy from the pattern alone. Failed engulfing candles can reverse quickly near resistance.',
  },
  Hammer: {
    side: 'BUY',
    control: 'Buyers defended lower prices',
    meaning: 'A long lower wick shows sellers pushed price down but buyers recovered into the close.',
    confirmation: ['Near support', 'Next candle closes higher', 'Price reclaims VWAP', 'Volume improves'],
    action: 'Watch for a confirmed bullish reversal setup.',
    warning: 'A hammer in a downtrend can fail if support breaks.',
  },
  'Morning Star': {
    side: 'BUY',
    control: 'Buyers regained control',
    meaning: 'A three-candle reversal where selling slows and buyers close strongly.',
    confirmation: ['Third candle closes above midpoint of first candle', 'Volume expands', 'VWAP or EMA reclaim'],
    action: 'Potential BUY setup after the third candle confirms.',
    warning: 'Needs follow-through; avoid if resistance is directly overhead.',
  },
  'Three White Soldiers': {
    side: 'BUY',
    control: 'Buyers in control',
    meaning: 'Three strong bullish candles show sustained demand.',
    confirmation: ['Healthy volume', 'RSI not extremely overbought', 'Price above VWAP', 'Market supportive'],
    action: 'Favorable continuation setup if risk/reward remains acceptable.',
    warning: 'Avoid chasing if the move is too extended or risk/reward is poor.',
  },
  'Inverted Hammer': {
    side: 'BUY',
    control: 'Buyers attempted a reversal',
    meaning: 'The upper wick shows buying pressure appeared after a decline.',
    confirmation: ['Next candle breaks the high', 'Volume increases', 'Support holds'],
    action: 'Wait for confirmation before considering a BUY setup.',
    warning: 'Without follow-through it can become a weak rejection candle.',
  },
  'Piercing Pattern': {
    side: 'BUY',
    control: 'Buyers challenged sellers',
    meaning: 'A bullish candle closes above the midpoint of the prior bearish candle.',
    confirmation: ['Close above VWAP', 'Rising volume', 'EMA 9 turning up'],
    action: 'Potential reversal setup after confirmation.',
    warning: 'Avoid when broader market and sector are weak.',
  },
  'Bullish Harami': {
    side: 'BUY',
    control: 'Selling pressure paused',
    meaning: 'A small bullish body forms inside the previous bearish body.',
    confirmation: ['Break above harami high', 'Support nearby', 'Volume improves'],
    action: 'Watch for reversal confirmation.',
    warning: 'This is a weaker signal without a breakout candle.',
  },
  'Three Inside Up': {
    side: 'BUY',
    control: 'Buyers improved after a pause',
    meaning: 'A bullish harami followed by a breakout candle confirms a reversal attempt.',
    confirmation: ['Third candle breaks prior high', 'Price above VWAP', 'EMA structure improving'],
    action: 'Potential BUY setup after confirmation.',
    warning: 'False reversals are common in sideways markets.',
  },
  'Tweezer Bottom': {
    side: 'BUY',
    control: 'Buyers defended support',
    meaning: 'Two candles reject nearly the same low, suggesting support is active.',
    confirmation: ['Support holds', 'Higher close follows', 'Volume supports the reversal'],
    action: 'Watch for a support-based BUY setup.',
    warning: 'A break below the tweezer low invalidates the setup.',
  },
  'On-Neck Pattern': {
    side: 'BUY',
    control: 'Buyers only slightly challenged sellers',
    meaning: 'A small bullish candle closes near the prior bearish low; it is tentative.',
    confirmation: ['Strong follow-through required', 'VWAP reclaim', 'Support nearby'],
    action: 'Wait for confirmation; do not treat it as a standalone BUY.',
    warning: 'Often becomes continuation lower if confirmation fails.',
  },
  'Bullish Counterattack': {
    side: 'BUY',
    control: 'Buyers countered sellers',
    meaning: 'A bullish candle closes near the previous bearish close after a gap or sharp drop.',
    confirmation: ['Next candle closes higher', 'Volume expansion', 'Market not bearish'],
    action: 'Potential reversal watch setup.',
    warning: 'Needs immediate follow-through.',
  },
  'Three Outside Up': {
    side: 'BUY',
    control: 'Buyers in control',
    meaning: 'Bullish engulfing followed by another bullish candle confirms demand.',
    confirmation: ['VWAP support', 'Volume above average', 'Sector strength'],
    action: 'High-confidence setup only if risk/reward is favorable.',
    warning: 'Avoid if price is extended into major resistance.',
  },
  'Bearish Engulfing': {
    side: 'SELL',
    control: 'Sellers showed strength',
    meaning: 'A bearish candle covered the prior bullish body, showing supply returned.',
    confirmation: ['Price below VWAP', 'Volume increasing', 'EMA 9 < EMA 21', 'No immediate support nearby'],
    action: 'Potential SELL setup after confirmation below the signal candle low.',
    warning: 'Do not sell from one candle alone, especially above support.',
  },
  'Shooting Star': {
    side: 'SELL',
    control: 'Sellers rejected higher prices',
    meaning: 'A long upper wick shows buyers failed to hold the move.',
    confirmation: ['Near resistance', 'Next candle closes lower', 'Price below VWAP'],
    action: 'Watch for a bearish reversal setup.',
    warning: 'Can fail during strong bullish trends.',
  },
  'Evening Star': {
    side: 'SELL',
    control: 'Sellers regained control',
    meaning: 'A three-candle reversal where buying slows and sellers close strongly.',
    confirmation: ['Third candle closes below midpoint of first candle', 'Volume expands', 'VWAP lost'],
    action: 'Potential SELL setup after confirmation.',
    warning: 'Avoid short bias if sector and market remain strongly bullish.',
  },
  'Three Black Crows': {
    side: 'SELL',
    control: 'Sellers in control',
    meaning: 'Three bearish candles show sustained supply.',
    confirmation: ['Below VWAP', 'Weak EMA structure', 'Selling volume above average'],
    action: 'Bearish continuation setup if support is not directly below.',
    warning: 'Late entries can suffer sharp pullbacks.',
  },
  'Hanging Man': {
    side: 'SELL',
    control: 'Sellers warned after an advance',
    meaning: 'A long lower wick after an up move can warn that selling pressure is entering.',
    confirmation: ['Next candle closes lower', 'Resistance nearby', 'VWAP lost'],
    action: 'Wait for breakdown confirmation.',
    warning: 'Not bearish by itself; trend context matters.',
  },
  'Dark Cloud Cover': {
    side: 'SELL',
    control: 'Sellers challenged buyers',
    meaning: 'A bearish candle closes below the midpoint of the previous bullish candle.',
    confirmation: ['Volume expands', 'Price below VWAP', 'EMA 9 turns below EMA 21'],
    action: 'Potential SELL setup after confirmation.',
    warning: 'Avoid if price is sitting on strong support.',
  },
  'Bearish Harami': {
    side: 'SELL',
    control: 'Buying pressure paused',
    meaning: 'A small bearish body forms inside the prior bullish body.',
    confirmation: ['Break below harami low', 'Resistance nearby', 'Volume supports sell pressure'],
    action: 'Watch for bearish reversal confirmation.',
    warning: 'It is a weak warning until the low breaks.',
  },
  'Three Inside Down': {
    side: 'SELL',
    control: 'Sellers improved after a pause',
    meaning: 'A bearish harami followed by a breakdown candle confirms supply.',
    confirmation: ['Third candle breaks prior low', 'Below VWAP', 'Weak sector'],
    action: 'Potential SELL setup after confirmation.',
    warning: 'Avoid when major support is very close.',
  },
  'Tweezer Top': {
    side: 'SELL',
    control: 'Sellers defended resistance',
    meaning: 'Two candles reject nearly the same high, suggesting resistance is active.',
    confirmation: ['Lower close follows', 'Resistance holds', 'Volume supports rejection'],
    action: 'Watch for a resistance-based SELL setup.',
    warning: 'A break above the tweezer high invalidates the setup.',
  },
  'Three Outside Down': {
    side: 'SELL',
    control: 'Sellers in control',
    meaning: 'Bearish engulfing followed by another bearish candle confirms supply.',
    confirmation: ['VWAP lost', 'Volume above average', 'Sector weakness'],
    action: 'High-confidence bearish setup only if support is not nearby.',
    warning: 'Avoid if the overall market strongly contradicts the SELL.',
  },
};

function toNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const parsed = Number(String(value).replace(/,/g, '').replace(/%/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value) {
  const amount = toNumber(value);
  return amount ? `₹${amount.toFixed(2)}` : 'N/A';
}

function formatVolume(value) {
  const volume = toNumber(value);
  if (!volume) return 'N/A';
  if (volume >= 10000000) return `${(volume / 10000000).toFixed(2)}Cr`;
  if (volume >= 100000) return `${(volume / 100000).toFixed(2)}L`;
  return volume.toLocaleString('en-IN');
}

// ── Delegate duplicate implementations to shared indicatorEngine ──
function emaSeries_local(values, period) { return emaSeries(values, period); }
function rsiValue(closes, period = 14) { const r = calcRSI(closes, period); return r.value; }
function vwapSeries(candles) {
  // Return cumulative VWAP per candle for chart plotting
  let pv = 0, vol = 0;
  return candles.map((c) => {
    const v = toNumber(c.volume);
    if (!v) return null;
    pv += ((c.high + c.low + c.close) / 3) * v;
    vol += v;
    return vol ? pv / vol : null;
  });
}
function atrValue(candles, period = 14) { const r = calcATR(candles, period); return r.value; }
function macdState(closes) {
  const r = calcMACD(closes);
  if (!r.macd || !r.signal) return null;
  return r.macd > r.signal ? 'bullish' : 'bearish';
}
function adxProxy(candles) {
  // Use real ADX from shared engine
  const r = calcADX(candles);
  return r.adx;
}

function getRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.payload)) return payload.payload;
  if (Array.isArray(payload?.allSec?.data)) return payload.allSec.data;
  return [];
}

function getSymbol(row) {
  return String(row?.symbol || row?.Symbol || row?.SYMBOL || row?.identifier || '').trim().toUpperCase();
}

function getIndustry(row) {
  return row?.industry || row?.sector || row?.basicIndustry || row?.basic_industry || row?.meta?.industry || 'Unclassified';
}

function normalizeCandle(raw, index) {
  if (Array.isArray(raw)) {
    const time = raw[0] || index;
    const open = toNumber(raw[1]);
    const high = toNumber(raw[2] ?? raw[1]);
    const low = toNumber(raw[3] ?? raw[1]);
    const close = toNumber(raw[4] ?? raw[1]);
    const volume = toNumber(raw[5]);
    return { time, open, high: high || close, low: low || close, close, volume };
  }

  const close = toNumber(raw?.close ?? raw?.ltp ?? raw?.price ?? raw?.value);
  return {
    time: raw?.time || raw?.timestamp || raw?.date || index,
    open: toNumber(raw?.open) || close,
    high: toNumber(raw?.high) || close,
    low: toNumber(raw?.low) || close,
    close,
    volume: toNumber(raw?.volume ?? raw?.totalTradedVolume),
  };
}

function aggregateCandles(candles, minutes) {
  if (!candles.length || minutes <= 1) return candles;
  const bucketSize = minutes;
  const aggregated = [];
  for (let index = 0; index < candles.length; index += bucketSize) {
    const bucket = candles.slice(index, index + bucketSize);
    if (!bucket.length) continue;
    aggregated.push({
      time: bucket[0].time,
      open: bucket[0].open,
      high: Math.max(...bucket.map((c) => c.high)),
      low: Math.min(...bucket.map((c) => c.low)),
      close: bucket[bucket.length - 1].close,
      volume: bucket.reduce((sum, c) => sum + toNumber(c.volume), 0),
    });
  }
  return aggregated;
}

function normalizeCandlesFromChart(payload) {
  // Use shared normalizeCandles from indicatorEngine, then map to local {time,open,high,low,close,volume} shape
  const sym = '';
  const normalized = normalizeCandles(payload, sym);
  if (normalized.length) {
    return normalized.map((c) => ({
      time: c.timestamp instanceof Date ? c.timestamp.getTime() : new Date(c.timestamp).getTime(),
      open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume,
    }));
  }
  // Fallback: try legacy array-of-arrays format directly
  const possible = [
    payload?.candles, payload?.data?.candles,
    payload?.grapthData, payload?.graphData,
    payload?.data?.grapthData, payload?.data?.graphData,
    payload?.data, payload,
  ].find(Array.isArray);
  return (possible || []).map(normalizeCandle).filter((c) => c.open && c.high && c.low && c.close);
}

function levelInfo(candles, row) {
  const highs = candles.map((c) => c.high).filter(Boolean);
  const lows = candles.map((c) => c.low).filter(Boolean);
  const recent = candles.slice(-20);
  const recentHighs = recent.map((c) => c.high).filter(Boolean);
  const recentLows = recent.map((c) => c.low).filter(Boolean);
  const previousHigh = toNumber(row?.previousDayHigh ?? row?.prevDayHigh);
  const previousLow = toNumber(row?.previousDayLow ?? row?.prevDayLow);
  const previousClose = toNumber(row?.previousClose ?? row?.prevClose);
  const pivot = previousHigh && previousLow && previousClose ? (previousHigh + previousLow + previousClose) / 3 : null;

  return {
    previousDayHigh: previousHigh,
    previousDayLow: previousLow,
    previousDayClose: previousClose,
    dayOpen: candles[0]?.open || toNumber(row?.open),
    intradayHigh: highs.length ? Math.max(...highs) : toNumber(row?.dayHigh ?? row?.high),
    intradayLow: lows.length ? Math.min(...lows) : toNumber(row?.dayLow ?? row?.low),
    support: toNumber(row?.support) || (recentLows.length ? Math.min(...recentLows) : 0),
    resistance: toNumber(row?.resistance) || (recentHighs.length ? Math.max(...recentHighs) : 0),
    pivot,
    majorSupport: previousLow || (recentLows.length ? Math.min(...recentLows) : 0),
    majorResistance: previousHigh || (recentHighs.length ? Math.max(...recentHighs) : 0),
  };
}

function candleParts(candle) {
  const range = Math.max(candle.high - candle.low, 0.01);
  const body = Math.abs(candle.close - candle.open);
  const upper = candle.high - Math.max(candle.open, candle.close);
  const lower = Math.min(candle.open, candle.close) - candle.low;
  const closePosition = (candle.close - candle.low) / range;
  return { range, body, upper, lower, closePosition, bullish: candle.close >= candle.open, bearish: candle.close < candle.open };
}

function classifyControl(candle, previous, avgVolume, levels) {
  if (!candle) return { label: '⚪ INSUFFICIENT DATA', reasons: ['No candle available.'] };
  const parts = candleParts(candle);
  const volumeRatio = avgVolume ? toNumber(candle.volume) / avgVolume : 0;
  const nearResistanceBreak = levels?.resistance && candle.close > levels.resistance;
  const supportBreak = levels?.support && candle.close < levels.support;
  const reasons = [];

  if (parts.body / parts.range >= 0.58) reasons.push(parts.bullish ? 'Large bullish body' : 'Large bearish body');
  if (parts.closePosition >= 0.75) reasons.push('Close near high');
  if (parts.closePosition <= 0.25) reasons.push('Close near low');
  if (parts.upper / parts.range <= 0.2 && parts.bullish) reasons.push('Small upper wick');
  if (parts.lower / parts.range <= 0.2 && parts.bearish) reasons.push('Small lower wick');
  if (volumeRatio >= 1.5) reasons.push('Strong volume');
  if (previous && candle.close > previous.high) reasons.push('Break above previous candle high');
  if (previous && candle.close < previous.low) reasons.push('Break below previous candle low');
  if (nearResistanceBreak) reasons.push('Breakout above resistance');
  if (supportBreak) reasons.push('Breakdown below support');

  if (parts.bullish && parts.body / parts.range >= 0.58 && parts.closePosition >= 0.72 && (volumeRatio >= 1.2 || nearResistanceBreak)) {
    return { label: '🟢 BUYERS IN CONTROL', reasons };
  }
  if (parts.bullish && parts.closePosition >= 0.6) return { label: '🟢 BUYERS SHOWED STRENGTH', reasons };
  if (parts.bearish && parts.body / parts.range >= 0.58 && parts.closePosition <= 0.28 && (volumeRatio >= 1.2 || supportBreak)) {
    return { label: '🔴 SELLERS IN CONTROL', reasons };
  }
  if (parts.bearish && parts.closePosition <= 0.4) return { label: '🔴 SELLERS SHOWED STRENGTH', reasons };
  return { label: '🟡 INDECISION', reasons: reasons.length ? reasons : ['Small body or mixed wicks show low directional conviction.'] };
}

function detectPatterns(candles) {
  if (candles.length < 2) return [];
  const last = candles.at(-1);
  const prev = candles.at(-2);
  const third = candles.at(-3);
  const p = candleParts(last);
  const pp = candleParts(prev);
  const patterns = [];
  const bodyHigh = (c) => Math.max(c.open, c.close);
  const bodyLow = (c) => Math.min(c.open, c.close);

  if (pp.bearish && p.bullish && bodyHigh(last) >= bodyHigh(prev) && bodyLow(last) <= bodyLow(prev)) patterns.push('Bullish Engulfing');
  if (pp.bullish && p.bearish && bodyHigh(last) >= bodyHigh(prev) && bodyLow(last) <= bodyLow(prev)) patterns.push('Bearish Engulfing');
  if (p.lower > p.body * 2 && p.upper <= p.body * 0.8 && p.closePosition > 0.55) patterns.push('Hammer');
  if (p.upper > p.body * 2 && p.lower <= p.body * 0.8 && p.closePosition < 0.55) patterns.push('Shooting Star');
  if (p.lower > p.body * 2 && p.bearish) patterns.push('Hanging Man');
  if (p.upper > p.body * 2 && p.bullish) patterns.push('Inverted Hammer');
  if (pp.bearish && p.bullish && last.close > prev.open - pp.body / 2 && last.open < prev.close) patterns.push('Piercing Pattern');
  if (pp.bullish && p.bearish && last.close < prev.open + pp.body / 2 && last.open > prev.close) patterns.push('Dark Cloud Cover');
  if (pp.bearish && p.bullish && bodyHigh(last) < bodyHigh(prev) && bodyLow(last) > bodyLow(prev)) patterns.push('Bullish Harami');
  if (pp.bullish && p.bearish && bodyHigh(last) < bodyHigh(prev) && bodyLow(last) > bodyLow(prev)) patterns.push('Bearish Harami');
  if (Math.abs(last.low - prev.low) / last.close < 0.002 && p.bullish) patterns.push('Tweezer Bottom');
  if (Math.abs(last.high - prev.high) / last.close < 0.002 && p.bearish) patterns.push('Tweezer Top');
  if (pp.bearish && p.bullish && Math.abs(last.close - prev.close) / last.close < 0.003) patterns.push('Bullish Counterattack');
  if (pp.bearish && p.bullish && Math.abs(last.close - prev.low) / last.close < 0.003) patterns.push('On-Neck Pattern');

  if (third) {
    const t = candleParts(third);
    if (t.bearish && pp.body / pp.range < 0.35 && p.bullish && last.close > (third.open + third.close) / 2) patterns.push('Morning Star');
    if (t.bullish && pp.body / pp.range < 0.35 && p.bearish && last.close < (third.open + third.close) / 2) patterns.push('Evening Star');
    const last3 = candles.slice(-3).map(candleParts);
    if (last3.every((part) => part.bullish) && candles.at(-1).close > candles.at(-2).close && candles.at(-2).close > candles.at(-3).close) patterns.push('Three White Soldiers');
    if (last3.every((part) => part.bearish) && candles.at(-1).close < candles.at(-2).close && candles.at(-2).close < candles.at(-3).close) patterns.push('Three Black Crows');
    if (patterns.includes('Bullish Harami') && last.close > third.high) patterns.push('Three Inside Up');
    if (patterns.includes('Bearish Harami') && last.close < third.low) patterns.push('Three Inside Down');
    if (patterns.includes('Bullish Engulfing') && last.close > prev.high) patterns.push('Three Outside Up');
    if (patterns.includes('Bearish Engulfing') && last.close < prev.low) patterns.push('Three Outside Down');
  }

  return [...new Set(patterns)].map((name) => ({ name, ...PATTERN_LIBRARY[name] })).filter((item) => item.name);
}

function detectMarker(analysis) {
  if (!analysis.hasRequiredData) return { type: 'WAIT', label: '🟡 WAIT', reasons: ['Required candle, volume, VWAP, EMA and RSI data are not complete.'] };
  if (analysis.buyScore >= 80 && analysis.riskReward >= 2) return { type: 'BUY', label: '🟢 BUY', reasons: analysis.buyReasons };
  if (analysis.sellScore >= 80) return { type: 'SELL', label: '🔴 SELL', reasons: analysis.sellReasons };
  return { type: 'WAIT', label: '🟡 WAIT', reasons: analysis.waitReasons };
}

function analyzeRow(row, candles, marketDirection, industryScore) {
  const price = toNumber(row?.price ?? row?.lastPrice ?? row?.ltp ?? row?.close ?? row?.last_price);
  const volume = toNumber(row?.volume ?? row?.totalTradedVolume ?? row?.quantityTraded);
  const closes = candles.map((c) => c.close);
  const ema9 = toNumber(row?.ema9) || emaSeries_local(closes, 9).at(-1);
  const ema21 = toNumber(row?.ema21 ?? row?.ema20) || emaSeries_local(closes, 21).at(-1);
  const ema50 = toNumber(row?.ema50) || emaSeries_local(closes, 50).at(-1);
  const vwap = toNumber(row?.vwap) || vwapSeries(candles).filter(Boolean).at(-1);
  const rsi = toNumber(row?.rsi) || rsiValue(closes);
  const macd = row?.macd ? (row.macd.macd > row.macd.signal ? 'bullish' : 'bearish') : macdState(closes);
  const adx = toNumber(row?.adx) || adxProxy(candles);
  const avgVolume = candles.length ? candles.reduce((sum, c) => sum + toNumber(c.volume), 0) / candles.length : toNumber(row?.averageVolume);
  const volumeRatio = avgVolume ? (volume || candles.at(-1)?.volume || 0) / avgVolume : toNumber(row?.volumeRatio);
  const levels = levelInfo(candles, row);
  const patterns = detectPatterns(candles);
  const bullishPattern = patterns.find((p) => p.side === 'BUY');
  const bearishPattern = patterns.find((p) => p.side === 'SELL');
  const last = candles.at(-1);
  const previous = candles.at(-2);
  const control = classifyControl(last, previous, avgVolume, levels);
  const nearResistance = levels.majorResistance && price && price >= levels.majorResistance * 0.995 && price <= levels.majorResistance;
  const nearSupport = levels.majorSupport && price && price <= levels.majorSupport * 1.005 && price >= levels.majorSupport;
  const resistanceBreakout = levels.resistance && price > levels.resistance && volumeRatio >= 1.5;
  const supportBreakdown = levels.support && price < levels.support && volumeRatio >= 1.2;
  const hasRequiredData = Boolean(price && candles.length >= 20 && vwap && ema9 && ema21 && ema50 && rsi && adx && volumeRatio);

  const buyChecks = [
    [price > vwap, 15, 'Price above VWAP'],
    [ema9 > ema21, 10, 'EMA 9 > EMA 21'],
    [price > ema50, 10, 'Price above EMA 50'],
    [rsi >= 50 && rsi <= 70, 10, `RSI ${rsi?.toFixed?.(0) || 'N/A'} within 50-70`],
    [macd === 'bullish', 10, 'MACD bullish'],
    [adx > 20, 10, `ADX ${adx?.toFixed?.(0) || 'N/A'} confirms trend`],
    [volumeRatio > 1.5, 15, `Volume ${volumeRatio?.toFixed?.(2) || 'N/A'}x average`],
    [Boolean(bullishPattern), 10, bullishPattern ? `${bullishPattern.name} detected` : 'Bullish candle pattern'],
    [resistanceBreakout, 5, 'Breakout above resistance'],
    [industryScore >= 70, 5, `Industry strength ${industryScore}/100`],
  ];

  const sellChecks = [
    [price < vwap, 15, 'Price below VWAP'],
    [ema9 < ema21, 10, 'EMA 9 < EMA 21'],
    [price < ema50, 10, 'Price below EMA 50'],
    [rsi < 50, 10, `RSI ${rsi?.toFixed?.(0) || 'N/A'} below 50`],
    [macd === 'bearish', 10, 'MACD bearish'],
    [adx > 20, 10, `ADX ${adx?.toFixed?.(0) || 'N/A'} confirms trend`],
    [volumeRatio > 1.5 && last?.close < last?.open, 15, `Selling volume ${volumeRatio?.toFixed?.(2) || 'N/A'}x average`],
    [Boolean(bearishPattern), 10, bearishPattern ? `${bearishPattern.name} detected` : 'Bearish candle pattern'],
    [supportBreakdown, 5, 'Breakdown below support'],
    [industryScore < 45, 5, `Weak industry ${industryScore}/100`],
  ];

  let buyScore = buyChecks.reduce((score, [ok, points]) => score + (ok ? points : 0), 0);
  let sellScore = sellChecks.reduce((score, [ok, points]) => score + (ok ? points : 0), 0);
  const buyReasons = buyChecks.filter(([ok]) => ok).map(([, , reason]) => reason);
  const sellReasons = sellChecks.filter(([ok]) => ok).map(([, , reason]) => reason);
  const waitReasons = [];

  if (marketDirection.score < 45) {
    buyScore = Math.max(0, buyScore - 10);
    waitReasons.push('Overall market is weak, so BUY confidence is reduced.');
  }
  if (marketDirection.score > 65) sellScore = Math.max(0, sellScore - 8);
  if (nearResistance) {
    buyScore = Math.max(0, buyScore - 15);
    waitReasons.push('Resistance nearby — avoid chasing BUY.');
  }
  if (nearSupport) {
    sellScore = Math.max(0, sellScore - 12);
    waitReasons.push('Support nearby — avoid forcing SELL.');
  }
  if (rsi > 78) {
    buyScore = Math.max(0, buyScore - 12);
    waitReasons.push('RSI is extremely overbought.');
  }
  if (rsi >= 45 && rsi <= 55 && adx < 18) waitReasons.push('Sideways market conditions: RSI is neutral and ADX is low.');
  if (!hasRequiredData) waitReasons.push('⚠️ INSUFFICIENT DATA: full candles, VWAP, EMA, RSI, ADX and volume are required for a signal.');

  const entry = resistanceBreakout ? Math.max(price, levels.resistance) : last ? Math.max(price, last.high) : price;
  const atr = atrValue(candles) || price * 0.006;
  const stopCandidates = [levels.support, levels.majorSupport, vwap, entry - atr * 1.5].filter((value) => value && value < entry);
  const stopLoss = stopCandidates.length ? Math.max(...stopCandidates) : entry * 0.99;
  const risk = entry - stopLoss;
  const target1 = entry + risk * 2;
  const target2 = entry + risk * 2.5;
  const riskReward = risk > 0 ? (target1 - entry) / risk : 0;

  const setupLabel = !hasRequiredData
    ? '⚪ INSUFFICIENT DATA'
    : buyScore >= 80 && riskReward >= 2
      ? '🟢 STRONG BUY SETUP'
      : buyScore >= 70
        ? '🟢 BUY SETUP'
        : sellScore >= 80
          ? '🔴 STRONG SELL SETUP'
          : sellScore >= 65
            ? '🟡 SELLERS SHOWING STRENGTH'
            : buyScore >= 60
              ? '🟡 WATCH / WAIT FOR CONFIRMATION'
              : buyScore >= 40
                ? '🟠 WEAK SETUP'
                : '🔴 AVOID / WAIT';

  return {
    symbol: getSymbol(row),
    companyName: row?.companyName || row?.securityInfo?.companyName || getSymbol(row),
    industry: getIndustry(row),
    price,
    changePercent: toNumber(row?.changePercent ?? row?.pChange ?? row?.perChange),
    volume,
    vwap,
    ema9,
    ema21,
    ema50,
    rsi,
    adx,
    macd,
    volumeRatio,
    patterns,
    primaryPattern: bullishPattern || bearishPattern || null,
    bullishPattern,
    bearishPattern,
    control,
    levels,
    buyScore: Math.round(buyScore),
    sellScore: Math.round(sellScore),
    technicalScore: Math.round(Math.max(buyScore, sellScore)),
    industryScore,
    marketScore: marketDirection.score,
    overallScore: Math.round((industryScore * 0.25) + (marketDirection.score * 0.15) + (Math.max(buyScore, sellScore) * 0.35) + (Math.min(100, volumeRatio * 40) * 0.15) + (riskReward >= 2 ? 10 : 0)),
    buyReasons,
    sellReasons,
    waitReasons,
    setupLabel,
    hasRequiredData,
    nearResistance,
    nearSupport,
    resistanceBreakout,
    supportBreakdown,
    entry,
    stopLoss,
    target1,
    target2,
    riskReward,
    marker: null,
  };
}

function scoreIndustry(rows) {
  const groups = new Map();
  rows.forEach((row) => {
    const key = getIndustry(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });

  return [...groups.entries()].map(([industry, items]) => {
    const avgChange = items.reduce((sum, row) => sum + toNumber(row?.changePercent ?? row?.pChange ?? row?.perChange), 0) / items.length;
    const advancing = items.filter((row) => toNumber(row?.changePercent ?? row?.pChange ?? row?.perChange) > 0).length;
    const declining = items.filter((row) => toNumber(row?.changePercent ?? row?.pChange ?? row?.perChange) < 0).length;
    const volumeTotal = items.reduce((sum, row) => sum + toNumber(row?.volume ?? row?.totalTradedVolume ?? row?.quantityTraded), 0);
    const breadth = items.length ? advancing / items.length : 0;
    const score = Math.round(Math.max(0, Math.min(100, 45 + avgChange * 8 + breadth * 35 + Math.min(20, volumeTotal / 10000000))));
    return {
      industry,
      score,
      change: avgChange,
      advancing,
      declining,
      volumeTotal,
      stocks: items,
    };
  }).sort((a, b) => b.score - a.score);
}

function marketDirectionFromRows(rows) {
  const changed = rows.filter((row) => toNumber(row?.changePercent ?? row?.pChange ?? row?.perChange) !== 0);
  const advancing = changed.filter((row) => toNumber(row?.changePercent ?? row?.pChange ?? row?.perChange) > 0).length;
  const declining = changed.filter((row) => toNumber(row?.changePercent ?? row?.pChange ?? row?.perChange) < 0).length;
  const breadth = changed.length ? advancing / changed.length : 0;
  const score = Math.round(Math.max(0, Math.min(100, breadth * 100)));
  return {
    score,
    label: score >= 65 ? 'Bullish market breadth' : score >= 45 ? 'Mixed market breadth' : 'Bearish market breadth',
    advancing,
    declining,
  };
}

function TradingChart({ analysis, candles, timeframe, onTimeframeChange }) {
  const canvasRef = useRef(null);
  const [hover, setHover] = useState(null);
  const displayCandles = useMemo(() => aggregateCandles(candles, timeframe.minutes).slice(-80), [candles, timeframe]);
  const closes = displayCandles.map((c) => c.close);
  const ema9 = emaSeries_local(closes, 9);
  const ema21 = emaSeries_local(closes, 21);
  const ema50 = emaSeries_local(closes, 50);
  const vwap = vwapSeries(displayCandles);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#101820';
    ctx.fillRect(0, 0, width, height);

    if (!displayCandles.length) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 14px Poppins, sans-serif';
      ctx.fillText('Insufficient OHLC data for chart', 24, 48);
      return;
    }

    const pad = { left: 52, right: 18, top: 18, bottom: 72 };
    const chartH = height - pad.top - pad.bottom;
    const volumeTop = height - 54;
    const prices = displayCandles.flatMap((c) => [c.high, c.low]);
    [analysis?.levels?.support, analysis?.levels?.resistance, analysis?.levels?.previousDayHigh, analysis?.levels?.previousDayLow, analysis?.levels?.dayOpen]
      .filter(Boolean)
      .forEach((level) => prices.push(level));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const scaleY = (price) => pad.top + ((maxPrice - price) / Math.max(maxPrice - minPrice, 0.01)) * chartH;
    const step = (width - pad.left - pad.right) / displayCandles.length;
    const candleW = Math.max(4, Math.min(12, step * 0.62));
    const maxVol = Math.max(...displayCandles.map((c) => toNumber(c.volume)), 1);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i += 1) {
      const y = pad.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(width - pad.right, y);
      ctx.stroke();
    }

    function drawLine(value, color, label, dash = []) {
      if (!value) return;
      const y = scaleY(value);
      ctx.save();
      ctx.strokeStyle = color;
      ctx.setLineDash(dash);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(width - pad.right, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = color;
      ctx.font = '700 11px Poppins, sans-serif';
      ctx.fillText(label, pad.left + 4, y - 4);
      ctx.restore();
    }

    displayCandles.forEach((candle, index) => {
      const x = pad.left + index * step + step / 2;
      const bullish = candle.close >= candle.open;
      const color = bullish ? '#16a34a' : '#dc2626';
      const yOpen = scaleY(candle.open);
      const yClose = scaleY(candle.close);
      const yHigh = scaleY(candle.high);
      const yLow = scaleY(candle.low);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, yHigh);
      ctx.lineTo(x, yLow);
      ctx.stroke();
      ctx.fillRect(x - candleW / 2, Math.min(yOpen, yClose), candleW, Math.max(2, Math.abs(yClose - yOpen)));
      const volH = (toNumber(candle.volume) / maxVol) * 42;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(x - candleW / 2, volumeTop + 44 - volH, candleW, volH);
      ctx.globalAlpha = 1;
    });

    function plot(series, color) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      series.forEach((value, index) => {
        if (!value) return;
        const x = pad.left + index * step + step / 2;
        const y = scaleY(value);
        if (index === 0 || !series[index - 1]) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    plot(vwap, '#38bdf8');
    plot(ema9, '#facc15');
    plot(ema21, '#fb923c');
    plot(ema50, '#c084fc');
    drawLine(analysis?.levels?.support, '#22c55e', 'Support');
    drawLine(analysis?.levels?.resistance, '#ef4444', 'Resistance');
    drawLine(analysis?.levels?.previousDayHigh, '#f87171', 'PDH', [4, 4]);
    drawLine(analysis?.levels?.previousDayLow, '#4ade80', 'PDL', [4, 4]);
    drawLine(analysis?.levels?.dayOpen, '#e2e8f0', 'Open', [3, 5]);

    if (analysis?.marker && displayCandles.length) {
      const markerIndex = displayCandles.length - 1;
      const x = pad.left + markerIndex * step + step / 2;
      const y = scaleY(displayCandles.at(-1).high) - 18;
      ctx.fillStyle = analysis.marker.type === 'BUY' ? '#16a34a' : analysis.marker.type === 'SELL' ? '#dc2626' : '#eab308';
      ctx.fillRect(x - 26, y - 15, 52, 22);
      ctx.fillStyle = '#fff';
      ctx.font = '800 10px Poppins, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(analysis.marker.type, x, y);
      ctx.textAlign = 'left';
    }

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '700 11px Poppins, sans-serif';
    ctx.fillText('VWAP', width - 206, 18);
    ctx.fillStyle = '#facc15';
    ctx.fillText('EMA 9', width - 162, 18);
    ctx.fillStyle = '#fb923c';
    ctx.fillText('EMA 21', width - 112, 18);
    ctx.fillStyle = '#c084fc';
    ctx.fillText('EMA 50', width - 54, 18);
  }, [analysis, displayCandles, ema9, ema21, ema50, vwap]);

  function handlePointer(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const step = (rect.width - 70) / Math.max(displayCandles.length, 1);
    const index = Math.max(0, Math.min(displayCandles.length - 1, Math.round((x - 52 - step / 2) / step)));
    const candle = displayCandles[index];
    if (!candle) return setHover(null);
    const patterns = detectPatterns(displayCandles.slice(0, index + 1));
    const pattern = patterns[0] || null;
    setHover({ x: Math.min(rect.width - 300, Math.max(12, x)), y: 44, candle, pattern, control: classifyControl(candle, displayCandles[index - 1], 0, analysis?.levels) });
  }

  return (
    <div className="ais-chart-wrap">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
        <div>
          <div className="fw-bold">{analysis?.symbol || 'Select Stock'} Learning Chart</div>
          <div className="small text-muted">TradingView-style OHLC view with VWAP, EMA, volume and support/resistance overlays.</div>
        </div>
        <div className="btn-group btn-group-sm" role="group" aria-label="Timeframe">
          {TIMEFRAMES.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`btn ${item.minutes === timeframe.minutes ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => onTimeframeChange(item)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="ais-chart-canvas-shell" onPointerMove={handlePointer} onPointerLeave={() => setHover(null)} onClick={handlePointer}>
        <canvas ref={canvasRef} className="ais-chart-canvas" />
        {hover && (
          <div className="ais-candle-tooltip" style={{ left: hover.x, top: hover.y }}>
            <div className="fw-bold">{hover.pattern?.name || 'Candle Reading'}</div>
            <div className="small"><strong>Signal:</strong> {hover.pattern ? `Potential ${hover.pattern.side} setup` : 'No standalone pattern'}</div>
            <div className="small"><strong>OHLC:</strong> {formatMoney(hover.candle.open)} / {formatMoney(hover.candle.high)} / {formatMoney(hover.candle.low)} / {formatMoney(hover.candle.close)}</div>
            <div className="small"><strong>Control:</strong> {hover.control.label}</div>
            {hover.pattern ? (
              <>
                <div className="small mt-2"><strong>Meaning:</strong> {hover.pattern.meaning}</div>
                <div className="small"><strong>Confirmation:</strong> {hover.pattern.confirmation.join(', ')}</div>
                <div className="small"><strong>Possible action:</strong> {hover.pattern.action}</div>
                <div className="small text-warning"><strong>Risk:</strong> {hover.pattern.warning}</div>
              </>
            ) : (
              <div className="small text-warning mt-2">Pattern alone is not enough. Wait for VWAP, EMA, volume and level confirmation.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SetupCard({ analysis }) {
  const favorable = analysis?.hasRequiredData && analysis.buyScore >= 80 && analysis.riskReward >= 2;
  const avoid = !analysis?.hasRequiredData || analysis.buyScore < 40 || analysis.waitReasons.length >= 3;
  const className = favorable ? 'ais-setup-card ais-setup-card--good' : avoid ? 'ais-setup-card ais-setup-card--bad' : 'ais-setup-card ais-setup-card--wait';
  return (
    <div className={className}>
      <div className="d-flex justify-content-between gap-3">
        <div>
          <div className="ais-setup-title">{favorable ? '🟢 FAVORABLE INTRADAY SETUP' : avoid ? '🔴 AVOID / WAIT' : '🟡 WAIT FOR CONFIRMATION'}</div>
          <div className="ais-setup-sub">{analysis?.setupLabel}</div>
        </div>
        <div className="text-end">
          <div className="ais-setup-score">{analysis?.buyScore || 0}/100</div>
          <div className="small">BUY score</div>
        </div>
      </div>
      <div className="row g-2 mt-2 small">
        <div className="col-6 col-lg-3">Entry Zone: <strong>{formatMoney(analysis?.entry)}</strong></div>
        <div className="col-6 col-lg-3">Stop Loss: <strong>{formatMoney(analysis?.stopLoss)}</strong></div>
        <div className="col-6 col-lg-3">Target 1: <strong>{formatMoney(analysis?.target1)}</strong></div>
        <div className="col-6 col-lg-3">Target 2: <strong>{formatMoney(analysis?.target2)}</strong></div>
        <div className="col-12">Risk/Reward: <strong>{analysis?.riskReward >= 2 ? `1:${analysis.riskReward.toFixed(1)}` : '🟡 NO FAVORABLE RISK/REWARD'}</strong></div>
      </div>
      <div className="mt-2 small">
        {(favorable ? analysis.buyReasons : analysis.waitReasons.length ? analysis.waitReasons : ['Indicators are conflicting. Wait for confirmation.']).slice(0, 7).map((reason) => (
          <span key={reason} className="ais-reason-pill">✓ {reason}</span>
        ))}
      </div>
      <div className="small mt-2 opacity-75">Educational decision-support only. The highlight means the algorithm found a favorable setup according to configured rules, not a guaranteed or risk-free trade.</div>
    </div>
  );
}

function StockTable({ rows, selectedSymbol, onSelect }) {
  return (
    <div className="ais-stock-table table-responsive">
      <table className="table table-sm table-hover align-middle mb-0">
        <thead>
          <tr>
            <th>Stock</th>
            <th>Score</th>
            <th>Price</th>
            <th>Vol</th>
            <th>RSI</th>
            <th>Control</th>
            <th>Pattern</th>
            <th>Entry</th>
            <th>SL</th>
            <th>Target</th>
            <th>R/R</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.symbol}
              className={row.symbol === selectedSymbol ? 'ais-stock-table-row-selected' : ''}
              role="button"
              onClick={() => onSelect(row.symbol)}
            >
              <td>
                <strong className="ais-stock-symbol">{row.symbol}</strong>
                <div className="text-muted">{row.industry}</div>
              </td>
              <td>
                <span className={`badge ${row.buyScore >= 80 ? 'text-bg-success' : row.sellScore >= 70 ? 'text-bg-danger' : 'text-bg-warning'}`}>
                  {row.overallScore}/100
                </span>
              </td>
              <td>
                {formatMoney(row.price)}
                <div className={row.changePercent >= 0 ? 'text-success' : 'text-danger'}>
                  {row.changePercent >= 0 ? '+' : ''}{row.changePercent.toFixed(2)}%
                </div>
              </td>
              <td>{formatVolume(row.volume)}</td>
              <td>{row.rsi ? row.rsi.toFixed(0) : 'N/A'}</td>
              <td>{row.control.label}</td>
              <td>{row.primaryPattern?.name || 'No confirmed pattern'}</td>
              <td>{formatMoney(row.entry)}</td>
              <td>{formatMoney(row.stopLoss)}</td>
              <td>{formatMoney(row.target1)}</td>
              <td>{row.riskReward >= 2 ? `1:${row.riskReward.toFixed(1)}` : 'Wait'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && (
        <div className="alert alert-warning small mb-0">
          No stocks matched this tab. Required market data may be missing or stale.
        </div>
      )}
    </div>
  );
}

function ExplanationPanel({ analysis }) {
  const marker = analysis?.marker || { type: 'WAIT', reasons: [] };
  const pattern = analysis?.primaryPattern;
  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start gap-3">
          <div>
            <h5 className="mb-1">{marker.label} — {Math.max(analysis?.buyScore || 0, analysis?.sellScore || 0)}/100</h5>
            <div className="text-muted small">Why did the algorithm select this status?</div>
          </div>
          <button type="button" className="btn btn-sm btn-outline-secondary" data-bs-toggle="button">Learning</button>
        </div>
        <ol className="small mt-3 mb-3">
          {(marker.reasons.length ? marker.reasons : analysis?.waitReasons || []).slice(0, 8).map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ol>
        {pattern && (
          <div className="alert alert-light border small mb-3">
            <strong>{pattern.name}</strong><br />
            Pattern → {pattern.control}<br />
            Meaning → {pattern.meaning}<br />
            Confirmation → {pattern.confirmation.join(', ')}<br />
            Possible action → {pattern.action}<br />
            Risk warning → {pattern.warning}
          </div>
        )}
        <div className="small fw-semibold">Conclusion:</div>
        <div className="small text-muted">
          {marker.type === 'BUY'
            ? 'Multiple bullish factors are aligned. Wait for confirmation and manage risk.'
            : marker.type === 'SELL'
              ? 'Multiple bearish factors are aligned. Confirm support breakdown and manage risk.'
              : 'Indicators are incomplete or conflicting. Wait for confirmation before acting.'}
        </div>
      </div>
    </div>
  );
}

export default function AdvancedIntradayScanner() {
  const [rows, setRows] = useState([]);
  const [chartCandles, setChartCandles] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [activeTab, setActiveTab] = useState('top');
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[2]);
  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [marketSession, setMarketSession] = useState(() => getMarketSessionStatus());
  useEffect(() => {
    const update = () => setMarketSession(getMarketSessionStatus());
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const response = await fetchScannerMarketData();
        if (!response.ok) throw new Error(response.error || 'Failed to load NSE scanner data.');
        const nextRows = getRows(response.data);
        if (cancelled) return;
        setRows(nextRows);
        setSelectedSymbol((current) => current || getSymbol(nextRows[0]) || '');
        setLastUpdated(new Date());
      } catch (err) {
        if (!cancelled) setError(err.message || String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const timer = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const selectedRaw = useMemo(() => rows.find((row) => getSymbol(row) === selectedSymbol) || rows[0] || null, [rows, selectedSymbol]);

  useEffect(() => {
    let cancelled = false;
    async function loadChart() {
      if (!selectedRaw) return;
      setChartLoading(true);
      const symbol = getSymbol(selectedRaw);
      const embedded = normalizeCandlesFromChart(selectedRaw);
      if (embedded.length >= 2) {
        setChartCandles(embedded);
        setChartLoading(false);
        return;
      }
      try {
        const response = await fetchChartDataByIndex(`EQN:${symbol}`);
        if (cancelled) return;
        const candles = response.ok ? normalizeCandlesFromChart(response.data) : [];
        setChartCandles(candles);
      } catch {
        if (!cancelled) setChartCandles([]);
      } finally {
        if (!cancelled) setChartLoading(false);
      }
    }
    loadChart();
    return () => {
      cancelled = true;
    };
  }, [selectedRaw]);

  const industries = useMemo(() => scoreIndustry(rows), [rows]);
  const marketDirection = useMemo(() => marketDirectionFromRows(rows), [rows]);
  const industryScoreByName = useMemo(() => new Map(industries.map((item) => [item.industry, item.score])), [industries]);

  const analyses = useMemo(() => rows.map((row) => {
    const symbol = getSymbol(row);
    const candles = symbol === selectedSymbol ? chartCandles : normalizeCandlesFromChart(row);
    const industry = getIndustry(row);
    const analysis = analyzeRow(row, candles, marketDirection, industryScoreByName.get(industry) || 45);
    analysis.marker = detectMarker(analysis);
    return analysis;
  }).sort((a, b) => b.overallScore - a.overallScore), [rows, selectedSymbol, chartCandles, marketDirection, industryScoreByName]);

  const selectedAnalysis = analyses.find((row) => row.symbol === selectedSymbol) || analyses[0] || null;

  const filteredRows = useMemo(() => {
    const industryFilter = selectedIndustry ? (row) => row.industry === selectedIndustry : () => true;
    if (activeTab === 'bullish') return analyses.filter((row) => row.buyScore >= 80).filter(industryFilter);
    if (activeTab === 'breakout') return analyses.filter((row) => row.resistanceBreakout).filter(industryFilter);
    if (activeTab === 'active') return analyses.slice().sort((a, b) => b.volume - a.volume).filter(industryFilter).slice(0, 20);
    if (activeTab === 'avoid') return analyses.filter((row) => !row.hasRequiredData || row.setupLabel.includes('AVOID')).filter(industryFilter);
    if (activeTab === 'industries') return analyses.filter(industryFilter);
    return analyses.filter(industryFilter).slice(0, 10);
  }, [activeTab, analyses, selectedIndustry]);

  const topIndustry = industries[0];
  const topStock = analyses[0];

  return (
    <div className="ais-page">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
        <div>
          <h3 className="mb-1">Advanced NSE Intraday Stock Scanner</h3>
          <p className="text-muted mb-0">Educational scanner for industry strength, buyer/seller control, confirmation scoring and risk/reward.</p>
        </div>
        <div className="text-end small">
          <div><strong>{marketDirection.label}</strong></div>
          <div className="text-muted">NIFTY/BANK NIFTY proxy: breadth {marketDirection.score}/100 · {marketDirection.advancing} up / {marketDirection.declining} down</div>
          <div className="text-muted">Latest market data: {lastUpdated ? lastUpdated.toLocaleString() : 'N/A'}</div>
        </div>
      </div>

      {error && <div className="alert alert-warning">{error}</div>}
      {loading && <div className="alert alert-info">Refreshing NSE market data...</div>}

      {!marketSession.isMarketOpen && !marketSession.isPreOpen && (
        <div className="alert alert-danger">
          <strong>🔴 NSE MARKET {marketSession.status === 'WEEKEND' ? 'CLOSED (WEEKEND)' : 'CLOSED'}</strong> — IST {marketSession.istTime}.
          <div className="small mt-1">Intraday indicators are from the last available session. They are <strong>NOT live signals</strong>. Do not trade based on closed-market data.</div>
        </div>
      )}

      <div className="alert alert-secondary border-0 small">
        This tool highlights “Strong Setup”, “Favorable Setup”, or “High-Confidence Setup” only when multiple rules align. It does not guarantee profit and it should not be treated as risk-free advice.
      </div>

      <div className="row g-3 mb-3">
        <div className="col-12 col-lg-3">
          <div className="ais-answer-card">
            <span>1. Strong Industry</span>
            <strong>{topIndustry?.industry || 'N/A'}</strong>
            <small>{topIndustry ? `${topIndustry.score}/100 · ${topIndustry.advancing} advancing` : 'Insufficient data'}</small>
          </div>
        </div>
        <div className="col-12 col-lg-3">
          <div className="ais-answer-card">
            <span>2. Strong Stock</span>
            <strong>{topStock?.symbol || 'N/A'}</strong>
            <small>{topStock ? `${topStock.overallScore}/100 · ${topStock.setupLabel}` : 'Insufficient data'}</small>
          </div>
        </div>
        <div className="col-12 col-lg-3">
          <div className="ais-answer-card">
            <span>3. Control</span>
            <strong>{selectedAnalysis?.control?.label || 'N/A'}</strong>
            <small>{selectedAnalysis?.primaryPattern?.name || 'No confirmed pattern'}</small>
          </div>
        </div>
        <div className="col-12 col-lg-3">
          <div className="ais-answer-card">
            <span>4. Risk/Reward</span>
            <strong>{selectedAnalysis?.riskReward >= 2 ? `Favorable 1:${selectedAnalysis.riskReward.toFixed(1)}` : 'Wait'}</strong>
            <small>{selectedAnalysis?.hasRequiredData ? selectedAnalysis.setupLabel : 'Insufficient data'}</small>
          </div>
        </div>
      </div>

      <div className="d-flex flex-wrap gap-2 mb-3">
        {SCANNER_TABS.map((tab) => (
          <button key={tab.key} type="button" className={`btn btn-sm ${activeTab === tab.key ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => setActiveTab(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>


      <div className="row">
    <div className="col-12 col-xl-7">
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body">
              <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
                <select className="form-select form-select-sm" value={selectedSymbol} onChange={(event) => setSelectedSymbol(event.target.value)} style={{ maxWidth: 180 }}>
                  {analyses.map((row) => <option key={row.symbol} value={row.symbol}>{row.symbol}</option>)}
                </select>
                <select className="form-select form-select-sm" value={selectedIndustry} onChange={(event) => setSelectedIndustry(event.target.value)} style={{ maxWidth: 220 }}>
                  <option value="">All industries</option>
                  {industries.map((industry) => <option key={industry.industry} value={industry.industry}>{industry.industry} — {industry.score}/100</option>)}
                </select>
                {chartLoading && <span className="small text-muted">Loading chart...</span>}
              </div>
              <TradingChart analysis={selectedAnalysis} candles={chartCandles} timeframe={timeframe} onTimeframeChange={setTimeframe} />
            </div>
          </div>
          {selectedAnalysis && <SetupCard analysis={selectedAnalysis} />}
          {selectedAnalysis && <div className="mt-3"><ExplanationPanel analysis={selectedAnalysis} /></div>}
        </div>

      </div>

      <div className="row g-3">  
        <div className="col-12 col-xl-12">
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body">
              <h5 className="mb-3">🔥 Top Industries Today</h5>
              <div className="ais-industry-list">
                {industries.slice(0, 8).map((industry, index) => (
                  <button key={industry.industry} type="button" className={`ais-industry-row ${selectedIndustry === industry.industry ? 'active' : ''}`} onClick={() => setSelectedIndustry(industry.industry)}>
                    <span>{index + 1}. {industry.score >= 75 ? '🟢' : industry.score >= 55 ? '🟡' : '🔴'} {industry.industry}</span>
                    <strong>{industry.score}/100</strong>
                  </button>
                ))}
              </div>
              {selectedIndustry && (
                <button type="button" className="btn btn-sm btn-outline-secondary mt-3" onClick={() => setSelectedIndustry('')}>Clear industry filter</button>
              )}
            </div>
          </div>

          <StockTable rows={filteredRows} selectedSymbol={selectedSymbol} onSelect={setSelectedSymbol} />
        </div>
      </div>

      {activeTab === 'learning' && (
        <div className="card border-0 shadow-sm mt-3">
          <div className="card-body">
            <h5>📚 Candlestick Learning Library</h5>
            <div className="row g-2">
              {Object.entries(PATTERN_LIBRARY).map(([name, item]) => (
                <div className="col-12 col-md-6 col-xl-4" key={name}>
                  <div className="border rounded p-3 h-100 small">
                    <strong>{name}</strong>
                    <div>Buyer/Seller control: {item.control}</div>
                    <div>Meaning: {item.meaning}</div>
                    <div>Confirmation: {item.confirmation.join(', ')}</div>
                    <div>Possible action: {item.action}</div>
                    <div className="text-danger">Risk warning: {item.warning}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
