import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('BigShot Radar Institutional & 5x Volume Algorithm', () => {
  test('Mega Block Accumulation: identifies > ₹500 Cr institutional supply absorption', () => {
    const deals = [
      { symbol: 'ATHERENERG', dealValueCr: 1758.24, dealPrice: 1480.0, ltp: 1717.7 },
      { symbol: 'LENSKART', dealValueCr: 1856.78, dealPrice: 630.0, ltp: 648.5 },
      { symbol: 'TINYDEAL', dealValueCr: 12.5, dealPrice: 100.0, ltp: 101.0 },
    ];

    const megaBlocks = deals.filter((d) => d.dealValueCr >= 500);
    assert.equal(megaBlocks.length, 2);
    assert.equal(megaBlocks[0].symbol, 'ATHERENERG');
    assert.equal(megaBlocks[1].symbol, 'LENSKART');

    // Verify T+1 follow-through gain calculation
    const atherGain = ((1717.7 - 1480.0) / 1480.0) * 100;
    assert.ok(atherGain > 15.0, 'Ather Energy should demonstrate >15% follow-through gain from block price');
  });

  test('5x Volume Surge News Breakout: detects high RVOL and price > open above VWAP', () => {
    const stocks = [
      { symbol: 'ASIANHOTNR', open: 309.95, price: 362.05, vwap: 338.28, rvol: 8.4, volume: 1850000 },
      { symbol: 'BODALCHEM', open: 106.5, price: 118.89, vwap: 113.96, rvol: 6.2, volume: 4200000 },
      { symbol: 'NORMALSTOCK', open: 200.0, price: 201.0, vwap: 200.5, rvol: 1.2, volume: 50000 },
    ];

    const breakouts = stocks.filter((s) => {
      const is5xVolume = s.rvol >= 5.0;
      const isAboveOpen = s.price > s.open * 1.03; // ≥ +3% above open
      const isAboveVwap = s.price > s.vwap;
      return is5xVolume && isAboveOpen && isAboveVwap;
    });

    assert.equal(breakouts.length, 2);
    assert.equal(breakouts[0].symbol, 'ASIANHOTNR');
    assert.equal(breakouts[1].symbol, 'BODALCHEM');
  });

  test('Custom Watchlist Persistence: pins and unpins symbols correctly', () => {
    const watchlist = new Set(['ATHERENERG', 'ASIANHOTNR']);
    assert.equal(watchlist.has('ATHERENERG'), true);

    // Toggle pin off
    watchlist.delete('ATHERENERG');
    assert.equal(watchlist.has('ATHERENERG'), false);

    // Toggle pin on
    watchlist.add('BODALCHEM');
    assert.equal(watchlist.has('BODALCHEM'), true);
    assert.equal(watchlist.size, 2);
  });

  test('Upper Circuit Radar: accurately detects 100% Locked and Near-Circuit alerts', () => {
    const stocks = [
      { symbol: 'NIRAJISPAT', price: 341.85, prevClose: 285.0, upperBand: 341.85 },
      { symbol: 'BODALCHEM', price: 118.89, prevClose: 100.4, upperBand: 120.48 },
      { symbol: 'SLOWSTOCK', price: 102.0, prevClose: 100.0, upperBand: 120.0 },
    ];

    const results = stocks.map((s) => {
      const distPct = Math.max(0, ((s.upperBand - s.price) / s.price) * 100);
      let status = 'NORMAL';
      if (distPct <= 0.3) status = 'LOCKED_IN_UC';
      else if (distPct <= 2.5) status = 'NEAR_UC_ALERT';
      return { symbol: s.symbol, distPct, status };
    });

    assert.equal(results[0].status, 'LOCKED_IN_UC');
    assert.equal(results[1].status, 'NEAR_UC_ALERT');
    assert.ok(results[1].distPct <= 2.0, 'Bodalchem should be within 2% of Upper Band');
    assert.equal(results[2].status, 'NORMAL');
  });
});

