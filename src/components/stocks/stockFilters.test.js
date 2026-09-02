import test from 'node:test';
import assert from 'node:assert/strict';
import { filterStocksByGroup } from './stockFilters.js';
import { buildMyStockSignal } from './myStockSignals.js';

test('filters personal care stocks by symbol and company name', () => {
  const rows = [
    { symbol: 'HINDUNILVR', companyName: 'Hindustan Unilever' },
    { symbol: 'MARICO', companyName: 'Marico Ltd' },
    { symbol: 'INFY', companyName: 'Infosys' },
    { symbol: 'GODREJCP', companyName: 'Godrej Consumer' },
  ];

  const filtered = filterStocksByGroup(rows, 'personal-care');

  assert.deepEqual(filtered.map((row) => row.symbol).sort(), ['GODREJCP', 'HINDUNILVR', 'MARICO'].sort());
});

test('returns empty list when no basic industry match is present', () => {
  const rows = [{ symbol: 'INFY', companyName: 'Infosys' }];

  const filtered = filterStocksByGroup(rows, 'basic-industry');

  assert.deepEqual(filtered, []);
});

test('classifies bullish and bearish intraday sentiment for my stocks', () => {
  assert.deepEqual(buildMyStockSignal({ price: 120, previousClose: 110 }), {
    status: 'Buy',
    sentiment: 'Strong Bullish',
    marketDirection: 'Rapidly Rising',
    investorMood: 'Very Confident',
    keyAction: 'Aggressive Buying',
    goodForIntraday: 'Yes',
  });

  assert.deepEqual(buildMyStockSignal({ price: 95, previousClose: 100 }), {
    status: 'Sell',
    sentiment: 'Bearish',
    marketDirection: 'Falling',
    investorMood: 'Pessimistic',
    keyAction: 'Selling / Hedging',
    goodForIntraday: 'No',
  });

  assert.deepEqual(buildMyStockSignal({ price: 103, previousClose: 100 }), {
    status: 'Buy',
    sentiment: 'Bullish',
    marketDirection: 'Rising',
    investorMood: 'Optimistic',
    keyAction: 'Buying / Holding',
    goodForIntraday: 'Yes',
  });
});

test('evaluates intraday signal and profit limit rule correctly', () => {
  function computeIntradaySignal({ price, vwap, open, changePercent, score, distToUcPct }) {
    const isLockedInUC = distToUcPct <= 0.3;
    const isNearUC = !isLockedInUC && distToUcPct <= 2.0;
    const aboveVwap = price >= vwap;

    if (isLockedInUC) {
      return { signal: 'LOCKED_CIRCUIT', advice: 'Hold for Tomorrow Gap-Up Open' };
    }
    if (isNearUC) {
      return { signal: 'NEAR_UC_ALERT', advice: 'Buy Window Before Freeze' };
    }
    if (!aboveVwap || (price < open && changePercent <= 0)) {
      return { signal: 'STRONG_SELLING', advice: 'DO NOT BUY / EXIT LONG' };
    }
    if (score >= 60 && aboveVwap && changePercent >= 1.5) {
      return { signal: 'STRONG_BUY', advice: 'Take 50% at T1 (+2.5%) & SL to Cost' };
    }
    return { signal: 'WATCH', advice: 'Wait for Breakout above VWAP' };
  }

  // Ather Energy scenario today: below VWAP
  const ather = computeIntradaySignal({ price: 1675, vwap: 1702, open: 1722, changePercent: -2.9, score: 40, distToUcPct: 6.0 });
  assert.equal(ather.signal, 'STRONG_SELLING');
  assert.match(ather.advice, /DO NOT BUY/);

  // Lenskart scenario today: above VWAP
  const lenskart = computeIntradaySignal({ price: 669, vwap: 669, open: 665, changePercent: 1.8, score: 85, distToUcPct: 3.5 });
  assert.equal(lenskart.signal, 'STRONG_BUY');
  assert.match(lenskart.advice, /Take 50% at T1/);

  // Niraj Ispat scenario today: Locked in UC
  const niraj = computeIntradaySignal({ price: 341.85, vwap: 341.85, open: 285, changePercent: 19.9, score: 95, distToUcPct: 0.0 });
  assert.equal(niraj.signal, 'LOCKED_CIRCUIT');
});

