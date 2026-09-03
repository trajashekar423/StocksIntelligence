/**
 * F&O Defined-Risk Options Strategy Engine
 * NSE India — Calculation & Scoring Logic
 *
 * IMPORTANT: This engine never guarantees profit.
 * Every strategy exposes a defined maximum risk calculated BEFORE entry.
 * No live orders are placed by this module.
 */

// ─── TRANSACTION COST ENGINE ────────────────────────────────────────────────

/**
 * Estimate all-in transaction costs for an options trade.
 * Rates are approximate NSE/SEBI rates as of 2024.
 * @param {number} premium  - total premium paid/received (per lot × lots)
 * @param {number} lots     - number of lots
 * @param {number} lotSize  - NSE lot size
 * @param {'buy'|'sell'} side
 */
export function estimateCosts(premium, lots, lotSize, side) {
  const qty = lots * lotSize;
  const turnover = Math.abs(premium) * qty;

  const brokerage = Math.min(20, turnover * 0.0003); // flat ₹20 or 0.03%
  const stt = side === 'sell' ? turnover * 0.000625 : 0; // STT on sell side only for options
  const exchangeCharge = turnover * 0.00053; // NSE transaction charge
  const sebi = turnover * 0.000001;
  const stampDuty = side === 'buy' ? turnover * 0.00003 : 0;
  const gst = (brokerage + exchangeCharge + sebi) * 0.18;
  const slippage = Math.abs(premium) * 0.005 * qty; // 0.5% slippage estimate

  const total = brokerage + stt + exchangeCharge + sebi + stampDuty + gst + slippage;

  return {
    brokerage: +brokerage.toFixed(2),
    stt: +stt.toFixed(2),
    exchangeCharge: +exchangeCharge.toFixed(2),
    sebi: +sebi.toFixed(2),
    stampDuty: +stampDuty.toFixed(2),
    gst: +gst.toFixed(2),
    slippage: +slippage.toFixed(2),
    total: +total.toFixed(2),
  };
}

function totalCosts(legs, lotSize) {
  return legs.reduce((sum, leg) => {
    const c = estimateCosts(leg.premium, leg.lots, lotSize, leg.side);
    return sum + c.total;
  }, 0);
}

// ─── BLACK-SCHOLES GREEKS ────────────────────────────────────────────────────

function normCDF(x) {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const t = 1 / (1 + p * Math.abs(x) / Math.SQRT2);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x / 2);
  return 0.5 * (1 + sign * y);
}

function normPDF(x) {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Black-Scholes Greeks for a single option leg.
 * @param {'CE'|'PE'} type
 * @param {number} S  - spot price
 * @param {number} K  - strike
 * @param {number} T  - time to expiry in years
 * @param {number} r  - risk-free rate (e.g. 0.065)
 * @param {number} iv - implied volatility (e.g. 0.20 for 20%)
 */
export function calcGreeks(type, S, K, T, r, iv) {
  if (T <= 0 || iv <= 0 || S <= 0 || K <= 0) {
    return { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0, iv };
  }
  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + 0.5 * iv * iv) * T) / (iv * sqrtT);
  const d2 = d1 - iv * sqrtT;
  const nd1 = normCDF(d1), nd2 = normCDF(d2);
  const nnd1 = normCDF(-d1), nnd2 = normCDF(-d2);
  const pdf1 = normPDF(d1);

  const delta = type === 'CE' ? nd1 : nd1 - 1;
  const gamma = pdf1 / (S * iv * sqrtT);
  const theta = type === 'CE'
    ? (-(S * pdf1 * iv) / (2 * sqrtT) - r * K * Math.exp(-r * T) * nd2) / 365
    : (-(S * pdf1 * iv) / (2 * sqrtT) + r * K * Math.exp(-r * T) * nnd2) / 365;
  const vega = S * pdf1 * sqrtT / 100; // per 1% IV change
  const rho = type === 'CE'
    ? K * T * Math.exp(-r * T) * nd2 / 100
    : -K * T * Math.exp(-r * T) * nnd2 / 100;

  return {
    delta: +delta.toFixed(4),
    gamma: +gamma.toFixed(6),
    theta: +theta.toFixed(4),
    vega: +vega.toFixed(4),
    rho: +rho.toFixed(4),
    iv,
  };
}

// ─── STRATEGY CALCULATORS ────────────────────────────────────────────────────

/**
 * Bull Call Spread
 */
export function calcBullCallSpread({ spot, buyStrike, sellStrike, buyPremium, sellPremium, lotSize, lots, T, r, iv }) {
  const netDebit = (buyPremium - sellPremium) * lotSize * lots;
  const maxProfit = ((sellStrike - buyStrike) - (buyPremium - sellPremium)) * lotSize * lots;
  const maxLoss = netDebit;
  const breakeven = buyStrike + (buyPremium - sellPremium);
  const rr = maxLoss > 0 ? +(maxProfit / maxLoss).toFixed(2) : 0;

  const costs = totalCosts([
    { premium: buyPremium, lots, side: 'buy' },
    { premium: sellPremium, lots, side: 'sell' },
  ], lotSize);

  const greeksBuy = calcGreeks('CE', spot, buyStrike, T, r, iv);
  const greeksSell = calcGreeks('CE', spot, sellStrike, T, r, iv);
  const netDelta = greeksBuy.delta - greeksSell.delta;
  const netTheta = (greeksBuy.theta - greeksSell.theta) * lotSize * lots;
  const netVega = (greeksBuy.vega - greeksSell.vega) * lotSize * lots;

  return {
    strategy: 'Bull Call Spread',
    direction: 'BULLISH',
    legs: [
      { type: 'CE', action: 'BUY', strike: buyStrike, premium: buyPremium },
      { type: 'CE', action: 'SELL', strike: sellStrike, premium: sellPremium },
    ],
    netDebit: +netDebit.toFixed(2),
    maxProfit: +maxProfit.toFixed(2),
    maxLoss: +maxLoss.toFixed(2),
    breakeven: +breakeven.toFixed(2),
    rr,
    costs: +costs.toFixed(2),
    netMaxProfit: +(maxProfit - costs).toFixed(2),
    netMaxLoss: +(maxLoss + costs).toFixed(2),
    greeks: { delta: +netDelta.toFixed(4), theta: +netTheta.toFixed(2), vega: +netVega.toFixed(2) },
  };
}

/**
 * Bear Put Spread
 */
export function calcBearPutSpread({ spot, buyStrike, sellStrike, buyPremium, sellPremium, lotSize, lots, T, r, iv }) {
  const netDebit = (buyPremium - sellPremium) * lotSize * lots;
  const maxProfit = ((buyStrike - sellStrike) - (buyPremium - sellPremium)) * lotSize * lots;
  const maxLoss = netDebit;
  const breakeven = buyStrike - (buyPremium - sellPremium);
  const rr = maxLoss > 0 ? +(maxProfit / maxLoss).toFixed(2) : 0;

  const costs = totalCosts([
    { premium: buyPremium, lots, side: 'buy' },
    { premium: sellPremium, lots, side: 'sell' },
  ], lotSize);

  const greeksBuy = calcGreeks('PE', spot, buyStrike, T, r, iv);
  const greeksSell = calcGreeks('PE', spot, sellStrike, T, r, iv);
  const netDelta = greeksBuy.delta - greeksSell.delta;
  const netTheta = (greeksBuy.theta - greeksSell.theta) * lotSize * lots;
  const netVega = (greeksBuy.vega - greeksSell.vega) * lotSize * lots;

  return {
    strategy: 'Bear Put Spread',
    direction: 'BEARISH',
    legs: [
      { type: 'PE', action: 'BUY', strike: buyStrike, premium: buyPremium },
      { type: 'PE', action: 'SELL', strike: sellStrike, premium: sellPremium },
    ],
    netDebit: +netDebit.toFixed(2),
    maxProfit: +maxProfit.toFixed(2),
    maxLoss: +maxLoss.toFixed(2),
    breakeven: +breakeven.toFixed(2),
    rr,
    costs: +costs.toFixed(2),
    netMaxProfit: +(maxProfit - costs).toFixed(2),
    netMaxLoss: +(maxLoss + costs).toFixed(2),
    greeks: { delta: +netDelta.toFixed(4), theta: +netTheta.toFixed(2), vega: +netVega.toFixed(2) },
  };
}

/**
 * Iron Condor
 */
export function calcIronCondor({ spot, longPutStrike, shortPutStrike, shortCallStrike, longCallStrike,
  longPutPremium, shortPutPremium, shortCallPremium, longCallPremium, lotSize, lots, T, r, iv }) {
  const netCredit = ((shortPutPremium + shortCallPremium) - (longPutPremium + longCallPremium)) * lotSize * lots;
  const putSpreadWidth = shortPutStrike - longPutStrike;
  const callSpreadWidth = longCallStrike - shortCallStrike;
  const maxLoss = (Math.max(putSpreadWidth, callSpreadWidth) * lotSize * lots) - netCredit;
  const maxProfit = netCredit;
  const upperBreakeven = shortCallStrike + (netCredit / (lotSize * lots));
  const lowerBreakeven = shortPutStrike - (netCredit / (lotSize * lots));
  const rr = maxLoss > 0 ? +(maxProfit / maxLoss).toFixed(2) : 0;

  const costs = totalCosts([
    { premium: longPutPremium, lots, side: 'buy' },
    { premium: shortPutPremium, lots, side: 'sell' },
    { premium: shortCallPremium, lots, side: 'sell' },
    { premium: longCallPremium, lots, side: 'buy' },
  ], lotSize);

  return {
    strategy: 'Iron Condor',
    direction: 'NEUTRAL',
    legs: [
      { type: 'PE', action: 'BUY', strike: longPutStrike, premium: longPutPremium },
      { type: 'PE', action: 'SELL', strike: shortPutStrike, premium: shortPutPremium },
      { type: 'CE', action: 'SELL', strike: shortCallStrike, premium: shortCallPremium },
      { type: 'CE', action: 'BUY', strike: longCallStrike, premium: longCallPremium },
    ],
    netCredit: +netCredit.toFixed(2),
    maxProfit: +netCredit.toFixed(2),
    maxLoss: +maxLoss.toFixed(2),
    upperBreakeven: +upperBreakeven.toFixed(2),
    lowerBreakeven: +lowerBreakeven.toFixed(2),
    rr,
    costs: +costs.toFixed(2),
    netMaxProfit: +(netCredit - costs).toFixed(2),
    netMaxLoss: +(maxLoss + costs).toFixed(2),
    distanceToUpperBE: +(upperBreakeven - spot).toFixed(2),
    distanceToLowerBE: +(spot - lowerBreakeven).toFixed(2),
  };
}

/**
 * Calendar Spread
 */
export function calcCalendarSpread({ spot, strike, nearPremium, farPremium, lotSize, lots, nearT, farT, r, nearIV, farIV }) {
  const netDebit = (farPremium - nearPremium) * lotSize * lots;
  const maxLoss = netDebit; // defined risk = net debit paid
  const ivDiff = farIV - nearIV;

  const nearGreeks = calcGreeks('CE', spot, strike, nearT, r, nearIV);
  const farGreeks = calcGreeks('CE', spot, strike, farT, r, farIV);
  const netTheta = (farGreeks.theta - nearGreeks.theta) * lotSize * lots;
  const netVega = (farGreeks.vega - nearGreeks.vega) * lotSize * lots;

  const costs = totalCosts([
    { premium: nearPremium, lots, side: 'sell' },
    { premium: farPremium, lots, side: 'buy' },
  ], lotSize);

  return {
    strategy: 'Calendar Spread',
    direction: 'NEUTRAL',
    legs: [
      { type: 'CE', action: 'SELL', strike, premium: nearPremium, expiry: 'NEAR' },
      { type: 'CE', action: 'BUY', strike, premium: farPremium, expiry: 'FAR' },
    ],
    netDebit: +netDebit.toFixed(2),
    maxLoss: +maxLoss.toFixed(2),
    ivDiff: +ivDiff.toFixed(4),
    costs: +costs.toFixed(2),
    netMaxLoss: +(maxLoss + costs).toFixed(2),
    greeks: {
      theta: +netTheta.toFixed(2),
      vega: +netVega.toFixed(2),
    },
  };
}

// ─── PAYOFF TABLE ────────────────────────────────────────────────────────────

/**
 * Generate payoff at expiry across a price range.
 * @param {Array<{action:'BUY'|'SELL', type:'CE'|'PE', strike:number, premium:number}>} legs
 * @param {number} spot
 * @param {number} lotSize
 * @param {number} lots
 * @param {number} steps  - number of price points
 */
export function generatePayoff(legs, spot, lotSize, lots, steps = 21) {
  const range = spot * 0.1; // ±10%
  const low = spot - range;
  const high = spot + range;
  const step = (high - low) / (steps - 1);

  return Array.from({ length: steps }, (_, i) => {
    const price = low + i * step;
    const pnl = legs.reduce((sum, leg) => {
      const intrinsic = leg.type === 'CE'
        ? Math.max(0, price - leg.strike)
        : Math.max(0, leg.strike - price);
      const legPnl = leg.action === 'BUY'
        ? (intrinsic - leg.premium) * lotSize * lots
        : (leg.premium - intrinsic) * lotSize * lots;
      return sum + legPnl;
    }, 0);
    return { price: +price.toFixed(2), pnl: +pnl.toFixed(2) };
  });
}

// ─── STRATEGY SCORER ────────────────────────────────────────────────────────

/**
 * Score a strategy 0–100.
 * Weights: trend=20, volatility=15, liquidity=15, rr=15, oi=10, volume=10, iv=5, technical=10
 */
export function scoreStrategy({ direction, regime, rr, iv, ivPercentile, liquidity, oi, volume, technicalScore }) {
  let score = 0;

  // Trend alignment (20)
  const trendMatch =
    (direction === 'BULLISH' && (regime === 'BULLISH' || regime === 'TRENDING')) ||
    (direction === 'BEARISH' && regime === 'BEARISH') ||
    (direction === 'NEUTRAL' && (regime === 'NEUTRAL' || regime === 'RANGE-BOUND'));
  score += trendMatch ? 20 : regime === 'AVOID' ? 0 : 8;

  // Volatility (15)
  if (direction === 'NEUTRAL' && iv > 0.15 && iv < 0.35) score += 15;
  else if (direction !== 'NEUTRAL' && iv > 0.10 && iv < 0.40) score += 12;
  else score += 5;

  // Liquidity (15)
  if (liquidity === 'HIGH') score += 15;
  else if (liquidity === 'MEDIUM') score += 10;
  else score += 0;

  // Risk/Reward (15)
  if (rr >= 2.0) score += 15;
  else if (rr >= 1.5) score += 12;
  else if (rr >= 1.0) score += 8;
  else score += 0;

  // OI confirmation (10)
  if (oi >= 100000) score += 10;
  else if (oi >= 50000) score += 7;
  else score += 3;

  // Volume (10)
  if (volume >= 10000) score += 10;
  else if (volume >= 1000) score += 6;
  else score += 2;

  // IV conditions (5)
  if (ivPercentile !== undefined) {
    if (direction === 'NEUTRAL' && ivPercentile >= 50) score += 5;
    else if (direction !== 'NEUTRAL' && ivPercentile < 50) score += 5;
    else score += 2;
  } else {
    score += 3;
  }

  // Technical confirmation (10)
  score += Math.min(10, Math.max(0, Math.round((technicalScore || 50) / 10)));

  return Math.min(100, Math.max(0, Math.round(score)));
}

export function classifyScore(score) {
  if (score >= 80) return { label: 'Strong Candidate', color: 'success' };
  if (score >= 70) return { label: 'Good Candidate', color: 'primary' };
  if (score >= 60) return { label: 'Watchlist', color: 'warning' };
  return { label: 'Reject', color: 'danger' };
}

// ─── MARKET REGIME ───────────────────────────────────────────────────────────

export function detectRegime({ rsi, adx, changePercent, iv, atr, spot, ema20, ema50 }) {
  if (adx !== undefined && adx > 25 && changePercent > 1) return 'BULLISH';
  if (adx !== undefined && adx > 25 && changePercent < -1) return 'BEARISH';
  if (iv !== undefined && iv > 0.35) return 'HIGH VOLATILITY';
  if (iv !== undefined && iv < 0.12) return 'LOW VOLATILITY';
  if (rsi !== undefined && rsi > 60 && ema20 && spot > ema20) return 'BULLISH';
  if (rsi !== undefined && rsi < 40 && ema20 && spot < ema20) return 'BEARISH';
  if (rsi !== undefined && rsi >= 40 && rsi <= 60) return 'RANGE-BOUND';
  if (changePercent > 0.5) return 'BULLISH';
  if (changePercent < -0.5) return 'BEARISH';
  return 'NEUTRAL';
}

// ─── POSITION SIZING ─────────────────────────────────────────────────────────

/**
 * Calculate how many lots can be traded given risk constraints.
 * @param {number} capital
 * @param {number} riskPct       - e.g. 1 for 1%
 * @param {number} maxLossPerLot - max loss for 1 lot
 * @param {number} lotSize
 */
export function sizeLots(capital, riskPct, maxLossPerLot, lotSize) {
  const allowedRisk = capital * (riskPct / 100);
  if (maxLossPerLot <= 0) return 0;
  return Math.max(0, Math.floor(allowedRisk / maxLossPerLot));
}

// ─── PAPER TRADE STORE ───────────────────────────────────────────────────────

const PAPER_KEY = 'fo_paper_trades';

export function getPaperTrades() {
  try {
    return JSON.parse(localStorage.getItem(PAPER_KEY) || '[]');
  } catch {
    return [];
  }
}

export function savePaperTrade(trade) {
  const trades = getPaperTrades();
  trades.unshift({ ...trade, id: Date.now(), timestamp: new Date().toISOString() });
  localStorage.setItem(PAPER_KEY, JSON.stringify(trades.slice(0, 200)));
  return trades[0];
}

export function updatePaperTrade(id, updates) {
  const trades = getPaperTrades();
  const idx = trades.findIndex((t) => t.id === id);
  if (idx === -1) return;
  trades[idx] = { ...trades[idx], ...updates };
  localStorage.setItem(PAPER_KEY, JSON.stringify(trades));
}

export function clearPaperTrades() {
  localStorage.removeItem(PAPER_KEY);
}

// ─── AUDIT LOG ───────────────────────────────────────────────────────────────

const AUDIT_KEY = 'fo_audit_log';

export function appendAuditLog(entry) {
  try {
    const log = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
    log.unshift({ ...entry, ts: new Date().toISOString() });
    localStorage.setItem(AUDIT_KEY, JSON.stringify(log.slice(0, 500)));
  } catch { /* silent */ }
}

export function getAuditLog() {
  try {
    return JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
  } catch {
    return [];
  }
}

// ─── RISK GATE ───────────────────────────────────────────────────────────────

/**
 * Hard risk gate — returns { allowed, reasons[] }
 */
export function riskGate({ maxLoss, allowedRisk, liquidity, minLiquidity, bidAskSpread, maxBidAsk,
  dailyLoss, maxDailyLoss, openPositions, maxPositions, dataAgeMs, maxDataAgeMs }) {
  const reasons = [];

  if (maxLoss > allowedRisk) reasons.push(`Max loss ₹${maxLoss.toFixed(0)} exceeds allowed ₹${allowedRisk.toFixed(0)}`);
  if (liquidity < minLiquidity) reasons.push(`Liquidity ${liquidity} below minimum ${minLiquidity}`);
  if (bidAskSpread > maxBidAsk) reasons.push(`Bid-ask spread ${bidAskSpread.toFixed(2)} too wide (max ${maxBidAsk})`);
  if (dailyLoss >= maxDailyLoss) reasons.push(`Daily loss limit ₹${maxDailyLoss} reached`);
  if (openPositions >= maxPositions) reasons.push(`Max open positions (${maxPositions}) reached`);
  if (dataAgeMs > maxDataAgeMs) reasons.push(`Data stale: ${Math.round(dataAgeMs / 1000)}s old`);

  return { allowed: reasons.length === 0, reasons };
}

// ─── MOCK OPTION CHAIN (adapter placeholder) ─────────────────────────────────

/**
 * Returns a mock option chain for a given underlying and spot price.
 * REPLACE this with a real NSE option-chain API call when available.
 * The interface is: getOptionChain(symbol, spot) → { strikes: [...] }
 */
export function getMockOptionChain(symbol, spot) {
  const step = spot < 500 ? 10 : spot < 2000 ? 50 : spot < 10000 ? 100 : 500;
  const atm = Math.round(spot / step) * step;
  const strikes = [];

  for (let i = -5; i <= 5; i++) {
    const strike = atm + i * step;
    const moneyness = (spot - strike) / spot;
    const baseIV = 0.18 + Math.abs(moneyness) * 0.05;
    const cePremium = Math.max(0.5, spot * baseIV * 0.1 * Math.exp(-Math.abs(moneyness) * 3));
    const pePremium = Math.max(0.5, spot * baseIV * 0.1 * Math.exp(-Math.abs(moneyness) * 3));

    strikes.push({
      strike,
      ce: {
        ltp: +cePremium.toFixed(2),
        bid: +(cePremium * 0.98).toFixed(2),
        ask: +(cePremium * 1.02).toFixed(2),
        iv: +baseIV.toFixed(4),
        oi: Math.round(50000 + Math.random() * 200000),
        volume: Math.round(1000 + Math.random() * 20000),
        delta: +(0.5 + moneyness * 2).toFixed(3),
      },
      pe: {
        ltp: +pePremium.toFixed(2),
        bid: +(pePremium * 0.98).toFixed(2),
        ask: +(pePremium * 1.02).toFixed(2),
        iv: +baseIV.toFixed(4),
        oi: Math.round(50000 + Math.random() * 200000),
        volume: Math.round(1000 + Math.random() * 20000),
        delta: +(-0.5 + moneyness * 2).toFixed(3),
      },
    });
  }

  return { symbol, spot, strikes, source: 'MOCK — Connect real NSE option-chain API' };
}

// ─── STRATEGY AUTO-SELECTOR ──────────────────────────────────────────────────

/**
 * Given a regime and option chain, suggest the best-fit strategy.
 */
export function suggestStrategy(regime) {
  if (regime === 'BULLISH' || regime === 'TRENDING') return 'Bull Call Spread';
  if (regime === 'BEARISH') return 'Bear Put Spread';
  if (regime === 'NEUTRAL' || regime === 'RANGE-BOUND') return 'Iron Condor';
  if (regime === 'HIGH VOLATILITY') return 'Bear Put Spread';
  if (regime === 'LOW VOLATILITY') return 'Calendar Spread';
  return null;
}
