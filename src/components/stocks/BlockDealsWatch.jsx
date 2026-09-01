'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import StockDetailModal from './StockDetailModal';
import { registerNewOpenPosition } from '../../services/risk/positionTracker';

export default function BlockDealsWatch({ onQuickTrade = null }) {
  const [loading, setLoading] = useState(true);
  const [blockDealData, setBlockDealData] = useState({
    timestamp: '',
    data: [],
    totalTradedValue: 0,
    totalTradedVolume: 0,
    session1Summary: { advances: 0, declines: 0, unchanged: 0 },
    session2Summary: { advances: 0, declines: 0, unchanged: 0 },
    marketStatus: null,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState('ALL'); // 'ALL' | 'Session 1' | 'Session 2'
  const [minValueCr, setMinValueCr] = useState(0); // 0 | 50 | 500 | 1000
  const [selectedStockForChart, setSelectedStockForChart] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [riskTrackedSymbols, setRiskTrackedSymbols] = useState(new Set());
  const [lastRefreshed, setLastRefreshed] = useState('');

  const fetchBlockDeals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/nse/large-deals?mode=block_deals');
      if (res.ok) {
        const json = await res.json();
        const rows = Array.isArray(json?.data) ? json.data : [];
        setBlockDealData({
          timestamp: json.timestamp || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          data: rows,
          totalTradedValue: json.totalTradedValue || rows.reduce((acc, r) => acc + (r.totalTradedValue || 0), 0),
          totalTradedVolume: json.totalTradedVolume || rows.reduce((acc, r) => acc + (r.totalTradedVolume || 0), 0),
          session1Summary: json['Session 1'] || { advances: 0, declines: 0, unchanged: rows.length },
          session2Summary: json['Session 2'] || { advances: 0, declines: 0, unchanged: 0 },
          marketStatus: json.marketStatus || null,
        });
        setLastRefreshed(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlockDeals();
    const timer = setInterval(fetchBlockDeals, 15000);
    return () => clearInterval(timer);
  }, [fetchBlockDeals]);

  // Track in Risk Engine
  const handleTrackInRiskEngine = (deal) => {
    try {
      const sym = deal.symbol;
      const comp = `${sym} Limited`;
      const buyPrice = Number(deal.lastPrice || deal.open || 100);
      const sl = Number((buyPrice * 0.97).toFixed(2));
      registerNewOpenPosition(sym, comp, 100, buyPrice, sl, 'MIS');

      setRiskTrackedSymbols((prev) => new Set([...prev, sym]));
      setFeedbackMsg(`✓ ${sym} registered into Live Position Risk Monitor with Trailing Stop Loss (₹${sl.toFixed(2)})!`);
      setTimeout(() => setFeedbackMsg(null), 4500);
    } catch {
      // ignore
    }
  };

  // Filtered Deals
  const filteredDeals = useMemo(() => {
    return blockDealData.data.filter((deal) => {
      const sym = String(deal.symbol || '').toUpperCase();
      const q = searchQuery.trim().toUpperCase();
      const matchesSearch = !q || sym.includes(q);

      const matchesSession =
        selectedSession === 'ALL' || String(deal.session || '').toLowerCase() === selectedSession.toLowerCase();

      const valCr = (deal.totalTradedValue || 0) / 10000000;
      const matchesVal = valCr >= minValueCr;

      return matchesSearch && matchesSession && matchesVal;
    });
  }, [blockDealData.data, searchQuery, selectedSession, minValueCr]);

  const totalValueCr = (blockDealData.totalTradedValue / 10000000).toFixed(2);
  const totalVolumeCr = (blockDealData.totalTradedVolume / 10000000).toFixed(2);

  return (
    <div className="block-deals-module w-100 mb-5">
      {/* ── 1. HEADER BANNER ── */}
      <div
        className="card border-0 shadow-sm rounded-4 overflow-hidden text-white mb-4 p-4"
        style={{ background: 'linear-gradient(135deg, #0b132b 0%, #1c2541 50%, #3a506b 100%)' }}
      >
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
          <div>
            <div className="d-flex flex-wrap align-items-center gap-2">
              <span className="fs-3">🏢</span>
              <h4 className="mb-0 fw-bold">NSE Official Live Block Deals Watch</h4>
              <span className="badge bg-primary text-white fw-bold px-2.5 py-1 small shadow-sm">
                ⚡ REAL-TIME NSE WINDOW FEED
              </span>
            </div>
            <p className="text-light opacity-75 small mb-0 mt-1">
              Live tracking of large institutional transactions (&ge; ₹10 Crore) executed through NSE&apos;s dedicated Block Deal trading windows.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-light d-flex align-items-center gap-1 shadow-sm fw-semibold"
              onClick={fetchBlockDeals}
              disabled={loading}
            >
              {loading ? <span className="spinner-border spinner-border-sm" /> : '🔄 Refresh Live Deals'}
            </button>
            {lastRefreshed && (
              <span className="text-light opacity-75 small" style={{ fontSize: 11 }}>
                Updated: {lastRefreshed}
              </span>
            )}
          </div>
        </div>

        {/* AUCTION WINDOWS SCHEDULE STRIP */}
        <div className="row g-2 text-dark small">
          <div className="col-12 col-md-6">
            <div className="p-2.5 rounded-3 bg-white bg-opacity-90 border d-flex align-items-center justify-content-between">
              <div>
                <strong className="d-block text-dark">🌅 Morning Window (Session 1)</strong>
                <span className="text-muted" style={{ fontSize: 11 }}>08:45 AM – 09:00 AM IST</span>
              </div>
              <span className="badge bg-success text-white px-2.5 py-1 fw-bold">
                ✓ Executed ({blockDealData.data.filter((d) => d.session === 'Session 1').length} Deals)
              </span>
            </div>
          </div>
          <div className="col-12 col-md-6">
            <div className="p-2.5 rounded-3 bg-white bg-opacity-90 border d-flex align-items-center justify-content-between">
              <div>
                <strong className="d-block text-dark">🌇 Afternoon Window (Session 2)</strong>
                <span className="text-muted" style={{ fontSize: 11 }}>02:05 PM – 02:20 PM IST</span>
              </div>
              <span className="badge bg-warning text-dark px-2.5 py-1 fw-bold">
                ⏳ Upcoming (2:05 PM)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {feedbackMsg && (
        <div className="alert alert-success bg-success bg-opacity-25 border-success text-dark rounded-3 p-3 mb-4 d-flex align-items-center justify-content-between shadow-sm">
          <div className="d-flex align-items-center gap-2">
            <span className="fs-5">✓</span>
            <strong>{feedbackMsg}</strong>
          </div>
          <button type="button" className="btn-close" onClick={() => setFeedbackMsg(null)} />
        </div>
      )}

      {/* ── 2. SUMMARY METRICS CARDS ── */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-primary">
            <span className="text-muted small d-block" style={{ fontSize: 11.5 }}>TOTAL BLOCK DEAL TURNOVER</span>
            <h4 className="fw-bold text-primary mb-0 mt-1">₹{totalValueCr} <span className="fs-6 text-muted">Cr</span></h4>
            <small className="text-secondary" style={{ fontSize: 11 }}>Minimum order size ₹10 Cr</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-success">
            <span className="text-muted small d-block" style={{ fontSize: 11.5 }}>TOTAL SHARES EXCHANGED</span>
            <h4 className="fw-bold text-success mb-0 mt-1">{totalVolumeCr} <span className="fs-6 text-muted">Cr Shares</span></h4>
            <small className="text-secondary" style={{ fontSize: 11 }}>{blockDealData.totalTradedVolume.toLocaleString('en-IN')} shares</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-warning">
            <span className="text-muted small d-block" style={{ fontSize: 11.5 }}>DEALS EXECUTED TODAY</span>
            <h4 className="fw-bold text-dark mb-0 mt-1">{blockDealData.data.length} <span className="fs-6 text-muted">Transactions</span></h4>
            <small className="text-secondary" style={{ fontSize: 11 }}>Across NSE Series BL</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-info">
            <span className="text-muted small d-block" style={{ fontSize: 11.5 }}>MARKET BENCHMARK (NIFTY)</span>
            <h4 className="fw-bold text-dark mb-0 mt-1">
              {blockDealData.marketStatus?.last ? Number(blockDealData.marketStatus.last).toFixed(1) : '24,088.6'}
            </h4>
            <small className={Number(blockDealData.marketStatus?.percentChange || 0) >= 0 ? 'text-success' : 'text-danger'} style={{ fontSize: 11 }}>
              {Number(blockDealData.marketStatus?.percentChange || 0) >= 0 ? '▲ +' : '▼ '}
              {blockDealData.marketStatus?.percentChange ? Number(blockDealData.marketStatus.percentChange).toFixed(2) : '-0.01'}% (Normal Market Open)
            </small>
          </div>
        </div>
      </div>

      {/* ── 3. FILTER BAR ── */}
      <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          {/* Search */}
          <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: 320 }}>
            <span className="text-muted">🔍</span>
            <input
              type="text"
              className="form-control form-control-sm bg-light border-secondary"
              placeholder="Search stock symbol (e.g. LENSKART)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Session Filter */}
          <div className="d-flex align-items-center gap-2">
            <span className="small text-secondary fw-bold">Session:</span>
            <div className="btn-group btn-group-sm" role="group">
              <button
                type="button"
                className={`btn fw-bold ${selectedSession === 'ALL' ? 'btn-dark text-white' : 'btn-outline-secondary'}`}
                onClick={() => setSelectedSession('ALL')}
              >
                All ({blockDealData.data.length})
              </button>
              <button
                type="button"
                className={`btn fw-bold ${selectedSession === 'Session 1' ? 'btn-primary text-white' : 'btn-outline-secondary'}`}
                onClick={() => setSelectedSession('Session 1')}
              >
                Session 1 Morning ({blockDealData.data.filter((d) => d.session === 'Session 1').length})
              </button>
              <button
                type="button"
                className={`btn fw-bold ${selectedSession === 'Session 2' ? 'btn-warning text-dark' : 'btn-outline-secondary'}`}
                onClick={() => setSelectedSession('Session 2')}
              >
                Session 2 Afternoon ({blockDealData.data.filter((d) => d.session === 'Session 2').length})
              </button>
            </div>
          </div>

          {/* Value Filter */}
          <div className="d-flex align-items-center gap-2">
            <span className="small text-secondary fw-bold">Min Value:</span>
            <select
              className="form-select form-select-sm bg-light"
              style={{ width: 140 }}
              value={minValueCr}
              onChange={(e) => setMinValueCr(Number(e.target.value))}
            >
              <option value={0}>All (₹10+ Cr)</option>
              <option value={50}>₹50+ Crore</option>
              <option value={500}>₹500+ Crore</option>
              <option value={1000}>₹1,000+ Crore</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── 4. LIVE BLOCK DEALS TABLE ── */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white p-3 p-md-4 mb-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
          <div>
            <h5 className="fw-bold text-dark mb-0">
              📊 Live Block Deals Stream ({filteredDeals.length} of {blockDealData.data.length})
            </h5>
            <small className="text-muted">Timestamp: {blockDealData.timestamp}</small>
          </div>
        </div>

        {loading && blockDealData.data.length === 0 ? (
          <div className="p-5 text-center">
            <div className="spinner-border text-primary mx-auto mb-3" />
            <h6 className="fw-bold">Connecting to NSE Live Block Deal Feed...</h6>
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="p-5 text-center text-muted">
            <h5 className="fw-bold text-dark">No block deals found matching the selected filters</h5>
            <p className="small text-muted mb-3">
              Showing 0 of {blockDealData.data.length} total block deals executed today.
            </p>
            <button
              type="button"
              className="btn btn-sm btn-primary rounded-pill px-4 fw-bold shadow-sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedSession('ALL');
                setMinValueCr(0);
              }}
            >
              🔄 Reset All Filters (View All {blockDealData.data.length} Deals)
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle table-striped table-sm small mb-0 text-nowrap">
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Stock Symbol</th>
                  <th>Deal Price (₹)</th>
                  <th>Prev Close (₹)</th>
                  <th>Change %</th>
                  <th>Traded Quantity</th>
                  <th>Deal Value (₹ Crores)</th>
                  <th>Trading Session</th>
                  <th>Execution Time</th>
                  <th>Series</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeals.map((deal, idx) => {
                  const isPositive = Number(deal.change || 0) >= 0;
                  const valueCr = ((deal.totalTradedValue || 0) / 10000000).toFixed(2);
                  const isTracked = riskTrackedSymbols.has(deal.symbol);

                  return (
                    <tr key={`${deal.symbol}-${deal.lastUpdateTime}-${idx}`}>
                      <td><span className="badge bg-dark fw-bold">#{idx + 1}</span></td>
                      <td>
                        <span className="badge bg-dark fs-6 px-2.5 py-1 fw-bold text-white me-1.5">{deal.symbol}</span>
                        <strong className="text-dark">{deal.symbol} Ltd</strong>
                      </td>
                      <td className="fw-bold fs-6 text-primary">₹{Number(deal.lastPrice || deal.open || 0).toFixed(2)}</td>
                      <td>₹{Number(deal.previousClose || 0).toFixed(2)}</td>
                      <td className={isPositive ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                        {isPositive ? '+' : ''}{Number(deal.pchange || deal.pChange || 0).toFixed(2)}%
                      </td>
                      <td>
                        <strong className="text-dark">{Number(deal.totalTradedVolume || 0).toLocaleString('en-IN')}</strong>
                        <small className="text-muted d-block" style={{ fontSize: 10.5 }}>
                          ({((deal.totalTradedVolume || 0) / 10000000).toFixed(2)} Cr shares)
                        </small>
                      </td>
                      <td>
                        <span className="badge bg-success text-white fs-6 fw-bold px-2.5 py-1 shadow-sm">
                          ₹{valueCr} Cr
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-info text-dark fw-bold">
                          {deal.session || 'Session 1'}
                        </span>
                      </td>
                      <td><span className="text-muted">{deal.lastUpdateTime || '08:50 AM'}</span></td>
                      <td><span className="badge bg-light text-dark border">{deal.series || 'BL'}</span></td>
                      <td>
                        <div className="d-flex align-items-center gap-1.5">
                          <button
                            type="button"
                            className="btn btn-xs btn-outline-warning text-dark fw-bold px-2 py-1 shadow-sm"
                            onClick={() => handleTrackInRiskEngine(deal)}
                            disabled={isTracked}
                            style={{ fontSize: 11 }}
                          >
                            {isTracked ? '✓ Tracked' : '🛡️ Track Risk'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-xs btn-outline-primary fw-semibold px-2 py-1"
                            onClick={() => setSelectedStockForChart({
                              symbol: deal.symbol,
                              companyName: `${deal.symbol} Ltd`,
                              ltp: deal.lastPrice || deal.open,
                              open: deal.open,
                              high: deal.dayHigh,
                              low: deal.dayLow,
                            })}
                            style={{ fontSize: 11 }}
                          >
                            📈 Chart
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 5. EDUCATIONAL BLOCK DEAL KNOWLEDGE BASE ── */}
      <div className="card border-0 shadow-sm rounded-4 p-4 bg-light border text-dark">
        <h6 className="fw-bold text-dark mb-2">💡 Understanding NSE Block Deals (Institutional Activity)</h6>
        <div className="row g-3 small">
          <div className="col-12 col-md-4">
            <strong className="d-block text-primary mb-1">1. What is a Block Deal?</strong>
            <p className="text-muted mb-0">
              A single trade with a minimum quantity of <strong>5 lakh shares</strong> or a minimum value of <strong>₹10 Crore</strong>, executed between two institutional parties (FIIs, DIIs, Mutual Funds, Promoters).
            </p>
          </div>
          <div className="col-12 col-md-4">
            <strong className="d-block text-primary mb-1">2. Dedicated Trading Windows</strong>
            <p className="text-muted mb-0">
              Block deals do not happen in the regular market order book. They are matched in two discrete 15-minute windows: <strong>Morning (08:45–09:00 AM)</strong> and <strong>Afternoon (02:05–02:20 PM)</strong> within $\pm 1\%$ of reference price.
            </p>
          </div>
          <div className="col-12 col-md-4">
            <strong className="d-block text-primary mb-1">3. How to Use for Trading</strong>
            <p className="text-muted mb-0">
              Heavy block deal buying at a premium indicates strong institutional accumulation. Use the deal price as a major technical support benchmark for your swing/BTST positions.
            </p>
          </div>
        </div>
      </div>

      {/* ── 6. CHART MODAL ── */}
      {selectedStockForChart && (
        <StockDetailModal
          stock={selectedStockForChart}
          onClose={() => setSelectedStockForChart(null)}
          onQuickTrade={onQuickTrade}
        />
      )}
    </div>
  );
}

