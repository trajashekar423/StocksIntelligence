'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { runReversalScanner } from '../../services/strategy/reversalScannerEngine';

// Default realistic seed candidates with 20-candle historical series
function generateSeedCandidates() {
  // Helper to generate 20 candles with a specified trend and reversal
  const makeCandles = (basePrice, trendType) => {
    const candles = [];
    let p = basePrice;

    if (trendType === 'DOWNTREND_HAMMER_CONFIRMED') {
      // 18 candles declining
      p = basePrice * 1.08;
      for (let i = 0; i < 18; i++) {
        const open = p;
        p -= (basePrice * 0.005);
        const close = p;
        candles.push({
          open,
          high: open + (basePrice * 0.002),
          low: close - (basePrice * 0.003),
          close,
          volume: 120000,
        });
      }
      // Candle 19: Textbook Hammer (c2)
      const hammerLow = p - (basePrice * 0.022);
      const hammerOpen = p;
      const hammerClose = p + (basePrice * 0.003);
      candles.push({
        open: hammerOpen,
        high: hammerClose + (basePrice * 0.001),
        low: hammerLow,
        close: hammerClose,
        volume: 280000, // 2.3x volume surge
      });
      // Candle 20: Bullish Confirmation (c1 breakout above Hammer High)
      candles.push({
        open: hammerClose,
        high: hammerClose + (basePrice * 0.015),
        low: hammerClose - (basePrice * 0.002),
        close: hammerClose + (basePrice * 0.012), // Higher than hammer high
        volume: 250000,
      });
    } else if (trendType === 'DOWNTREND_ENGULFING_AWAITING') {
      // 18 candles declining
      p = basePrice * 1.07;
      for (let i = 0; i < 18; i++) {
        const open = p;
        p -= (basePrice * 0.0045);
        const close = p;
        candles.push({
          open,
          high: open + (basePrice * 0.002),
          low: close - (basePrice * 0.002),
          close,
          volume: 90000,
        });
      }
      // Candle 19: Red candle
      const redOpen = p;
      const redClose = p - (basePrice * 0.008);
      candles.push({
        open: redOpen,
        high: redOpen + 2,
        low: redClose - 2,
        close: redClose,
        volume: 85000,
      });
      // Candle 20: Bullish Engulfing forming
      candles.push({
        open: redClose - (basePrice * 0.002),
        high: redOpen + (basePrice * 0.006),
        low: redClose - (basePrice * 0.003),
        close: redOpen + (basePrice * 0.004),
        volume: 210000,
      });
    } else if (trendType === 'PULLBACK_CONTINUATION') {
      // Steady uptrend, slight pullback to EMA20 / VWAP
      p = basePrice * 0.94;
      for (let i = 0; i < 17; i++) {
        const open = p;
        p += (basePrice * 0.005);
        const close = p;
        candles.push({
          open,
          high: close + (basePrice * 0.003),
          low: open - (basePrice * 0.002),
          close,
          volume: 150000,
        });
      }
      // 2 small pullback candles
      p -= (basePrice * 0.006);
      candles.push({ open: p + 5, high: p + 7, low: p - 2, close: p, volume: 110000 });
      p -= (basePrice * 0.004);
      candles.push({ open: p + 4, high: p + 5, low: p - 3, close: p, volume: 95000 });
      // Current candle bouncing off EMA20 / VWAP
      candles.push({
        open: p,
        high: p + (basePrice * 0.012),
        low: p - 1,
        close: p + (basePrice * 0.010),
        volume: 240000,
      });
    } else {
      // Top rejection / short setup
      p = basePrice * 0.92;
      for (let i = 0; i < 18; i++) {
        const open = p;
        p += (basePrice * 0.006);
        const close = p;
        candles.push({
          open,
          high: close + (basePrice * 0.002),
          low: open - (basePrice * 0.002),
          close,
          volume: 140000,
        });
      }
      // Candle 19: High spike
      candles.push({
        open: p,
        high: p + (basePrice * 0.035),
        low: p - 2,
        close: p + (basePrice * 0.005),
        volume: 310000,
      });
      // Candle 20: Breakdown below VWAP with long upper wick
      candles.push({
        open: p + (basePrice * 0.004),
        high: p + (basePrice * 0.02),
        low: p - (basePrice * 0.018),
        close: p - (basePrice * 0.015),
        volume: 290000,
      });
    }

    return candles;
  };

  return [
    {
      symbol: 'ATHERENERG',
      companyName: 'Ather Energy Limited',
      sector: 'EV / AUTO',
      candles: makeCandles(1644, 'DOWNTREND_HAMMER_CONFIRMED'),
      ema20: 1675,
      ema50: 1710,
      ema9: 1640,
      rsiCurrent: 39,
      rsiPrevious: 28,
      atr: 24.5,
      averageVolume20: 120000,
    },
    {
      symbol: 'TATASTEEL',
      companyName: 'Tata Steel Limited',
      sector: 'METALS',
      candles: makeCandles(148.5, 'DOWNTREND_HAMMER_CONFIRMED'),
      ema20: 153.2,
      ema50: 156.0,
      ema9: 148.0,
      rsiCurrent: 38,
      rsiPrevious: 31,
      atr: 2.8,
      averageVolume20: 8500000,
    },
    {
      symbol: 'PAYTM',
      companyName: 'One97 Communications Ltd',
      sector: 'FINTECH',
      candles: makeCandles(640, 'DOWNTREND_ENGULFING_AWAITING'),
      ema20: 665,
      ema50: 685,
      ema9: 638,
      rsiCurrent: 36,
      rsiPrevious: 29,
      atr: 14.0,
      averageVolume20: 1800000,
    },
    {
      symbol: 'HDFCBANK',
      companyName: 'HDFC Bank Limited',
      sector: 'BANKING',
      candles: makeCandles(1625, 'DOWNTREND_HAMMER_CONFIRMED'),
      ema20: 1648,
      ema50: 1665,
      ema9: 1622,
      rsiCurrent: 37,
      rsiPrevious: 30,
      atr: 18.0,
      averageVolume20: 3800000,
    },
    {
      symbol: 'RELIANCE',
      companyName: 'Reliance Industries Limited',
      sector: 'ENERGY',
      candles: makeCandles(2980, 'PULLBACK_CONTINUATION'),
      vwap: 2968,
      ema20: 2970,
      ema50: 2930,
      ema9: 2978,
      rsiCurrent: 58,
      rsiPrevious: 54,
      atr: 32.0,
      averageVolume20: 2200000,
    },
    {
      symbol: 'TATAMOTORS',
      companyName: 'Tata Motors Limited',
      sector: 'AUTO',
      candles: makeCandles(1045, 'PULLBACK_CONTINUATION'),
      vwap: 1038,
      ema20: 1040,
      ema50: 1015,
      ema9: 1042,
      rsiCurrent: 62,
      rsiPrevious: 58,
      atr: 16.5,
      averageVolume20: 3200000,
    },
    {
      symbol: 'INFY',
      companyName: 'Infosys Limited',
      sector: 'IT',
      candles: makeCandles(1820, 'PULLBACK_CONTINUATION'),
      vwap: 1814,
      ema20: 1816,
      ema50: 1795,
      ema9: 1818,
      rsiCurrent: 59,
      rsiPrevious: 55,
      atr: 22.0,
      averageVolume20: 2400000,
    },
    {
      symbol: 'SUNPHARMA',
      companyName: 'Sun Pharmaceutical Ind.',
      sector: 'PHARMA',
      candles: makeCandles(1780, 'TOP_REJECTION_SHORT'),
      vwap: 1785,
      ema20: 1750,
      ema50: 1730,
      ema9: 1775,
      rsiCurrent: 68,
      rsiPrevious: 72,
      atr: 24.0,
      averageVolume20: 1400000,
    },
    {
      symbol: 'DLF',
      companyName: 'DLF Limited',
      sector: 'REALTY',
      candles: makeCandles(865, 'TOP_REJECTION_SHORT'),
      vwap: 872,
      ema20: 840,
      ema50: 820,
      ema9: 860,
      rsiCurrent: 66,
      rsiPrevious: 71,
      atr: 14.0,
      averageVolume20: 2100000,
    },
  ];
}

export default function ReversalQuantScanner({ onQuickTrade = null, onSendToPractice = null }) {
  const [loading, setLoading] = useState(true);
  const [activeSetupTab, setActiveSetupTab] = useState('ALL'); // 'ALL' | 'REVERSAL' | 'PULLBACK' | 'SHORT'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'CONFIRMED' | 'AWAITING'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStockForModal, setSelectedStockForModal] = useState(null);
  const [rawCandidates, setRawCandidates] = useState([]);
  const [lastRefreshed, setLastRefreshed] = useState('');

  // Fetch live market data to enrich / supplement candidate list
  const fetchMarketFeed = useCallback(async () => {
    setLoading(true);
    try {
      const [gainersRes, activeRes] = await Promise.allSettled([
        fetch('/api/nse/top-ten'),
        fetch('/api/nse/most-active'),
      ]);

      const seeds = generateSeedCandidates();
      const symbolMap = new Map();

      // Seed baseline first
      seeds.forEach((s) => symbolMap.set(s.symbol, s));

      // Update baseline seeds with live quotes if available
      const updateFromRows = (rows) => {
        if (!Array.isArray(rows)) return;
        rows.forEach((r) => {
          const sym = String(r.symbol || '').trim().toUpperCase();
          const ltp = Number(r.ltp || r.lastPrice || 0);
          if (sym && ltp > 0 && symbolMap.has(sym)) {
            const existing = symbolMap.get(sym);
            const candles = [...existing.candles];
            if (candles.length > 0) {
              const last = { ...candles[candles.length - 1], close: ltp, high: Math.max(candles[candles.length - 1].high, ltp), low: Math.min(candles[candles.length - 1].low, ltp) };
              candles[candles.length - 1] = last;
            }
            symbolMap.set(sym, {
              ...existing,
              candles,
              companyName: r.companyName || existing.companyName,
            });
          }
        });
      };

      if (gainersRes.status === 'fulfilled' && gainersRes.value.ok) {
        const gJson = await gainersRes.value.json().catch(() => ({}));
        const gRows = Array.isArray(gJson?.allSec?.data) ? gJson.allSec.data : Array.isArray(gJson?.data) ? gJson.data : [];
        updateFromRows(gRows);
      }

      if (activeRes.status === 'fulfilled' && activeRes.value.ok) {
        const aJson = await activeRes.value.json().catch(() => ({}));
        const aRows = Array.isArray(aJson?.data) ? aJson.data : [];
        updateFromRows(aRows);
      }

      setRawCandidates(Array.from(symbolMap.values()));
      setLastRefreshed(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }));
    } catch {
      setRawCandidates(generateSeedCandidates());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketFeed();
  }, [fetchMarketFeed]);

  // Execute Reversal Scanner Engine
  const scanResult = useMemo(() => {
    if (!rawCandidates || rawCandidates.length === 0) {
      return {
        timestamp: '',
        totalScanned: 0,
        downToUpReversals: [],
        pullbackContinuations: [],
        topReversalShorts: [],
      };
    }
    return runReversalScanner(rawCandidates);
  }, [rawCandidates]);

  // Filter candidates based on active setup tab, confirmation status, and search query
  const displayedCandidates = useMemo(() => {
    let pool = [];
    if (activeSetupTab === 'REVERSAL') {
      pool = scanResult.downToUpReversals;
    } else if (activeSetupTab === 'PULLBACK') {
      pool = scanResult.pullbackContinuations;
    } else if (activeSetupTab === 'SHORT') {
      pool = scanResult.topReversalShorts;
    } else {
      // ALL
      pool = [
        ...scanResult.downToUpReversals,
        ...scanResult.pullbackContinuations,
        ...scanResult.topReversalShorts,
      ];
    }

    if (statusFilter === 'CONFIRMED') {
      pool = pool.filter((c) => c.confirmationStatus === 'BUY_CONFIRMED');
    } else if (statusFilter === 'AWAITING') {
      pool = pool.filter((c) => c.confirmationStatus === 'AWAITING_CANDLE_2');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toUpperCase();
      pool = pool.filter(
        (c) =>
          c.symbol.includes(q) ||
          c.companyName.toUpperCase().includes(q) ||
          c.sector.toUpperCase().includes(q) ||
          c.candlestickPattern.toUpperCase().includes(q)
      );
    }

    return pool;
  }, [scanResult, activeSetupTab, statusFilter, searchQuery]);

  const confirmedCount = useMemo(() => {
    const all = [
      ...scanResult.downToUpReversals,
      ...scanResult.pullbackContinuations,
      ...scanResult.topReversalShorts,
    ];
    return all.filter((c) => c.confirmationStatus === 'BUY_CONFIRMED').length;
  }, [scanResult]);

  return (
    <div className="reversal-quant-scanner card shadow-sm border-0 mb-4" style={{ background: '#0b1320', color: '#f8fafc' }}>
      {/* ── HEADER BANNER ── */}
      <div className="card-header border-bottom border-secondary border-opacity-25 py-3" style={{ background: 'rgba(15, 23, 42, 0.95)' }}>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2">
              <span className="fs-4">🔄</span>
              <h5 className="mb-0 fw-bold text-white tracking-wide">
                Institutional Bullish Reversal & 3-Way Setup Engine
              </h5>
              <span className="badge rounded-pill bg-warning text-dark fw-bold px-2 py-1" style={{ fontSize: '11px' }}>
                100-PT QUANT SCANNER
              </span>
            </div>
            <p className="text-muted small mb-0 mt-1">
              Catches genuine bottoms at 20-candle swing support with strict <strong>Candle 2 Confirmation Gate</strong> & <strong>ATR-buffered stop loss</strong>.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-dark border border-secondary text-secondary small py-2 px-3">
              🕒 Last Refreshed: <span className="text-info">{lastRefreshed || 'Just now'}</span>
            </span>
            <button
              type="button"
              className="btn btn-outline-info btn-sm rounded-pill px-3 fw-semibold"
              onClick={fetchMarketFeed}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : '🔄 Refresh Live'}
            </button>
          </div>
        </div>

        {/* Quick Setup Stats */}
        <div className="row g-2 mt-3">
          <div className="col-6 col-md-3">
            <div className="p-2 rounded border border-secondary border-opacity-25 text-center" style={{ background: 'rgba(30, 41, 59, 0.7)' }}>
              <span className="text-muted small d-block" style={{ fontSize: 11 }}>1. DOWN → UP REVERSALS</span>
              <strong className="fs-5 text-emerald text-success">{scanResult.downToUpReversals.length} Setups</strong>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-2 rounded border border-secondary border-opacity-25 text-center" style={{ background: 'rgba(30, 41, 59, 0.7)' }}>
              <span className="text-muted small d-block" style={{ fontSize: 11 }}>2. UP → PULLBACK → UP</span>
              <strong className="fs-5 text-info">{scanResult.pullbackContinuations.length} Continuations</strong>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-2 rounded border border-secondary border-opacity-25 text-center" style={{ background: 'rgba(30, 41, 59, 0.7)' }}>
              <span className="text-muted small d-block" style={{ fontSize: 11 }}>3. UP → REVERSAL → DOWN</span>
              <strong className="fs-5 text-warning">{scanResult.topReversalShorts.length} Short Setups</strong>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-2 rounded border border-secondary border-opacity-25 text-center" style={{ background: 'rgba(30, 41, 59, 0.7)' }}>
              <span className="text-muted small d-block" style={{ fontSize: 11 }}>🟢 2ND CANDLE CONFIRMED</span>
              <strong className="fs-5 text-success">{confirmedCount} Ready to Enter</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ── EDUCATIONAL ARCHITECTURE BANNER ── */}
      <div className="p-3 border-bottom border-secondary border-opacity-25" style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-success bg-opacity-25 text-success border border-success px-2 py-1">Step 1: Trend Exhaustion</span>
            <span className="text-muted">➔</span>
            <span className="badge bg-info bg-opacity-25 text-info border border-info px-2 py-1">Step 2: 20-Low Support (≤3%)</span>
            <span className="text-muted">➔</span>
            <span className="badge bg-warning bg-opacity-25 text-warning border border-warning px-2 py-1">Step 3: Hammer/Engulfing</span>
            <span className="text-muted">➔</span>
            <span className="badge bg-primary bg-opacity-25 text-primary border border-primary px-2 py-1">Step 4: RVOL ≥1.2x</span>
            <span className="text-muted">➔</span>
            <span className="badge bg-secondary bg-opacity-25 text-light border border-secondary px-2 py-1">Step 5: RSI Hook &lt;35</span>
            <span className="text-muted">➔</span>
            <span className="badge bg-success text-white px-2 py-1 fw-bold">🎯 Candle 2 Breakout Gate</span>
          </div>
          <div className="small text-muted fst-italic">
            🛡️ Never buy Candle 1 alone. Enforce Candle 2 Close &gt; Candle 1 High.
          </div>
        </div>
      </div>

      {/* ── SETUP TABS & FILTERS ── */}
      <div className="p-3 border-bottom border-secondary border-opacity-25 d-flex flex-wrap align-items-center justify-content-between gap-3">
        {/* 3 Master Setup Tabs */}
        <div className="btn-group" role="group" aria-label="Setup Type Selection">
          <button
            type="button"
            className={`btn btn-sm ${activeSetupTab === 'ALL' ? 'btn-primary text-white fw-bold' : 'btn-outline-secondary text-light'}`}
            onClick={() => setActiveSetupTab('ALL')}
          >
            📊 All Setups ({scanResult.totalScanned})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeSetupTab === 'REVERSAL' ? 'btn-success text-white fw-bold' : 'btn-outline-secondary text-light'}`}
            onClick={() => setActiveSetupTab('REVERSAL')}
          >
            🔄 1. Down → Up Reversal ({scanResult.downToUpReversals.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeSetupTab === 'PULLBACK' ? 'btn-info text-dark fw-bold' : 'btn-outline-secondary text-light'}`}
            onClick={() => setActiveSetupTab('PULLBACK')}
          >
            📈 2. Up → Pullback → Up ({scanResult.pullbackContinuations.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeSetupTab === 'SHORT' ? 'btn-warning text-dark fw-bold' : 'btn-outline-secondary text-light'}`}
            onClick={() => setActiveSetupTab('SHORT')}
          >
            📉 3. Up → Reversal → Down ({scanResult.topReversalShorts.length})
          </button>
        </div>

        {/* Filters and Search */}
        <div className="d-flex flex-wrap align-items-center gap-2 ms-auto">
          <select
            className="form-select form-select-sm bg-dark text-light border-secondary"
            style={{ width: 190 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Confirmation States</option>
            <option value="CONFIRMED">🟢 2nd Candle Confirmed</option>
            <option value="AWAITING">🟡 Awaiting Candle 2</option>
          </select>

          <input
            type="text"
            className="form-control form-control-sm bg-dark text-light border-secondary"
            placeholder="Search stock, pattern, sector..."
            style={{ width: 220 }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ── CANDIDATE CARDS GRID ── */}
      <div className="p-3">
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-info mb-2" role="status" />
            <div className="text-muted small">Scanning 20-candle swing structures, patterns &amp; volume confirmations...</div>
          </div>
        )}

        {!loading && displayedCandidates.length === 0 && (
          <div className="text-center py-5 border border-dashed border-secondary rounded p-4">
            <span className="fs-1 d-block mb-2">🔍</span>
            <h6 className="fw-bold text-light">No Matching Reversal Setups Found</h6>
            <p className="text-muted small mb-3">Try adjusting your filters or search terms.</p>
            <button
              type="button"
              className="btn btn-outline-info btn-sm rounded-pill px-3"
              onClick={() => {
                setActiveSetupTab('ALL');
                setStatusFilter('ALL');
                setSearchQuery('');
              }}
            >
              Reset Filters
            </button>
          </div>
        )}

        {!loading && displayedCandidates.length > 0 && (
          <div className="row g-3">
            {displayedCandidates.map((candidate) => {
              const isConfirmed = candidate.confirmationStatus === 'BUY_CONFIRMED';
              const isAwaiting = candidate.confirmationStatus === 'AWAITING_CANDLE_2';

              return (
                <div key={candidate.symbol} className="col-12 col-xl-6">
                  <div
                    className={`card h-100 border ${
                      isConfirmed
                        ? 'border-success border-2'
                        : 'border-secondary border-opacity-50'
                    }`}
                    style={{
                      background: isConfirmed
                        ? 'linear-gradient(180deg, rgba(6, 78, 59, 0.25) 0%, rgba(15, 23, 42, 0.95) 100%)'
                        : 'rgba(15, 23, 42, 0.85)',
                    }}
                  >
                    <div className="card-body p-3">
                      {/* Top Row: Symbol, Price, Reversal Score */}
                      <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                        <div>
                          <div className="d-flex align-items-center gap-2">
                            <h5 className="mb-0 fw-bold text-white">{candidate.symbol}</h5>
                            <span className="badge bg-secondary bg-opacity-50 text-light small px-2 py-0" style={{ fontSize: 10 }}>
                              {candidate.sector}
                            </span>
                            <span className="badge bg-dark border border-secondary text-info small" style={{ fontSize: 10 }}>
                              {candidate.candlestickPattern} {candidate.patternEmoji}
                            </span>
                          </div>
                          <div className="text-muted small" style={{ fontSize: 11 }}>
                            {candidate.companyName}
                          </div>
                        </div>

                        <div className="text-end">
                          <div className="fs-5 fw-bold text-white">₹{candidate.currentPrice.toFixed(2)}</div>
                          <span className={`badge rounded-pill ${candidate.signalBadgeClass} px-2 py-1`} style={{ fontSize: 11 }}>
                            Score: {candidate.reversalScore}/100
                          </span>
                        </div>
                      </div>

                      {/* Setup Type & Confirmation Gate Banner */}
                      <div className="mb-3 p-2 rounded d-flex align-items-center justify-content-between gap-2" style={{ background: 'rgba(30, 41, 59, 0.7)' }}>
                        <div className="small">
                          <span className="text-muted d-block" style={{ fontSize: 10 }}>SETUP TYPE</span>
                          <strong className="text-warning" style={{ fontSize: 12 }}>{candidate.setupLabel}</strong>
                        </div>

                        <div>
                          {isConfirmed ? (
                            <span className="badge bg-success text-white py-1 px-2 fw-bold" style={{ fontSize: 12 }}>
                              🟢 BUY CONFIRMED
                            </span>
                          ) : isAwaiting ? (
                            <span className="badge bg-warning text-dark py-1 px-2 fw-bold" style={{ fontSize: 11 }}>
                              🟡 AWAITING CANDLE 2 (&gt;₹{candidate.reversalHigh.toFixed(2)})
                            </span>
                          ) : (
                            <span className="badge bg-danger text-white py-1 px-2 fw-bold" style={{ fontSize: 11 }}>
                              🔴 SETUP INVALIDATED
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Technical Checklist Pills */}
                      <div className="row g-2 mb-3">
                        <div className="col-4">
                          <div className="p-2 rounded text-center border border-secondary border-opacity-25" style={{ background: 'rgba(2, 6, 23, 0.4)' }}>
                            <span className="text-muted small d-block" style={{ fontSize: 10 }}>20-LOW SUPPORT</span>
                            <strong className="text-light" style={{ fontSize: 12 }}>
                              ₹{candidate.lowestLow20.toFixed(2)}
                            </strong>
                            <div className="text-muted" style={{ fontSize: 10 }}>
                              {candidate.distanceToSupportPct}% away
                            </div>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="p-2 rounded text-center border border-secondary border-opacity-25" style={{ background: 'rgba(2, 6, 23, 0.4)' }}>
                            <span className="text-muted small d-block" style={{ fontSize: 10 }}>VOLUME SURGE</span>
                            <strong className={candidate.volumeRatio >= 1.5 ? 'text-success' : 'text-light'} style={{ fontSize: 12 }}>
                              {candidate.volumeRatio}x RVOL
                            </strong>
                            <div className="text-muted" style={{ fontSize: 10 }}>
                              {candidate.volumeRatio >= 1.5 ? 'Surge Active' : 'Normal'}
                            </div>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="p-2 rounded text-center border border-secondary border-opacity-25" style={{ background: 'rgba(2, 6, 23, 0.4)' }}>
                            <span className="text-muted small d-block" style={{ fontSize: 10 }}>RSI HOOK</span>
                            <strong className={candidate.isRsiRecovering ? 'text-success' : 'text-light'} style={{ fontSize: 12 }}>
                              {candidate.rsiPrevious} → {candidate.rsiCurrent}
                            </strong>
                            <div className="text-muted" style={{ fontSize: 10 }}>
                              {candidate.isRsiRecovering ? 'Recovery Hook' : 'Neutral'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stop Loss & Targets Bar */}
                      <div className="p-2 rounded border border-secondary border-opacity-50 mb-3" style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
                        <div className="d-flex align-items-center justify-content-between small mb-1">
                          <span className="text-muted">🛑 ATR Stop Loss:</span>
                          <strong className="text-danger">₹{candidate.stopLossPrice.toFixed(2)} (-₹{candidate.riskPerShare.toFixed(2)}/sh)</strong>
                        </div>
                        <div className="d-flex align-items-center justify-content-between small mb-1">
                          <span className="text-muted">🎯 Target 1 (1:2 R:R):</span>
                          <strong className="text-success">₹{candidate.target1.toFixed(2)} (+₹{(candidate.riskPerShare * 2).toFixed(2)})</strong>
                        </div>
                        <div className="d-flex align-items-center justify-content-between small">
                          <span className="text-muted">🚀 Target 2 (1:3 R:R):</span>
                          <strong className="text-info">₹{candidate.target2.toFixed(2)} (+₹{(candidate.riskPerShare * 3).toFixed(2)})</strong>
                        </div>
                      </div>

                      {/* Key Reasons / Explainability */}
                      {candidate.reasons && candidate.reasons.length > 0 && (
                        <div className="small text-muted mb-3" style={{ fontSize: 11 }}>
                          <span className="text-light fw-semibold">Quant Logic: </span>
                          {candidate.reasons.slice(0, 2).join(' • ')}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pt-2 border-top border-secondary border-opacity-25">
                        <button
                          type="button"
                          className="btn btn-outline-light btn-sm rounded-pill px-3"
                          onClick={() => setSelectedStockForModal(candidate)}
                        >
                          🔬 100-Pt Breakdown
                        </button>

                        <div className="d-flex gap-2">
                          {onSendToPractice && (
                            <button
                              type="button"
                              className="btn btn-warning btn-sm rounded-pill px-3 fw-bold text-dark"
                              onClick={() => onSendToPractice(candidate)}
                            >
                              🎓 Practice Dummy
                            </button>
                          )}
                          {onQuickTrade && (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm rounded-pill px-3 fw-bold"
                              onClick={() => onQuickTrade(candidate)}
                            >
                              ⚡ Trade
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── DEEP 100-PT EXPLAINABILITY MODAL ── */}
      {selectedStockForModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ background: 'rgba(0, 0, 0, 0.8)', zIndex: 1050 }}
          onClick={() => setSelectedStockForModal(null)}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content text-light border border-secondary" style={{ background: '#0f172a' }}>
              <div className="modal-header border-bottom border-secondary">
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <h5 className="modal-title fw-bold text-white mb-0">{selectedStockForModal.symbol}</h5>
                    <span className="badge bg-secondary">{selectedStockForModal.sector}</span>
                    <span className={`badge ${selectedStockForModal.signalBadgeClass}`}>
                      {selectedStockForModal.signalTier.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-muted small mt-1">{selectedStockForModal.companyName}</div>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedStockForModal(null)}
                />
              </div>

              <div className="modal-body p-4">
                {/* 100-Pt Score Header */}
                <div className="p-3 rounded mb-4 d-flex align-items-center justify-content-between" style={{ background: 'rgba(30, 41, 59, 0.8)' }}>
                  <div>
                    <div className="text-muted small">TOTAL REVERSAL SCORE</div>
                    <div className="display-6 fw-bold text-success">{selectedStockForModal.reversalScore} / 100</div>
                  </div>
                  <div className="text-end">
                    <div className="text-muted small">CURRENT PRICE</div>
                    <div className="fs-4 fw-bold text-white">₹{selectedStockForModal.currentPrice.toFixed(2)}</div>
                  </div>
                </div>

                {/* Score Breakdown Radar Bars */}
                <h6 className="fw-bold text-white mb-3">📊 100-Point Formula Component Breakdown</h6>
                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-6">
                    <div className="p-2 rounded bg-dark border border-secondary border-opacity-50">
                      <div className="d-flex justify-content-between small mb-1">
                        <span>1. Candlestick Pattern ({selectedStockForModal.candlestickPattern} {selectedStockForModal.patternEmoji})</span>
                        <strong className="text-success">{selectedStockForModal.breakdown.candlestickScore} / 20 pts</strong>
                      </div>
                      <div className="progress" style={{ height: 6 }}>
                        <div className="progress-bar bg-success" style={{ width: `${(selectedStockForModal.breakdown.candlestickScore / 20) * 100}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="p-2 rounded bg-dark border border-secondary border-opacity-50">
                      <div className="d-flex justify-content-between small mb-1">
                        <span>2. Support Floor Proximity (≤3%)</span>
                        <strong className="text-info">{selectedStockForModal.breakdown.supportProximityScore} / 20 pts</strong>
                      </div>
                      <div className="progress" style={{ height: 6 }}>
                        <div className="progress-bar bg-info" style={{ width: `${(selectedStockForModal.breakdown.supportProximityScore / 20) * 100}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="p-2 rounded bg-dark border border-secondary border-opacity-50">
                      <div className="d-flex justify-content-between small mb-1">
                        <span>3. Downtrend Exhaustion (EMA20&lt;EMA50)</span>
                        <strong className="text-warning">{selectedStockForModal.breakdown.downtrendExhaustionScore} / 15 pts</strong>
                      </div>
                      <div className="progress" style={{ height: 6 }}>
                        <div className="progress-bar bg-warning" style={{ width: `${(selectedStockForModal.breakdown.downtrendExhaustionScore / 15) * 100}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="p-2 rounded bg-dark border border-secondary border-opacity-50">
                      <div className="d-flex justify-content-between small mb-1">
                        <span>4. Volume Surge Ratio (RVOL)</span>
                        <strong className="text-primary">{selectedStockForModal.breakdown.volumeScore} / 15 pts</strong>
                      </div>
                      <div className="progress" style={{ height: 6 }}>
                        <div className="progress-bar bg-primary" style={{ width: `${(selectedStockForModal.breakdown.volumeScore / 15) * 100}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="p-2 rounded bg-dark border border-secondary border-opacity-50">
                      <div className="d-flex justify-content-between small mb-1">
                        <span>5. RSI Recovery Hook (&lt;35 Hook)</span>
                        <strong className="text-success">{selectedStockForModal.breakdown.rsiRecoveryScore} / 10 pts</strong>
                      </div>
                      <div className="progress" style={{ height: 6 }}>
                        <div className="progress-bar bg-success" style={{ width: `${(selectedStockForModal.breakdown.rsiRecoveryScore / 10) * 100}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="p-2 rounded bg-dark border border-secondary border-opacity-50">
                      <div className="d-flex justify-content-between small mb-1">
                        <span>6. EMA Reclaim &amp; MACD Inflection</span>
                        <strong className="text-info">{selectedStockForModal.breakdown.emaConfirmationScore + selectedStockForModal.breakdown.macdConfirmationScore} / 20 pts</strong>
                      </div>
                      <div className="progress" style={{ height: 6 }}>
                        <div className="progress-bar bg-info" style={{ width: `${((selectedStockForModal.breakdown.emaConfirmationScore + selectedStockForModal.breakdown.macdConfirmationScore) / 20) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2nd Candle Confirmation Gate Verification */}
                <div className="p-3 rounded mb-4 border border-secondary border-opacity-50" style={{ background: 'rgba(15, 23, 42, 0.9)' }}>
                  <h6 className="fw-bold text-white mb-2">🎯 Candle 2 Confirmation Gate Verification</h6>
                  <p className="small text-muted mb-2">
                    Candle 1 Reversal High is <strong>₹{selectedStockForModal.reversalHigh.toFixed(2)}</strong>.
                    Candle 1 Reversal Low is <strong>₹{selectedStockForModal.reversalLow.toFixed(2)}</strong>.
                  </p>
                  {selectedStockForModal.isBuyConfirmed ? (
                    <div className="alert alert-success py-2 px-3 mb-0 small">
                      ✅ <strong>Gate Passed:</strong> Candle 2 closed above ₹{selectedStockForModal.reversalHigh.toFixed(2)} with volume support ({selectedStockForModal.volumeRatio}x). Institutional entry confirmed!
                    </div>
                  ) : (
                    <div className="alert alert-warning py-2 px-3 mb-0 small">
                      ⏳ <strong>Gate Pending:</strong> Waiting for Candle 2 close above ₹{selectedStockForModal.reversalHigh.toFixed(2)}. Do NOT enter early to prevent false bottom traps!
                    </div>
                  )}
                </div>

                {/* ATR Risk Levels */}
                <div className="row g-2 mb-3">
                  <div className="col-6 col-md-3 text-center p-2 rounded bg-dark border border-secondary border-opacity-50">
                    <span className="text-muted small d-block" style={{ fontSize: 10 }}>ATR STOP LOSS</span>
                    <strong className="text-danger">₹{selectedStockForModal.stopLossPrice.toFixed(2)}</strong>
                  </div>
                  <div className="col-6 col-md-3 text-center p-2 rounded bg-dark border border-secondary border-opacity-50">
                    <span className="text-muted small d-block" style={{ fontSize: 10 }}>RISK PER SHARE</span>
                    <strong className="text-warning">₹{selectedStockForModal.riskPerShare.toFixed(2)}</strong>
                  </div>
                  <div className="col-6 col-md-3 text-center p-2 rounded bg-dark border border-secondary border-opacity-50">
                    <span className="text-muted small d-block" style={{ fontSize: 10 }}>TARGET 1 (1:2 R:R)</span>
                    <strong className="text-success">₹{selectedStockForModal.target1.toFixed(2)}</strong>
                  </div>
                  <div className="col-6 col-md-3 text-center p-2 rounded bg-dark border border-secondary border-opacity-50">
                    <span className="text-muted small d-block" style={{ fontSize: 10 }}>TARGET 2 (1:3 R:R)</span>
                    <strong className="text-info">₹{selectedStockForModal.target2.toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-top border-secondary d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-secondary rounded-pill px-4"
                  onClick={() => setSelectedStockForModal(null)}
                >
                  Close
                </button>

                <div className="d-flex gap-2">
                  {onSendToPractice && (
                    <button
                      type="button"
                      className="btn btn-warning rounded-pill px-4 fw-bold text-dark"
                      onClick={() => {
                        onSendToPractice(selectedStockForModal);
                        setSelectedStockForModal(null);
                      }}
                    >
                      🎓 Practice in Dummy Funds
                    </button>
                  )}
                  {onQuickTrade && (
                    <button
                      type="button"
                      className="btn btn-primary rounded-pill px-4 fw-bold"
                      onClick={() => {
                        onQuickTrade(selectedStockForModal);
                        setSelectedStockForModal(null);
                      }}
                    >
                      ⚡ Quick Trade
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
