export type Candle = {
  time?: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type MarketDepthSide = { price: number; qty: number }[];

export type MarketDepth = {
  bids?: MarketDepthSide;
  asks?: MarketDepthSide;
};

export type Macd = { macd: number; signal: number; hist?: number } | null;

export type StockInput = {
  symbol?: string;
  ltp?: number;
  open?: number;
  high?: number;
  low?: number;
  previousClose?: number;
  totalBuyQty?: number;
  totalSellQty?: number;
  totalTradedVolume?: number; // current cumulative
  avg20Volume?: number; // 20-day average volume
  intraday?: Candle[]; // ordered by time asc
  marketDepth?: MarketDepth;
  vwap?: number;
  ema9?: number;
  ema20?: number;
  ema50?: number;
  rsi?: number;
  macd?: Macd;
  atr?: number;
  prevDayHigh?: number;
  prevDayLow?: number;
  prevDayClose?: number;
  fiftyTwoWeekHigh?: number;
  nifty?: {
    price?: number;
    vwap?: number;
  };
  marketCap?: number;
};

export type HeatmapBox = {
  symbol?: string;
  ltp?: number;
  changePercent?: number | null;
  score: number;
  scoreMax: number;
  label: string; // e.g., HIGH CONVICTION BUY, STRONG BUY, BUY CANDIDATE, WATCH, AVOID
  colorHex: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  entryBadge: 'ENTRY READY' | 'WAIT';
  entryPrice: number | null;
  breakoutBadges: string[];
  volumeBadge: string;
  orderBookBadge: string;
  buyRatio: number | null;
  volumeRatio: number | null;
  breakoutConfirmed: boolean;
  breakoutType: string | null;
  marketCap?: number | null;
  reasons: string[];
};

function calcBuyRatio(stock: StockInput) {
  const buy = safeNum(stock.totalBuyQty) || 0;
  const sell = safeNum(stock.totalSellQty) || 0;
  if (buy === 0 && sell === 0) return null;
  return sell === 0 ? Infinity : buy / sell;
}

function calcVolumeRatio(stock: StockInput) {
  const cur = safeNum(stock.totalTradedVolume);
  const avg = safeNum(stock.avg20Volume);
  if (cur == null || avg == null || avg <= 0) return null;
  return cur / avg;
}

export function evaluateHeatmapBox(stock: StockInput): HeatmapBox {
  const scan = scanStock(stock);
  const score = scan.score;
  const scoreMax = 155; // visual max per design
  const buyRatio = calcBuyRatio(stock);
  const volumeRatio = calcVolumeRatio(stock);

  // label/color mapping
    let label = 'AVOID';
    let colorHex = '#E53935'; // Red
    if (score >= 120) {
      label = 'HIGH CONVICTION BUY';
      colorHex = '#00C853'; // Dark Green
    } else if (score >= 100) {
      label = 'STRONG BUY';
      colorHex = '#4CAF50'; // Green
    } else if (score >= 80) {
      label = 'BUY CANDIDATE';
      colorHex = '#FFD600'; // Yellow
    } else if (score >= 60) {
      label = 'WATCH';
      colorHex = '#FB8C00'; // Orange
    }

  // breakout badges
  const breakoutBadges: string[] = [];
  if (scan.breakout) {
    const t = scan.breakoutType || '';
    if (t === 'OpeningRange') breakoutBadges.push('🔥 ORB');
    if (t === 'PreviousDayHigh') breakoutBadges.push('🔥 Previous High');
    if (t === 'Consolidation') breakoutBadges.push('🔥 Consolidation');
    if (t === '52WeekHigh') breakoutBadges.push('🔥 52 Week High');
  }
  // VWAP breakout badge
  if (safeNum(stock.ltp) != null && safeNum(stock.vwap) != null && stock.ltp! > stock.vwap!) {
    if (!breakoutBadges.includes('🔥 VWAP Breakout')) breakoutBadges.push('🔥 VWAP Breakout');
  }

  // volume badge
  let volumeBadge = 'Normal Volume';
  if (volumeRatio != null) {
    if (volumeRatio >= 3) volumeBadge = '3x Volume 🔥';
    else if (volumeRatio >= 2) volumeBadge = '2x Volume';
    else if (volumeRatio >= 1.5) volumeBadge = '1.5x Volume';
  }

  // order book badge
  let orderBookBadge = 'Balanced';
  if (buyRatio == null) orderBookBadge = 'Balanced';
  else if (buyRatio === Infinity || buyRatio > 2) orderBookBadge = 'Strong Buyers';
  else if (buyRatio < 0.8) orderBookBadge = 'Strong Sellers';

    // confirmations per spec for Low risk (all must be true)
    const confirmations: { key: string; ok: boolean }[] = [];
    const cScore = score >= 100;
    const cPriceAboveVwap = safeNum(stock.ltp) != null && safeNum(stock.vwap) != null && stock.ltp! > stock.vwap!;
    const cEmaBull = safeNum(stock.ema9) != null && safeNum(stock.ema20) != null && safeNum(stock.ema50) != null && stock.ema9! > stock.ema20! && stock.ema20! > stock.ema50!;
    const cBuyRatio = buyRatio != null && buyRatio > 2;
    const cVolume = volumeRatio != null && volumeRatio >= 2;
    const cBreakout = scan.breakout === true;
    const cNifty = stock.nifty != null && safeNum(stock.nifty.price) != null && safeNum(stock.nifty.vwap) != null && stock.nifty.price! > stock.nifty.vwap!;
    const cRsi = safeNum(stock.rsi) != null && stock.rsi! >= 55 && stock.rsi! <= 70;
    const cMacd = (stock.macd != null && stock.macd.macd > stock.macd.signal);

    confirmations.push({ key: 'Score>=100', ok: cScore });
    confirmations.push({ key: 'Price>VWAP', ok: cPriceAboveVwap });
    confirmations.push({ key: 'EMA Bullish', ok: cEmaBull });
    confirmations.push({ key: 'BuyRatio>2', ok: cBuyRatio });
    confirmations.push({ key: 'Volume>=2x', ok: cVolume });
    confirmations.push({ key: 'Breakout', ok: cBreakout });
    confirmations.push({ key: 'NiftyBullish', ok: cNifty });
    confirmations.push({ key: 'RSI 55-70', ok: cRsi });
    confirmations.push({ key: 'MACD Bullish', ok: cMacd });

    const passed = confirmations.filter((c) => c.ok).length;
    const total = confirmations.length;

    // Determine risk strictly
    let riskLevel: HeatmapBox['riskLevel'] = 'VERY_HIGH';
    const missing = total - passed;
    if (missing === 0) {
      riskLevel = 'LOW';
    } else if (missing <= 2) {
      riskLevel = 'MEDIUM';
    } else {
      // high risk detection: any of these conditions elevate to HIGH
      const priceBelowVwap = !cPriceAboveVwap;
      const emaWeak = !cEmaBull;
      const weakVolume = !(volumeRatio != null && volumeRatio >= 1.5);
      const sidewaysMarket = !stock.nifty || !(safeNum(stock.nifty.price) != null && safeNum(stock.nifty.vwap) != null);
      const highAtr = evaluateVolatilityAdjustment(stock) <= -15; // ATR too high
      const marketWeak = !cNifty;

      if (priceBelowVwap || emaWeak || weakVolume || sidewaysMarket || highAtr || marketWeak) {
        riskLevel = 'HIGH';
      } else {
        riskLevel = 'VERY_HIGH';
      }
    }

  // entry badge
  const entryReady = score >= 100 && scan.breakout === true && safeNum(stock.ltp) != null && safeNum(stock.vwap) != null && stock.ltp! > stock.vwap! && safeNum(stock.ema9) != null && safeNum(stock.ema20) != null && safeNum(stock.ema50) != null && stock.ema9! > stock.ema20! && stock.ema20! > stock.ema50! && buyRatio != null && buyRatio > 2 && volumeRatio != null && volumeRatio > 2 && stock.nifty != null && safeNum(stock.nifty.price) != null && safeNum(stock.nifty.vwap) != null && stock.nifty.price! > stock.nifty.vwap!;
  const entryBadge: HeatmapBox['entryBadge'] = entryReady ? 'ENTRY READY' : 'WAIT';

  return {
    symbol: stock.symbol,
    ltp: safeNum(stock.ltp) ?? undefined,
    changePercent: (safeNum(stock.ltp) != null && safeNum(stock.previousClose) != null) ? (((stock.ltp! - (stock.previousClose || 0)) / (stock.previousClose || 1)) * 100) : null,
    score,
    scoreMax,
    label,
    colorHex,
    riskLevel,
    entryBadge,
    entryPrice: scan.entryPrice,
    breakoutBadges,
    volumeBadge,
    orderBookBadge,
    buyRatio: buyRatio === Infinity ? null : (buyRatio ?? null),
    volumeRatio: volumeRatio ?? null,
    breakoutConfirmed: scan.breakout,
    breakoutType: scan.breakoutType,
    marketCap: safeNum(stock.marketCap) ?? null,
    reasons: scan.reasons,
  };
}

export function compareForHeatmap(a: HeatmapBox, b: HeatmapBox) {
  // Highest Score, then highest buyRatio, then highest volumeRatio, then breakout strength, then marketCap
  if (b.score !== a.score) return b.score - a.score;
  const ar = a.buyRatio ?? 0;
  const br = b.buyRatio ?? 0;
  if (br !== ar) return br - ar;
  const av = a.volumeRatio ?? 0;
  const bv = b.volumeRatio ?? 0;
  if (bv !== av) return bv - av;
  const aw = (a.breakoutConfirmed ? 1 : 0) + (a.breakoutBadges.length * 0.1);
  const bw = (b.breakoutConfirmed ? 1 : 0) + (b.breakoutBadges.length * 0.1);
  if (bw !== aw) return bw - aw;
  const am = a.marketCap ?? 0;
  const bm = b.marketCap ?? 0;
  return (bm - am) as number;
}

export function detectAlerts(previous: HeatmapBox | null, current: HeatmapBox) {
  const events: string[] = [];
  if (!previous) {
    if (current.score >= 100) events.push('score_above_100');
    if (current.score >= 120) events.push('score_above_120');
    if (current.breakoutConfirmed) events.push('breakout_confirmed');
    if (current.entryBadge === 'ENTRY READY') events.push('entry_available');
    return events;
  }
  // score crosses
  if ((previous.score < 100 && current.score >= 100)) events.push('score_crossed_100');
  if ((previous.score < 120 && current.score >= 120)) events.push('score_crossed_120');
  // breakout
  if (!previous.breakoutConfirmed && current.breakoutConfirmed) events.push('breakout_confirmed');
  // entry availability changes
  if (previous.entryBadge === 'WAIT' && current.entryBadge === 'ENTRY READY') events.push('entry_available');
  if (previous.entryBadge === 'ENTRY READY' && current.entryBadge === 'WAIT') events.push('entry_invalidated');
  // stop/target hits can't be determined here without price history; UI should detect when LTP crosses stop/targets
  return events;
}

export type ScannerOutput = {
  score: number;
  color: 'GREEN' | 'ORANGE' | 'RED';
  recommendation: 'STRONG BUY' | 'BUY' | 'WATCH' | 'AVOID';
  confidence: number; // 0..100
  entryPrice: number | null;
  stopLoss: number | null;
  target1: number | null;
  target2: number | null;
  target3: number | null;
  riskReward: number | null;
  breakout: boolean;
  breakoutType: string | null;
  reasons: string[];
};

function safeNum(v?: number | null): number | null {
  return typeof v === 'number' && !Number.isNaN(v) ? v : null;
}

export function calculateTrendScore(stock: StockInput, reasons: string[]) {
  const price = safeNum(stock.ltp);
  const vwap = safeNum(stock.vwap);
  if (price == null || vwap == null) return 0;
  if (price > vwap) {
    reasons.push('Price above VWAP');
    return 20;
  }
  reasons.push('Price below VWAP');
  return -20;
}

export function calculateEmasScore(stock: StockInput, reasons: string[]) {
  const e9 = safeNum(stock.ema9);
  const e20 = safeNum(stock.ema20);
  const e50 = safeNum(stock.ema50);
  if (e9 == null || e20 == null || e50 == null) return 0;
  if (e9 > e20 && e20 > e50) {
    reasons.push('EMA Bullish (9>20>50)');
    return 20;
  }
  reasons.push('EMA not bullish');
  return -20;
}

export function calculateVolumeScore(stock: StockInput, reasons: string[]) {
  const curVol = safeNum(stock.totalTradedVolume);
  const avg20 = safeNum(stock.avg20Volume);
  if (curVol == null || avg20 == null || avg20 <= 0) return 0;
  const ratio = curVol / avg20;
  if (ratio >= 3) {
    reasons.push(`Volume Spike ${ratio.toFixed(2)}x`);
    return 30;
  }
  if (ratio >= 2) {
    reasons.push(`Volume Spike ${ratio.toFixed(2)}x`);
    return 20;
  }
  return 0;
}

export function calculateBuySellPressure(stock: StockInput, reasons: string[]) {
  const buy = safeNum(stock.totalBuyQty) || 0;
  const sell = safeNum(stock.totalSellQty) || 0;
  if (buy <= 0 && sell <= 0) return 0;
  if (sell === 0 && buy > 0) {
    reasons.push(`Buy/Sell Ratio > ${buy}/0`);
    return 20;
  }
  const ratio = buy / (sell || 1);
  if (ratio > 2) {
    reasons.push(`Buy/Sell Ratio ${ratio.toFixed(2)}`);
    return 20;
  }
  if (ratio >= 1.5) {
    reasons.push(`Buy/Sell Ratio ${ratio.toFixed(2)}`);
    return 10;
  }

  // order book top-of-book pressure
  const topBid = stock.marketDepth?.bids?.[0]?.qty || 0;
  const topAsk = stock.marketDepth?.asks?.[0]?.qty || 0;
  if (topBid > topAsk) {
    reasons.push('Top-of-book more bids');
    return 10;
  }
  reasons.push('Top-of-book more asks or balanced');
  return -10;
}

export function detectBreakout(stock: StockInput, reasons: string[]) {
  const ltp = safeNum(stock.ltp);
  const prevHigh = safeNum(stock.prevDayHigh);
  const intraday = stock.intraday || [];
  const recent = intraday.slice(-5);
  // Previous day high breakout
  if (ltp != null && prevHigh != null && ltp > prevHigh) {
    reasons.push('Previous Day High Breakout');
    return { confirmed: true, type: 'PreviousDayHigh', candleHigh: recent[recent.length - 1]?.high ?? ltp, candleLow: recent[recent.length - 1]?.low ?? stock.low ?? null };
  }

  // Opening range breakout (first 5 candles)
  const opening = intraday.slice(0, 5);
  if (opening.length >= 2) {
    const openingHigh = Math.max(...opening.map((c) => c.high));
    if (ltp != null && ltp > openingHigh) {
      reasons.push('Opening Range Breakout');
      const candle = recent[recent.length - 1];
      return { confirmed: true, type: 'OpeningRange', candleHigh: candle?.high ?? ltp, candleLow: candle?.low ?? stock.low ?? null };
    }
  }

  // Consolidation breakout: check last 30 candles low volatility then breakout above max of consolidation
  const lookback = intraday.slice(-30);
  if (lookback.length >= 5) {
    const highs = lookback.map((c) => c.high);
    const lows = lookback.map((c) => c.low);
    const range = (Math.max(...highs) - Math.min(...lows)) || 1;
    const avgBody = lookback.reduce((s, c) => s + Math.abs(c.close - c.open), 0) / lookback.length;
    if (avgBody / range < 0.25) {
      const consolidationHigh = Math.max(...highs.slice(0, -1));
      if (ltp != null && ltp > consolidationHigh) {
        reasons.push('Consolidation Breakout');
        const candle = recent[recent.length - 1];
        return { confirmed: true, type: 'Consolidation', candleHigh: candle?.high ?? ltp, candleLow: candle?.low ?? stock.low ?? null };
      }
    }
  }

  // 52 week high breakout
  const f52 = safeNum(stock.fiftyTwoWeekHigh);
  if (ltp != null && f52 != null && ltp > f52) {
    reasons.push('52 Week High Breakout');
    const candle = recent[recent.length - 1];
    return { confirmed: true, type: '52WeekHigh', candleHigh: candle?.high ?? ltp, candleLow: candle?.low ?? stock.low ?? null };
  }

  return { confirmed: false, type: null, candleHigh: null, candleLow: null };
}

export function detectBullishPatterns(stock: StockInput, reasons: string[]) {
  const intraday = stock.intraday || [];
  const last = intraday[intraday.length - 1];
  if (!last) return { matched: false, reasons: [] };
  const matchedReasons: string[] = [];
  // Strong candle body
  const body = Math.abs(last.close - last.open);
  const range = last.high - last.low || 1;
  if (last.close > last.open && body / range > 0.6) {
    matchedReasons.push('Strong Bullish Candle');
  }
  // Hammer: small body near high or low
  const lowerWick = Math.min(last.open, last.close) - last.low;
  const upperWick = last.high - Math.max(last.open, last.close);
  if (lowerWick > body * 1.5 && upperWick < body) {
    matchedReasons.push('Hammer');
  }
  // Bullish engulfing (compare last two)
  const prev = intraday[intraday.length - 2];
  if (prev && prev.close < prev.open && last.close > last.open && last.close > prev.open && last.open < prev.close) {
    matchedReasons.push('Bullish Engulfing');
  }
  // Higher high / higher low
  const prevHigh = intraday[intraday.length - 2]?.high;
  const prevLow = intraday[intraday.length - 2]?.low;
  if (prevHigh != null && prevLow != null && last.high > prevHigh && last.low > prevLow) {
    matchedReasons.push('Higher High / Higher Low');
  }

  if (matchedReasons.length) {
    matchedReasons.forEach((r) => reasons.push(r));
    return { matched: true, reasons: matchedReasons };
  }
  return { matched: false, reasons: [] };
}

export function calculateRsiScore(stock: StockInput, reasons: string[]) {
  const rsi = safeNum(stock.rsi);
  if (rsi == null) return 0;
  if (rsi >= 55 && rsi <= 70) {
    reasons.push(`RSI ${rsi.toFixed(0)}`);
    return 10;
  }
  if (rsi > 80) {
    reasons.push(`RSI ${rsi.toFixed(0)} (overbought)`);
    return -10;
  }
  if (rsi < 40) {
    reasons.push(`RSI ${rsi.toFixed(0)} (weak)`);
    return -15;
  }
  return 0;
}

export function calculateMacdScore(stock: StockInput, reasons: string[]) {
  const macd = stock.macd;
  if (!macd) return 0;
  if (macd.macd > macd.signal) {
    reasons.push('MACD bullish');
    return 15;
  }
  return 0;
}

export function calculateMarketTrendScore(stock: StockInput, reasons: string[]) {
  const nifty = stock.nifty;
  if (!nifty) return 0;
  const price = safeNum(nifty.price);
  const vwap = safeNum(nifty.vwap);
  if (price == null || vwap == null) return 0;
  if (price > vwap) {
    reasons.push('NIFTY Above VWAP');
    return 15;
  }
  reasons.push('NIFTY Below VWAP');
  return -20;
}

export function evaluateVolatilityAdjustment(stock: StockInput) {
  const atr = safeNum(stock.atr);
  const price = safeNum(stock.ltp) || 1;
  if (atr == null) return 0;
  const rel = atr / price;
  // if ATR > 3% of price, penalize confidence
  if (rel > 0.03) return -15;
  // if ATR < 0.2% of price, avoid breakout entry (we return flag)
  if (rel < 0.002) return -10;
  return 0;
}

export function calculateScore(stock: StockInput) {
  const reasons: string[] = [];
  let score = 0;

  score += calculateTrendScore(stock, reasons);
  score += calculateEmasScore(stock, reasons);
  score += calculateVolumeScore(stock, reasons);
  score += calculateBuySellPressure(stock, reasons);

  const breakout = detectBreakout(stock, reasons);
  if (breakout.confirmed) score += 20;

  const pa = detectBullishPatterns(stock, reasons);
  if (pa.matched) score += 15;

  score += calculateRsiScore(stock, reasons);
  score += calculateMacdScore(stock, reasons);
  score += calculateMarketTrendScore(stock, reasons);

  // clamp score to a reasonable range
  const maxPossible = 200;
  if (score > maxPossible) score = maxPossible;
  if (score < -maxPossible) score = -maxPossible;

  return { score, reasons, breakoutInfo: breakout };
}

export function calculateEntry(stock: StockInput, breakoutInfo: any, reasons: string[]) {
  const price = safeNum(stock.ltp);
  const vwap = safeNum(stock.vwap);
  const e9 = safeNum(stock.ema9);
  const e20 = safeNum(stock.ema20);
  const e50 = safeNum(stock.ema50);
  const volRatio = (safeNum(stock.totalTradedVolume) && safeNum(stock.avg20Volume)) ? (stock.totalTradedVolume! / (stock.avg20Volume || 1)) : 0;
  const buySell = (safeNum(stock.totalBuyQty) || 0) / ((safeNum(stock.totalSellQty) || 1));
  const marketBullish = stock.nifty && stock.nifty.price != null && stock.nifty.vwap != null && stock.nifty.price > stock.nifty.vwap;
  const bullishEma = e9 != null && e20 != null && e50 != null && e9 > e20 && e20 > e50;

  // simple bullish candle check
  const intraday = stock.intraday || [];
  const last = intraday[intraday.length - 1];
  const bullishCandle = last ? last.close > last.open : false;

  const conditions = [
    price != null && vwap != null && price > vwap,
    bullishEma,
    volRatio >= 2,
    buySell > 1.8,
    breakoutInfo?.confirmed === true,
    bullishCandle,
    !!marketBullish,
  ];

  if (!conditions.every(Boolean)) {
    reasons.push('Entry conditions not met');
    return null;
  }

  // Entry = Breakout Candle High + 0.10%
  const breakoutHigh = safeNum(breakoutInfo.candleHigh) || price!;
  const entry = breakoutHigh * 1.001;
  reasons.push(`Entry at breakout +0.10% -> ${entry.toFixed(2)}`);
  return entry;
}

export function calculateStopLoss(stock: StockInput, entry: number | null, breakoutInfo: any, reasons: string[]) {
  if (!entry) return null;
  const vwap = safeNum(stock.vwap);
  const atr = safeNum(stock.atr) || 0;
  const breakoutLow = safeNum(breakoutInfo.candleLow) || safeNum(stock.low) || null;
  const atrBased = entry - (atr * 1.5 || 0);
  const candidates: number[] = [];
  if (breakoutLow != null) candidates.push(breakoutLow);
  if (vwap != null) candidates.push(vwap);
  if (!Number.isNaN(atrBased)) candidates.push(atrBased);
  if (!candidates.length) return null;
  // Choose the safest stop (closest to entry but below it) -> maximize stop value but < entry
  let stop = Math.max(...candidates.filter((c) => c < entry));
  if (!stop || stop >= entry) stop = Math.min(...candidates) as number;
  reasons.push(`Stop loss set at ${stop.toFixed(2)}`);
  return stop;
}

export function calculateTargets(entry: number | null, stop: number | null, stock: StockInput, reasons: string[]) {
  if (entry == null || stop == null) return { target1: null, target2: null, target3: null, riskReward: null };
  const R = entry - stop;
  const target1 = entry + R;
  const target2 = entry + 2 * R;
  // target3: trail using EMA9 if available, otherwise 3R
  const ema9 = safeNum(stock.ema9);
  const target3 = ema9 != null ? Math.max(entry + 3 * R, ema9) : entry + 3 * R;
  const riskReward = R > 0 ? (target2 - entry) / (entry - stop) : null;
  reasons.push(`Targets ${target1.toFixed(2)}, ${target2.toFixed(2)}`);
  return { target1, target2, target3, riskReward };
}

export function calculateConfidence(score: number, stock: StockInput) {
  // map score roughly to 0-100
  const maxScore = 165; // heuristic
  let conf = Math.round((Math.max(0, score) / maxScore) * 100);
  // adjust for volatility
  const volAdj = evaluateVolatilityAdjustment(stock);
  if (volAdj < 0) conf = Math.max(0, conf + volAdj);
  return Math.min(100, Math.max(0, conf));
}

export function generateRecommendation(score: number) {
  if (score >= 120) return { recommendation: 'STRONG BUY' as const, color: 'GREEN' as const };
  if (score >= 100) return { recommendation: 'BUY' as const, color: 'GREEN' as const };
  if (score >= 80) return { recommendation: 'WATCH' as const, color: 'ORANGE' as const };
  return { recommendation: 'AVOID' as const, color: 'RED' as const };
}

export function scanStock(stock: StockInput): ScannerOutput {
  const { score, reasons, breakoutInfo } = calculateScore(stock);
  const entryReasons: string[] = [];
  const entry = calculateEntry(stock, breakoutInfo, entryReasons);
  const stop = calculateStopLoss(stock, entry, breakoutInfo, entryReasons);
  const targets = calculateTargets(entry, stop, stock, entryReasons);
  const confidence = calculateConfidence(score, stock);
  const rec = generateRecommendation(score);
  const allReasons = [...reasons, ...entryReasons];
  return {
    score,
    color: rec.color,
    recommendation: rec.recommendation,
    confidence,
    entryPrice: entry,
    stopLoss: stop,
    target1: targets.target1,
    target2: targets.target2,
    target3: targets.target3,
    riskReward: targets.riskReward,
    breakout: !!breakoutInfo?.confirmed,
    breakoutType: breakoutInfo?.type ?? null,
    reasons: allReasons,
  };
}

export default {
  scanStock,
  calculateScore,
  detectBreakout,
  calculateEntry,
  calculateStopLoss,
  calculateTargets,
  calculateConfidence,
  generateRecommendation,
};
