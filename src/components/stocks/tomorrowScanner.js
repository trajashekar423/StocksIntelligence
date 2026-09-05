import { getNSEDateTime } from '../../utils/nseTime.js';
import { evaluateSafeEntry } from '../../services/strategy/reversalScannerEngine.ts';
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const parsed = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

function getNearestSupport(price, values = []) {
  const supports = values
    .filter((value) => Number.isFinite(value) && value > 0 && value < price)
    .sort((a, b) => b - a);

  return supports.length ? supports[0] : null;
}

function getNearestResistance(price, values = []) {
  const resistances = values
    .filter((value) => Number.isFinite(value) && value > 0 && value >= price)
    .sort((a, b) => a - b);

  return resistances.length ? resistances[0] : null;
}

function formatMoney(value) {
  const amount = toNumber(value);
  return amount > 0 ? `₹${amount.toFixed(2)}` : 'N/A';
}

export function buildTomorrowScanner(rows = [], context = {}) {
  const candidates = (Array.isArray(rows) ? rows : [])
    .map((row) => {
      const price = toNumber(row?.price ?? row?.ltp ?? row?.close ?? row?.lastPrice);
      const previousClose = toNumber(row?.previousClose ?? row?.prevClose ?? row?.close ?? row?.previous_day_close ?? price);
      const changePercent = toNumber(
        row?.changePercent ?? row?.pChange ?? row?.percentChange ?? ((price - previousClose) / Math.max(previousClose, 1)) * 100
      );
      const volumeRatio = toNumber(
        row?.volumeRatio ?? row?.relativeVolume ?? row?.relVolume ?? ((toNumber(row?.volume) / Math.max(toNumber(row?.averageVolume), 1)))
      );
      const vwap = toNumber(row?.vwap ?? row?.VWAP ?? row?.vwapPrice ?? 0);
      const volume = toNumber(
        row?.volume ?? row?.trade_quantity ?? row?.tradedQuantity ?? row?.totalTradedVolume ?? row?.quantityTraded ?? row?.total_traded_quantity ?? 0
      );
      const averageVolume = toNumber(row?.averageVolume ?? row?.avgVolume ?? row?.average_volume ?? row?.average_traded_volume ?? 0);
      const dayLow = toNumber(row?.dayLow ?? row?.low ?? 0);
      const dayHigh = toNumber(row?.dayHigh ?? row?.high ?? 0);
      const prevDayHigh = toNumber(row?.previousDayHigh ?? row?.PDH ?? row?.prevDayHigh ?? 0);
      const supportLevel = getNearestSupport(price, [dayLow, previousClose, vwap, toNumber(row?.supportLevel)]);
      const resistanceLevel = getNearestResistance(price, [dayHigh, prevDayHigh, toNumber(row?.resistanceLevel), price * 1.05]);
      const breakout = Boolean(
        price > (prevDayHigh || price) &&
        volumeRatio >= 1.5 &&
        price > (vwap || price) &&
        changePercent > 0
      );
      const trend = changePercent > 3 && price > previousClose ? 'Strong Bullish' : (changePercent > 0 ? 'Bullish' : 'Neutral');
      const riskReward = supportLevel && price > supportLevel
        ? clamp((Number(resistanceLevel || price) - price) / Math.max(price - supportLevel, 0.01), 0, 10)
        : 1.2;
      const breakoutLabel = breakout ? '🔥 BREAKOUT CONFIRMED' : (price >= (prevDayHigh || price) ? '⚠️ NEAR RESISTANCE' : 'N/A');
      const distanceFromSupport = supportLevel ? ((price - supportLevel) / Math.max(supportLevel, 1)) * 100 : null;
      const distanceFromResistance = resistanceLevel && price < resistanceLevel
        ? ((resistanceLevel - price) / Math.max(price, 1)) * 100
        : 0;

      let score = 0;
      score += clamp(changePercent > 0 ? changePercent * 4 : 0, 0, 15);
      score += volumeRatio >= 1.5 ? 20 : volumeRatio >= 1.2 ? 15 : 8;
      score += price > (vwap || price) ? 10 : 0;
      score += supportLevel && price > supportLevel ? 10 : 0;
      score += breakout ? 15 : (prevDayHigh && price >= prevDayHigh * 0.995 ? 10 : 0);
      score += riskReward >= 3 ? 10 : riskReward >= 2 ? 8 : 4;
      score += toNumber(row?.score) * 0.2;
      score += context?.marketBullish ? 5 : 2;
      score = clamp(Math.round(score), 0, 100);

      let signal = '⚪ NEUTRAL';
      if (score >= 90) signal = '🔥 VERY STRONG';
      else if (score >= 80) signal = '🟢 STRONG BULLISH';
      else if (score >= 70) signal = '🟡 BULLISH WATCH';
      else if (score >= 60) signal = '⚪ NEUTRAL';
      else signal = '🔴 WEAK';

      const entryZone = supportLevel && resistanceLevel
        ? (supportLevel + Math.min(price, resistanceLevel)) / 2
        : price;
      const stopLoss = supportLevel || price * 0.985;
      const target1 = price + Math.max((price - stopLoss) * 1.5, 0.5);
      const target2 = price + Math.max((price - stopLoss) * 2.5, 0.8);
      const target3 = price + Math.max((price - stopLoss) * 3.5, 1.2);

      // 🛡️ Safe Logic Decision Engine for Intraday Entries
      const safeEntry = evaluateSafeEntry({
        currentPrice: price,
        recommendedEntry: entryZone,
        stopLoss,
        target1,
        vwap: vwap || price * 0.998,
      });

      return {
        symbol: row?.symbol || row?.Symbol || 'N/A',
        companyName: row?.companyName || row?.company || 'N/A',
        price,
        previousClose,
        changePercent,
        volume,
        averageVolume,
        vwap,
        volumeRatio,
        relativeVolume: volumeRatio,
        supportLevel,
        resistanceLevel,
        distanceFromSupport,
        distanceFromResistance,
        breakout,
        breakoutLabel,
        trend,
        signal,
        score,
        riskReward: Number(riskReward.toFixed(2)),
        entryZone,
        stopLoss,
        target1,
        target2,
        target3,
        safeEntry,
        tradeSetup: breakout ? 'BUY ON CONFIRMATION' : 'WAIT FOR ENTRY',
        marketBias: context?.marketSummary || 'N/A',
      };
    })
    .filter((row) => row.symbol && row.symbol !== 'N/A' && row.price > 0)
    .sort((a, b) => b.score - a.score || b.changePercent - a.changePercent)
    .slice(0, 10);

  const top10 = candidates.map((row, index) => ({ ...row, rank: index + 1 }));
  const bestPick = top10[0] || null;
  const breakoutCandidates = top10.filter((row) => row.breakout).slice(0, 3);
  const strongMomentum = top10.filter((row) => row.relativeVolume >= 1.5 && row.changePercent > 2).slice(0, 3);
  const safeSetup = top10.filter((row) => row.supportLevel && row.riskReward >= 2).slice(0, 3);
  const avoidTomorrow = top10.filter((row) => row.score < 60 || row.changePercent <= 0).slice(0, 5);

  const now = new Date();
  return {
    top10,
    bestPick,
    breakoutCandidates,
    strongMomentum,
    safeSetup,
    avoidTomorrow,
    dataDate: now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    dataTime: getNSEDateTime(now).shortTime,
    dataStatus: context?.live === false ? 'DELAYED' : 'LIVE',
    marketSummary: context?.marketSummary || 'N/A',
    signalSummary: bestPick ? `${bestPick.symbol} · ${bestPick.signal}` : 'N/A',
  };
}

export function renderTomorrowSetup(row, budgetPerStock = 25000) {
  const safe = row?.safeEntry;
  const price = Number(row?.price || 1);
  const qty = Math.max(Math.floor(budgetPerStock / Math.max(price, 0.01)), 1);
  const invested = Math.round(qty * price);
  const t1 = Number(row?.target1 || price * 1.04);
  const t2 = Number(row?.target2 || price * 1.07);
  const sl = Number(row?.stopLoss || price * 0.985);
  const t1Profit = Math.round(qty * (t1 - price));
  const t2Profit = Math.round(qty * (t2 - price));
  const slLoss = Math.round(qty * Math.max(price - sl, 0.01));
  const halfQty = Math.max(Math.floor(qty / 2), 1);
  const halfProfitT1 = Math.round(halfQty * (t1 - price));

  return {
    entry: formatMoney(row?.entryZone),
    stopLoss: formatMoney(row?.stopLoss),
    target1: formatMoney(row?.target1),
    target2: formatMoney(row?.target2),
    target3: formatMoney(row?.target3),
    riskReward: row?.riskReward ? `${row.riskReward}:1` : 'N/A',
    safeStatus: safe?.status || 'N/A',
    safeReason: safe?.reason || '',
    isSafe: Boolean(safe?.safe),
    breakevenTrigger: safe?.breakevenTrigger ? formatMoney(safe.breakevenTrigger) : 'N/A',
    bookHalfAt: safe?.bookHalfAt ? formatMoney(safe.bookHalfAt) : 'N/A',
    entryRange: safe?.entryZone || formatMoney(row?.entryZone),
    qty,
    invested,
    t1Profit,
    t2Profit,
    slLoss,
    halfQty,
    halfProfitT1,
  };
}
