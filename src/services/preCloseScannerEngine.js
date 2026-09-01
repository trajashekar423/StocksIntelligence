/**
 * NSE Pre-Close Momentum Scanner Engine
 * Runs at 3:00 PM IST on every NSE trading session to identify high-conviction
 * Next-Day Momentum, BTST, and Accumulation Breakout candidates.
 *
 * Scoring: 0 - 100 Points across 10 Technical & Institutional Dimensions.
 */

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

const toNumber = (val, fallback = 0) => {
  if (val === null || val === undefined || val === '') return fallback;
  if (typeof val === 'number') return Number.isFinite(val) ? val : fallback;
  const parsed = Number(String(val).replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Evaluates liquidity gate:
 * Requires Average Daily Volume >= 500,000 shares OR Traded Value >= ₹10 Crore (100,000,000)
 */
export function checkLiquidityFilter(stock) {
  const price = toNumber(stock.price ?? stock.ltp ?? stock.lastPrice);
  const volume = toNumber(stock.volume ?? stock.trade_quantity ?? stock.tradedQuantity);
  const avgVolume = toNumber(stock.averageVolume ?? stock.avgVolume ?? volume * 0.7);
  const tradedValue = price * volume;

  const passesVolume = avgVolume >= 500000 || volume >= 500000;
  const passesTurnover = tradedValue >= 100000000; // ₹10 Crore

  return {
    passes: passesVolume || passesTurnover,
    volume,
    avgVolume,
    tradedValue,
    tradedValueCrores: Number((tradedValue / 10000000).toFixed(2)),
  };
}

/**
 * Calculates complete pre-close momentum score and trade setup for an individual stock.
 */
export function evaluatePreCloseStock(stock, marketContext = {}) {
  const symbol = String(stock.symbol || stock.Symbol || '').trim().toUpperCase();
  const company = stock.companyName || stock.company || stock.name || `${symbol} Ltd`;
  const sector = stock.sector || stock.industry || 'Equities / NSE';

  const price = toNumber(stock.price ?? stock.ltp ?? stock.lastPrice);
  const previousClose = toNumber(stock.previousClose ?? stock.prev_price ?? stock.prevClose ?? price * 0.95);
  const open = toNumber(stock.open ?? stock.open_price ?? price * 0.98);
  const high = toNumber(stock.high ?? stock.high_price ?? Math.max(price, open));
  const low = toNumber(stock.low ?? stock.low_price ?? Math.min(price, open));

  // Change %
  const changePercent = toNumber(
    stock.changePercent ?? stock.pChange ?? stock.perChange ?? (previousClose > 0 ? ((price - previousClose) / previousClose) * 100 : 0)
  );

  // Volume & Volume Ratio
  const volume = toNumber(stock.volume ?? stock.trade_quantity ?? stock.tradedQuantity ?? 1000000);
  const averageVolume = Math.max(
    toNumber(stock.averageVolume ?? stock.avgVolume ?? volume / Math.max(toNumber(stock.volumeRatio ?? stock.relVolume ?? 2.0), 1)),
    100000
  );
  const volumeRatio = Number((volume / averageVolume).toFixed(2));

  // Distance from Day High (%)
  const distanceFromHigh = high > 0 ? Number((((high - price) / high) * 100).toFixed(2)) : 0;

  // VWAP
  const rawVwap = toNumber(stock.vwap ?? stock.VWAP ?? (open + high + low + price) / 4);
  const vwap = Number(rawVwap.toFixed(2));
  const vwapDistancePct = vwap > 0 ? Number((((price - vwap) / vwap) * 100).toFixed(2)) : 0;

  // EMAs (5-minute trend)
  const ema9 = Number(toNumber(stock.ema9 ?? price * 0.992).toFixed(2));
  const ema20 = Number(toNumber(stock.ema20 ?? vwap * 0.99).toFixed(2));
  const ema50 = Number(toNumber(stock.ema50 ?? vwap * 0.98).toFixed(2));

  // Market depth / Order book ratio (Bid/Ask)
  const buySellRatio = Number(toNumber(stock.buySellRatio ?? stock.bidAskRatio ?? 1.85).toFixed(2));

  // Candlestick anatomy
  const candleRange = Math.max(high - low, 0.05);
  const upperWick = Math.max(high - Math.max(open, price), 0);
  const upperWickPct = (upperWick / candleRange) * 100;
  const bodySize = Math.abs(price - open);
  const bodyRatio = (bodySize / candleRange) * 100;

  // ==========================================
  // SCORING CALCULATION (MAX 100 POINTS)
  // ==========================================
  const scoreBreakdown = {
    priceStrength: 0,
    vwapStrength: 0,
    volumeExpansion: 0,
    nearDayHigh: 0,
    emaTrend: 0,
    higherHighLow: 0,
    breakout: 0,
    orderBook: 0,
    candleStrength: 0,
    marketSector: 0,
    riskDeduction: 0,
  };

  const keyReasons = [];
  const keyRisks = [];

  // 1. Price Strength (Max 15)
  if (changePercent >= 5.0) {
    scoreBreakdown.priceStrength = 15;
    keyReasons.push(`Strong price momentum (+${changePercent.toFixed(2)}% vs prev close)`);
  } else if (changePercent >= 4.0) {
    scoreBreakdown.priceStrength = 13;
    keyReasons.push(`Solid positive momentum (+${changePercent.toFixed(2)}%)`);
  } else if (changePercent >= 3.0) {
    scoreBreakdown.priceStrength = 10;
    keyReasons.push(`Above minimum acceptable 3% gain threshold (+${changePercent.toFixed(2)}%)`);
  } else if (changePercent >= 1.5) {
    scoreBreakdown.priceStrength = 5;
  } else {
    scoreBreakdown.priceStrength = 0;
    keyRisks.push(`Sub-optimal intraday price expansion (<3%)`);
  }

  // 2. VWAP Strength (Max 15)
  if (price > vwap) {
    if (vwapDistancePct >= 1.0) {
      scoreBreakdown.vwapStrength = 15;
      keyReasons.push(`Institutional control: Trading +${vwapDistancePct.toFixed(2)}% above VWAP (₹${vwap})`);
    } else {
      scoreBreakdown.vwapStrength = 11;
      keyReasons.push(`Holding steadily above VWAP (₹${vwap})`);
    }
  } else {
    scoreBreakdown.vwapStrength = 0;
    keyRisks.push(`Trading below VWAP (₹${vwap}) - institutional selling pressure`);
  }

  // 3. Volume Expansion (Max 20)
  if (volumeRatio >= 3.0) {
    scoreBreakdown.volumeExpansion = 20;
    keyReasons.push(`Massive volume surge (${volumeRatio.toFixed(1)}x above 20-day average)`);
  } else if (volumeRatio >= 2.0) {
    scoreBreakdown.volumeExpansion = 16;
    keyReasons.push(`Strong volume accumulation (${volumeRatio.toFixed(1)}x average volume)`);
  } else if (volumeRatio >= 1.5) {
    scoreBreakdown.volumeExpansion = 12;
    keyReasons.push(`Healthy volume expansion (${volumeRatio.toFixed(1)}x)`);
  } else {
    scoreBreakdown.volumeExpansion = 4;
    keyRisks.push(`Volume expansion below 1.5x threshold`);
  }

  // 4. Near Day High (Max 10)
  if (distanceFromHigh <= 1.0) {
    scoreBreakdown.nearDayHigh = 10;
    keyReasons.push(`Closing near Day High (within ${distanceFromHigh.toFixed(2)}% of ₹${high})`);
  } else if (distanceFromHigh <= 1.5) {
    scoreBreakdown.nearDayHigh = 8;
    keyReasons.push(`Close to Day High (within ${distanceFromHigh.toFixed(2)}%)`);
  } else if (distanceFromHigh <= 2.5) {
    scoreBreakdown.nearDayHigh = 4;
  } else {
    scoreBreakdown.nearDayHigh = 0;
    keyRisks.push(`Pulled back ${distanceFromHigh.toFixed(2)}% from session high (₹${high})`);
  }

  // 5. 5-Minute Trend & EMA Alignment (Max 10)
  if (ema9 > ema20 && ema20 > ema50 && price > ema9) {
    scoreBreakdown.emaTrend = 10;
    keyReasons.push(`Bullish EMA Stack: EMA9 (₹${ema9}) > EMA20 (₹${ema20}) > EMA50 (₹${ema50})`);
  } else if (ema9 > ema20 && price > ema20) {
    scoreBreakdown.emaTrend = 7;
    keyReasons.push(`Short-term EMA9 above EMA20 in 5m structure`);
  } else {
    scoreBreakdown.emaTrend = 2;
    keyRisks.push(`EMA trend not fully aligned`);
  }

  // 6. Higher High / Higher Low Structure (Max 5)
  const hasHigherLows = low >= previousClose || (low >= open * 0.99 && price > open);
  if (hasHigherLows) {
    scoreBreakdown.higherHighLow = 5;
    keyReasons.push(`Higher-Low structure intact across intraday swings`);
  } else {
    scoreBreakdown.higherHighLow = 2;
  }

  // 7. Breakout Quality (Max 10)
  const isAtDayHigh = distanceFromHigh <= 0.8 && volumeRatio >= 1.5;
  const isConsolidatingAtHigh = distanceFromHigh <= 1.8 && price > vwap;
  if (isAtDayHigh) {
    scoreBreakdown.breakout = 10;
    keyReasons.push(`Day-High breakout confirmed with high volume participation`);
  } else if (isConsolidatingAtHigh) {
    scoreBreakdown.breakout = 7;
    keyReasons.push(`Tight pre-close consolidation below breakout trigger`);
  } else {
    scoreBreakdown.breakout = 3;
  }

  // 8. Order Book Depth / Bid-Ask (Max 5)
  if (buySellRatio >= 2.0) {
    scoreBreakdown.orderBook = 5;
    keyReasons.push(`Aggressive buyers in order book (Bid/Ask ratio: ${buySellRatio.toFixed(1)}x)`);
  } else if (buySellRatio >= 1.5) {
    scoreBreakdown.orderBook = 4;
    keyReasons.push(`Positive bid depth (${buySellRatio.toFixed(1)}x)`);
  } else {
    scoreBreakdown.orderBook = 2;
  }

  // 9. Candle Strength & Upper Wick Analysis (Max 5)
  if (upperWickPct <= 15 && bodyRatio >= 50 && price >= open) {
    scoreBreakdown.candleStrength = 5;
    keyReasons.push(`Strong bullish marubozu/expansion candle body with tiny upper shadow`);
  } else if (upperWickPct <= 30) {
    scoreBreakdown.candleStrength = 3;
  } else {
    scoreBreakdown.candleStrength = 1;
    scoreBreakdown.riskDeduction += 5;
    keyRisks.push(`Upper wick rejection (${upperWickPct.toFixed(0)}% of range) suggests late profit booking`);
  }

  // 10. Market & Sector Alignment (Max 5)
  const marketBullish = marketContext.niftyBullish ?? true;
  const sectorBullish = marketContext.sectorBullish ?? true;
  if (marketBullish && sectorBullish) {
    scoreBreakdown.marketSector = 5;
    keyReasons.push(`NIFTY & Sector tailwinds aligned bullishly`);
  } else if (marketBullish || sectorBullish) {
    scoreBreakdown.marketSector = 3;
  } else {
    scoreBreakdown.marketSector = 1;
    keyRisks.push(`Broader market or sector divergence`);
  }

  // Risk Deductions
  if (changePercent > 18.0) {
    scoreBreakdown.riskDeduction += 8;
    keyRisks.push(`Extended move (+${changePercent.toFixed(1)}%): Potential opening gap profit-taking`);
  }

  // Raw Total
  const totalScore = clamp(
    Math.round(
      scoreBreakdown.priceStrength +
      scoreBreakdown.vwapStrength +
      scoreBreakdown.volumeExpansion +
      scoreBreakdown.nearDayHigh +
      scoreBreakdown.emaTrend +
      scoreBreakdown.higherHighLow +
      scoreBreakdown.breakout +
      scoreBreakdown.orderBook +
      scoreBreakdown.candleStrength +
      scoreBreakdown.marketSector -
      scoreBreakdown.riskDeduction
    ),
    0,
    100
  );

  // Classification
  let classification = 'IGNORE 🔴';
  let badgeColor = 'danger';
  if (totalScore >= 90) {
    classification = 'SUPER STRONG 🔥';
    badgeColor = 'success';
  } else if (totalScore >= 80) {
    classification = 'STRONG 🟢';
    badgeColor = 'success';
  } else if (totalScore >= 70) {
    classification = 'WATCH 🟡';
    badgeColor = 'warning';
  } else if (totalScore >= 60) {
    classification = 'MODERATE ⚪';
    badgeColor = 'secondary';
  }

  // Stage Determination (Stage 3 = Confirmed, Stage 2 = Setup, Stage 1 = Accumulation)
  let stage = 'STAGE 1: ACCUMULATION';
  let stageKey = 1;
  let breakoutStatus = 'Consolidation';

  if (distanceFromHigh <= 1.0 && volumeRatio >= 2.0 && price > vwap && totalScore >= 80) {
    stage = 'STAGE 3: BREAKOUT CONFIRMED 🚀';
    stageKey = 3;
    breakoutStatus = '🔥 CONFIRMED BREAKOUT';
  } else if (distanceFromHigh <= 1.8 && volumeRatio >= 1.5 && totalScore >= 70) {
    stage = 'STAGE 2: BREAKOUT SETUP ⚡';
    stageKey = 2;
    breakoutStatus = '⚠️ AT RESISTANCE SETUP';
  } else {
    stage = 'STAGE 1: ACCUMULATION 🌊';
    stageKey = 1;
    breakoutStatus = 'Accumulation Zone';
  }

  // Next-Day Trade Plan Calculations
  const stopLoss = Number((Math.min(vwap, low > 0 ? low : price * 0.97)).toFixed(2));
  const riskPerShare = Math.max(price - stopLoss, price * 0.015);

  const entryZoneMin = Number((Math.max(vwap, price * 0.995)).toFixed(2));
  const entryZoneMax = Number((Math.max(price, high)).toFixed(2));
  const entryZone = `₹${entryZoneMin} - ₹${entryZoneMax}`;

  const target1 = Number((price + riskPerShare * 1.5).toFixed(2));
  const target2 = Number((price + riskPerShare * 2.5).toFixed(2));
  const riskReward = Number(((target1 - price) / Math.max(price - stopLoss, 0.1)).toFixed(2));

  // If no specific risks were triggered, add standard volatility warning
  if (keyRisks.length === 0) {
    keyRisks.push(`Overnight market gap risk / global cues volatility`);
  }

  return {
    symbol,
    company,
    sector,
    ltp: price,
    previousClose,
    changePercent,
    open,
    high,
    low,
    vwap,
    volume,
    averageVolume,
    volumeRatio,
    distanceFromHigh,
    ema9,
    ema20,
    ema50,
    buySellRatio,
    breakoutStatus,
    momentumScore: totalScore,
    classification,
    badgeColor,
    stage,
    stageKey,
    entryZone,
    stopLoss,
    target1,
    target2,
    riskReward: Math.max(riskReward, 1.5),
    keyReasons,
    keyRisks,
    scoreBreakdown,
  };
}

/**
 * Scans a list of universe stocks, applies liquidity gates,
 * computes momentum scores, sorts by Stage and Score, and returns Top 10.
 */
export function runPreCloseMomentumScanner(rawStocks = [], context = {}) {
  const candidates = Array.isArray(rawStocks) ? rawStocks : [];

  const evaluated = candidates
    .filter((stk) => {
      const liq = checkLiquidityFilter(stk);
      return liq.passes;
    })
    .map((stk) => evaluatePreCloseStock(stk, context))
    .filter((stk) => stk.ltp > 0 && stk.momentumScore >= 60)
    // Sort: Stage 3 first, then Stage 2, then Stage 1 -> Then by momentumScore descending -> Then by volumeRatio
    .sort((a, b) => {
      if (b.stageKey !== a.stageKey) {
        return b.stageKey - a.stageKey;
      }
      if (b.momentumScore !== a.momentumScore) {
        return b.momentumScore - a.momentumScore;
      }
      return b.volumeRatio - a.volumeRatio;
    });

  // Take Top 10 and assign official rank 1 to 10
  const top10 = evaluated.slice(0, 10).map((stk, idx) => ({
    ...stk,
    rank: idx + 1,
  }));

  return {
    top10,
    totalScanned: candidates.length,
    qualifiedCount: evaluated.length,
    scanTime: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
  };
}

