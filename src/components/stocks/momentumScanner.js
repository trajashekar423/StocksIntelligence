const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

function toNum(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const p = Number(String(value).replace(/,/g, '').replace(/%/g, ''));
  return Number.isFinite(p) ? p : 0;
}

function emaSeries(values, period) {
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

function rsiValue(closes, period = 14) {
  if (closes.length <= period) return null;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gains += d; else losses += Math.abs(d);
  }
  if (!losses) return 100;
  return 100 - 100 / (1 + gains / losses);
}

function adxProxy(candles) {
  if (candles.length < 15) return null;
  const recent = candles.slice(-14);
  const trs = recent.map((c, i) => {
    const prev = recent[i - 1]?.close ?? c.close;
    return Math.max(c.high - c.low, Math.abs(c.high - prev), Math.abs(c.low - prev));
  });
  const atr = trs.reduce((s, v) => s + v, 0) / trs.length;
  return clamp((atr / Math.max(candles.at(-1)?.close || 1, 1)) * 1000, 8, 60);
}

function vwapCurrent(candles) {
  let pv = 0, vol = 0;
  for (const c of candles) {
    const v = toNum(c.volume);
    if (!v) continue;
    pv += ((c.high + c.low + c.close) / 3) * v;
    vol += v;
  }
  return vol ? pv / vol : null;
}

function detectBullishPattern(candles) {
  if (candles.length < 2) return null;
  const last = candles.at(-1);
  const prev = candles.at(-2);
  const body = (c) => Math.abs(c.close - c.open);
  const range = (c) => Math.max(c.high - c.low, 0.001);
  const bullish = (c) => c.close >= c.open;
  const bodyHigh = (c) => Math.max(c.open, c.close);
  const bodyLow = (c) => Math.min(c.open, c.close);

  if (!bullish(prev) && bullish(last) && bodyHigh(last) >= bodyHigh(prev) && bodyLow(last) <= bodyLow(prev)) return 'Bullish Engulfing';
  const lower = Math.min(last.open, last.close) - last.low;
  const upper = last.high - Math.max(last.open, last.close);
  if (lower > body(last) * 2 && upper <= body(last) * 0.8 && bullish(last)) return 'Hammer';
  if (!bullish(prev) && bullish(last) && last.close > prev.open - body(prev) / 2 && last.open < prev.close) return 'Piercing Pattern';
  if (!bullish(prev) && bullish(last) && bodyHigh(last) < bodyHigh(prev) && bodyLow(last) > bodyLow(prev)) return 'Bullish Harami';
  if (candles.length >= 3) {
    const third = candles.at(-3);
    if (!bullish(third) && body(prev) / range(prev) < 0.35 && bullish(last) && last.close > (third.open + third.close) / 2) return 'Morning Star';
    if (bullish(third) && bullish(prev) && bullish(last) && last.close > prev.close && prev.close > third.close) return 'Three White Soldiers';
  }
  return null;
}

/* ─── MOVEMENT ZONE ─────────────────────────────────────── */

export const MOVEMENT_ZONES = [
  { key: 'early',    label: '🟢 1–2% Early Momentum',      min: 1,  max: 2  },
  { key: 'strong',   label: '🟢 2–5% Strong Momentum',     min: 2,  max: 5  },
  { key: 'high',     label: '🔥 5–10% High Momentum',      min: 5,  max: 10 },
  { key: 'veryhigh', label: '🔥 10–20% Very High Momentum', min: 10, max: 20 },
  { key: 'extreme1', label: '🔥🔥 20–30% Extreme Momentum', min: 20, max: 30 },
  { key: 'extreme2', label: '🚨 30–40% Extreme Move',       min: 30, max: 40 },
  { key: 'extreme3', label: '🚨 40–50% Extreme Move',       min: 40, max: 50 },
  { key: 'potential',label: '🔮 Potential Movers',          min: 0,  max: 5  },
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

/* ─── MOMENTUM SCORE ─────────────────────────────────────── */

function scoreGap(pctFromOpen) {
  if (pctFromOpen > 8)  return 10;
  if (pctFromOpen > 6)  return 9;
  if (pctFromOpen > 4)  return 7;
  if (pctFromOpen > 2)  return 5;
  if (pctFromOpen > 1)  return 4;
  if (pctFromOpen > 0)  return 2;
  return 0;
}

function scoreRVOL(rvol) {
  if (rvol > 3)   return 15;
  if (rvol > 2)   return 12;
  if (rvol > 1.5) return 8;
  if (rvol > 1)   return 5;
  return 0;
}

function scoreVWAP(price, vwap, prevVwap) {
  if (!vwap) return 0;
  if (price > vwap && prevVwap && vwap > prevVwap) return 10;
  if (price > vwap) return 6;
  return 0;
}

function scoreEMA(ema9, ema21, ema50) {
  let s = 0;
  if (ema9 && ema21 && ema9 > ema21) s += 5;
  if (ema21 && ema50 && ema21 > ema50) s += 5;
  return s;
}

function scoreBreakout(price, pdh, orbHigh, resistance, rvol) {
  const levels = [pdh, orbHigh, resistance].filter(Boolean);
  const broken = levels.filter((l) => price > l);
  if (!broken.length) {
    const near = levels.some((l) => price >= l * 0.995 && price < l);
    return near ? 3 : 0;
  }
  if (rvol > 2)   return 15;
  if (rvol > 1.5) return 10;
  return 5;
}

function scoreCandle(pattern) {
  if (!pattern) return 0;
  const strong = ['Bullish Engulfing', 'Morning Star', 'Three White Soldiers', 'Three Outside Up', 'Three Inside Up'];
  return strong.includes(pattern) ? 10 : 3;
}

function scoreRSI(rsi) {
  if (!rsi) return 0;
  if (rsi > 80) return 0;
  if (rsi >= 70) return 3;
  if (rsi >= 60) return 5;
  if (rsi >= 50) return 3;
  return 0;
}

function scoreADX(adx) {
  if (!adx) return 0;
  if (adx > 35) return 5;
  if (adx > 25) return 4;
  if (adx > 20) return 2;
  return 0;
}

function scoreIndustry(industryScore) {
  if (industryScore >= 80) return 10;
  if (industryScore >= 65) return 7;
  if (industryScore >= 50) return 4;
  if (industryScore >= 35) return 2;
  return 0;
}

function scoreMarket(marketScore) {
  if (marketScore >= 65) return 5;
  if (marketScore >= 45) return 2;
  return 0;
}

/* ─── CHASE DETECTION ────────────────────────────────────── */

function detectChase(pctFromOpen, rsi, price, vwap, rvol) {
  if (pctFromOpen >= 10 && rsi > 80 && vwap && price > vwap * 1.05 && rvol < 1.5) {
    return 'DO_NOT_CHASE';
  }
  if (pctFromOpen >= 20) return 'EXTREME_CAUTION';
  if (pctFromOpen >= 30) return 'EXTREME_VOLATILITY';
  return null;
}

/* ─── ORB ────────────────────────────────────────────────── */

function calcORB(candles, minutes = 15) {
  if (!candles.length) return { high: null, low: null };
  const orbCandles = candles.slice(0, Math.ceil(minutes));
  return {
    high: Math.max(...orbCandles.map((c) => c.high).filter(Boolean)),
    low:  Math.min(...orbCandles.map((c) => c.low).filter(Boolean)),
  };
}

/* ─── MAIN BUILD ─────────────────────────────────────────── */

export function buildMomentumScanner(rows = [], candles = [], marketScore = 50, industryScoreMap = new Map()) {
  const results = rows
    .map((row) => {
      const price      = toNum(row?.price ?? row?.lastPrice ?? row?.ltp ?? row?.close);
      const open       = toNum(row?.open ?? row?.open_price) || price;
      const dayHigh    = toNum(row?.dayHigh ?? row?.high);
      const dayLow     = toNum(row?.dayLow ?? row?.low);
      const pdh        = toNum(row?.previousDayHigh ?? row?.prevDayHigh);
      const pdl        = toNum(row?.previousDayLow  ?? row?.prevDayLow);
      const prevClose  = toNum(row?.previousClose   ?? row?.prevClose);
      const volume     = toNum(row?.volume ?? row?.totalTradedVolume ?? row?.quantityTraded);
      const avgVolume  = toNum(row?.averageVolume   ?? row?.avgVolume);
      const rvol       = avgVolume > 0 ? volume / avgVolume : toNum(row?.volumeRatio);
      const symbol     = String(row?.symbol || row?.Symbol || '').trim().toUpperCase();
      const industry   = row?.industry || row?.sector || 'Unclassified';
      const indScore   = industryScoreMap.get(industry) ?? 45;

      if (!price || !symbol) return null;

      const rowCandles = candles.filter((c) => c.symbol === symbol);
      const closes     = rowCandles.map((c) => c.close).filter(Boolean);
      const ema9s      = emaSeries(closes, 9);
      const ema21s     = emaSeries(closes, 21);
      const ema50s     = emaSeries(closes, 50);
      const ema9       = toNum(row?.ema9)  || ema9s.at(-1)  || 0;
      const ema21      = toNum(row?.ema20) || ema21s.at(-1) || 0;
      const ema50      = toNum(row?.ema50) || ema50s.at(-1) || 0;
      const vwap       = toNum(row?.vwap)  || vwapCurrent(rowCandles) || 0;
      const prevVwap   = rowCandles.length > 1 ? vwapCurrent(rowCandles.slice(0, -1)) : null;
      const rsi        = toNum(row?.rsi)   || rsiValue(closes);
      const adx        = toNum(row?.adx)   || adxProxy(rowCandles);
      const pattern    = detectBullishPattern(rowCandles);
      const orb        = calcORB(rowCandles);

      const pctFromOpen   = open ? ((price - open) / open) * 100 : 0;
      const highFromOpen  = open ? ((dayHigh - open) / open) * 100 : 0;
      const lowFromOpen   = open ? ((dayLow  - open) / open) * 100 : 0;
      const distVwap      = vwap  ? ((price - vwap)  / vwap)  * 100 : null;
      const distPDH       = pdh   ? ((price - pdh)   / pdh)   * 100 : null;
      const distPDL       = pdl   ? ((price - pdl)   / pdl)   * 100 : null;

      const resistance = toNum(row?.resistance) || pdh || (rowCandles.length ? Math.max(...rowCandles.slice(-20).map((c) => c.high)) : 0);
      const support    = toNum(row?.support)    || pdl || (rowCandles.length ? Math.min(...rowCandles.slice(-20).map((c) => c.low))  : 0);

      /* ── Scores ── */
      const sGap      = scoreGap(pctFromOpen);
      const sRvol     = scoreRVOL(rvol);
      const sVwap     = scoreVWAP(price, vwap, prevVwap);
      const sEma      = scoreEMA(ema9, ema21, ema50);
      const sBreakout = scoreBreakout(price, pdh, orb.high, resistance, rvol);
      const sCandle   = scoreCandle(pattern);
      const sRsi      = scoreRSI(rsi);
      const sAdx      = scoreADX(adx);
      const sInd      = scoreIndustry(indScore);
      const sMkt      = scoreMarket(marketScore);

      const momentumScore = clamp(
        Math.round(sGap + sRvol + sVwap + sEma + sBreakout + sCandle + sRsi + sAdx + sInd + sMkt),
        0, 100
      );

      /* ── Early momentum bonus ── */
      const earlyMomentum = pctFromOpen >= 1 && pctFromOpen <= 5 && rvol >= 1.5 && vwap && price > vwap && ema9 > ema21;

      /* ── ORB status ── */
      let orbStatus = null;
      if (orb.high && price > orb.high && vwap && price > vwap && ema9 > ema21 && rvol >= 1.5) orbStatus = 'BUY';
      else if (orb.low && price < orb.low && vwap && price < vwap && ema9 < ema21 && rvol >= 1.5) orbStatus = 'SELL';

      /* ── Chase detection ── */
      const chaseWarning = detectChase(pctFromOpen, rsi, price, vwap, rvol);

      /* ── Signal label ── */
      const signalLabel =
        momentumScore >= 90 ? '🚀 Exceptional Momentum' :
        momentumScore >= 80 ? '🟢 Strong Momentum' :
        momentumScore >= 70 ? '🟢 Favorable Setup' :
        momentumScore >= 60 ? '🟡 Watch' :
        momentumScore >= 50 ? '🟠 Weak' :
        '🔴 Avoid';

      /* ── Risk/Reward ── */
      const atr = adx ? (price * adx / 1000) : price * 0.006;
      const sl  = support && support < price ? Math.max(support, price - atr * 1.5) : price - atr * 1.5;
      const risk = Math.max(price - sl, 0.01);
      const t1  = resistance && resistance > price ? resistance : price + risk * 2;
      const t2  = price + risk * 2.5;
      const t3  = price + risk * 3.5;
      const rr  = (t1 - price) / risk;

      /* ── Buy conditions ── */
      const buyConditions = [
        [price > vwap,          'Price above VWAP'],
        [ema9 > ema21,          'EMA 9 > EMA 21'],
        [rvol >= 1.5,           `RVOL ${rvol.toFixed(2)}x`],
        [sBreakout >= 10,       'Resistance breakout'],
        [Boolean(pattern),      pattern ? `${pattern} detected` : ''],
        [indScore >= 65,        `Industry strength ${indScore}/100`],
        [marketScore >= 55,     'Market supportive'],
        [rsi >= 50 && rsi <= 75, `RSI ${rsi?.toFixed(0) || 'N/A'}`],
      ].filter(([ok, label]) => ok && label);

      const buyConfirmed = buyConditions.length >= 5 && momentumScore >= 80 && rr >= 2 && !chaseWarning;

      /* ── Movement zone ── */
      const zone = getMovementZone(pctFromOpen);

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
        vwap,
        ema9,
        ema21,
        ema50,
        rsi,
        adx,
        pattern,
        orb,
        orbStatus,
        pctFromOpen,
        highFromOpen,
        lowFromOpen,
        distVwap,
        distPDH,
        distPDL,
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
        zone,
        scores: { sGap, sRvol, sVwap, sEma, sBreakout, sCandle, sRsi, sAdx, sInd, sMkt },
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      // Favor early momentum (1–5%) with high score over already-extended stocks
      const aEarly = a.pctFromOpen >= 1 && a.pctFromOpen <= 5 ? 1 : 0;
      const bEarly = b.pctFromOpen >= 1 && b.pctFromOpen <= 5 ? 1 : 0;
      if (bEarly !== aEarly) return bEarly - aEarly;
      return b.momentumScore - a.momentumScore || b.rvol - a.rvol || b.indScore - a.indScore;
    });

  return results;
}
