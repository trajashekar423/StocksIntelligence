/**
 * Momentum Scanner — pure scoring logic.
 * Receives pre-computed indicators from indicatorEngine.js.
 * No symbol-specific code. Works for any valid NSE equity.
 */

import { computeIndicators } from '../../services/indicatorEngine.js';
import { normalizeSymbol } from '../../services/candleCache.js';

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

function toNum(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const p = Number(String(value).replace(/,/g, '').replace(/%/g, ''));
  return Number.isFinite(p) ? p : 0;
}

/* ─── MOVEMENT ZONES ─────────────────────────────────────── */

export const MOVEMENT_ZONES = [
  { key: 'early',    label: '🟢 1–2% Early Momentum',       min: 1,  max: 2  },
  { key: 'strong',   label: '🟢 2–5% Strong Momentum',      min: 2,  max: 5  },
  { key: 'high',     label: '🔥 5–10% High Momentum',       min: 5,  max: 10 },
  { key: 'veryhigh', label: '🔥 10–20% Very High Momentum', min: 10, max: 20 },
  { key: 'extreme1', label: '🔥🔥 20–30% Extreme Momentum', min: 20, max: 30 },
  { key: 'extreme2', label: '🚨 30–40% Extreme Move',        min: 30, max: 40 },
  { key: 'extreme3', label: '🚨 40–50% Extreme Move',        min: 40, max: 50 },
  { key: 'potential',label: '🔮 Potential Movers',           min: 0,  max: 5  },
];

export function getMovementZone(pctFromOpen) {
  if (pctFromOpen >= 40) return 'extreme3';
  if (pctFromOpen >= 30) return 'extreme2';
  if (pctFromOpen >= 20) return 'extreme1';
  if (pctFromOpen >= 10) return 'veryhigh';
  if (pctFromOpen >= 5)  return 'high';
  if (pctFromOpen >= 2)  return 'strong';
  if (pctFromOpen >= 1)  return 'early';
  return 'potential';
}

export function getMovementLevels(open) {
  if (!open) return [];
  return [1, 2, 5, 10, 20, 30, 40, 50].map((pct) => ({
    pct,
    price: open * (1 + pct / 100),
    label: pct >= 30 ? `🚨 ${pct}%` : pct >= 10 ? `🔥 ${pct}%` : `🟢 ${pct}%`,
  }));
}

/* ─── SCORING FUNCTIONS ──────────────────────────────────── */

function scoreVWAP(price, vwap) {
  if (!vwap || !price) return 0;
  if (price > vwap * 1.005) return 15;
  if (price > vwap) return 10;
  return 0;
}

function scoreRSI(rsi) {
  if (rsi === null || rsi === undefined) return 0;
  if (rsi > 80) return 0;
  if (rsi >= 65) return 8;
  if (rsi >= 55) return 10;
  if (rsi >= 50) return 6;
  return 0;
}

function scoreADX(adx, plusDI, minusDI) {
  if (!adx) return 0;
  const trending = plusDI && minusDI ? plusDI > minusDI : true;
  if (!trending) return 0;
  if (adx > 40) return 15;
  if (adx > 30) return 12;
  if (adx > 25) return 10;
  if (adx > 20) return 7;
  if (adx > 15) return 4;
  return 0;
}

function scoreRVOL(rvol, rvolStatus) {
  if (!rvol || rvolStatus === 'insufficient_history') return 0;
  if (rvol > 3)   return 15;
  if (rvol > 2)   return 12;
  if (rvol > 1.5) return 9;
  if (rvol > 1.2) return 6;
  if (rvol > 1)   return 3;
  return 0;
}

function scoreORB(price, orbHigh, orbLow, orbStatus, vwap, rvol) {
  if (orbStatus !== 'valid' || !orbHigh || !orbLow) return 0;
  if (price > orbHigh && vwap && price > vwap && rvol >= 1.5) return 15;
  if (price > orbHigh) return 10;
  if (price >= orbHigh * 0.995) return 5;
  return 0;
}

function scoreEMA(price, ema9, ema20, ema50) {
  let s = 0;
  if (ema9 && ema20 && ema9 > ema20) s += 5;
  if (ema20 && ema50 && ema20 > ema50) s += 3;
  if (price && ema9 && price > ema9) s += 2;
  return Math.min(s, 10);
}

function scoreMACD(macd, macdSignal, macdHist) {
  if (macd === null || macdSignal === null) return 0;
  if (macd > macdSignal && macdHist > 0) return 5;
  if (macd > macdSignal) return 3;
  return 0;
}

function scorePriceMomentum(pctFromOpen) {
  if (pctFromOpen > 8)  return 5;
  if (pctFromOpen > 4)  return 4;
  if (pctFromOpen > 2)  return 3;
  if (pctFromOpen > 1)  return 2;
  if (pctFromOpen > 0)  return 1;
  return 0;
}

function scoreCandle(pattern) {
  if (!pattern) return 0;
  const strong = ['Bullish Engulfing', 'Morning Star', 'Three White Soldiers', 'Hammer'];
  const moderate = ['Bullish Harami', 'Piercing Pattern', 'Strong Bullish Candle'];
  if (strong.includes(pattern)) return 5;
  if (moderate.includes(pattern)) return 3;
  return 1;
}

function scoreSector(sectorScore) {
  if (sectorScore >= 80) return 5;
  if (sectorScore >= 65) return 4;
  if (sectorScore >= 50) return 3;
  if (sectorScore >= 35) return 1;
  return 0;
}

function scoreMarket(marketScore) {
  if (marketScore >= 65) return 5;
  if (marketScore >= 45) return 3;
  return 0;
}

/* ─── ORB STATUS LABEL ───────────────────────────────────── */

function getOrbStatusLabel(price, orbHigh, orbLow, orbStatus, vwap, rvol) {
  if (orbStatus !== 'valid' || !orbHigh || !orbLow) return null;
  if (price > orbHigh && vwap && price > vwap && rvol >= 1.5) return 'BUY';
  if (price < orbLow  && vwap && price < vwap && rvol >= 1.5) return 'SELL';
  if (price > orbHigh) return 'BREAKOUT';
  if (price < orbLow)  return 'BREAKDOWN';
  return null;
}

/* ─── CHASE DETECTION ────────────────────────────────────── */

function detectChase(pctFromOpen, rsi, price, vwap, rvol) {
  if (pctFromOpen >= 30) return 'EXTREME_VOLATILITY';
  if (pctFromOpen >= 20) return 'EXTREME_CAUTION';
  if (pctFromOpen >= 10 && rsi > 80 && vwap && price > vwap * 1.05 && rvol < 1.5) return 'DO_NOT_CHASE';
  return null;
}

/* ─── MAIN BUILD ─────────────────────────────────────────── */

/**
 * @param {Array}  rows            - scanner rows (quote/top-ten data)
 * @param {Map}    candleMap       - Map<symbol, candle[]> from candleCache
 * @param {number} marketScore     - 0–100 broad market score
 * @param {Map}    industryScoreMap - Map<industry, score>
 */
export function buildMomentumScanner(rows = [], candleMap = new Map(), marketScore = 50, industryScoreMap = new Map()) {
  const results = rows
    .map((row) => {
      const symbol    = String(row?.symbol || row?.Symbol || '').trim().toUpperCase().replace(/:.*$/, '');
      const price     = toNum(row?.price ?? row?.lastPrice ?? row?.ltp ?? row?.close);
      if (!price || !symbol) return null;

      const open      = toNum(row?.open ?? row?.open_price) || price;
      const dayHigh   = toNum(row?.dayHigh ?? row?.high);
      const dayLow    = toNum(row?.dayLow  ?? row?.low);
      const pdh       = toNum(row?.previousDayHigh ?? row?.prevDayHigh);
      const pdl       = toNum(row?.previousDayLow  ?? row?.prevDayLow);
      const prevClose = toNum(row?.previousClose   ?? row?.prevClose);
      const volume    = toNum(row?.volume ?? row?.totalTradedVolume ?? row?.quantityTraded);
      const avgVolume = toNum(row?.averageVolume   ?? row?.avgVolume);
      const industry  = row?.industry || row?.sector || 'Unclassified';
      const indScore  = industryScoreMap.get(industry) ?? 45;

      // Get candles for this symbol from the pre-fetched map
      const candles = candleMap.get(symbol) || [];

      // Compute all indicators from candles
      const ind = computeIndicators(candles, { currentVolume: volume, averageVolume: avgVolume });

      // Prefer candle-derived values; fall back to quote fields only if candles unavailable
      const vwap    = (ind.vwap    != null) ? ind.vwap    : (toNum(row?.vwap)  || null);
      const rsi     = (ind.rsi     != null) ? ind.rsi     : (toNum(row?.rsi)   || null);
      const adx     = ind.adx     ?? null;
      const plusDI  = ind.plusDI  ?? null;
      const minusDI = ind.minusDI ?? null;
      const atr     = ind.atr     ?? null;
      const rvol    = (ind.rvol != null) ? ind.rvol : ((avgVolume > 0 ? volume / avgVolume : toNum(row?.volumeRatio)) || 0);
      const rvolStatus = ind.rvolStatus;
      const ema9    = (ind.ema9  != null) ? ind.ema9  : (toNum(row?.ema9)  || null);
      const ema20   = (ind.ema20 != null) ? ind.ema20 : (toNum(row?.ema20) || null);
      const ema50   = (ind.ema50 != null) ? ind.ema50 : (toNum(row?.ema50) || null);
      const orbHigh = ind.orbHigh ?? null;
      const orbLow  = ind.orbLow  ?? null;
      const orbCalcStatus = ind.orbStatus;
      const macd    = ind.macd    ?? null;
      const macdSig = ind.macdSignal ?? null;
      const macdHist = ind.macdHist ?? null;
      const pattern = ind.candlePattern;

      const pctFromOpen  = open ? ((price - open) / open) * 100 : 0;
      const highFromOpen = open ? ((dayHigh - open) / open) * 100 : 0;
      const lowFromOpen  = open ? ((dayLow  - open) / open) * 100 : 0;
      const distVwap     = vwap  ? ((price - vwap)  / vwap)  * 100 : null;
      const distPDH      = pdh   ? ((price - pdh)   / pdh)   * 100 : null;

      const resistance = toNum(row?.resistance) || pdh || (candles.length ? Math.max(...candles.slice(-20).map((c) => c.high)) : 0);
      const support    = toNum(row?.support)    || pdl || (candles.length ? Math.min(...candles.slice(-20).map((c) => c.low))  : 0);

      /* ── Scores (total 100) ── */
      const sVwap    = scoreVWAP(price, vwap);                                    // 15
      const sRsi     = scoreRSI(rsi);                                             // 10
      const sAdx     = scoreADX(adx, plusDI, minusDI);                           // 15
      const sRvol    = scoreRVOL(rvol, rvolStatus);                              // 15
      const sOrb     = scoreORB(price, orbHigh, orbLow, orbCalcStatus, vwap, rvol); // 15
      const sEma     = scoreEMA(price, ema9, ema20, ema50);                      // 10
      const sMacd    = scoreMACD(macd, macdSig, macdHist);                       // 5
      const sMom     = scorePriceMomentum(pctFromOpen);                          // 5
      const sSector  = scoreSector(indScore);                                    // 5
      const sMkt     = scoreMarket(marketScore);                                 // 5
      // candle pattern is a bonus (not in base 100)
      const sCandle  = scoreCandle(pattern);

      const momentumScore = clamp(
        Math.round(sVwap + sRsi + sAdx + sRvol + sOrb + sEma + sMacd + sMom + sSector + sMkt + sCandle),
        0, 100
      );

      /* ── Data sufficiency check ── */
      const hasCandles = candles.length >= 5;
      const dataInsufficient = !hasCandles && !vwap && !rsi && !adx;

      /* ── Data completeness % ── */
      const dataFields = [vwap, rsi, adx, rvol > 0 ? rvol : null, ema9, ema20, ema50, macd, orbHigh];
      const dataCompleteness = Math.round((dataFields.filter((v) => v != null).length / dataFields.length) * 100);

      /* ── ORB trade signal ── */
      const orbTradeStatus = getOrbStatusLabel(price, orbHigh, orbLow, orbCalcStatus, vwap, rvol);

      /* ── Early momentum ── */
      const earlyMomentum = pctFromOpen >= 1 && pctFromOpen <= 5 && rvol >= 1.5 && vwap && price > vwap && ema9 && ema20 && ema9 > ema20;

      /* ── Chase detection ── */
      const chaseWarning = detectChase(pctFromOpen, rsi, price, vwap, rvol);

      /* ── Signal label ── */
      const signalLabel =
        dataInsufficient      ? '⚪ Data Insufficient' :
        momentumScore >= 85   ? '🔥 Strong Momentum' :
        momentumScore >= 75   ? '🟢 Good' :
        momentumScore >= 65   ? '🟡 Watch' :
        '🔴 Avoid';

      /* ── Entry status (separate from ranking) ── */
      const entryReady =
        momentumScore >= 75 &&
        vwap && price > vwap &&
        rvol >= 1.5 &&
        adx != null && adx >= 20 &&
        sOrb >= 10 &&
        ema9 && ema20 && ema9 > ema20 &&
        !chaseWarning;

      const entryStatus = entryReady ? '✅ ENTRY READY' : momentumScore >= 65 ? '👁 WATCH' : '⛔ NOT READY';

      /* ── Risk/Reward ── */
      const atrVal  = atr || (price * 0.006);
      const sl      = support && support < price ? Math.max(support, price - atrVal * 1.5) : price - atrVal * 1.5;
      const risk    = Math.max(price - sl, 0.01);
      const t1      = resistance && resistance > price ? resistance : price + risk * 2;
      const t2      = price + risk * 2.5;
      const t3      = price + risk * 3.5;
      const rr      = (t1 - price) / risk;

      /* ── Buy conditions ── */
      const buyConditions = [
        [vwap && price > vwap,                    'Price above VWAP'],
        [ema9 && ema20 && ema9 > ema20,           'EMA 9 > EMA 20'],
        [rvol >= 1.5,                             `RVOL ${rvol.toFixed(2)}x`],
        [sOrb >= 10,                              'ORB Breakout'],
        [Boolean(pattern),                        pattern ? `${pattern}` : ''],
        [indScore >= 65,                          `Sector ${indScore}/100`],
        [marketScore >= 55,                       'Market supportive'],
        [rsi !== null && rsi >= 50 && rsi <= 75,  `RSI ${rsi?.toFixed(0)}`],
        [adx !== null && adx > 20,                `ADX ${adx?.toFixed(0)}`],
      ].filter(([ok, label]) => ok && label);

      const buyConfirmed = buyConditions.length >= 5 && momentumScore >= 75 && rr >= 2 && !chaseWarning;

      return {
        symbol,
        companyName: row?.companyName || symbol,
        industry,
        indScore,
        price,
        open,
        dayHigh,
        dayLow,
        pdh,
        pdl,
        prevClose,
        volume,
        avgVolume,
        rvol,
        rvolStatus,
        vwap,
        vwapStatus: ind.vwapStatus,
        ema9,
        ema20,
        ema50,
        rsi,
        rsiStatus: ind.rsiStatus,
        adx,
        plusDI,
        minusDI,
        adxStatus: ind.adxStatus,
        atr: atrVal,
        macd,
        macdSignal: macdSig,
        macdHist,
        pattern,
        orbHigh,
        orbLow,
        orbStatus: orbTradeStatus,
        orbCalcStatus,
        pctFromOpen,
        highFromOpen,
        lowFromOpen,
        distVwap,
        distPDH,
        resistance,
        support,
        sl,
        t1,
        t2,
        t3,
        rr: Number(rr.toFixed(2)),
        momentumScore,
        signalLabel,
        earlyMomentum,
        chaseWarning,
        buyConditions,
        buyConfirmed,
        dataInsufficient,
        dataCompleteness,
        entryStatus,
        entryReady,
        candleCount: candles.length,
        zone: getMovementZone(pctFromOpen),
        scores: { sVwap, sRsi, sAdx, sRvol, sOrb, sEma, sMacd, sMom, sSector, sMkt, sCandle },
        indicators: ind,
      };
    })
    .filter(Boolean)
    // TOP 10 = highest Momentum Score descending. NSE Top Ten / Most Active do NOT determine rank.
    .sort((a, b) => b.momentumScore - a.momentumScore || b.rvol - a.rvol || b.indScore - a.indScore);

  return results;
}
