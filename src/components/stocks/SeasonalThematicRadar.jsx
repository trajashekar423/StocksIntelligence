'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getSeasonalAnalysis, INDIAN_SEASONAL_CYCLES } from '../../services/calendar/seasonalThemeEngine';
import StockDetailModal from './StockDetailModal';

export default function SeasonalThematicRadar({ onQuickTrade = null, onSendToPractice = null }) {
  const [selectedCycleId, setSelectedCycleId] = useState('onam_ganesh_chaturthi');
  const [livePrices, setLivePrices] = useState({});
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [selectedStockDetail, setSelectedStockDetail] = useState(null);

  // 1. Analyze today's seasonal context (normalized in IST)
  const seasonalAnalysis = useMemo(() => {
    return getSeasonalAnalysis(new Date());
  }, []);

  const { currentMonthName, activeCycles, upcomingCycles, allCycles } = seasonalAnalysis;

  // Active or selected cycle
  const currentCycle = useMemo(() => {
    return allCycles.find((c) => c.id === selectedCycleId) || allCycles[0];
  }, [allCycles, selectedCycleId]);

  // Set default cycle to active season on mount
  useEffect(() => {
    if (activeCycles.length > 0) {
      setSelectedCycleId(activeCycles[0].id);
    }
  }, [activeCycles]);

  // 2. Fetch live quotes for stocks in the selected seasonal basket
  const fetchBasketQuotes = useCallback(async () => {
    if (!currentCycle || !currentCycle.stocks) return;
    setLoadingQuotes(true);

    try {
      const results = await Promise.allSettled(
        currentCycle.stocks.map(async (stk) => {
          const res = await fetch(`/api/quote-equity?symbol=${stk.symbol}`);
          if (!res.ok) return { symbol: stk.symbol, price: null };
          const data = await res.json();
          return {
            symbol: stk.symbol,
            price: Number(data?.priceInfo?.lastPrice || 0),
            pChange: Number(data?.priceInfo?.pChange || 0),
            vwap: Number(data?.priceInfo?.vwap || 0),
            high: Number(data?.priceInfo?.intraDayHighLow?.max || 0),
            low: Number(data?.priceInfo?.intraDayHighLow?.min || 0),
          };
        })
      );

      const priceMap = {};
      results.forEach((r) => {
        if (r.status === 'fulfilled' && r.value.symbol && r.value.price) {
          priceMap[r.value.symbol] = r.value;
        }
      });
      setLivePrices((prev) => ({ ...prev, ...priceMap }));
    } catch {
      // ignore
    } finally {
      setLoadingQuotes(false);
    }
  }, [currentCycle]);

  useEffect(() => {
    fetchBasketQuotes();
  }, [fetchBasketQuotes]);

  // Helper for role styling
  const getRoleBadge = (role) => {
    switch (role) {
      case 'MONOPOLY':
        return 'bg-purple-subtle text-purple border border-purple-subtle';
      case 'LEADER':
        return 'bg-success-subtle text-success border border-success-subtle';
      default:
        return 'bg-info-subtle text-info border border-info-subtle';
    }
  };

  return (
    <div className="seasonal-radar-container pb-5">
      {/* ── 1. HEADER & CALENDAR BANNER ── */}
      <div
        className="d-flex flex-wrap justify-content-between align-items-center gap-3 p-4 mb-4 rounded-4 shadow-sm"
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          color: '#fff',
        }}
      >
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="fs-3">🗓️</span>
            <h4 className="fw-bold mb-0 text-white">Indian Seasonal & Festival Market Radar</h4>
            <span className="badge bg-warning text-dark fw-bold px-2.5 py-1">JAN – DEC CYCLE</span>
          </div>
          <p className="mb-0 small" style={{ color: '#c7d2fe' }}>
            Front-run Dalal Street’s cultural and festive cycles. Smart money accumulates 2–4 weeks BEFORE the festival and books profit before the event.
          </p>
        </div>

        <div className="d-flex align-items-center gap-3">
          <div className="text-end small">
            <span className="d-block" style={{ color: '#c7d2fe' }}>Current Month:</span>
            <strong className="text-warning fs-6">{currentMonthName} 2026</strong>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-light rounded-pill px-3 fw-semibold shadow-sm"
            onClick={fetchBasketQuotes}
            disabled={loadingQuotes}
          >
            {loadingQuotes ? 'Updating...' : '🔄 Refresh Prices'}
          </button>
        </div>
      </div>

      {/* ── 2. ACTIVE SEASON SPOTLIGHT BANNER ── */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white border-start border-warning border-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="fs-3">{currentCycle.festiveIcon}</span>
              <h5 className="fw-bold mb-0 text-dark">{currentCycle.name}</h5>
              {currentCycle.hindiName && (
                <span className="badge bg-light text-secondary border fw-medium">
                  {currentCycle.hindiName}
                </span>
              )}
              {activeCycles.some((c) => c.id === currentCycle.id) && (
                <span className="badge bg-success text-white fw-bold px-2.5 py-1">
                  🟢 ACTIVE RIGHT NOW ({currentMonthName})
                </span>
              )}
              {upcomingCycles.some((c) => c.id === currentCycle.id) && (
                <span className="badge bg-warning text-dark fw-bold px-2.5 py-1">
                  ⏳ UPCOMING NEXT MONTH
                </span>
              )}
            </div>
            <p className="text-muted small mb-0">{currentCycle.description}</p>
          </div>

          <div className="d-flex flex-wrap gap-1.5">
            {currentCycle.sectors.map((sec, i) => (
              <span key={i} className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1">
                {sec}
              </span>
            ))}
          </div>
        </div>

        <div className="row g-2 p-3 rounded-3 bg-light border text-dark small">
          <div className="col-12 col-md-4">
            <strong className="text-success d-block">📥 When to Accumulate (Smart Money Entry):</strong>
            <span>{currentCycle.whenToAccumulate}</span>
          </div>
          <div className="col-12 col-md-4">
            <strong className="text-danger d-block">📤 When to Exit (Harvest Profits):</strong>
            <span>{currentCycle.whenToExit}</span>
          </div>
          <div className="col-12 col-md-4">
            <strong className="text-primary d-block">⚡ Primary Driver / Catalyst:</strong>
            <span>{currentCycle.catalyst}</span>
          </div>
        </div>
      </div>

      {/* ── 3. FESTIVAL & SEASON CYCLE SELECTOR PILLS ── */}
      <div className="mb-4">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <span className="small text-muted fw-bold text-uppercase" style={{ fontSize: 11 }}>
            Select Indian Seasonal Playbook (Jan – Dec):
          </span>
          <span className="badge bg-light text-muted border">10 Major Cultural Waves</span>
        </div>

        <div className="d-flex flex-wrap gap-2">
          {allCycles.map((cycle) => {
            const isActive = selectedCycleId === cycle.id;
            const isLiveThisMonth = activeCycles.some((c) => c.id === cycle.id);

            return (
              <button
                key={cycle.id}
                type="button"
                className={`btn btn-sm rounded-pill px-3 py-1.5 fw-semibold transition-all ${
                  isActive
                    ? 'btn-primary text-white shadow-sm'
                    : isLiveThisMonth
                    ? 'btn-outline-success border-2'
                    : 'btn-light text-dark border'
                }`}
                onClick={() => setSelectedCycleId(cycle.id)}
              >
                <span className="me-1.5">{cycle.festiveIcon}</span>
                {cycle.name.split('(')[0]}
                {isLiveThisMonth && <span className="ms-1.5 badge bg-success text-white">Live</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. THEMATIC STOCK BASKET TABLE ── */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white mb-4">
        <div className="d-flex align-items-center justify-content-between p-3 border-bottom bg-light">
          <div>
            <h6 className="fw-bold mb-0 text-dark">
              🎯 {currentCycle.name} — Curated Stock Basket ({currentCycle.stocks.length} Stocks)
            </h6>
            <small className="text-muted">
              Live quotes updating from NSE India • Direct 1-click Practice & Quick Trade
            </small>
          </div>
          <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-1.5 rounded-pill fw-bold">
            Typical Seasonal Wave: +6% to +20%
          </span>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light small text-muted text-uppercase" style={{ fontSize: 11 }}>
              <tr>
                <th className="ps-4">Stock & Company</th>
                <th>Role & Sector</th>
                <th>Festive Catalyst / Why It Moves</th>
                <th>Typical Runup</th>
                <th>Live Price</th>
                <th>Day Change</th>
                <th>VWAP Position</th>
                <th className="text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentCycle.stocks.map((stock) => {
                const quote = livePrices[stock.symbol] || null;
                const price = quote?.price || null;
                const pChange = quote?.pChange ?? 0;
                const vwap = quote?.vwap || null;
                const isAboveVwap = price && vwap && price >= vwap;

                return (
                  <tr key={stock.symbol}>
                    <td className="ps-4">
                      <strong className="d-block text-dark fs-6">{stock.symbol}</strong>
                      <span className="small text-muted" style={{ fontSize: 11 }}>
                        {stock.companyName}
                      </span>
                    </td>

                    <td>
                      <span className={`badge ${getRoleBadge(stock.role)} d-block mb-1`} style={{ width: 'fit-content', fontSize: 10 }}>
                        {stock.role}
                      </span>
                      <span className="small text-muted fw-semibold">{stock.sector}</span>
                    </td>

                    <td style={{ maxWidth: 320 }}>
                      <span className="small text-secondary">{stock.catalyst}</span>
                    </td>

                    <td>
                      <span className="badge bg-success-subtle text-success fw-bold px-2 py-1">
                        {stock.typicalRunupPct}
                      </span>
                    </td>

                    <td>
                      {price ? (
                        <strong className="text-dark">₹{price.toFixed(2)}</strong>
                      ) : (
                        <span className="text-muted small">Loading...</span>
                      )}
                    </td>

                    <td>
                      {price ? (
                        <span className={`badge ${pChange >= 0 ? 'bg-success' : 'bg-danger'} fw-bold`}>
                          {pChange >= 0 ? '+' : ''}{pChange.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-muted small">—</span>
                      )}
                    </td>

                    <td>
                      {price && vwap ? (
                        isAboveVwap ? (
                          <span className="badge bg-success-subtle text-success small">
                            ✓ Above VWAP (₹{vwap.toFixed(2)})
                          </span>
                        ) : (
                          <span className="badge bg-warning-subtle text-warning-emphasis small">
                            ⚠️ Below VWAP (₹{vwap.toFixed(2)})
                          </span>
                        )
                      ) : (
                        <span className="text-muted small">—</span>
                      )}
                    </td>

                    <td className="text-end pe-4">
                      <div className="d-flex align-items-center justify-content-end gap-1.5">
                        {onSendToPractice && (
                          <button
                            type="button"
                            className="btn btn-xs btn-outline-warning fw-bold rounded-pill px-2.5 py-1 text-dark"
                            onClick={() => onSendToPractice(stock)}
                            title="Practice this seasonal stock in Dummy Funds"
                          >
                            🎓 Practice
                          </button>
                        )}
                        {onQuickTrade && (
                          <button
                            type="button"
                            className="btn btn-xs btn-outline-primary fw-bold rounded-pill px-2.5 py-1"
                            onClick={() => onQuickTrade(stock)}
                          >
                            ⚡ Trade
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-secondary rounded-pill px-2 py-1"
                          onClick={() => setSelectedStockDetail(stock)}
                        >
                          📊
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5. THE 4 STAGES OF A SEASONAL FESTIVE TRADE (Educational Guide) ── */}
      <div className="card border-0 shadow-sm rounded-4 p-4" style={{ background: '#0f172a', color: '#fff' }}>
        <h6 className="fw-bold text-warning mb-3">
          🎓 The 4 Stages of an Indian Seasonal Trade (How Smart Money Plays It):
        </h6>
        <div className="row g-3">
          <div className="col-12 col-md-3">
            <div className="p-3 rounded-3 h-100" style={{ background: '#1e293b' }}>
              <span className="badge bg-primary mb-2">STAGE 1</span>
              <strong className="text-white d-block mb-1">Quiet Accumulation</strong>
              <small className="d-block" style={{ color: '#ffffff' }}>
                3 to 4 weeks before the festival. Volumes are quiet. FIIs & Mutual Funds quietly build positions while retail traders are not paying attention.
              </small>
            </div>
          </div>
          <div className="col-12 col-md-3">
            <div className="p-3 rounded-3 h-100" style={{ background: '#1e293b' }}>
              <span className="badge bg-info mb-2">STAGE 2</span>
              <strong className="text-white d-block mb-1">Media Hype & Markup</strong>
              <small className="d-block" style={{ color: '#ffffff' }}>
                1 to 2 weeks before. News channels talk about "Festive Demand", retail volume surges, and prices make sharp momentum breakouts.
              </small>
            </div>
          </div>
          <div className="col-12 col-md-3">
            <div className="p-3 rounded-3 h-100" style={{ background: '#1e293b' }}>
              <span className="badge bg-success mb-2">STAGE 3</span>
              <strong className="text-white d-block mb-1">The Harvest (Profit Booking)</strong>
              <small className="d-block" style={{ color: '#ffffff' }}>
                1 to 2 days before peak festival. Smart money dumps shares into retail euphoria and locks in +10% to +20% festive gains!
              </small>
            </div>
          </div>
          <div className="col-12 col-md-3">
            <div className="p-3 rounded-3 h-100" style={{ background: '#1e293b' }}>
              <span className="badge bg-danger mb-2">STAGE 4</span>
              <strong className="text-white d-block mb-1">The Hangover (Trap)</strong>
              <small className="d-block" style={{ color: '#ffffff' }}>
                Festival day itself. Retail traders rush to buy on Dhanteras or Dussehra morning. Stock dumps or stays flat. Never buy here!
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Detail Modal */}
      {selectedStockDetail && (
        <StockDetailModal
          stock={selectedStockDetail}
          onClose={() => setSelectedStockDetail(null)}
          onQuickTrade={onQuickTrade}
        />
      )}
    </div>
  );
}

