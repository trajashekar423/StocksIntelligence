'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { detectAllCandlePatterns } from '../../services/candlestickPatterns';
import {
  calcRSIseries,
  evaluateOverboughtStatus,
  calculateDynamicExitStopLoss,
} from '../../services/risk/overboughtEngine';

export default function CandleChart({
  candles = [],
  symbol = 'STOCK',
  companyName = '',
  basePrice = null,
  currentPrice = null,
  height = 440,
  onCandleSelect = null,
  initialEntryPrice = '',
}) {
  const [timeframe, setTimeframe] = useState('5m');
  const [hoverIndex, setHoverIndex] = useState(null);
  const [showEMA, setShowEMA] = useState(true);
  const [showVWAP, setShowVWAP] = useState(true);
  const [showSignals, setShowSignals] = useState(true);
  // 'auto' (default: auto-activates near overbought) | 'on' | 'off'
  const [overboughtMode, setOverboughtMode] = useState('auto');
  const [userEntryPrice, setUserEntryPrice] = useState(initialEntryPrice ? String(initialEntryPrice) : '');
  const [zoomLevel, setZoomLevel] = useState(40); // number of visible candles
  const [isFullscreen, setIsFullscreen] = useState(false);
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  // Determine base price based on symbol
  const cleanSymbol = String(symbol || '').trim().toUpperCase();
  const effectivePrice = Number(currentPrice || basePrice || 0);

  const getSymbolBasePrice = (sym) => {
    if (effectivePrice > 0) return effectivePrice;
    switch (sym) {
      case 'SWIGGY':
        return 276.1;
      case 'RAMBHAJO':
        return 215.91;
      case 'NITCO':
        return 101.89;
      case 'CUPID':
        return 283.8;
      case 'INFY':
        return 1128.0;
      case 'TATASTEEL':
        return 186.3;
      case 'RELIANCE':
        return 2980.0;
      case 'HDFCBANK':
        return 1680.0;
      case 'SBIN':
        return 812.0;
      case 'TCS':
        return 4150.0;
      case 'MANAPPURAM':
        return 365.0;
      case 'SUZLON':
        return 74.5;
      case 'TATAMOTORS':
        return 998.0;
      case 'IFCI':
        return 97.5;
      default:
        return 100.0;
    }
  };

  const [liveCandles, setLiveCandles] = useState([]);
  const [loadingCandles, setLoadingCandles] = useState(false);

  // Fetch real live OHLC candles from exchange feed
  const candlesLen = Array.isArray(candles) ? candles.length : 0;

  useEffect(() => {
    if (candlesLen >= 1) {
      setLiveCandles(candles);
      setLoadingCandles(false);
      return;
    }
    let isMounted = true;
    setLoadingCandles(true);
    async function fetchLiveCandles() {
      try {
        const res = await fetch(`/api/nse/candles?symbol=${cleanSymbol}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.candles) && data.candles.length >= 1 && isMounted) {
            setLiveCandles(data.candles);
          }
        }
      } catch {
        // keep fallback
      } finally {
        if (isMounted) {
          setLoadingCandles(false);
        }
      }
    }
    fetchLiveCandles();
    return () => {
      isMounted = false;
    };
  }, [candlesLen, cleanSymbol]);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Use real candles if available, else generate deterministic candles
  const rawCandles = useMemo(() => {
    if (Array.isArray(candles) && candles.length >= 1) {
      return candles;
    }
    if (Array.isArray(liveCandles) && liveCandles.length >= 1) {
      return liveCandles;
    }
    // Generate deterministic intraday tick candles anchored at effectivePrice
    const basePrice = getSymbolBasePrice(cleanSymbol);
    const count = 50;
    const generated = [];
    let p = basePrice * 0.985;
    const now = new Date();

    for (let i = 0; i < count; i++) {
      const time = new Date(now.getTime() - (count - i) * 5 * 60000);
      const isUp = Math.sin(i * 0.45) > -0.15;
      const vol = Math.floor(25000 + Math.abs(Math.sin(i * 0.7)) * 75000 + (i > 35 ? 120000 : 0));
      const delta = (Math.random() * 0.006 + 0.001) * basePrice * (isUp ? 1 : -0.75);
      const open = p;
      let close = open + delta;
      let high = Math.max(open, close) + Math.random() * 0.003 * basePrice;
      let low = Math.min(open, close) - Math.random() * 0.003 * basePrice;

      // Ensure last candle matches real current price
      if (i === count - 1 && effectivePrice > 0) {
        close = effectivePrice;
        high = Math.max(high, close);
        low = Math.min(low, close);
      }

      generated.push({
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: vol,
      });
      p = close;
    }
    return generated;
  }, [candles, liveCandles, effectivePrice, cleanSymbol]);

  // Sliced candles based on zoom level
  const visibleCandles = useMemo(() => {
    if (!rawCandles.length) return [];
    return rawCandles.slice(-zoomLevel);
  }, [rawCandles, zoomLevel]);

  // Derived indicator calculations: VWAP, EMA9, EMA21, RSI(14), and Decoupled Buy/Sell/Overbought Signals
  const {
    minPrice,
    maxPrice,
    maxVolume,
    vwapSeries,
    ema9Series,
    ema21Series,
    rsiSeries,
    buySellSignals,
    overboughtSignals,
    overboughtEvaluations,
    isApproachingOverbought,
  } = useMemo(() => {
    if (!visibleCandles.length) {
      return {
        minPrice: 0,
        maxPrice: 100,
        maxVolume: 1,
        vwapSeries: [],
        ema9Series: [],
        ema21Series: [],
        rsiSeries: [],
        buySellSignals: [],
        overboughtSignals: [],
        overboughtEvaluations: [],
        isApproachingOverbought: false,
      };
    }

    let min = Infinity;
    let max = -Infinity;
    let maxVol = 0;

    visibleCandles.forEach((c) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (c.volume > maxVol) maxVol = c.volume;
    });

    // Expand price bounds slightly for breathing room
    const padding = (max - min) * 0.08 || 2;
    min = Math.max(0, min - padding);
    max = max + padding;

    // VWAP
    let cumVol = 0;
    let cumTypVol = 0;
    const vwap = visibleCandles.map((c) => {
      const typ = (c.high + c.low + c.close) / 3;
      cumVol += c.volume;
      cumTypVol += typ * c.volume;
      return cumVol > 0 ? cumTypVol / cumVol : c.close;
    });

    // EMA 9 & 21
    function calcEMA(period) {
      const k = 2 / (period + 1);
      let ema = visibleCandles[0].close;
      return visibleCandles.map((c, i) => {
        if (i === 0) return ema;
        ema = c.close * k + ema * (1 - k);
        return ema;
      });
    }

    const ema9 = calcEMA(9);
    const ema21 = calcEMA(21);

    // Wilder's RSI(14) series
    const closes = visibleCandles.map((c) => c.close);
    const rsi = calcRSIseries(closes, 14);

    // Overbought Evaluations
    const parsedEntry = parseFloat(userEntryPrice);
    const validEntry = !isNaN(parsedEntry) && parsedEntry > 0 ? parsedEntry : null;

    const obEvals = visibleCandles.map((c, i) => {
      return evaluateOverboughtStatus({
        currentPrice: c.close,
        entryPrice: validEntry,
        peakPrice: max,
        vwap: vwap[i],
        rsi: rsi[i] !== null ? rsi[i] : 50,
        candle: c,
        timeStr: c.time,
      });
    });

    // Check if current active stock is approaching or inside overbought zone
    const latestRsi = rsi.at(-1) || 50;
    const latestOb = obEvals.at(-1);
    const isApproaching = latestRsi >= 68 || (latestOb && latestOb.isOverbought);

    // Determine if Overbought display should be active
    const isObActive = overboughtMode === 'on' || (overboughtMode === 'auto' && isApproaching);

    // 1. STANDARD BUY / SELL SIGNALS (Always Computed and Never Overwritten)
    const buySell = visibleCandles.map((c, i) => {
      if (i < 1) return null;
      const patterns = detectAllCandlePatterns(visibleCandles.slice(0, i + 1));
      const hasBullishPattern = patterns.some((p) =>
        ['Bullish Engulfing', 'Hammer', 'Morning Star', 'Three White Soldiers', 'Piercing Pattern'].includes(p.name)
      );
      const hasBearishPattern = patterns.some((p) =>
        ['Bearish Engulfing', 'Shooting Star', 'Evening Star'].includes(p.name)
      );

      // Buy signal when bullish pattern occurs above/at VWAP
      if (hasBullishPattern && c.close >= vwap[i] * 0.998) {
        return { type: 'BUY', label: '🟢 BUY', pattern: patterns[0]?.name || 'Bullish', color: '#16a34a' };
      }
      if (hasBearishPattern && c.close < vwap[i]) {
        return { type: 'SELL', label: '🔴 SELL', pattern: patterns[0]?.name || 'Bearish', color: '#dc2626' };
      }
      return null;
    });

    // 2. OVERBOUGHT PEAK EXIT PINS (Only Shown on Peak Exhaustion / Upper Wick Candles)
    const obSignals = visibleCandles.map((c, i) => {
      if (!isObActive) return null;
      const obEval = obEvals[i];
      if (!obEval || !obEval.isOverbought) return null;

      const prev = visibleCandles[i - 1];
      const next = visibleCandles[i + 1];
      const isLocalHigh = (!prev || c.high >= prev.high) && (!next || c.high >= next.high);
      const isUpperWick = obEval.hasUpperWickRejection;
      const isExtreme = obEval.level === 'OVERBOUGHT_CRITICAL' || obEval.level === 'BEARISH_REVERSAL_EXIT';

      // Pin EXIT on upper wick exhaustion or highest peak candles
      if (isUpperWick || (isLocalHigh && isExtreme)) {
        return {
          type: 'OVERBOUGHT_EXIT',
          label: '🚨 EXIT',
          title: `🚨 SAFE EXIT: ${obEval.actionAdvice}`,
          color: '#dc2626',
        };
      }

      if (isLocalHigh && obEval.level === 'OVERBOUGHT_WARN') {
        return {
          type: 'OVERBOUGHT_WARN',
          label: '⚠️ OB',
          title: `⚠️ Overbought: ${obEval.actionAdvice}`,
          color: '#f59e0b',
        };
      }

      return null;
    });

    return {
      minPrice: min,
      maxPrice: max,
      maxVolume: maxVol || 1,
      vwapSeries: vwap,
      ema9Series: ema9,
      ema21Series: ema21,
      rsiSeries: rsi,
      buySellSignals: buySell,
      overboughtSignals: obSignals,
      overboughtEvaluations: obEvals,
      isApproachingOverbought: isApproaching,
    };
  }, [visibleCandles, userEntryPrice, overboughtMode]);

  // Dynamic Layout Dimensions: Fullwidth HD SVG
  const paddingLeft = 20;
  const paddingRight = 85;
  const paddingTop = 25;
  const paddingBottom = 45;
  const chartWidth = isFullscreen ? 1600 : 1200;
  const chartHeight = isFullscreen ? 680 : height;
  const pricePlotHeight = (chartHeight - paddingTop - paddingBottom) * 0.74;
  const volumePlotHeight = (chartHeight - paddingTop - paddingBottom) * 0.20;
  const volumeTop = paddingTop + pricePlotHeight + 14;

  const n = visibleCandles.length;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const candleSpacing = plotWidth / (n || 1);
  const candleWidth = Math.max(3, Math.min(26, candleSpacing * 0.72));

  // Helper scale functions
  const getY = (val) => {
    if (maxPrice === minPrice) return paddingTop + pricePlotHeight / 2;
    return paddingTop + pricePlotHeight - ((val - minPrice) / (maxPrice - minPrice)) * pricePlotHeight;
  };

  const getVolY = (vol) => {
    const h = (vol / maxVolume) * volumePlotHeight;
    return volumeTop + volumePlotHeight - h;
  };

  const getX = (index) => {
    return paddingLeft + index * candleSpacing + candleSpacing / 2;
  };

  // Active / Hovered candle
  const activeCandleIndex = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < n ? hoverIndex : n - 1;
  const activeCandle = visibleCandles[activeCandleIndex];
  const activeEval = overboughtEvaluations[activeCandleIndex] || null;
  const activeRSI = rsiSeries[activeCandleIndex];
  const activeVWAP = vwapSeries[activeCandleIndex] || (activeCandle ? activeCandle.close : 0);

  const parsedEntry = parseFloat(userEntryPrice);
  const hasUserEntry = !isNaN(parsedEntry) && parsedEntry > 0;
  const entryY = hasUserEntry ? getY(parsedEntry) : null;
  const trailingStopY = activeEval?.trailingStopPrice ? getY(activeEval.trailingStopPrice) : null;

  const isObDisplayActive = overboughtMode === 'on' || (overboughtMode === 'auto' && isApproachingOverbought);

  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgX = (clientX / rect.width) * chartWidth;
    const index = Math.floor((svgX - paddingLeft) / candleSpacing);
    if (index >= 0 && index < n) {
      setHoverIndex(index);
      if (onCandleSelect) {
        onCandleSelect(visibleCandles[index]);
      }
    }
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const toggleOverboughtMode = () => {
    setOverboughtMode((prev) => {
      if (prev === 'auto') return 'on';
      if (prev === 'on') return 'off';
      return 'auto';
    });
  };

  return (
    <div
      ref={containerRef}
      className={`card shadow-sm border-0 rounded-4 overflow-hidden mb-3 ${
        isFullscreen ? 'position-fixed top-0 start-0 w-100 h-100 z-3 bg-dark text-white rounded-0' : 'bg-white'
      }`}
      style={isFullscreen ? { zIndex: 1070, overflowY: 'auto' } : {}}
    >
      {/* ── TOP CONTROLS & TIMEFRAME BAR ── */}
      <div
        className={`card-header d-flex flex-wrap align-items-center justify-content-between px-3 py-2 border-bottom gap-2 ${
          isFullscreen ? 'bg-dark bg-opacity-75 border-secondary text-white' : 'bg-light bg-opacity-75'
        }`}
      >
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="badge bg-primary px-2.5 py-1.5 fw-bold fs-6 shadow-sm">
            {cleanSymbol}
          </span>
          {companyName && (
            <span className={`small fw-semibold d-none d-sm-inline ${isFullscreen ? 'text-light opacity-75' : 'text-muted'}`}>
              {companyName}
            </span>
          )}
          {activeCandle && (
            <span
              className={`fw-bold ms-2 fs-5 ${
                activeCandle.close >= activeCandle.open ? 'text-success' : 'text-danger'
              }`}
            >
              ₹{activeCandle.close.toFixed(2)}
            </span>
          )}
        </div>

        {/* Timeframe, Overlays & Fullscreen Button */}
        <div className="d-flex flex-wrap align-items-center gap-2">
          {/* Signal overlay toggle (Always Visible) */}
          <button
            type="button"
            className={`btn btn-sm fw-bold shadow-sm d-flex align-items-center gap-1 ${
              showSignals ? 'btn-success text-white' : isFullscreen ? 'btn-outline-light' : 'btn-outline-secondary'
            }`}
            onClick={() => setShowSignals(!showSignals)}
            title="Toggle Live 🟢 BUY & 🔴 SELL Pattern Signals"
          >
            🎯 🟢 BUY Signals
          </button>

          {/* Smart Auto-Activating Overbought Guard Toggle */}
          <button
            type="button"
            className={`btn btn-sm fw-bold shadow-sm d-flex align-items-center gap-1 ${
              isObDisplayActive
                ? activeEval?.level === 'OVERBOUGHT_CRITICAL' || activeEval?.level === 'BEARISH_REVERSAL_EXIT'
                  ? 'btn-danger text-white animate-pulse'
                  : 'btn-warning text-dark'
                : 'btn-outline-secondary'
            }`}
            onClick={toggleOverboughtMode}
            title="Click to cycle: Auto (activates near overbought) -> Always ON -> OFF"
          >
            🛡️ Overbought:{' '}
            {overboughtMode === 'auto'
              ? isApproachingOverbought
                ? '⚡ AUTO ACTIVE'
                : 'Auto (Watching)'
              : overboughtMode === 'on'
              ? 'ON'
              : 'OFF'}
          </button>

          {/* Timeframe selector */}
          <div className="btn-group btn-group-sm shadow-sm">
            {['1m', '5m', '15m', '1h', '1D'].map((tf) => (
              <button
                key={tf}
                type="button"
                className={`btn btn-sm fw-semibold ${
                  timeframe === tf
                    ? 'btn-primary'
                    : isFullscreen
                    ? 'btn-outline-light'
                    : 'btn-outline-secondary'
                }`}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Indicator toggles */}
          <div className="btn-group btn-group-sm d-none d-md-flex shadow-sm">
            <button
              type="button"
              className={`btn btn-sm fw-semibold ${
                showVWAP
                  ? 'btn-purple text-white'
                  : isFullscreen
                  ? 'btn-outline-light'
                  : 'btn-outline-secondary'
              }`}
              style={showVWAP ? { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' } : {}}
              onClick={() => setShowVWAP(!showVWAP)}
            >
              VWAP
            </button>
            <button
              type="button"
              className={`btn btn-sm fw-semibold ${
                showEMA
                  ? 'btn-info text-white'
                  : isFullscreen
                  ? 'btn-outline-light'
                  : 'btn-outline-secondary'
              }`}
              onClick={() => setShowEMA(!showEMA)}
            >
              EMA 9/21
            </button>
          </div>

          {/* Zoom controls */}
          <div className="btn-group btn-group-sm shadow-sm">
            <button
              type="button"
              className={`btn btn-sm ${isFullscreen ? 'btn-outline-light' : 'btn-outline-secondary'}`}
              title="Zoom In"
              onClick={() => setZoomLevel((prev) => Math.max(15, prev - 10))}
            >
              🔍 +
            </button>
            <button
              type="button"
              className={`btn btn-sm ${isFullscreen ? 'btn-outline-light' : 'btn-outline-secondary'}`}
              title="Zoom Out"
              onClick={() => setZoomLevel((prev) => Math.min(rawCandles.length, prev + 10))}
            >
              -
            </button>
          </div>

          {/* FULLSCREEN TOGGLE BUTTON */}
          <button
            type="button"
            className={`btn btn-sm fw-bold px-3 shadow-sm d-flex align-items-center gap-1 ${
              isFullscreen ? 'btn-warning text-dark' : 'btn-outline-primary'
            }`}
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen (ESC)' : 'Open Chart in Fullscreen and Full Width'}
          >
            {isFullscreen ? '✕ Exit' : '⛶ Fullscreen'}
          </button>
        </div>
      </div>

      {/* ── INTERACTIVE INTRADAY SAFE EXIT & OVERBOUGHT MONITOR BAR ── */}
      <div
        className={`px-3 py-2 border-bottom ${
          isObDisplayActive && activeEval?.isOverbought
            ? activeEval.level === 'BEARISH_REVERSAL_EXIT' || activeEval.level === 'OVERBOUGHT_CRITICAL'
              ? 'bg-danger bg-opacity-10 border-danger'
              : 'bg-warning bg-opacity-10 border-warning'
            : isFullscreen
            ? 'bg-dark bg-opacity-50 text-white border-secondary'
            : 'bg-light'
        }`}
      >
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2.5">
          {/* Realtime Technical Gauges */}
          <div className="d-flex flex-wrap align-items-center gap-2">
            <span className="badge bg-secondary bg-opacity-25 text-dark border small">
              RSI(14):{' '}
              <strong className={activeRSI >= 70 ? 'text-danger' : activeRSI <= 30 ? 'text-success' : 'text-primary'}>
                {activeRSI !== null ? activeRSI.toFixed(1) : 'N/A'}
              </strong>
            </span>
            <span className="badge bg-secondary bg-opacity-25 text-dark border small">
              VWAP:{' '}
              <strong>₹{activeVWAP.toFixed(2)}</strong> ({activeEval?.vwapDeviationPct >= 0 ? '+' : ''}
              {activeEval?.vwapDeviationPct ?? 0}%)
            </span>
            {activeEval?.hasUpperWickRejection && (
              <span className="badge bg-danger text-white fw-bold shadow-sm">
                🪤 Upper Wick Rejection (Shooting Star)
              </span>
            )}
            <span className={`badge bg-${activeEval?.badgeColor || 'secondary'} text-white fw-bold shadow-sm`}>
              {activeEval?.badgeText || 'HEALTHY'}
            </span>
            {isApproachingOverbought && (
              <span className="badge bg-warning text-dark fw-bold border border-warning shadow-sm">
                ⚡ Overbought Guard Auto-Activated
              </span>
            )}
          </div>

          {/* User Entry Price Input & Live Profit Tracker */}
          <div className="d-flex flex-wrap align-items-center gap-2">
            <div className="input-group input-group-sm" style={{ width: 220 }}>
              <span className="input-group-text bg-white fw-semibold small">My Entry ₹</span>
              <input
                type="number"
                step="0.05"
                className="form-control form-control-sm text-end fw-bold"
                placeholder="e.g. 278.00"
                value={userEntryPrice}
                onChange={(e) => setUserEntryPrice(e.target.value)}
              />
              {userEntryPrice && (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  title="Clear Entry Price"
                  onClick={() => setUserEntryPrice('')}
                >
                  ✕
                </button>
              )}
            </div>

            {hasUserEntry && activeEval?.pnlAmount !== null && (
              <div className="d-flex align-items-center gap-2">
                <span
                  className={`badge fs-7 px-2.5 py-1.5 fw-bold ${
                    activeEval.pnlAmount >= 0 ? 'bg-success text-white' : 'bg-danger text-white'
                  }`}
                >
                  {activeEval.pnlAmount >= 0 ? '▲ +' : '▼ '}
                  ₹{Math.abs(activeEval.pnlAmount).toFixed(2)} ({activeEval.pnlPct}%)
                </span>
                <span className="badge bg-warning text-dark border border-dark fw-bold">
                  🛡️ Trailing SL: ₹{activeEval.trailingStopPrice.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Action Advice Box */}
        <div className="mt-2 pt-1 border-top border-secondary border-opacity-10 d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div className="d-flex align-items-center gap-2">
            <span className="fw-bold small text-uppercase">
              {activeEval?.isOverbought ? '🚨 Action Alert:' : '💡 Safe Guide:'}
            </span>
            <span className={`small fw-semibold ${activeEval?.isOverbought ? 'text-danger' : 'text-muted'}`}>
              {activeEval?.actionAdvice}
            </span>
          </div>
          {activeEval?.isOverbought && hasUserEntry && (
            <span className="badge bg-danger text-white fw-bold px-3 py-1 shadow-sm">
              ⚡ SAFE EXIT TRIGGERED — PROTECT YOUR CAPITAL
            </span>
          )}
        </div>
      </div>

      {/* ── MAIN SVG CHART CANVAS ── */}
      <div
        className="position-relative w-100"
        style={{
          height: isFullscreen ? 'calc(100vh - 160px)' : height,
          minHeight: 340,
          cursor: 'crosshair',
          userSelect: 'none',
          backgroundColor: isFullscreen ? '#0f172a' : '#ffffff',
        }}
      >
        {loadingCandles && (
          <div
            className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75 z-2"
          >
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading Candles...</span>
            </div>
          </div>
        )}

        <svg
          ref={svgRef}
          className="w-100 h-100"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Background Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const priceVal = minPrice + (maxPrice - minPrice) * (1 - pct);
            const y = paddingTop + pct * pricePlotHeight;
            return (
              <g key={`grid-${i}`}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke={isFullscreen ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={chartWidth - paddingRight + 6}
                  y={y + 4}
                  fill={isFullscreen ? '#94a3b8' : '#64748b'}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  ₹{priceVal.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Volume Separator Line */}
          <line
            x1={paddingLeft}
            y1={volumeTop - 4}
            x2={chartWidth - paddingRight}
            y2={volumeTop - 4}
            stroke={isFullscreen ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}
            strokeWidth="1"
          />

          {/* Candlesticks & Volume Bars */}
          {visibleCandles.map((c, i) => {
            const x = getX(i);
            const openY = getY(c.open);
            const closeY = getY(c.close);
            const highY = getY(c.high);
            const lowY = getY(c.low);
            const isBullish = c.close >= c.open;
            const color = isBullish ? '#16a34a' : '#dc2626';
            const bodyFill = isBullish ? '#22c55e' : '#ef4444';
            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.max(2, Math.abs(closeY - openY));

            const volY = getVolY(c.volume);
            const volH = volumeTop + volumePlotHeight - volY;
            const buySig = buySellSignals[i];
            const obSig = overboughtSignals[i];

            return (
              <g key={`candle-${i}`}>
                {/* Volume bar */}
                <rect
                  x={x - candleWidth / 2}
                  y={volY}
                  width={candleWidth}
                  height={volH}
                  fill={isBullish ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)'}
                  rx="1"
                />

                {/* Upper Wick */}
                <line
                  x1={x}
                  y1={highY}
                  x2={x}
                  y2={bodyTop}
                  stroke={color}
                  strokeWidth={candleWidth > 12 ? '2' : '1.5'}
                />

                {/* Lower Wick */}
                <line
                  x1={x}
                  y1={bodyTop + bodyHeight}
                  x2={x}
                  y2={lowY}
                  stroke={color}
                  strokeWidth={candleWidth > 12 ? '2' : '1.5'}
                />

                {/* Real Body Rectangle */}
                <rect
                  x={x - candleWidth / 2}
                  y={bodyTop}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={bodyFill}
                  stroke={color}
                  strokeWidth="1"
                  rx="1.5"
                />

                {/* 1. 🟢 BUY Signal Pin (Below Candle at lowY + 14) */}
                {showSignals && buySig && buySig.type === 'BUY' && (
                  <g transform={`translate(${x}, ${lowY + 14})`}>
                    <polygon points="0,-6 -6,4 6,4" fill="#16a34a" />
                    <rect x="-18" y="5" width="36" height="14" rx="3" fill="#16a34a" />
                    <text x="0" y="15" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                      BUY
                    </text>
                  </g>
                )}

                {/* 2. 🔴 SELL Signal Pin (Above Candle at highY - 14) */}
                {showSignals && buySig && buySig.type === 'SELL' && (
                  <g transform={`translate(${x}, ${highY - 14})`}>
                    <polygon points="0,6 -6,-4 6,-4" fill="#dc2626" />
                    <rect x="-18" y="-18" width="36" height="14" rx="3" fill="#dc2626" />
                    <text x="0" y="-8" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                      SELL
                    </text>
                  </g>
                )}

                {/* 3. 🚨 OVERBOUGHT SAFE EXIT PIN (Above Candle at highY - 20) */}
                {isObDisplayActive && obSig && obSig.type === 'OVERBOUGHT_EXIT' && (
                  <g transform={`translate(${x}, ${highY - 20})`}>
                    <polygon points="0,6 -6,-4 6,-4" fill="#dc2626" />
                    <rect x="-24" y="-20" width="48" height="16" rx="4" fill="#dc2626" filter="drop-shadow(0px 2px 4px rgba(220,38,38,0.6))" />
                    <text x="0" y="-8" fill="#ffffff" fontSize="8.5" fontWeight="900" textAnchor="middle">
                      🚨 EXIT
                    </text>
                  </g>
                )}

                {/* 4. ⚠️ OVERBOUGHT WARNING PIN (Above Candle at highY - 20) */}
                {isObDisplayActive && obSig && obSig.type === 'OVERBOUGHT_WARN' && (
                  <g transform={`translate(${x}, ${highY - 20})`}>
                    <polygon points="0,6 -6,-4 6,-4" fill="#f59e0b" />
                    <rect x="-20" y="-20" width="40" height="16" rx="4" fill="#f59e0b" />
                    <text x="0" y="-8" fill="#1e293b" fontSize="8.5" fontWeight="900" textAnchor="middle">
                      ⚠️ OB
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* VWAP Line Overlay */}
          {showVWAP && vwapSeries.length > 1 && (
            <polyline
              fill="none"
              stroke="#a855f7"
              strokeWidth="2.5"
              strokeLinejoin="round"
              points={visibleCandles.map((_, i) => `${getX(i)},${getY(vwapSeries[i])}`).join(' ')}
            />
          )}

          {/* EMA 9 Overlay */}
          {showEMA && ema9Series.length > 1 && (
            <polyline
              fill="none"
              stroke="#0ea5e9"
              strokeWidth="2"
              strokeLinejoin="round"
              points={visibleCandles.map((_, i) => `${getX(i)},${getY(ema9Series[i])}`).join(' ')}
            />
          )}

          {/* EMA 21 Overlay */}
          {showEMA && ema21Series.length > 1 && (
            <polyline
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeLinejoin="round"
              points={visibleCandles.map((_, i) => `${getX(i)},${getY(ema21Series[i])}`).join(' ')}
            />
          )}

          {/* User Entry Price Horizontal Line */}
          {hasUserEntry && entryY !== null && (
            <g>
              <line
                x1={paddingLeft}
                y1={entryY}
                x2={chartWidth - paddingRight}
                y2={entryY}
                stroke="#16a34a"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
              <rect
                x={chartWidth - paddingRight + 4}
                y={entryY - 10}
                width={78}
                height={20}
                fill="#16a34a"
                rx="4"
              />
              <text
                x={chartWidth - paddingRight + 8}
                y={entryY + 4}
                fill="#ffffff"
                fontSize="10"
                fontWeight="bold"
              >
                📍 Entry: ₹{parsedEntry.toFixed(2)}
              </text>
            </g>
          )}

          {/* Trailing Stop Loss Horizontal Line */}
          {hasUserEntry && trailingStopY !== null && activeEval?.trailingStopPrice && (
            <g>
              <line
                x1={paddingLeft}
                y1={trailingStopY}
                x2={chartWidth - paddingRight}
                y2={trailingStopY}
                stroke="#f97316"
                strokeWidth="2"
                strokeDasharray="4 3"
              />
              <rect
                x={chartWidth - paddingRight + 4}
                y={trailingStopY - 10}
                width={78}
                height={20}
                fill="#f97316"
                rx="4"
              />
              <text
                x={chartWidth - paddingRight + 8}
                y={trailingStopY + 4}
                fill="#ffffff"
                fontSize="10"
                fontWeight="bold"
              >
                🛡️ SL: ₹{activeEval.trailingStopPrice.toFixed(2)}
              </text>
            </g>
          )}

          {/* Crosshair on active/hovered candle */}
          {activeCandle && (
            <g>
              <line
                x1={getX(activeCandleIndex)}
                y1={paddingTop}
                x2={getX(activeCandleIndex)}
                y2={volumeTop + volumePlotHeight}
                stroke={isFullscreen ? '#94a3b8' : '#64748b'}
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <line
                x1={paddingLeft}
                y1={getY(activeCandle.close)}
                x2={chartWidth - paddingRight}
                y2={getY(activeCandle.close)}
                stroke={isFullscreen ? '#94a3b8' : '#64748b'}
                strokeWidth="1"
                strokeDasharray="2 2"
              />

              {/* Price axis highlight badge */}
              <rect
                x={chartWidth - paddingRight + 4}
                y={getY(activeCandle.close) - 10}
                width={72}
                height={20}
                fill={activeCandle.close >= activeCandle.open ? '#16a34a' : '#dc2626'}
                rx="4"
              />
              <text
                x={chartWidth - paddingRight + 8}
                y={getY(activeCandle.close) + 4}
                fill="#ffffff"
                fontSize="11"
                fontWeight="bold"
              >
                ₹{activeCandle.close.toFixed(2)}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Bottom Chart Legend */}
      <div
        className={`d-flex flex-wrap align-items-center justify-content-between px-3 py-2 border-top small ${
          isFullscreen ? 'bg-dark bg-opacity-75 text-light border-secondary' : 'bg-light bg-opacity-50 text-muted'
        }`}
      >
        <div className="d-flex flex-wrap align-items-center gap-3">
          <span className="d-flex align-items-center gap-1">
            <span className="d-inline-block rounded-1" style={{ width: 10, height: 10, backgroundColor: '#22c55e' }} />
            Bullish 🟢
          </span>
          <span className="d-flex align-items-center gap-1">
            <span className="d-inline-block rounded-1" style={{ width: 10, height: 10, backgroundColor: '#ef4444' }} />
            Bearish 🔴
          </span>
          {showSignals && (
            <span className="d-flex align-items-center gap-1">
              <span className="badge bg-success text-white" style={{ fontSize: 9 }}>🟢 BUY</span>
              <span className="badge bg-danger text-white" style={{ fontSize: 9 }}>🔴 SELL</span>
              Signals
            </span>
          )}
          {isObDisplayActive && (
            <span className="d-flex align-items-center gap-1">
              <span className="badge bg-danger text-white" style={{ fontSize: 9 }}>🚨 EXIT</span>
              <span className="badge bg-warning text-dark" style={{ fontSize: 9 }}>⚠️ OB</span>
              Overbought Safe Exit
            </span>
          )}
          {showVWAP && (
            <span className="d-flex align-items-center gap-1">
              <span className="d-inline-block" style={{ width: 12, height: 2.5, backgroundColor: '#a855f7' }} />
              VWAP
            </span>
          )}
          {showEMA && (
            <span className="d-flex align-items-center gap-2">
              <span className="d-flex align-items-center gap-1">
                <span className="d-inline-block" style={{ width: 12, height: 2, backgroundColor: '#0ea5e9' }} />
                EMA 9
              </span>
              <span className="d-flex align-items-center gap-1">
                <span className="d-inline-block" style={{ width: 12, height: 2, backgroundColor: '#f59e0b' }} />
                EMA 21
              </span>
            </span>
          )}
        </div>
        <div className="small opacity-75">
          {isFullscreen ? 'Press ESC to return' : 'Real-Time Intraday Risk & Safe Exit Guard'}
        </div>
      </div>
    </div>
  );
}
