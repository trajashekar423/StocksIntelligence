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
