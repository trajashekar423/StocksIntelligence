/**
 * Intraday Technical Stock Scanner & 0-100 Bullish Scoring Engine
 * Combines Momentum, Volume/RVOL, VWAP, RSI, Breakout, Support/Resistance & Candlestick patterns.
 */

import type { ScannerStock, SignalLevel, TradeSignal, TradingConfig } from '../../types/trading.ts';
import { calculatePositionSize } from './positionSizer.ts';
import { getTradingConfig } from './config.ts';

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

export function classifySignalLevel(score: number): SignalLevel {
  if (score >= 80) return 'STRONG_BULLISH';
  if (score >= 65) return 'BULLISH';
  if (score >= 50) return 'NEUTRAL';
  if (score >= 30) return 'WEAK';
  return 'BEARISH';
}

export interface ScoreBreakdown {
  score: number;
  momentumScore: number;
  volumeScore: number;
  vwapScore: number;
  rsiScore: number;
  breakoutScore: number;
  srScore: number;
  patternScore: number;
  reasons: string[];
}

export function computeBullishScore(stock: any): ScoreBreakdown {
  const price = Number(
    stock.price ?? stock.ltp ?? stock.lastPrice ?? stock.last_price ?? stock.open_price ?? 0
  );
  const open = Number(stock.open ?? stock.open_price ?? price);
  const prevClose = Number(
    stock.previousClose ?? stock.prevClose ?? stock.prev_price ?? price
  );
  const changePct =
    prevClose > 0
      ? ((price - prevClose) / prevClose) * 100
      : Number(stock.changePercent ?? stock.perChange ?? 0);
  const vwap = Number(
    stock.vwap ??
      (stock.open_price
        ? (Number(stock.open_price) +
            Number(stock.high_price || price) +
            Number(stock.low_price || price) +
            price) /
          4
        : price)
  );
  const rsi = Number(stock.rsi ?? 58);
  const rvol = Number(stock.rvol ?? stock.volumeRatio ?? 1.4);
  const prevDayHigh = Number(
    stock.prevDayHigh ?? stock.previousDayHigh ?? stock.high_price ?? 0
  );
  const orbHigh = Number(stock.orbHigh ?? 0);
  const candlePattern = stock.candlePattern || null;

  const reasons: string[] = [];

  // 1. Price Momentum (0 - 20)
  let momentumScore = 0;
  if (changePct >= 5) {
    momentumScore = 20;
    reasons.push(`High Momentum (+${changePct.toFixed(2)}%)`);
  } else if (changePct >= 2) {
    momentumScore = 16;
    reasons.push(`Strong Momentum (+${changePct.toFixed(2)}%)`);
  } else if (changePct >= 0.8) {
    momentumScore = 12;
    reasons.push(`Positive Intraday Gain (+${changePct.toFixed(2)}%)`);
  } else if (changePct >= 0) {
    momentumScore = 6;
  } else {
    momentumScore = 0;
  }

  // 2. Volume / Relative Volume (0 - 20)
  let volumeScore = 0;
  if (rvol >= 2.5) {
    volumeScore = 20;
    reasons.push(`Extreme Volume Spike (${rvol.toFixed(1)}x avg)`);
  } else if (rvol >= 1.8) {
    volumeScore = 16;
    reasons.push(`High Relative Volume (${rvol.toFixed(1)}x avg)`);
  } else if (rvol >= 1.2) {
    volumeScore = 12;
    reasons.push(`Above Average Volume (${rvol.toFixed(1)}x avg)`);
  } else if (rvol >= 1.0) {
    volumeScore = 6;
  }

  // 3. VWAP Position & Strength (0 - 15)
  let vwapScore = 0;
  if (vwap > 0 && price > vwap) {
    const vwapDist = ((price - vwap) / vwap) * 100;
    if (vwapDist >= 0.5 && vwapDist <= 3.5) {
      vwapScore = 15;
      reasons.push(`Trading Above VWAP (+${vwapDist.toFixed(1)}%)`);
    } else if (vwapDist > 0) {
      vwapScore = 10;
      reasons.push('Price Above VWAP');
    }
  }

  // 4. RSI Wilder (0 - 10)
  let rsiScore = 0;
  if (rsi >= 55 && rsi <= 72) {
    rsiScore = 10; // Bullish momentum sweet spot
    reasons.push(`RSI Optimal Momentum (${rsi.toFixed(0)})`);
  } else if (rsi >= 50 && rsi < 55) {
    rsiScore = 7;
  } else if (rsi > 72 && rsi <= 80) {
    rsiScore = 5; // Near overbought
  } else {
    rsiScore = 0;
  }

  // 5. Breakout Proximity / Confirmation (0 - 15)
  let breakoutScore = 0;
  if (prevDayHigh > 0 && price > prevDayHigh) {
    breakoutScore = 15;
    reasons.push(`Breakout Above PDH (₹${prevDayHigh.toFixed(2)})`);
  } else if (orbHigh > 0 && price > orbHigh) {
    breakoutScore = 12;
    reasons.push(`Opening Range Breakout (₹${orbHigh.toFixed(2)})`);
  } else if (prevDayHigh > 0 && price >= prevDayHigh * 0.99) {
    breakoutScore = 8;
    reasons.push('Testing Resistance / Near PDH');
  }

  // 6. Support & Resistance (0 - 15)
  let srScore = 0;
  const dayLow = Number(stock.dayLow ?? stock.low ?? price * 0.98);
  const support = vwap > 0 ? Math.max(dayLow, vwap) : dayLow;
  if (support > 0 && price > support) {
    srScore = 15;
  } else {
    srScore = 7;
  }

  // 7. Candlestick Pattern (0 - 5)
  let patternScore = 0;
  if (candlePattern && /Bullish|Hammer|Morning Star|Three White Soldiers/i.test(candlePattern)) {
    patternScore = 5;
    reasons.push(`Pattern: ${candlePattern}`);
  }

  const totalScore = clamp(
    Math.round(momentumScore + volumeScore + vwapScore + rsiScore + breakoutScore + srScore + patternScore),
    0,
    100
  );

  return {
    score: totalScore,
    momentumScore,
    volumeScore,
    vwapScore,
    rsiScore,
    breakoutScore,
    srScore,
    patternScore,
    reasons,
  };
}

export function evaluateStockScanner(stock: any, config = getTradingConfig()): ScannerStock {
  const price = Number(
    stock.price ?? stock.ltp ?? stock.lastPrice ?? stock.last_price ?? stock.open_price ?? 0
  );
  const prevClose = Number(
    stock.previousClose ?? stock.prevClose ?? stock.prev_price ?? price
  );
  const changePercent =
    prevClose > 0
      ? ((price - prevClose) / prevClose) * 100
      : Number(stock.changePercent ?? stock.perChange ?? 0);
  const vwap = Number(
    stock.vwap ??
      (stock.open_price
        ? (Number(stock.open_price) +
            Number(stock.high_price || price) +
            Number(stock.low_price || price) +
            price) /
          4
        : price)
  );
  const rsi = Number(stock.rsi ?? 58);
  const dayLow = Number(stock.dayLow ?? stock.low ?? stock.low_price ?? price * 0.985);
  const dayHigh = Number(stock.dayHigh ?? stock.high ?? stock.high_price ?? price * 1.02);
  const prevDayHigh = Number(stock.prevDayHigh ?? stock.previousDayHigh ?? dayHigh);

  const breakdown = computeBullishScore(stock);
  const bullishScore = breakdown.score;
  const signal = classifySignalLevel(bullishScore);

  // Derive logical intraday Support, Resistance, Target, StopLoss
  const support = Number((vwap > 0 && vwap < price ? Math.max(dayLow, vwap) : dayLow || price * (1 - config.stopLossPct / 100)).toFixed(2));
  const resistance = Number((prevDayHigh > price ? prevDayHigh : Math.max(dayHigh, price * (1 + config.targetPct / 100))).toFixed(2));

  const entryPrice = price;
  const stopLoss = Number((support < price ? support : price * (1 - config.stopLossPct / 100)).toFixed(2));
  const riskPerShare = Math.max(entryPrice - stopLoss, entryPrice * 0.005);
  const target = Number((price + riskPerShare * 2).toFixed(2));
  const riskReward = riskPerShare > 0 ? Number(((target - entryPrice) / riskPerShare).toFixed(2)) : 2.0;

  // Calculate suggested quantity
  const sizing = calculatePositionSize({
    capital: config.capital,
    riskPerTradePct: config.riskPerTradePct,
    maxPositionValue: config.maxPositionValue,
    entryPrice,
    stopLoss,
    target,
  });

  return {
    rank: 0,
    symbol: String(stock.symbol || '').trim().toUpperCase(),
    companyName: stock.companyName || stock.company || stock.symbol,
    ltp: price,
    changePercent: Number(changePercent.toFixed(2)),
    volume: Number(stock.volume ?? stock.trade_quantity ?? 0),
    volumeRatio: Number(stock.rvol ?? stock.volumeRatio ?? 1),
    vwap: Number(vwap.toFixed(2)),
    rsi: Number(rsi.toFixed(1)),
    support,
    resistance,
    bullishScore,
    signal,
    entryPrice,
    target,
    stopLoss,
    riskReward,
    suggestedQty: sizing.quantity,
    adx: stock.adx ? Number(stock.adx.toFixed(1)) : undefined,
    atr: stock.atr ? Number(stock.atr.toFixed(2)) : undefined,
    candlePattern: stock.candlePattern || null,
  };
}

export function generateTradeSignal(stock: any, config = getTradingConfig()): TradeSignal {
  const evaluated = evaluateStockScanner(stock, config);
  const breakdown = computeBullishScore(stock);

  const sizing = calculatePositionSize({
    capital: config.capital,
    riskPerTradePct: config.riskPerTradePct,
    maxPositionValue: config.maxPositionValue,
    entryPrice: evaluated.entryPrice,
    stopLoss: evaluated.stopLoss,
    target: evaluated.target,
  });

  const shouldBuy = evaluated.bullishScore >= config.minBullishScore && sizing.quantity > 0;

  return {
    symbol: evaluated.symbol,
    signal: shouldBuy ? 'BUY' : evaluated.bullishScore >= 65 ? 'WAIT' : 'AVOID',
    signalLevel: evaluated.signal,
    bullishScore: evaluated.bullishScore,
    confidence: evaluated.bullishScore,
    entryPrice: evaluated.entryPrice,
    stopLoss: evaluated.stopLoss,
    target1: evaluated.target,
    target2: Number((evaluated.entryPrice + (evaluated.entryPrice - evaluated.stopLoss) * 3).toFixed(2)),
    riskReward: evaluated.riskReward,
    quantity: sizing.quantity,
    riskAmount: sizing.totalRiskAmount,
    potentialProfit: sizing.potentialProfit,
    reasons: breakdown.reasons,
    generatedAt: new Date().toISOString(),
  };
}
