import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeGlobalMarketScore } from './globalMarketEngine.ts';
import { computeIndiaMarketScore } from './indiaMarketEngine.ts';
import { computeSectorStrength } from './sectorStrengthEngine.ts';
import { runConfluenceQuantScan, type RawStockCandidate } from './confluenceScannerEngine.ts';

describe('NSE Confluence Quant Scanner Engine Suite', () => {
  it('Global Market Engine: rewards positive GIFT Nifty and penalizes surging VIX & Crude', () => {
    // Bullish Global Setup
    const bullGlobal = computeGlobalMarketScore({
      giftNiftyChangePct: 0.8,
      sp500ChangePct: 0.6,
      nasdaqChangePct: 0.9,
      usVix: 12.5,
      brentCrudePrice: 72.0,
      brentCrudeChangePct: -1.5,
    });
    assert.ok(bullGlobal.globalScore >= 65, `Expected >= 65, got ${bullGlobal.globalScore}`);
    assert.strictEqual(bullGlobal.sentiment, 'BULLISH');
    assert.strictEqual(bullGlobal.macroFactors.isGiftNiftyPositive, true);

    // Bearish Global Setup (Spiking Crude + VIX + Negative GIFT Nifty)
    const bearGlobal = computeGlobalMarketScore({
      giftNiftyChangePct: -1.2,
      sp500ChangePct: -1.5,
      usVix: 24.0,
      brentCrudePrice: 94.0,
      brentCrudeChangePct: 3.5,
    });
    assert.ok(bearGlobal.globalScore <= 40, `Expected <= 40, got ${bearGlobal.globalScore}`);
    assert.strictEqual(bearGlobal.sentiment, 'BEARISH');
  });

  it('Indian Market Engine: accurately classifies STRONG_BULL, NEUTRAL, and BEAR regimes', () => {
    // Strong Bull Market
    const strongBull = computeIndiaMarketScore({
      niftyChangePct: 1.2,
      bankNiftyChangePct: 1.5,
      indiaVix: 12.8,
      advances: 1650,
      declines: 350,
      fiiNetCrores: 2400,
      niftyPrice: 24600,
      niftyVwap: 24450,
      niftyEma20: 24500,
      niftyEma50: 24350,
    });
    assert.strictEqual(strongBull.regime, 'STRONG_BULL');
    assert.strictEqual(strongBull.details.allowLongBreakouts, true);
    assert.strictEqual(strongBull.details.allowIntradayShorts, false);

    // Bear Market (Outflows, High VIX, Nifty below VWAP)
    const bearMarket = computeIndiaMarketScore({
      niftyChangePct: -1.4,
      bankNiftyChangePct: -1.8,
      indiaVix: 20.5,
      advances: 420,
      declines: 1580,
      fiiNetCrores: -3200,
      niftyPrice: 24200,
      niftyVwap: 24380,
      niftyEma20: 24300,
      niftyEma50: 24450,
    });
    assert.ok(bearMarket.regime === 'BEAR' || bearMarket.regime === 'STRONG_BEAR');
    assert.strictEqual(bearMarket.details.allowLongBreakouts, false); // Long breakouts suppressed!
    assert.strictEqual(bearMarket.details.allowIntradayShorts, true); // Shorts prioritized!
  });

  it('Sector Strength Engine: provides tailwind boost to stocks in leading sectors and warns on lagging sectors', () => {
    const sec = computeSectorStrength(
      {
        AUTO: { changePct: 1.8, relativeVolume: 1.6, advances: 12, declines: 2 },
        METALS: { changePct: -1.2, relativeVolume: 1.1, advances: 3, declines: 11 },
      },
      0.4
    );

    const autoAdj = sec.getSectorAdjustment('AUTO', true);
    assert.strictEqual(autoAdj.isTailwind, true);
    assert.ok(autoAdj.adjustmentScore > 0);

    const metalLongAdj = sec.getSectorAdjustment('METALS', true);
    assert.strictEqual(metalLongAdj.isTailwind, false);
    assert.ok(metalLongAdj.adjustmentScore < 0);
  });

  it('Confluence Scanner: identifies high-quality Long candidate with full explainability', () => {
    const mockCandidates: RawStockCandidate[] = [
      {
        symbol: 'RELIANCE',
        companyName: 'Reliance Industries Limited',
        price: 2950.0,
        open: 2910.0,
        previousClose: 2900.0,
        vwap: 2925.0, // Above VWAP!
        volume: 2500000,
        relativeVolume: 1.8, // 1.8x RVOL
        ema9: 2935.0,
        ema20: 2920.0,
        ema50: 2890.0,
        rsi: 62.0, // Bullish RSI (50 - 70)
        atr: 35.0,
        sector: 'ENERGY',
        trend5m: 'BULLISH',
        trend15m: 'BULLISH',
        trend1h: 'BULLISH',
      },
      {
        symbol: 'WEAKCORP',
        companyName: 'Weak Stock Limited',
        price: 450.0,
        open: 465.0,
        previousClose: 468.0,
        vwap: 460.0, // Trapped below VWAP!
        volume: 300000,
        relativeVolume: 0.8,
        ema20: 455.0,
        ema50: 465.0,
        rsi: 42.0,
        sector: 'METALS',
      },
    ];

    const result = runConfluenceQuantScan(mockCandidates, {
      giftNiftyChangePct: 0.4,
      sp500ChangePct: 0.5,
    }, {
      niftyChangePct: 0.5,
      niftyPrice: 24500,
      niftyVwap: 24420,
    });

    assert.strictEqual(result.top10Long.length, 1);
    const rel = result.top10Long[0];
    assert.strictEqual(rel.symbol, 'RELIANCE');
    assert.strictEqual(rel.signal, 'LONG');
    assert.strictEqual(rel.canTrade, true);
    assert.ok(rel.finalScore >= 75);
    assert.ok(rel.reasons.some((r) => r.includes('VWAP')));
    assert.ok(rel.reasons.some((r) => r.includes('EMA20 > EMA50')));

    // WEAKCORP should NEVER be in top10Long because price is below VWAP
    assert.ok(!result.top10Long.some((s) => s.symbol === 'WEAKCORP'));
  });

  it('Confluence Scanner: suppresses Long signals and activates Short candidates during a Bear Market', () => {
    const mockCandidates: RawStockCandidate[] = [
      {
        symbol: 'DUMPING_BANK',
        companyName: 'Weak Bank Limited',
        price: 850.0,
        open: 875.0,
        previousClose: 880.0,
        vwap: 865.0, // Trapped below VWAP
        volume: 1500000,
        relativeVolume: 1.6,
        ema20: 860.0,
        ema50: 880.0, // EMA20 < EMA50
        rsi: 38.0, // Bearish RSI (30 - 50)
        atr: 12.0,
        sector: 'BANKING',
        trend15m: 'BEARISH',
      },
    ];

    const bearScan = runConfluenceQuantScan(mockCandidates, {
      giftNiftyChangePct: -1.1,
      sp500ChangePct: -1.2,
    }, {
      niftyChangePct: -1.3,
      niftyPrice: 24200,
      niftyVwap: 24350,
      indiaVix: 21.0,
      advances: 400,
      declines: 1600,
      fiiNetCrores: -2800,
    });

    assert.ok(bearScan.indianMarket.regime === 'BEAR' || bearScan.indianMarket.regime === 'STRONG_BEAR');
    // Top 10 Long must be empty in a Bear regime
    assert.strictEqual(bearScan.top10Long.length, 0);
    // Short candidate should qualify
    assert.strictEqual(bearScan.top10Short.length, 1);
    assert.strictEqual(bearScan.top10Short[0].symbol, 'DUMPING_BANK');
    assert.strictEqual(bearScan.top10Short[0].signal, 'SHORT');
  });

  it('Risk Filter: strictly rejects illiquid stocks (< ₹5 Cr turnover) and stocks near circuits', () => {
    const illiquidCandidate: RawStockCandidate = {
      symbol: 'TINY_ILLIQUID',
      price: 15.0,
      volume: 10000, // Turnover = ₹1.5 Lakhs << ₹5 Cr limit!
      previousClose: 14.5,
      vwap: 14.8,
      relativeVolume: 2.0,
    };

    const circuitCandidate: RawStockCandidate = {
      symbol: 'CIRCUIT_RISK',
      price: 100.0,
      upperCircuit: 100.8, // Only 0.8% away from Upper Circuit (< 1.5% buffer!)
      volume: 1000000,
      previousClose: 95.0,
      vwap: 98.0,
      relativeVolume: 2.0,
    };

    const scan = runConfluenceQuantScan([illiquidCandidate, circuitCandidate]);
    assert.strictEqual(scan.top10Long.length, 0);
    assert.strictEqual(scan.allCandidates[0].isPassingAllFilters, false);
    assert.ok(scan.allCandidates[0].warnings.some((w) => w.includes('Turnover')));
    assert.ok(scan.allCandidates[1].warnings.some((w) => w.includes('Upper Circuit')));
  });
});
