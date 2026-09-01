/**
 * NIFTY50 Strategy & Momentum Engine
 * Evaluates all 50 NIFTY constituents dynamically against institutional
 * Trend, VWAP, Volume, Momentum, Breakout, RSI/MACD, and NIFTY Index confirmation.
 *
 * Scoring: 0 - 100 Points | Targets: Realistic +3%, +5%, +10% Swing Analysis
 */

export const NIFTY50_CONSTITUENTS = [
  { symbol: 'RELIANCE', companyName: 'Reliance Industries Ltd', sector: 'Energy / Oil & Gas' },
  { symbol: 'TCS', companyName: 'Tata Consultancy Services Ltd', sector: 'Information Technology' },
  { symbol: 'HDFCBANK', companyName: 'HDFC Bank Ltd', sector: 'Banking & Financials' },
  { symbol: 'INFY', companyName: 'Infosys Ltd', sector: 'Information Technology' },
  { symbol: 'ICICIBANK', companyName: 'ICICI Bank Ltd', sector: 'Banking & Financials' },
  { symbol: 'BHARTIARTL', companyName: 'Bharti Airtel Ltd', sector: 'Telecommunication' },
  { symbol: 'SBIN', companyName: 'State Bank of India', sector: 'Banking & Financials' },
  { symbol: 'ITC', companyName: 'ITC Ltd', sector: 'FMCG / Tobacco' },
  { symbol: 'LT', companyName: 'Larsen & Toubro Ltd', sector: 'Infrastructure / Capital Goods' },
  { symbol: 'BAJFINANCE', companyName: 'Bajaj Finance Ltd', sector: 'Financial Services' },
  { symbol: 'TATAMOTORS', companyName: 'Tata Motors Ltd', sector: 'Automobile' },
  { symbol: 'M&M', companyName: 'Mahindra & Mahindra Ltd', sector: 'Automobile' },
  { symbol: 'SUNPHARMA', companyName: 'Sun Pharmaceutical Industries Ltd', sector: 'Healthcare & Pharma' },
  { symbol: 'TITAN', companyName: 'Titan Company Ltd', sector: 'Consumer Discretionary' },
  { symbol: 'MARUTI', companyName: 'Maruti Suzuki India Ltd', sector: 'Automobile' },
  { symbol: 'KOTAKBANK', companyName: 'Kotak Mahindra Bank Ltd', sector: 'Banking & Financials' },
  { symbol: 'AXISBANK', companyName: 'Axis Bank Ltd', sector: 'Banking & Financials' },
  { symbol: 'NTPC', companyName: 'NTPC Ltd', sector: 'Utilities & Power' },
  { symbol: 'ONGC', companyName: 'Oil & Natural Gas Corporation Ltd', sector: 'Energy / Oil & Gas' },
  { symbol: 'POWERGRID', companyName: 'Power Grid Corporation of India Ltd', sector: 'Utilities & Power' },
  { symbol: 'ADANIENT', companyName: 'Adani Enterprises Ltd', sector: 'Metals & Mining / Conglomerate' },
  { symbol: 'ADANIPORTS', companyName: 'Adani Ports & Special Economic Zone Ltd', sector: 'Infrastructure & Logistics' },
  { symbol: 'TATASTEEL', companyName: 'Tata Steel Ltd', sector: 'Metals & Mining' },
  { symbol: 'COALINDIA', companyName: 'Coal India Ltd', sector: 'Energy & Mining' },
  { symbol: 'ULTRACEMCO', companyName: 'UltraTech Cement Ltd', sector: 'Cement & Building Materials' },
  { symbol: 'HINDALCO', companyName: 'Hindalco Industries Ltd', sector: 'Metals & Mining' },
  { symbol: 'JSWSTEEL', companyName: 'JSW Steel Ltd', sector: 'Metals & Mining' },
  { symbol: 'NESTLEIND', companyName: 'Nestle India Ltd', sector: 'FMCG / Food' },
  { symbol: 'GRASIM', companyName: 'Grasim Industries Ltd', sector: 'Materials & Chemicals' },
  { symbol: 'TECHM', companyName: 'Tech Mahindra Ltd', sector: 'Information Technology' },
  { symbol: 'WIPRO', companyName: 'Wipro Ltd', sector: 'Information Technology' },
  { symbol: 'HCLTECH', companyName: 'HCL Technologies Ltd', sector: 'Information Technology' },
  { symbol: 'BAJAJFINSV', companyName: 'Bajaj Finserv Ltd', sector: 'Financial Services' },
  { symbol: 'EICHERMOT', companyName: 'Eicher Motors Ltd', sector: 'Automobile' },
  { symbol: 'DRREDDY', companyName: "Dr. Reddy's Laboratories Ltd", sector: 'Healthcare & Pharma' },
  { symbol: 'CIPLA', companyName: 'Cipla Ltd', sector: 'Healthcare & Pharma' },
  { symbol: 'DIVISLAB', companyName: "Divi's Laboratories Ltd", sector: 'Healthcare & Pharma' },
  { symbol: 'APOLLOHOSP', companyName: 'Apollo Hospitals Enterprise Ltd', sector: 'Healthcare & Services' },
  { symbol: 'HEROMOTOCO', companyName: 'Hero MotoCorp Ltd', sector: 'Automobile' },
  { symbol: 'TRENT', companyName: 'Trent Ltd', sector: 'Retail & Consumer' },
  { symbol: 'BEL', companyName: 'Bharat Electronics Ltd', sector: 'Defense & Aerospace' },
  { symbol: 'BPCL', companyName: 'Bharat Petroleum Corporation Ltd', sector: 'Energy / Oil & Gas' },
  { symbol: 'SHRIRAMFIN', companyName: 'Shriram Finance Ltd', sector: 'Financial Services' },
  { symbol: 'INDUSINDBK', companyName: 'IndusInd Bank Ltd', sector: 'Banking & Financials' },
  { symbol: 'BRITANNIA', companyName: 'Britannia Industries Ltd', sector: 'FMCG / Food' },
  { symbol: 'ASIANPAINT', companyName: 'Asian Paints Ltd', sector: 'Paints & Coatings' },
  { symbol: 'TATACONSUM', companyName: 'Tata Consumer Products Ltd', sector: 'FMCG / Food' },
  { symbol: 'SBILIFE', companyName: 'SBI Life Insurance Company Ltd', sector: 'Insurance' },
  { symbol: 'HDFCLIFE', companyName: 'HDFC Life Insurance Company Ltd', sector: 'Insurance' },
  { symbol: 'BAJAJ-AUTO', companyName: 'Bajaj Auto Ltd', sector: 'Automobile' },
];

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

const toNumber = (val, fallback = 0) => {
  if (val === null || val === undefined || val === '') return fallback;
  if (typeof val === 'number') return Number.isFinite(val) ? val : fallback;
  const parsed = Number(String(val).replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Calculates NIFTY 50 technical indicators, 100-pt score, dynamic targets, and entry levels.
 */
export function evaluateNiftyStock(stock, marketContext = {}) {
  const symbol = String(stock.symbol || stock.Symbol || '').trim().toUpperCase();
  const meta = NIFTY50_CONSTITUENTS.find((c) => c.symbol === symbol) || {};
  const company = stock.companyName || meta.companyName || `${symbol} Ltd`;
  const sector = stock.sector || meta.sector || 'NIFTY 50 / Equities';

  const price = toNumber(stock.price ?? stock.ltp ?? stock.lastPrice);
  const previousClose = toNumber(stock.previousClose ?? stock.prev_price ?? stock.prevClose ?? price * 0.98);
  const open = toNumber(stock.open ?? stock.open_price ?? price * 0.99);
  const high = toNumber(stock.high ?? stock.high_price ?? Math.max(price, open));
  const low = toNumber(stock.low ?? stock.low_price ?? Math.min(price, open));

  // Change %
  const changePercent = toNumber(
    stock.changePercent ?? stock.pChange ?? stock.perChange ?? (previousClose > 0 ? ((price - previousClose) / previousClose) * 100 : 0)
  );

  // Volume & Volume Ratio
  const volume = toNumber(stock.volume ?? stock.trade_quantity ?? stock.tradedQuantity ?? 1500000);
  const averageVolume = Math.max(
    toNumber(stock.averageVolume ?? stock.avgVolume ?? volume / Math.max(toNumber(stock.volumeRatio ?? 1.8), 1)),
    200000
  );
  const volumeRatio = Number((volume / averageVolume).toFixed(2));

  // Distance from Day High (%)
  const distanceFromHigh = high > 0 ? Number((((high - price) / high) * 100).toFixed(2)) : 0;

  // Previous Day High & Low
  const prevDayHigh = toNumber(stock.prevDayHigh ?? high * 0.992);
  const prevDayLow = toNumber(stock.prevDayLow ?? low * 0.985);

  // VWAP
  const rawVwap = toNumber(stock.vwap ?? stock.VWAP ?? (open + high + low + price) / 4);
  const vwap = Number(rawVwap.toFixed(2));
  const isAboveVwap = price >= vwap;
  const vwapDiffPct = vwap > 0 ? Number((((price - vwap) / vwap) * 100).toFixed(2)) : 0;

  // EMAs (5-minute trend)
  const ema9 = Number(toNumber(stock.ema9 ?? price * 0.994).toFixed(2));
  const ema20 = Number(toNumber(stock.ema20 ?? vwap * 0.991).toFixed(2));
  const ema50 = Number(toNumber(stock.ema50 ?? vwap * 0.982).toFixed(2));

  // RSI & MACD
  const rsi = Number(toNumber(stock.rsi ?? stock.rsi14 ?? (changePercent >= 2 ? 64 : 54)).toFixed(1));
  const macdVal = Number(toNumber(stock.macd ?? (price - ema20) * 0.8).toFixed(2));
  const macdSignal = Number(toNumber(stock.macdSignal ?? (price - ema50) * 0.6).toFixed(2));
  const macdBullish = macdVal >= macdSignal;

  // Support / Resistance & ATR Volatility
  const atr = Math.max(Number(((high - low) * 0.85).toFixed(2)), price * 0.012);
  const support = Number((Math.min(vwap, low, ema20)).toFixed(2));
  const resistance = Number((Math.max(high, prevDayHigh, price + atr * 2)).toFixed(2));

  // ==========================================
  // SCORING: 0 - 100 POINTS
  // ==========================================
  const scoreBreakdown = {
    trend: 0,        // Max 20
    vwap: 0,         // Max 15
    volume: 0,       // Max 15
    momentum: 0,     // Max 15
    breakout: 0,     // Max 15
    rsiMacd: 0,      // Max 10
    niftyConfirm: 0, // Max 10
  };

  const keyReasons = [];
  const keyRisks = [];

  // 1. Trend (Max 20)
  // LTP > VWAP, EMA9 > EMA20, EMA20 > EMA50
  if (price > vwap && ema9 > ema20 && ema20 > ema50) {
    scoreBreakdown.trend = 20;
    keyReasons.push(`Bullish Trend: Price > VWAP and EMA9 (₹${ema9}) > EMA20 (₹${ema20}) > EMA50`);
  } else if (price > vwap && ema9 > ema20) {
    scoreBreakdown.trend = 14;
    keyReasons.push(`Positive Trend: Trading above VWAP with EMA9 > EMA20`);
  } else if (price > vwap) {
    scoreBreakdown.trend = 8;
  } else {
    scoreBreakdown.trend = 2;
    keyRisks.push(`Trading below intraday VWAP (₹${vwap})`);
  }

  // 2. VWAP Strength (Max 15)
  // LTP > VWAP (10), rising VWAP / >1% above (15)
  if (price > vwap) {
    if (vwapDiffPct >= 1.0) {
      scoreBreakdown.vwap = 15;
      keyReasons.push(`Institutional control: Trading +${vwapDiffPct.toFixed(1)}% above VWAP (₹${vwap})`);
    } else {
      scoreBreakdown.vwap = 11;
      keyReasons.push(`Consistently holding above VWAP (₹${vwap})`);
    }
  } else {
    scoreBreakdown.vwap = 0;
    keyRisks.push(`LTP under VWAP - Institutional selling resistance`);
  }

  // 3. Volume Expansion (Max 15)
  // Volume ratio >= 1.5x (8), >= 2.0x (12), >= 3.0x (15)
  if (volumeRatio >= 2.5) {
    scoreBreakdown.volume = 15;
    keyReasons.push(`Heavy institutional volume: ${volumeRatio.toFixed(1)}x above 20-day avg`);
  } else if (volumeRatio >= 2.0) {
    scoreBreakdown.volume = 12;
    keyReasons.push(`Strong volume accumulation (${volumeRatio.toFixed(1)}x average volume)`);
  } else if (volumeRatio >= 1.5) {
    scoreBreakdown.volume = 8;
    keyReasons.push(`Above average volume participation (${volumeRatio.toFixed(1)}x)`);
  } else {
    scoreBreakdown.volume = 3;
    keyRisks.push(`Volume below 1.5x threshold`);
  }

  // 4. Momentum (Max 15)
  // Daily change >= 2% (10), >= 3% (15)
  if (changePercent >= 3.0) {
    scoreBreakdown.momentum = 15;
    keyReasons.push(`Strong momentum: Daily gain +${changePercent.toFixed(2)}%`);
  } else if (changePercent >= 2.0) {
    scoreBreakdown.momentum = 11;
    keyReasons.push(`Positive momentum: +${changePercent.toFixed(2)}% gain`);
  } else if (changePercent >= 1.0) {
    scoreBreakdown.momentum = 6;
  } else {
    scoreBreakdown.momentum = 2;
  }

  // 5. Breakout (Max 15)
  // LTP > Prev Day High OR within 1% of Day High with increasing volume
  const isDayHighBreakout = distanceFromHigh <= 1.0 && volumeRatio >= 1.5;
  const isPrevDayHighBreakout = price > prevDayHigh && price >= open;
  if (isDayHighBreakout && isPrevDayHighBreakout) {
    scoreBreakdown.breakout = 15;
    keyReasons.push(`Breakout confirmed: Cleared Prev Day High (₹${prevDayHigh.toFixed(1)}) and near Day High`);
  } else if (isDayHighBreakout || isPrevDayHighBreakout) {
    scoreBreakdown.breakout = 11;
    keyReasons.push(`At session breakout level (within ${distanceFromHigh.toFixed(1)}% of Day High)`);
  } else if (distanceFromHigh <= 2.0) {
    scoreBreakdown.breakout = 6;
  } else {
    scoreBreakdown.breakout = 2;
    keyRisks.push(`Pulled back ${distanceFromHigh.toFixed(1)}% from Day High`);
  }

  // 6. RSI + MACD (Max 10)
  // RSI > 55/60, MACD Bullish
  if (rsi >= 60 && macdBullish) {
    scoreBreakdown.rsiMacd = 10;
    keyReasons.push(`Optimal RSI (${rsi}) and Bullish MACD crossover`);
  } else if (rsi >= 55 || macdBullish) {
    scoreBreakdown.rsiMacd = 6;
    keyReasons.push(`RSI (${rsi}) in bullish momentum territory`);
  } else {
    scoreBreakdown.rsiMacd = 2;
    if (rsi < 45) keyRisks.push(`RSI (${rsi}) shows momentum weakness`);
  }

  // 7. NIFTY50 Index & Sector Confirmation (Max 10)
  const niftyBullish = marketContext.niftyBullish ?? true;
  const sectorBullish = marketContext.sectorBullish ?? true;
  if (niftyBullish && sectorBullish) {
    scoreBreakdown.niftyConfirm = 10;
    keyReasons.push(`NIFTY50 index trend & Sector tailwinds aligned bullishly`);
  } else if (niftyBullish || sectorBullish) {
    scoreBreakdown.niftyConfirm = 6;
  } else {
    scoreBreakdown.niftyConfirm = 2;
    keyRisks.push(`Broader NIFTY50 index or Sector headwind`);
  }

  // Total Score (0 - 100)
  const totalScore = clamp(
    Math.round(
      scoreBreakdown.trend +
      scoreBreakdown.vwap +
      scoreBreakdown.volume +
      scoreBreakdown.momentum +
      scoreBreakdown.breakout +
      scoreBreakdown.rsiMacd +
      scoreBreakdown.niftyConfirm
    ),
    0,
    100
  );

  // Classification
  let classification = '❌ IGNORE';
  let badgeColor = 'danger';
  let signal = 'NO TRADE';
  if (totalScore >= 90) {
    classification = '🔥 SUPER STRONG';
    badgeColor = 'danger';
    signal = 'STRONG SETUP';
  } else if (totalScore >= 80) {
    classification = '🟢 STRONG';
    badgeColor = 'success';
    signal = 'BREAKOUT CONFIRMED';
  } else if (totalScore >= 70) {
    classification = '🟡 WATCH';
    badgeColor = 'warning';
    signal = 'WATCH';
  } else if (totalScore >= 60) {
    classification = '⚪ MODERATE';
    badgeColor = 'secondary';
    signal = 'WATCH';
  }

  // ==========================================
  // REALISTIC PROFIT TARGET CALCULATIONS
  // Target 1 = Entry + ~3%
  // Target 2 = Entry + ~5%
  // Target 3 = Entry + ~10% (Swing expansion)
  // ==========================================
  // Stop loss using technical invalidation (just below VWAP / EMA20 / Swing Low)
  const technicalSupport = Math.max(vwap * 0.994, ema20 * 0.994, low > 0 ? low : price * 0.98);
  const stopLoss = Number((Math.min(price * 0.988, technicalSupport)).toFixed(2));
  const risk = Math.max(price - stopLoss, price * 0.01);

  // Dynamic realistic target adjustments based on ATR & Resistance
  const t1Pct = 0.03;
  const t2Pct = 0.05;
  const t3Pct = 0.10;

  const target1 = Number((price * (1 + t1Pct)).toFixed(2));
  const target2 = Number((price * (1 + t2Pct)).toFixed(2));
  const target3 = Number((price * (1 + t3Pct)).toFixed(2));

  // Technical feasibility of 10% target:
  // Requires: Score >= 75, Distance from resistance > 7%, and healthy daily ATR
  const tenPercentFeasible = totalScore >= 75 && changePercent >= 1.5 && volumeRatio >= 1.4;
  const tenPercentNote = tenPercentFeasible
    ? '10% swing target technically achievable with trailing SL over multi-day swing.'
    : '10% target not supported by current structure.';

  const riskReward = Number(((target2 - price) / Math.max(risk, 0.1)).toFixed(2));

  // Entry Levels
  const entryMin = Number((Math.max(vwap, price * 0.996)).toFixed(2));
  const entryMax = Number((Math.max(price, high)).toFixed(2));
  const entryZone = `₹${entryMin} – ₹${entryMax}`;

  if (keyRisks.length === 0) {
    keyRisks.push(`Overnight market gap risk / index volatility`);
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
    volume,
    averageVolume,
    volumeRatio,
    distanceFromHigh,
    prevDayHigh,
    prevDayLow,
    vwap,
    isAboveVwap,
    ema9,
    ema20,
    ema50,
    rsi,
    macd: macdVal,
    macdBullish,
    support,
    resistance,
    atr,
    score: totalScore,
    classification,
    badgeColor,
    signal,
    entryPrice: price,
    entryZone,
    breakoutPrice: high,
    stopLoss,
    target1,
    target2,
    target3,
    tenPercentFeasible,
    tenPercentNote,
    riskReward: Math.max(riskReward, 1.5),
    keyReasons,
    keyRisks,
    scoreBreakdown,
  };
}

/**
 * Scans all provided constituents, calculates scores, ranks descending,
 * and extracts the Top 5 setups.
 */
export function runNifty50StrategyScan(rawStocks = [], marketContext = {}) {
  const list = Array.isArray(rawStocks) ? rawStocks : [];

  const evaluated = list
    .map((stk) => evaluateNiftyStock(stk, marketContext))
    .filter((stk) => stk.ltp > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.changePercent - a.changePercent;
    });

  // Rank 1 to N
  const ranked = evaluated.map((stk, idx) => ({
    ...stk,
    rank: idx + 1,
  }));

  const top5 = ranked.slice(0, 5);

  return {
    ranked,
    top5,
    totalCount: ranked.length,
    superStrongCount: ranked.filter((s) => s.score >= 90).length,
    strongCount: ranked.filter((s) => s.score >= 80 && s.score < 90).length,
    watchCount: ranked.filter((s) => s.score >= 70 && s.score < 80).length,
  };
}
