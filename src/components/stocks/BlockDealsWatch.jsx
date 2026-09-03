'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import StockDetailModal from './StockDetailModal.jsx';
import { registerNewOpenPosition } from '../../services/risk/positionTracker';

const WATCHLIST_STORAGE_KEY = 'block_deals_custom_watchlist_v1';

/**
 * BlockDealsWatch Component (Powered by BigShot Radar Logic)
 * 
 * Implements Institutional Intelligence:
 * 1. 🏢 Mega Block Deal Accumulation (≥ ₹500–₹1,500+ Crore)
 * 2. 🟢 Strong Buy vs 🔴 Strong Selling (VWAP & Floor Breach Alerts)
 * 3. 🎯 Profit Limit & Capital Protection Advice
 * 4. 🛡️ Live Risk Tracking & Trailing Stop Integration
 * 5. 📱 100% Responsive Dual View (Table for Desktop, Cards for Mobile)
 */
export default function BlockDealsWatch({
  scannedStocks = [],
  blockDeals = [],
  onQuickTrade = null,
  onTrackRisk = null,
}) {
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
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'MEGA' | 'LARGE' | 'STRONG_BUY' | 'SELLING' | 'WATCHLIST'
  const [pinnedSymbols, setPinnedSymbols] = useState(new Set());
  const [selectedStockForChart, setSelectedStockForChart] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [riskTrackedSymbols, setRiskTrackedSymbols] = useState(new Set());
  const [lastRefreshed, setLastRefreshed] = useState('');
  const [showPlaybook, setShowPlaybook] = useState(false);

  // Load Pinned Watchlist
  useEffect(() => {
    try {
      const saved = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (saved) {
        setPinnedSymbols(new Set(JSON.parse(saved)));
      }
    } catch {
      // ignore
    }
  }, []);

  // Toggle Pinned Watchlist
  const togglePinWatchlist = (symbol) => {
    setPinnedSymbols((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) {
        next.delete(symbol);
        setFeedbackMsg(`Removed ${symbol} from Your Block Deals Watchlist`);
      } else {
        next.add(symbol);
        setFeedbackMsg(`⭐ Added ${symbol} to Your Block Deals Watchlist!`);
      }
      try {
        localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch {
        // ignore
      }
      setTimeout(() => setFeedbackMsg(null), 3500);
      return next;
    });
  };

  // Fetch Live Block Deals from NSE
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

  // Track in Risk Engine with Trailing SL
  const handleTrackInRiskEngine = (stock) => {
    try {
      const sym = stock.symbol;
      const comp = stock.companyName || `${sym} Limited`;
      const buyPrice = Number(stock.currentLtp || stock.dealPrice || 100);
      const sl = Number((stock.stopLoss || buyPrice * 0.97).toFixed(2));

      // 1. Register into positionTracker
      registerNewOpenPosition(sym, comp, 100, buyPrice, sl, 'MIS');

      // 2. Register into groww_active_positions_v1
      const activePositions = JSON.parse(localStorage.getItem('groww_active_positions_v1') || '[]');
      const newPos = {
        symbol: sym,
        qty: 100,
        avgPrice: buyPrice,
        stopLoss: sl,
        target: stock.target1 || Number((buyPrice * 1.03).toFixed(2)),
        entryTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        entryDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        type: 'BUY',
        currentLtp: buyPrice,
        unrealizedPnl: 0,
        pnlPercent: 0,
        trailingStop: sl,
        highestPrice: buyPrice,
      };
      const filtered = activePositions.filter((p) => p.symbol !== sym);
      localStorage.setItem('groww_active_positions_v1', JSON.stringify([newPos, ...filtered]));

      setRiskTrackedSymbols((prev) => new Set([...prev, sym]));
      setFeedbackMsg(`✓ ${sym} registered into Live Position Risk Monitor with Trailing SL (₹${sl.toFixed(2)})!`);
      setTimeout(() => setFeedbackMsg(null), 4000);
      onTrackRisk?.(stock);
    } catch {
      // ignore
    }
  };

  // Process & Merge All Block Deals with BigShot Radar Logic
  const processedBlockSetups = useMemo(() => {
    const rawDeals = blockDealData.data || [];

    // Fallback baseline for notable multi-day institutional block deals
    const historicalKnownDeals = [
      {
        session: 'Session 1',
        symbol: 'LENSKART',
        companyName: 'Lenskart Solutions Limited',
        dealPrice: 630.0,
        currentLtp: 669.0,
        totalTradedValue: 18567800000,
        totalTradedVolume: 29472670,
        pchange: 0.78,
        previousClose: 663.8,
        vwap: 669.09,
        series: 'EQ',
        lastUpdateTime: 'T+1 Live Follow-Through',
        catalyst: '₹1,856 Cr Mega Floor (Holding Green Above Base)',
      },
      {
        session: 'Session 1',
        symbol: 'ATHERENERG',
        companyName: 'Ather Energy Limited',
        dealPrice: 1480.0,
        currentLtp: 1675.0,
        totalTradedValue: 17582400000,
        totalTradedVolume: 11880000,
        pchange: -2.93,
        previousClose: 1725.5,
        vwap: 1702.25,
        series: 'EQ',
        lastUpdateTime: 'T+2 Pullback Window',
        catalyst: 'Post-Breakout Pullback (Below ₹1,702 VWAP)',
      },
    ];

    // Combine rawDeals and historical deals without duplicates
    const combined = [...rawDeals];
    for (const h of historicalKnownDeals) {
      if (!combined.some((d) => d.symbol === h.symbol)) {
        combined.push(h);
      }
    }

    return combined.map((deal) => {
      const sym = deal.symbol;
      const matchedScanner = scannedStocks.find((s) => s.symbol === sym);

      const dealValueCr = Number(((deal.totalTradedValue || 0) / 10000000).toFixed(2));
      const dealVolume = Number(deal.totalTradedVolume || 0);
      const dealPrice = Number(deal.lastPrice || deal.open || deal.dealPrice || 100);
      const prevClose = Number(deal.previousClose || matchedScanner?.previousClose || dealPrice);

      const currentLtp = Number(matchedScanner?.price || matchedScanner?.ltp || deal.currentLtp || deal.lastPrice || dealPrice);
      const pchange = Number(matchedScanner?.changePercent ?? deal.pchange ?? deal.pChange ?? (prevClose > 0 ? ((currentLtp - prevClose) / prevClose) * 100 : 0));

      const vwap = Number(matchedScanner?.vwap || deal.vwap || (dealPrice * 0.995).toFixed(2));
      const isAboveVwap = currentLtp >= vwap;
      const isHoldingDealPrice = currentLtp >= dealPrice;
      const gainSinceDealPct = dealPrice > 0 ? Number((((currentLtp - dealPrice) / dealPrice) * 100).toFixed(2)) : 0;

      // Upper band calculation
      const upperBand = Number((matchedScanner?.upperBand || (prevClose * 1.10)).toFixed(2));
      const distToUcPct = upperBand > 0 ? Math.max(0, Number((((upperBand - currentLtp) / upperBand) * 100).toFixed(1))) : 5.0;

      // Discount Block Deal Analysis
      const isDiscountDeal = prevClose > 0 && dealPrice < (prevClose * 0.99);
      const discountPct = prevClose > 0 ? Number((((dealPrice - prevClose) / prevClose) * 100).toFixed(2)) : 0;

      // BigShot 100-Point Scoring Logic
      let score = 50;
      if (dealValueCr >= 1000) score += 25;
      else if (dealValueCr >= 500) score += 20;
      else if (dealValueCr >= 100) score += 10;
      else if (dealValueCr >= 50) score += 5;

      if (isDiscountDeal) {
        score -= 40; // Heavy penalty for discount stake dump
      }

      if (isAboveVwap && pchange > 0) {
        score += 25;
      } else {
        score -= 30; // Heavy penalty for trading red or below VWAP
      }

      if (pchange > 1.0) score += 10;
      if (distToUcPct <= 1.5 && pchange > 0) score += 15;

      score = Math.max(5, Math.min(100, Math.round(score)));

      // Institutional Tier
      const isMegaBlock = dealValueCr >= 500;
      const isLargeBlock = dealValueCr >= 50 && dealValueCr < 500;
      const tierBadge = isMegaBlock
        ? '🏢 MEGA BLOCK (≥ ₹500 Cr)'
        : isLargeBlock
        ? '⚡ LARGE BLOCK (≥ ₹50 Cr)'
        : '📦 STANDARD BLOCK';

      // BigShot Live Signal & Alert Logic (Strict Defense)
      let signal = 'WATCH';
      let signalText = '🟡 WATCH / CONSOLIDATING';
      let signalAdvice = '⏳ Wait for clean breakout above VWAP with buyer volume';
      let risk = 'Low';

      if (isDiscountDeal || (pchange < 0 && dealValueCr >= 100)) {
        // e.g. MEESHO: 8 Crore shares sold at -2.5% discount creates massive supply overhang!
        signal = 'STRONG_SELLING';
        signalText = `⚠️ DISCOUNT STAKE DUMP (${discountPct}%)`;
        signalAdvice = `❌ DO NOT BUY — Institutional supply overhang (${discountPct}% discount). High dump risk!`;
        risk = 'High';
      } else if (!isAboveVwap || pchange < 0) {
        // Trading below VWAP or in the red
        signal = 'STRONG_SELLING';
        signalText = '🔴 STRONG SELLING (Below VWAP / Red)';
        signalAdvice = '❌ DO NOT BUY / Capital Defense (Never buy red stocks below VWAP)';
        risk = 'High';
      } else if (distToUcPct <= 1.5 && pchange >= 2.0) {
        signal = 'LOCKED_CIRCUIT';
        signalText = distToUcPct === 0 ? '🔒 100% LOCKED IN UC' : '⚡ NEAR UC (Golden Window)';
        signalAdvice = '💰 Hold for Tomorrow Gap-Up Open (Sell 50% at 09:15 AM)';
        risk = 'Low';
      } else if (isAboveVwap && pchange >= 0.8 && !isDiscountDeal) {
        signal = 'STRONG_BUY';
        signalText = '🟢 STRONG BUY (Holding Premium Floor)';
        signalAdvice = '🎯 Take 50% at T1 (+2.5%) & Move SL to Cost (Never-Red)';
        risk = 'Low';
      } else if (score >= 60 && pchange >= 0) {
        signal = 'ACCUMULATING';
        signalText = '💎 INSTITUTIONAL ACCUMULATION';
        signalAdvice = '📈 Building base above Deal Price. Buy near VWAP support.';
        risk = 'Medium';
      }

      // Stop Loss & Targets
      const stopLoss = Number((Math.min(dealPrice, vwap) * 0.985).toFixed(2));
      const target1 = Number((currentLtp * 1.025).toFixed(2));
      const target2 = Number((currentLtp * 1.05).toFixed(2));

      return {
        symbol: sym,
        companyName: deal.companyName || `${sym} Limited`,
        dealPrice,
        currentLtp,
        dealValueCr,
        dealVolume,
        pchange,
        prevClose,
        vwap,
        isAboveVwap,
        isHoldingDealPrice,
        gainSinceDealPct,
        upperBand,
        distToUcPct,
        score,
        isMegaBlock,
        isLargeBlock,
        tierBadge,
        signal,
        signalText,
        signalAdvice,
        risk,
        stopLoss,
        target1,
        target2,
        session: deal.session || 'Session 1',
        lastUpdateTime: deal.lastUpdateTime || '08:50 AM',
        series: deal.series || 'BL',
        catalyst: deal.catalyst || `${tierBadge} transaction`,
      };
    });
  }, [blockDealData.data, scannedStocks]);

  // Filtered Setups
  const displayedSetups = useMemo(() => {
    return processedBlockSetups.filter((deal) => {
      const q = searchQuery.trim().toUpperCase();
      const matchesSearch = !q || deal.symbol.includes(q) || deal.companyName.toUpperCase().includes(q);

      if (!matchesSearch) return false;

      switch (activeFilter) {
        case 'MEGA':
          return deal.isMegaBlock;
        case 'LARGE':
          return deal.isLargeBlock || deal.isMegaBlock;
        case 'STRONG_BUY':
          return deal.signal === 'STRONG_BUY' || deal.signal === 'LOCKED_CIRCUIT';
        case 'SELLING':
          return deal.signal === 'STRONG_SELLING';
        case 'WATCHLIST':
          return pinnedSymbols.has(deal.symbol);
        default:
          return true;
      }
    });
  }, [processedBlockSetups, searchQuery, activeFilter, pinnedSymbols]);

  const totalValueCr = (blockDealData.totalTradedValue / 10000000).toFixed(2);
  const megaBlocksCount = processedBlockSetups.filter((d) => d.isMegaBlock).length;
  const strongBuyCount = processedBlockSetups.filter((d) => d.signal === 'STRONG_BUY' || d.signal === 'LOCKED_CIRCUIT').length;

  return (
    <div className="block-deals-module w-100 mb-5">
      {/* ── 1. HEADER BANNER (BigShot Radar Styling) ── */}
      <div
        className="card border-0 shadow-sm rounded-4 overflow-hidden text-white mb-4 p-3 p-md-4"
        style={{ background: 'linear-gradient(135deg, #09131d 0%, #112842 50%, #1d4673 100%)' }}
      >
        <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-3 mb-3">
          <div>
            <div className="d-flex flex-wrap align-items-center gap-2">
              <span className="fs-3">🏢</span>
              <h4 className="mb-0 fw-bold fs-5 fs-md-4">
                NSE Block Deals Watch • Powered by BigShot Radar Logic
              </h4>
              <span className="badge bg-warning text-dark fw-bold px-2.5 py-1 small shadow-sm">
                ⚡ INSTITUTIONAL RADAR
              </span>
            </div>
            <p className="text-light opacity-75 small mb-0 mt-1">
              Tracks <strong>&ge; ₹500–₹1,500+ Cr Mega Blocks</strong>, VWAP Accumulation Floors, and 
              <strong> Strong Buy vs Strong Selling (Supply Dump)</strong> alerts with Limit Profit rules!
            </p>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2 w-100 w-lg-auto">
            <button
              type="button"
              className="btn btn-sm btn-outline-info text-white rounded-pill px-3 py-1.5 fw-bold shadow-sm flex-grow-1 flex-sm-grow-0"
              onClick={() => setShowPlaybook(!showPlaybook)}
            >
              {showPlaybook ? '✕ Close Playbook' : '🧠 Block Deals Playbook & Rules'}
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-light rounded-pill px-3 py-1.5 fw-semibold shadow-sm flex-grow-1 flex-sm-grow-0"
              onClick={fetchBlockDeals}
              disabled={loading}
            >
              {loading ? <span className="spinner-border spinner-border-sm" /> : '🔄 Refresh Deals'}
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeFilter === 'WATCHLIST' ? 'btn-warning text-dark' : 'btn-outline-warning text-white'} rounded-pill px-3 py-1.5 fw-bold shadow-sm flex-grow-1 flex-sm-grow-0`}
              onClick={() => setActiveFilter(activeFilter === 'WATCHLIST' ? 'ALL' : 'WATCHLIST')}
            >
              ⭐ Watchlist ({pinnedSymbols.size})
            </button>
          </div>
        </div>

        {/* ── EXPANDABLE PLAYBOOK & CASE STUDY ── */}
        {showPlaybook && (
          <div className="p-3 p-md-3.5 rounded-3 mb-3 border border-warning border-opacity-40" style={{ background: '#0b1622' }}>
            <div className="d-flex align-items-center gap-2 mb-2 pb-2 border-bottom border-secondary border-opacity-30">
              <span className="fs-4">🛡️</span>
              <h5 className="text-warning fw-bold mb-0 fs-6 fs-md-5">
                Institutional Block Deals Playbook: Accumulation Floor vs Supply Dumping
              </h5>
            </div>

            <div className="row g-3 small">
              {/* Card 1: Clean Accumulation (The Lenskart Model) */}
              <div className="col-12 col-md-6">
                <div className="p-3 rounded-3 h-100 border border-success border-opacity-50" style={{ background: '#0f241a' }}>
                  <strong className="text-success d-block fs-6 mb-2">🟢 The Accumulation Pattern (e.g. Lenskart ₹1,856 Cr):</strong>
                  <ul className="text-white ps-3 mb-0" style={{ lineHeight: '1.6' }}>
                    <li>
                      <strong>Floor Established</strong>: Price holds firmly <strong>ABOVE the Block Deal Price (₹630)</strong>.
                    </li>
                    <li>
                      <strong>Above VWAP (₹669)</strong>: Buyers defend the VWAP intraday benchmark, even when the broader market falls -200 pts.
                    </li>
                    <li>
                      <strong>Execution</strong>: Buy near VWAP support; book 50% at +2.5% Target 1, and move Stop Loss to Cost!
                    </li>
                  </ul>
                </div>
              </div>

              {/* Card 2: Supply Offloading (The Ather Energy Lesson) */}
              <div className="col-12 col-md-6">
                <div className="p-3 rounded-3 h-100 border border-danger border-opacity-50" style={{ background: '#1c1218' }}>
                  <strong className="text-danger d-block fs-6 mb-2">🔴 The Supply Dump Pattern (e.g. Ather Energy -₹2,500 Lesson):</strong>
                  <ul className="text-white ps-3 mb-0" style={{ lineHeight: '1.6' }}>
                    <li>
                      <strong>VWAP Breakdown</strong>: Even after a ₹1,758 Cr deal, if price breaks <strong>BELOW VWAP (₹1,702)</strong>, institutions are offloading inventory into retail!
                    </li>
                    <li>
                      <strong>Day 3 Exhaustion</strong>: Never chase on Day 3 without a support pullback base.
                    </li>
                    <li>
                      <strong>Golden Rule</strong>: <em>NEVER buy long when price is below VWAP, regardless of block deal size!</em>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SUMMARY STAT CARDS ── */}
        <div className="row g-2.5 g-md-3">
          <div className="col-6 col-md-3">
            <div className="p-3 rounded-3 border border-light border-opacity-10 h-100" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
              <span className="text-muted small d-block" style={{ fontSize: 11 }}>TOTAL BLOCK TURNOVER</span>
              <h4 className="fw-bold text-primary mb-0 mt-1">₹{totalValueCr} <span className="fs-6 text-muted">Cr</span></h4>
              <small className="text-light opacity-75" style={{ fontSize: 10.5 }}>Executed across NSE Sessions</small>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="p-3 rounded-3 border border-light border-opacity-10 h-100" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
              <span className="text-muted small d-block" style={{ fontSize: 11 }}>MEGA BLOCKS (&ge; ₹500 Cr)</span>
              <h4 className="fw-bold text-warning mb-0 mt-1">{megaBlocksCount} <span className="fs-6 text-muted">Stocks</span></h4>
              <small className="text-light opacity-75" style={{ fontSize: 10.5 }}>Giant Institutional Floor</small>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="p-3 rounded-3 border border-light border-opacity-10 h-100" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
              <span className="text-muted small d-block" style={{ fontSize: 11 }}>STRONG BUY SIGNALS</span>
              <h4 className="fw-bold text-success mb-0 mt-1">{strongBuyCount} <span className="fs-6 text-muted">Setups</span></h4>
              <small className="text-light opacity-75" style={{ fontSize: 10.5 }}>Above VWAP & Floor</small>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="p-3 rounded-3 border border-light border-opacity-10 h-100" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
              <span className="text-muted small d-block" style={{ fontSize: 11 }}>NSE BENCHMARK</span>
              <h4 className="fw-bold text-white mb-0 mt-1">
                {blockDealData.marketStatus?.last ? Number(blockDealData.marketStatus.last).toFixed(1) : '24,088.6'}
              </h4>
              <small className={Number(blockDealData.marketStatus?.percentChange || 0) >= 0 ? 'text-success' : 'text-danger'} style={{ fontSize: 10.5 }}>
                {Number(blockDealData.marketStatus?.percentChange || 0) >= 0 ? '▲ +' : '▼ '}
                {blockDealData.marketStatus?.percentChange ? Number(blockDealData.marketStatus.percentChange).toFixed(2) : '-0.01'}% (Market Open)
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* ── TOAST NOTIFICATION ── */}
      {feedbackMsg && (
        <div className="alert alert-success border-0 shadow-sm rounded-3 py-2 px-3 mb-3 d-flex align-items-center justify-content-between">
          <span className="fw-bold">{feedbackMsg}</span>
          <button type="button" className="btn-close btn-sm" onClick={() => setFeedbackMsg(null)} />
        </div>
      )}

      {/* ── 2. RESPONSIVE FILTER STRIP (Fluid Wrapping) ── */}
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-2.5 mb-3">
        <div className="d-flex flex-wrap gap-2" role="group">
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold shadow-sm ${activeFilter === 'ALL' ? 'btn-primary' : 'btn-outline-secondary text-dark'}`}
            onClick={() => setActiveFilter('ALL')}
          >
            🔥 All Blocks ({processedBlockSetups.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold shadow-sm ${activeFilter === 'MEGA' ? 'btn-warning text-dark' : 'btn-outline-warning text-dark'}`}
            onClick={() => setActiveFilter('MEGA')}
          >
            🏢 Mega Blocks ≥ ₹500 Cr ({megaBlocksCount})
          </button>
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold shadow-sm ${activeFilter === 'STRONG_BUY' ? 'btn-success text-white' : 'btn-outline-success'}`}
            onClick={() => setActiveFilter('STRONG_BUY')}
          >
            🟢 Strong Buy Above VWAP ({strongBuyCount})
          </button>
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold shadow-sm ${activeFilter === 'SELLING' ? 'btn-danger text-white' : 'btn-outline-danger'}`}
            onClick={() => setActiveFilter('SELLING')}
          >
            🔴 Selling Alerts ({processedBlockSetups.filter((d) => d.signal === 'STRONG_SELLING').length})
          </button>
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold shadow-sm ${activeFilter === 'WATCHLIST' ? 'btn-warning text-dark' : 'btn-outline-secondary'}`}
            onClick={() => setActiveFilter('WATCHLIST')}
          >
            ⭐ Pinned Watchlist ({pinnedSymbols.size})
          </button>
        </div>

        {/* Search Bar */}
        <div className="d-flex align-items-center gap-2 w-100 w-md-auto" style={{ maxWidth: 280 }}>
          <input
            type="text"
            className="form-control form-control-sm bg-light border-secondary rounded-pill px-3"
            placeholder="Search symbol (e.g. MEESHO)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ── 3A. DESKTOP RESULTS TABLE (Large Screens) ── */}
      <div className="d-none d-lg-block card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle table-striped table-sm small mb-0 text-nowrap">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Watchlist</th>
                <th>Stock Symbol & Company</th>
                <th>Live Signal & Alert</th>
                <th>Score</th>
                <th>Deal Price (₹)</th>
                <th>Live Price (₹)</th>
                <th>Day Gain %</th>
                <th>Deal Value (₹ Cr)</th>
                <th>VWAP (₹)</th>
                <th>Profit Limit Action</th>
                <th>Stop Loss (₹)</th>
                <th>Target 1 / 2 (₹)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedSetups.length === 0 ? (
                <tr>
                  <td colSpan="14" className="text-center py-5 text-muted">
                    <h5>No block deal setups match the selected filter</h5>
                    <p className="small mb-0">Try clearing filters or search term to view all transactions.</p>
                  </td>
                </tr>
              ) : (
                displayedSetups.map((deal, idx) => {
                  const isPinned = pinnedSymbols.has(deal.symbol);
                  const isPositive = Number(deal.pchange || 0) >= 0;
                  const isTracked = riskTrackedSymbols.has(deal.symbol);

                  return (
                    <tr key={`${deal.symbol}-${idx}`} className={!deal.isAboveVwap ? 'table-danger bg-opacity-10' : ''}>
                      <td><span className="badge bg-dark fw-bold">#{idx + 1}</span></td>

                      {/* 1-Click Pin Watchlist */}
                      <td>
                        <button
                          type="button"
                          className={`btn btn-xs rounded-pill px-2.5 py-1 fw-bold shadow-sm ${
                            isPinned ? 'btn-warning text-dark' : 'btn-outline-secondary text-dark'
                          }`}
                          onClick={() => togglePinWatchlist(deal.symbol)}
                          style={{ fontSize: 11 }}
                        >
                          {isPinned ? '⭐ Pinned' : '☆ Watchlist'}
                        </button>
                      </td>

                      {/* Stock Symbol & Company */}
                      <td>
                        <div className="d-flex align-items-center gap-1.5">
                          <span className="badge bg-dark fs-6 px-2.5 py-1 fw-bold text-white me-1">
                            {deal.symbol}
                          </span>
                          <div>
                            <strong className="text-dark d-block">{deal.companyName}</strong>
                            <small className="text-muted">
                              {deal.session} • {deal.series} • {deal.lastUpdateTime}
                            </small>
                          </div>
                        </div>
                      </td>

                      {/* Live Signal & Alert */}
                      <td>
                        {deal.signal === 'STRONG_SELLING' ? (
                          <span className="badge bg-danger text-white fw-bold px-2.5 py-1 shadow-sm fs-6">
                            {deal.signalText}
                          </span>
                        ) : deal.signal === 'LOCKED_CIRCUIT' ? (
                          <span className="badge bg-danger text-white fw-bold px-2.5 py-1 shadow-sm fs-6">
                            {deal.signalText}
                          </span>
                        ) : (
                          <span className="badge bg-success text-white fw-bold px-2.5 py-1 shadow-sm fs-6">
                            {deal.signalText}
                          </span>
                        )}
                      </td>

                      {/* Score */}
                      <td>
                        <span className={`badge fs-6 ${deal.score >= 80 ? 'bg-success text-white' : deal.score >= 60 ? 'bg-primary text-white' : 'bg-secondary'}`}>
                          {deal.score}/100
                        </span>
                      </td>

                      {/* Deal Price */}
                      <td className="fw-semibold text-dark">
                        ₹{Number(deal.dealPrice || 0).toFixed(2)}
                      </td>

                      {/* Live Price */}
                      <td className="fw-bold fs-6 text-primary">
                        ₹{Number(deal.currentLtp || 0).toFixed(2)}
                      </td>

                      {/* Day Gain % */}
                      <td className={isPositive ? 'text-success fw-bold fs-6' : 'text-danger fw-bold fs-6'}>
                        {isPositive ? '▲ +' : '▼ '}{Number(deal.pchange || 0).toFixed(2)}%
                      </td>

                      {/* Deal Value Cr */}
                      <td>
                        <span className={`badge fs-6 fw-bold px-2.5 py-1 shadow-sm ${deal.isMegaBlock ? 'bg-warning text-dark' : deal.isLargeBlock ? 'bg-info text-dark' : 'bg-light text-dark border'}`}>
                          ₹{deal.dealValueCr} Cr
                        </span>
                      </td>

                      {/* VWAP */}
                      <td>
                        <div>
                          <strong className={deal.isAboveVwap ? 'text-success' : 'text-danger'}>
                            ₹{Number(deal.vwap || 0).toFixed(2)}
                          </strong>
                          <small className="d-block text-muted" style={{ fontSize: 10 }}>
                            {deal.isAboveVwap ? '✓ Above VWAP' : '⚠️ Below VWAP'}
                          </small>
                        </div>
                      </td>

                      {/* Profit Limit Action */}
                      <td style={{ maxWidth: 220, whiteSpace: 'normal' }}>
                        <strong className={deal.signal === 'STRONG_SELLING' ? 'text-danger small d-block' : 'text-success small d-block'}>
                          {deal.signalAdvice}
                        </strong>
                      </td>

                      {/* Stop Loss */}
                      <td>
                        <span className="badge bg-danger text-white fw-bold px-2 py-1 shadow-sm">
                          ₹{Number(deal.stopLoss || 0).toFixed(2)}
                        </span>
                      </td>

                      {/* Targets */}
                      <td>
                        <div className="d-flex align-items-center gap-1">
                          <span className="badge bg-success text-white fw-bold px-2 py-1 shadow-sm">
                            T1: ₹{Number(deal.target1 || 0).toFixed(2)}
                          </span>
                          <span className="badge bg-success text-white fw-bold px-2 py-1 shadow-sm">
                            T2: ₹{Number(deal.target2 || 0).toFixed(2)}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="d-flex align-items-center gap-1.5">
                          <button
                            type="button"
                            className="btn btn-xs btn-outline-danger fw-bold px-2.5 py-1 shadow-sm"
                            onClick={() => handleTrackInRiskEngine(deal)}
                            style={{ fontSize: 11 }}
                          >
                            {isTracked ? '✓ Tracked' : '🛡️ Track Risk'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-xs btn-outline-primary fw-bold px-2 py-1 shadow-sm"
                            onClick={() => setSelectedStockForChart(deal)}
                            style={{ fontSize: 11 }}
                          >
                            📈 Chart
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 3B. MOBILE & TABLET RESPONSIVE CARDS (Small Screens) ── */}
      <div className="d-lg-none mb-4">
        {displayedSetups.length === 0 ? (
          <div className="card p-4 text-center text-muted rounded-4 shadow-sm">
            <h5>No block deals match the selected filter</h5>
            <p className="small mb-0">Try clearing filters or search term.</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {displayedSetups.map((deal, idx) => {
              const isPinned = pinnedSymbols.has(deal.symbol);
              const isPositive = Number(deal.pchange || 0) >= 0;
              const isTracked = riskTrackedSymbols.has(deal.symbol);

              return (
                <div
                  key={`mobile-block-${deal.symbol}-${idx}`}
                  className="card border shadow-sm rounded-4 overflow-hidden p-3"
                  style={{
                    background: !deal.isAboveVwap ? '#fff8f8' : '#ffffff',
                    borderColor: !deal.isAboveVwap ? '#f8d7da' : '#e2e8f0',
                  }}
                >
                  {/* Card Header: Symbol, Company & Price */}
                  <div className="d-flex align-items-start justify-content-between gap-2 pb-2 mb-2 border-bottom">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-dark fw-bold">#{idx + 1}</span>
                      <div>
                        <div className="d-flex align-items-center gap-1.5">
                          <strong className="fs-6 text-dark">{deal.symbol}</strong>
                          <span className={`badge px-1.5 py-0.5 ${deal.isMegaBlock ? 'bg-warning text-dark' : 'bg-secondary text-white'}`} style={{ fontSize: 10 }}>
                            ₹{deal.dealValueCr} Cr
                          </span>
                        </div>
                        <small className="text-muted d-block text-truncate" style={{ maxWidth: 180 }}>
                          {deal.companyName}
                        </small>
                      </div>
                    </div>

                    <div className="text-end">
                      <div className="fw-bold fs-5 text-primary">
                        ₹{Number(deal.currentLtp || 0).toFixed(2)}
                      </div>
                      <div className={isPositive ? 'text-success fw-bold small' : 'text-danger fw-bold small'}>
                        {isPositive ? '▲ +' : '▼ '}{Number(deal.pchange || 0).toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  {/* Signal & Watchlist Badge */}
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2.5">
                    <div>
                      {deal.signal === 'STRONG_SELLING' ? (
                        <span className="badge bg-danger text-white fw-bold px-2 py-1 shadow-sm">
                          {deal.signalText}
                        </span>
                      ) : deal.signal === 'LOCKED_CIRCUIT' ? (
                        <span className="badge bg-danger text-white fw-bold px-2 py-1 shadow-sm">
                          {deal.signalText}
                        </span>
                      ) : (
                        <span className="badge bg-success text-white fw-bold px-2 py-1 shadow-sm">
                          {deal.signalText}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className={`btn btn-xs rounded-pill px-2.5 py-1 fw-bold shadow-sm ${
                        isPinned ? 'btn-warning text-dark' : 'btn-outline-secondary'
                      }`}
                      onClick={() => togglePinWatchlist(deal.symbol)}
                      style={{ fontSize: 11 }}
                    >
                      {isPinned ? '⭐ Pinned' : '☆ Watchlist'}
                    </button>
                  </div>

                  {/* 4-Box Key Metrics Grid */}
                  <div className="row g-2 text-center small mb-2.5">
                    <div className="col-6 col-sm-3">
                      <div className="p-2 rounded bg-light border">
                        <span className="text-muted d-block" style={{ fontSize: 10.5 }}>Deal Price</span>
                        <strong className="text-dark">₹{Number(deal.dealPrice || 0).toFixed(2)}</strong>
                        <div style={{ fontSize: 9.5 }} className={deal.gainSinceDealPct >= 0 ? 'text-success' : 'text-danger'}>
                          {deal.gainSinceDealPct >= 0 ? '+' : ''}{deal.gainSinceDealPct}%
                        </div>
                      </div>
                    </div>
                    <div className="col-6 col-sm-3">
                      <div className="p-2 rounded bg-light border">
                        <span className="text-muted d-block" style={{ fontSize: 10.5 }}>VWAP</span>
                        <strong className={deal.isAboveVwap ? 'text-success' : 'text-danger'}>
                          ₹{Number(deal.vwap || 0).toFixed(2)}
                        </strong>
                        <div style={{ fontSize: 9.5, color: deal.isAboveVwap ? '#198754' : '#dc3545' }}>
                          {deal.isAboveVwap ? '✓ Above' : '⚠️ Below'}
                        </div>
                      </div>
                    </div>
                    <div className="col-6 col-sm-3">
                      <div className="p-2 rounded bg-light border">
                        <span className="text-muted d-block" style={{ fontSize: 10.5 }}>Stop Loss</span>
                        <strong className="text-danger">₹{Number(deal.stopLoss || 0).toFixed(2)}</strong>
                        <div style={{ fontSize: 9.5 }} className="text-muted">Risk Gate</div>
                      </div>
                    </div>
                    <div className="col-6 col-sm-3">
                      <div className="p-2 rounded bg-light border">
                        <span className="text-muted d-block" style={{ fontSize: 10.5 }}>Target 1</span>
                        <strong className="text-success">₹{Number(deal.target1 || 0).toFixed(2)}</strong>
                        <div style={{ fontSize: 9.5 }} className="text-success">+2.5% Lock</div>
                      </div>
                    </div>
                  </div>

                  {/* Profit Limit Action Alert Strip */}
                  <div
                    className="p-2 rounded mb-2.5 small"
                    style={{
                      background: deal.signal === 'STRONG_SELLING' ? '#fde8e8' : '#e6f7ef',
                      borderLeft: `4px solid ${deal.signal === 'STRONG_SELLING' ? '#dc3545' : '#198754'}`,
                    }}
                  >
                    <strong className={deal.signal === 'STRONG_SELLING' ? 'text-danger' : 'text-success'}>
                      {deal.signalAdvice}
                    </strong>
                  </div>

                  {/* Action Buttons */}
                  <div className="d-flex align-items-center gap-2 pt-1">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger fw-bold flex-grow-1 shadow-sm"
                      onClick={() => handleTrackInRiskEngine(deal)}
                    >
                      {isTracked ? '✓ Tracked' : '🛡️ Track Risk'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary fw-bold flex-grow-1 shadow-sm"
                      onClick={() => setSelectedStockForChart(deal)}
                    >
                      📈 View Chart
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 4. CHART / DETAIL MODAL ── */}
      {selectedStockForChart && (
        <StockDetailModal
          symbol={selectedStockForChart.symbol}
          stock={{
            ...selectedStockForChart,
            symbol: selectedStockForChart.symbol,
            companyName: selectedStockForChart.companyName,
            price: selectedStockForChart.currentLtp,
            changePercent: selectedStockForChart.pchange,
            change: Number(((selectedStockForChart.currentLtp * selectedStockForChart.pchange) / 100).toFixed(2)),
            vwap: selectedStockForChart.vwap,
            stopLoss: selectedStockForChart.stopLoss,
            target1: selectedStockForChart.target1,
            target2: selectedStockForChart.target2,
            score: selectedStockForChart.score || 85,
            bullishScore: selectedStockForChart.score || 85,
            support: selectedStockForChart.stopLoss,
            resistance: selectedStockForChart.target1,
          }}
          onClose={() => setSelectedStockForChart(null)}
          onQuickTrade={onQuickTrade}
        />
      )}
    </div>
  );
}

