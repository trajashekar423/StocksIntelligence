import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getSeasonalAnalysis, INDIAN_SEASONAL_CYCLES } from './seasonalThemeEngine.ts';

describe('Indian Seasonal & Festival Market Cycle Engine', () => {
  it('identifies September active themes: Ganesh Chaturthi, Onam & Navratri build-up', () => {
    // 4th September 2026
    const septDate = new Date('2026-09-04T12:00:00Z');
    const analysis = getSeasonalAnalysis(septDate);

    assert.strictEqual(analysis.currentMonth, 9);
    assert.strictEqual(analysis.currentMonthName, 'September');

    // Should include Onam & Ganesh Chaturthi and Navratri in active cycles
    const activeIds = analysis.activeCycles.map((c) => c.id);
    assert.ok(activeIds.includes('onam_ganesh_chaturthi'), 'Expected Onam/Ganesh in active cycles');
    assert.ok(activeIds.includes('navratri_dussehra'), 'Expected Navratri/Dussehra in active cycles');

    // Should include Diwali & Wedding Season in upcoming cycles
    const upcomingIds = analysis.upcomingCycles.map((c) => c.id);
    assert.ok(upcomingIds.includes('diwali_dhanteras'), 'Expected Diwali in upcoming cycles');
    assert.ok(upcomingIds.includes('wedding_season'), 'Expected Wedding season in upcoming cycles');
  });

  it('validates all 10 seasonal cycles have complete data, sectors, and actionable advice', () => {
    assert.ok(INDIAN_SEASONAL_CYCLES.length >= 10);

    INDIAN_SEASONAL_CYCLES.forEach((cycle) => {
      assert.ok(cycle.id, 'Cycle must have an ID');
      assert.ok(cycle.name, 'Cycle must have a name');
      assert.ok(cycle.sectors.length > 0, `Cycle ${cycle.id} must have sectors`);
      assert.ok(cycle.stocks.length >= 3, `Cycle ${cycle.id} must have at least 3 stocks`);
      assert.ok(cycle.whenToAccumulate, `Cycle ${cycle.id} must have accumulation guidance`);
      assert.ok(cycle.whenToExit, `Cycle ${cycle.id} must have exit guidance`);

      cycle.stocks.forEach((stock) => {
        assert.ok(stock.symbol, 'Stock must have symbol');
        assert.ok(stock.catalyst, `Stock ${stock.symbol} must have catalyst`);
        assert.ok(stock.typicalRunupPct, `Stock ${stock.symbol} must have runup expectation`);
      });
    });
  });

  it('accurately verifies thematic stock mapping across high-conviction Indian sectors', () => {
    // Gold & Jewellery
    const ganeshCycle = INDIAN_SEASONAL_CYCLES.find((c) => c.id === 'onam_ganesh_chaturthi');
    const ganeshSymbols = ganeshCycle?.stocks.map((s) => s.symbol) || [];
    assert.ok(ganeshSymbols.includes('TITAN'));
    assert.ok(ganeshSymbols.includes('KALYANJEW'));
    assert.ok(ganeshSymbols.includes('MUTHOOTFIN'));

    // Wedding Season
    const weddingCycle = INDIAN_SEASONAL_CYCLES.find((c) => c.id === 'wedding_season');
    const weddingSymbols = weddingCycle?.stocks.map((s) => s.symbol) || [];
    assert.ok(weddingSymbols.includes('MANYAVAR'));
    assert.ok(weddingSymbols.includes('INDHOTEL'));
    assert.ok(weddingSymbols.includes('RAYMOND'));

    // Summer Cooling
    const summerCycle = INDIAN_SEASONAL_CYCLES.find((c) => c.id === 'akshaya_tritiya_summer');
    const summerSymbols = summerCycle?.stocks.map((s) => s.symbol) || [];
    assert.ok(summerSymbols.includes('VBL'));
  });
});

