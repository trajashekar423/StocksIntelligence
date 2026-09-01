'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FiShield,
  FiActivity,
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
  FiRefreshCw,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiPlay,
  FiPause,
  FiLock,
  FiUnlock,
  FiSliders,
} from 'react-icons/fi';
import { ScannerStock, Position, DailyStats, TradingConfig, TradingLog, TradeSignal } from '@/src/types/trading';
import { GrowwAuthStatus } from '@/src/types/groww';
import StockDetailModal from '@/src/components/stocks/StockDetailModal.jsx';
import LivePositionRiskMonitor from './LivePositionRiskMonitor';
import { registerNewOpenPosition } from '@/src/services/risk/positionTracker';

const formatMsg = (val: any, fallback = 'Operation failed.'): string => {
  if (!val) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val?.message === 'string') return val.message;
  if (typeof val?.error === 'string') return val.error;
  if (typeof val?.error?.message === 'string') return val.error.message;
  try {
    return JSON.stringify(val);
  } catch {
    return fallback;
  }
};

export default function IntradayTradingModule() {
  // State
  const [stocks, setStocks] = useState<ScannerStock[]>([]);
  const [selectedStock, setSelectedStock] = useState<ScannerStock | null>(null);
  const [showChartModal, setShowChartModal] = useState(false);
  const [signal, setSignal] = useState<TradeSignal | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [closedTrades, setClosedTrades] = useState<Position[]>([]);
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [logs, setLogs] = useState<TradingLog[]>([]);
  const [growwAuth, setGrowwAuth] = useState<GrowwAuthStatus | null>(null);
  const [marketStatus, setMarketStatus] = useState<any>(null);
  const [config, setConfig] = useState<TradingConfig | null>(null);

  // Loading & Action states
  const [loadingScanner, setLoadingScanner] = useState(true);
  const [executingOrder, setExecutingOrder] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showLiveConfirmModal, setShowLiveConfirmModal] = useState(false);
  const [customQuantity, setCustomQuantity] = useState<number | ''>('');
  const [activeTab, setActiveTab] = useState<'scanner' | 'positions' | 'logs' | 'settings'>('scanner');

  // Load Status & Positions
  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/trading/status');
      if (res.ok) {
        const data = await res.json();
        setPositions(data.positions || []);
        setClosedTrades(data.closedPositions || []);
        setStats(data.stats || null);
        setLogs(data.logs || []);
        setMarketStatus(data.marketStatus || null);
        setGrowwAuth(data.growwAuth || null);
        setConfig(data.config || null);
      }
    } catch {
      // ignore
    }
  }, []);

  // Load Scanner Stocks
  const loadScanner = useCallback(async () => {
    setLoadingScanner(true);
    try {
      const res = await fetch('/api/scanner/intraday?limit=40');
      if (res.ok) {
        const data: ScannerStock[] = await res.json();
        setStocks(data);
        if (data.length > 0 && !selectedStock) {
          setSelectedStock(data[0]);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingScanner(false);
    }
  }, [selectedStock]);

  // Initial load and polling intervals
  useEffect(() => {
    loadStatus();
    loadScanner();

    // Fast polling for positions & status (every 3 seconds)
    const statusInterval = setInterval(loadStatus, 3000);
    // Scanner refresh (every 15 seconds)
    const scannerInterval = setInterval(loadScanner, 15000);

    return () => {
      clearInterval(statusInterval);
      clearInterval(scannerInterval);
    };
  }, [loadStatus, loadScanner]);

  // Load Trade Signal when selected stock changes
  useEffect(() => {
    if (!selectedStock) return;
    setCustomQuantity(selectedStock.suggestedQty || '');

    fetch('/api/trading/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: selectedStock.symbol, stockData: selectedStock }),
    })
      .then((res) => res.json())
      .then((data) => setSignal(data))
      .catch(() => setSignal(null));
  }, [selectedStock]);

  // Execute Buy Order
  const handleBuyOrder = async () => {
    if (!selectedStock) return;
    setExecutingOrder(true);
    setActionMessage(null);

    try {
      const res = await fetch('/api/trading/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: selectedStock.symbol,
          entryPrice: selectedStock.ltp,
          stopLoss: selectedStock.stopLoss,
          target: selectedStock.target,
          quantity: typeof customQuantity === 'number' && customQuantity > 0 ? customQuantity : selectedStock.suggestedQty,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const orderQty = typeof customQuantity === 'number' && customQuantity > 0 ? customQuantity : selectedStock.suggestedQty || 10;
        try {
          registerNewOpenPosition(
            selectedStock.symbol,
            selectedStock.companyName,
            orderQty,
            selectedStock.ltp,
            selectedStock.stopLoss,
            'MIS'
          );
        } catch {
          // Ignore registration error
        }

        setActionMessage({
          type: 'success',
          text: `Order placed successfully! Position opened for ${selectedStock.symbol} (${data.position?.mode} Mode) with Active Risk Monitoring.`,
        });
        loadStatus();
      } else {
        setActionMessage({
          type: 'error',
          text: formatMsg(data?.error, 'Order rejected by risk management gate.'),
        });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: formatMsg(err, 'Network error during order execution.') });
    } finally {
      setExecutingOrder(false);
    }
  };

  // Close Position
  const handleClosePosition = async (positionId: string, symbol: string) => {
    try {
      const res = await fetch('/api/trading/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positionId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({ type: 'info', text: `Position for ${symbol} closed successfully.` });
        loadStatus();
      } else {
        setActionMessage({ type: 'error', text: formatMsg(data?.error, 'Failed to close position.') });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: formatMsg(err, 'Error closing position.') });
    }
  };

  // Toggle Kill Switch (Stop New Trades)
  const handleToggleKillSwitch = async () => {
    if (!config) return;
    const nextEnabled = !config.enabled;

    try {
      const res = await fetch('/api/trading/kill-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextEnabled }),
      });
      if (res.ok) {
        loadStatus();
        setActionMessage({
          type: nextEnabled ? 'success' : 'info',
          text: nextEnabled ? 'Emergency Kill Switch deactivated. Trading resumed.' : 'Emergency Kill Switch activated! All new orders blocked.',
        });
      }
    } catch {
      // ignore
    }
  };

  // Switch Trading Mode (Paper vs Live)
  const handleSwitchMode = async (targetMode: 'PAPER' | 'LIVE') => {
    if (targetMode === 'LIVE') {
      setShowLiveConfirmModal(true);
      return;
    }

    try {
      const res = await fetch('/api/trading/kill-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'PAPER' }),
      });
      if (res.ok) {
        loadStatus();
        setActionMessage({ type: 'info', text: 'Switched to PAPER TRADING mode (safe simulation).' });
      }
    } catch {
      // ignore
    }
  };

  const confirmLiveMode = async () => {
    setShowLiveConfirmModal(false);
    try {
      const res = await fetch('/api/trading/kill-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'LIVE' }),
      });
      if (res.ok) {
        loadStatus();
        setActionMessage({
          type: 'error',
          text: '⚠️ WARNING: LIVE TRADING ACTIVATED. Real orders will now be routed to Groww.',
        });
      }
    } catch {
      // ignore
    }
  };

  // Reset Paper Trading Mode
  const handleResetPaperMode = async () => {
    if (
      !window.confirm(
        'Reset Paper Trading Journal? This will clear active positions, reset Realized P&L to ₹0.00, and restore virtual capital to ₹50,000.'
      )
    ) {
      return;
    }
    try {
      const res = await fetch('/api/trading/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capital: 50000 }),
      });
      if (res.ok) {
        await loadStatus();
        setActionMessage({
          type: 'success',
          text: '✓ Paper Trading Journal Reset! Virtual balance restored to ₹50,000 (0 trades, ₹0.00 P&L).',
        });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Failed to reset paper trading mode.' });
    }
  };

  const isLive = config?.mode === 'LIVE';

  return (
    <div className="container-fluid px-0">
      {/* ── TOP HEADER: Status & Kill Switch ── */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16 }}>
        <div className="card-body p-3 p-md-4">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            {/* Brand & Market Status */}
            <div className="d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center text-white rounded-3 shadow-sm"
                style={{
                  width: 46,
                  height: 46,
                  background: 'linear-gradient(135deg, #00d09c, #00b386)',
                  fontWeight: 900,
                  fontSize: 22,
                }}
              >
                G
              </div>
              <div>
                <div className="d-flex align-items-center gap-2">
                  <h4 className="fw-bold mb-0">Groww Intraday Trading Module</h4>
                  <span
                    className={`badge ${marketStatus?.isMarketOpen ? 'bg-success' : 'bg-secondary'}`}
                    style={{ fontSize: '0.75rem' }}
                  >
                    NSE {marketStatus?.status || (marketStatus?.isMarketOpen ? 'OPEN' : 'CLOSED')}
                  </span>
                </div>
                <div className="small text-muted">
                  IST Time: {marketStatus?.istTime || new Date().toLocaleTimeString()} · Real-time Technical Scoring & Execution
                </div>
              </div>
            </div>

            {/* Mode Indicator & Kill Switch */}
            <div className="d-flex flex-wrap align-items-center gap-2">
              {/* Groww Connection Badge */}
              <div
                className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 border bg-light small"
                title={`Groww Connection Status: ${growwAuth?.status || 'CHECKING'}`}
              >
                <div
                  className={`rounded-circle ${growwAuth?.authenticated ? 'bg-success' : 'bg-warning'}`}
                  style={{ width: 10, height: 10 }}
                />
                <span className="fw-semibold">
                  Groww: {growwAuth?.authenticated ? 'Connected' : 'Disconnected / Paper'}
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-link p-0 text-muted ms-1"
                  onClick={() => loadStatus()}
                  title="Refresh Connection"
                >
                  <FiRefreshCw size={12} />
                </button>
              </div>

              {/* Mode Selector */}
              <div className="btn-group btn-group-sm p-1 rounded-3 bg-light border">
                <button
                  type="button"
                  className={`btn rounded-2 fw-bold ${!isLive ? 'btn-warning text-dark shadow-sm' : 'btn-light text-muted'}`}
                  onClick={() => handleSwitchMode('PAPER')}
                >
                  🟡 PAPER MODE
                </button>
                <button
                  type="button"
                  className={`btn rounded-2 fw-bold ${isLive ? 'btn-danger shadow-sm' : 'btn-light text-muted'}`}
                  onClick={() => handleSwitchMode('LIVE')}
                >
                  🔴 LIVE MODE
                </button>
              </div>

              {/* Reset Paper Journal Button (Only in Paper Mode) */}
              {!isLive && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary rounded-3 fw-semibold d-flex align-items-center gap-1 shadow-sm"
                  onClick={handleResetPaperMode}
                  title="Reset Virtual Balance to ₹50,000 and clear trade history"
                >
                  <FiRefreshCw size={12} /> Reset Paper Journal
                </button>
              )}

              {/* Kill Switch Toggle */}
              <button
                type="button"
                className={`btn btn-sm fw-bold d-flex align-items-center gap-1 ${config?.enabled ? 'btn-outline-danger' : 'btn-danger'}`}
                onClick={handleToggleKillSwitch}
              >
                {config?.enabled ? (
                  <>
                    <FiLock size={14} /> STOP NEW TRADES
                  </>
                ) : (
                  <>
                    <FiUnlock size={14} /> RESUME TRADES (STOPPED)
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action / Alert Banner */}
          {actionMessage && (
            <div
              className={`alert alert-${actionMessage.type === 'error' ? 'danger' : actionMessage.type === 'success' ? 'success' : 'info'} alert-dismissible fade show mt-3 mb-0 small`}
              role="alert"
            >
              <div className="d-flex flex-column gap-1">
                <div>
                  <strong>{actionMessage.type === 'error' ? '⚠️ ' : '✓ '}</strong> {formatMsg(actionMessage.text)}
                </div>
                {actionMessage.text && actionMessage.text.includes('403 Forbidden') && (
                  <div className="mt-2 p-2 rounded-2 bg-dark text-white d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <div>
                      <span className="text-warning fw-bold">Your Outbound IP:</span>{' '}
                      <code className="text-info bg-black px-2 py-0.5 rounded user-select-all">183.83.231.209</code>
                      <div className="text-white-50 mt-0.5" style={{ fontSize: 11 }}>
                        Add this IP in Groww Developer Console → API Keys → Allowed IPs to enable LIVE trading.
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-warning fw-bold px-3 py-1 text-dark"
                      onClick={() => handleSwitchMode('PAPER')}
                    >
                      🟡 Switch to Paper Mode (Instant)
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setActionMessage(null)}
                aria-label="Close"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── STATS ROW ── */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3 h-100" style={{ borderRadius: 14 }}>
            <div className="text-muted small fw-semibold">Realized P&L (Today)</div>
            <div
              className={`fs-4 fw-bold mt-1 ${Number(stats?.realizedPnL || 0) >= 0 ? 'text-success' : 'text-danger'}`}
            >
              {Number(stats?.realizedPnL || 0) >= 0 ? '+' : ''}₹
              {Number(stats?.realizedPnL || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <small className="text-muted">
              {stats?.tradesToday || 0} Trades ({stats?.winRate || 0}% Win Rate)
            </small>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3 h-100" style={{ borderRadius: 14 }}>
            <div className="text-muted small fw-semibold">Unrealized P&L</div>
            <div
              className={`fs-4 fw-bold mt-1 ${Number(stats?.unrealizedPnL || 0) >= 0 ? 'text-success' : 'text-danger'}`}
            >
              {Number(stats?.unrealizedPnL || 0) >= 0 ? '+' : ''}₹
              {Number(stats?.unrealizedPnL || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <small className="text-muted">{positions.length} Active Positions</small>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3 h-100" style={{ borderRadius: 14 }}>
            <div className="text-muted small fw-semibold">Risk Budget Remaining</div>
            <div className="fs-4 fw-bold text-primary mt-1">
              ₹{Number(stats?.remainingRiskLimit || config?.maxDailyLoss || 2000).toLocaleString('en-IN')}
            </div>
            <small className="text-muted">Daily Max Loss: ₹{config?.maxDailyLoss || 2000}</small>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3 h-100" style={{ borderRadius: 14 }}>
            <div className="text-muted small fw-semibold">Available Capital</div>
            <div className="fs-4 fw-bold text-dark mt-1">
              ₹{Number(config?.capital || 50000).toLocaleString('en-IN')}
            </div>
            <small className="text-muted">Risk/Trade: {config?.riskPerTradePct || 1}%</small>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT GRID ── */}
      <div className="row g-4 mb-4">
        {/* Left Column: Intraday Scanner Table */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
            <div className="card-header bg-transparent border-0 pt-3 px-3 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <span className="fs-5 fw-bold">🎯 Bullish Intraday Scanner</span>
                <span className="badge bg-primary-subtle text-primary rounded-pill">0–100 Score</span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                onClick={loadScanner}
                disabled={loadingScanner}
              >
                <FiRefreshCw size={12} className={loadingScanner ? 'spinner-border spinner-border-sm' : ''} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="card-body p-0">
              <div className="table-responsive" style={{ maxHeight: 520 }}>
                <table className="table table-hover align-middle mb-0 text-nowrap">
                  <thead className="table-light sticky-top">
                    <tr className="small text-muted">
                      <th>#</th>
                      <th>Symbol</th>
                      <th>LTP</th>
                      <th>Change</th>
                      <th>VWAP</th>
                      <th>RSI</th>
                      <th>Bullish Score</th>
                      <th>Signal</th>
                      <th>Risk/Reward</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingScanner && stocks.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-5 text-muted">
                          <div className="spinner-border spinner-border-sm me-2" role="status" />
                          Evaluating NSE live momentum & technical indicators...
                        </td>
                      </tr>
                    ) : stocks.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-5 text-muted">
                          No candidate stocks matched bullish criteria right now.
                        </td>
                      </tr>
                    ) : (
                      stocks.map((stock) => {
                        const isSelected = selectedStock?.symbol === stock.symbol;
                        const scoreColor =
                          stock.bullishScore >= 80
                            ? 'bg-success'
                            : stock.bullishScore >= 65
                            ? 'bg-primary'
                            : stock.bullishScore >= 50
                            ? 'bg-warning text-dark'
                            : 'bg-danger';

                        return (
                          <tr
                            key={stock.symbol}
                            className={isSelected ? 'table-active' : ''}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedStock(stock)}
                          >
                            <td className="fw-bold text-muted small">{stock.rank}</td>
                            <td>
                              <div className="fw-bold">{stock.symbol}</div>
                              <small className="text-muted d-block text-truncate" style={{ maxWidth: 120 }}>
                                {stock.companyName}
                              </small>
                            </td>
                            <td className="fw-bold">₹{stock.ltp.toFixed(2)}</td>
                            <td className={stock.changePercent >= 0 ? 'text-success fw-semibold' : 'text-danger'}>
                              {stock.changePercent >= 0 ? '+' : ''}
                              {stock.changePercent.toFixed(2)}%
                            </td>
                            <td className="small">₹{stock.vwap.toFixed(2)}</td>
                            <td className="small">{stock.rsi.toFixed(0)}</td>
                            <td>
                              <span className={`badge ${scoreColor}`} style={{ fontSize: '0.85rem' }}>
                                {stock.bullishScore}/100
                              </span>
                            </td>
                            <td>
                              <span className="small fw-semibold">
                                {stock.signal === 'STRONG_BULLISH' ? '🟢 STRONG' : stock.signal === 'BULLISH' ? '🟢 BUY' : '⚪ NEUTRAL'}
                              </span>
                            </td>
                            <td className="small fw-semibold">{stock.riskReward}:1</td>
                            <td className="text-end">
                              <button
                                type="button"
                                className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedStock(stock);
                                }}
                              >
                                Analyze
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Selected Stock Execution Panel */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
            <div className="card-header bg-transparent border-0 pt-3 px-3">
              <h5 className="fw-bold mb-0">⚡ Order Execution Panel</h5>
            </div>

            <div className="card-body p-3">
              {selectedStock ? (
                <div>
                  {/* Symbol Header */}
                  <div className="d-flex justify-content-between align-items-start mb-3 pb-3 border-bottom">
                    <div>
                      <h4 className="fw-bold mb-0">{selectedStock.symbol}</h4>
                      <small className="text-muted">{selectedStock.companyName}</small>
                    </div>
                    <div className="text-end">
                      <div className="fs-5 fw-bold">₹{selectedStock.ltp.toFixed(2)}</div>
                      <span className={`small fw-semibold ${selectedStock.changePercent >= 0 ? 'text-success' : 'text-danger'}`}>
                        {selectedStock.changePercent >= 0 ? '+' : ''}
                        {selectedStock.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* Trade Setup Levels */}
                  <div className="bg-light p-3 rounded-3 mb-3 small">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Target (1:2 R:R):</span>
                      <strong className="text-success">₹{selectedStock.target.toFixed(2)}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Entry Price:</span>
                      <strong>₹{selectedStock.ltp.toFixed(2)}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Stop Loss:</span>
                      <strong className="text-danger">₹{selectedStock.stopLoss.toFixed(2)}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-0">
                      <span className="text-muted">Support / VWAP:</span>
                      <span>₹{selectedStock.support.toFixed(2)} / ₹{selectedStock.vwap.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Signal Reasons */}
                  {signal?.reasons && signal.reasons.length > 0 && (
                    <div className="mb-3">
                      <div className="small fw-bold text-muted mb-1">CONVICTION FACTORS:</div>
                      <div className="d-flex flex-wrap gap-1">
                        {signal.reasons.map((r, i) => (
                          <span key={i} className="badge bg-success-subtle text-success border border-success-subtle small">
                            ✓ {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sizing & Risk Calculator */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">
                      QUANTITY (RISK SIZED: {config?.riskPerTradePct}%):
                    </label>
                    <div className="input-group">
                      <input
                        type="number"
                        min="1"
                        className="form-control fw-bold"
                        value={customQuantity}
                        onChange={(e) => setCustomQuantity(e.target.value ? Number(e.target.value) : '')}
                        placeholder="Quantity"
                      />
                      <span className="input-group-text small">Shares</span>
                    </div>
                    <div className="d-flex justify-content-between text-muted small mt-1">
                      <span>Total Value: ₹{((Number(customQuantity) || selectedStock.suggestedQty || 1) * selectedStock.ltp).toFixed(0)}</span>
                      <span>
                        Max Risk: ₹
                        {(
                          (Number(customQuantity) || selectedStock.suggestedQty || 1) *
                          Math.max(selectedStock.ltp - selectedStock.stopLoss, selectedStock.ltp * 0.005)
                        ).toFixed(0)}
                      </span>
                    </div>
                  </div>

                  {/* 1-Click Buy Action */}
                  <button
                    type="button"
                    className={`btn w-100 py-2 fw-bold text-white rounded-pill shadow-sm mb-2 ${isLive ? 'btn-danger' : 'btn-success'}`}
                    onClick={handleBuyOrder}
                    disabled={executingOrder || !config?.enabled}
                  >
                    {executingOrder ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" /> Executing Order...
                      </>
                    ) : isLive ? (
                      `🔴 PLACE LIVE BUY ORDER (${selectedStock.symbol})`
                    ) : (
                      `🟡 PLACE PAPER BUY ORDER (${selectedStock.symbol})`
                    )}
                  </button>

                  {/* Interactive Chart & Anatomy Modal Trigger */}
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm w-100 rounded-pill mb-2 fw-semibold d-flex align-items-center justify-content-center gap-1"
                    onClick={() => setShowChartModal(true)}
                  >
                    📈 View Candlestick Chart & Live Anatomy
                  </button>

                  <div className="text-center small text-muted">
                    {isLive
                      ? '⚠️ Live execution via Groww API with automated risk management.'
                      : '🟡 Paper simulated order with virtual P&L tracking.'}
                  </div>
                </div>
              ) : (
                <div className="text-center py-5 text-muted">
                  Select a stock from the scanner to view trade setup and execute.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── LIVE OPEN POSITION RISK & EXIT ALERT ENGINE ── */}
      <LivePositionRiskMonitor />

      {/* ── OPEN POSITIONS & RECENT TRADES ── */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16 }}>
        <div className="card-header bg-transparent border-0 pt-3 px-3">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h5 className="fw-bold mb-0">📊 Active Open Positions ({positions.length})</h5>
            <div className="d-flex align-items-center gap-2">
              <span className="small text-muted">Auto-trailing Stop & Target Monitored</span>
              {!isLive && (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm rounded-pill px-2.5 py-0.5 small"
                  onClick={handleResetPaperMode}
                  title="Reset Virtual Journal"
                >
                  🔄 Reset Journal
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 text-nowrap">
              <thead className="table-light">
                <tr className="small text-muted">
                  <th>Symbol</th>
                  <th>Mode</th>
                  <th>Quantity</th>
                  <th>Entry Price</th>
                  <th>Current Price</th>
                  <th>Stop Loss / Trailing SL</th>
                  <th>Target</th>
                  <th>P&L (Unrealized)</th>
                  <th>Status</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {positions.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-4 text-muted">
                      No open positions currently active. Execute an intraday signal to start tracking.
                    </td>
                  </tr>
                ) : (
                  positions.map((pos) => {
                    const isProfit = pos.unrealizedPnL >= 0;
                    return (
                      <tr key={pos.id}>
                        <td className="fw-bold">{pos.symbol}</td>
                        <td>
                          <span className={`badge ${pos.mode === 'LIVE' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                            {pos.mode}
                          </span>
                        </td>
                        <td className="fw-semibold">{pos.quantity}</td>
                        <td>₹{pos.entryPrice.toFixed(2)}</td>
                        <td className="fw-bold">₹{pos.currentPrice.toFixed(2)}</td>
                        <td>
                          <div className="text-danger small">SL: ₹{pos.stopLoss.toFixed(2)}</div>
                          {pos.trailingStop > pos.stopLoss && (
                            <div className="text-primary small fw-semibold">Trail: ₹{pos.trailingStop.toFixed(2)}</div>
                          )}
                        </td>
                        <td className="text-success small fw-semibold">₹{pos.target1.toFixed(2)}</td>
                        <td>
                          <span className={`fw-bold ${isProfit ? 'text-success' : 'text-danger'}`}>
                            {isProfit ? '+' : ''}₹{pos.unrealizedPnL.toFixed(2)} ({isProfit ? '+' : ''}
                            {pos.unrealizedPnLPercent.toFixed(2)}%)
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-success-subtle text-success">{pos.status}</span>
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger rounded-pill px-3"
                            onClick={() => handleClosePosition(pos.id, pos.symbol)}
                          >
                            Close
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── LIVE TRADING LOGS ── */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
        <div className="card-header bg-transparent border-0 pt-3 px-3 d-flex justify-content-between align-items-center">
          <h6 className="fw-bold mb-0">📜 Trading Activity Stream</h6>
          <span className="badge bg-light text-muted border">{logs.length} events</span>
        </div>
        <div className="card-body p-3">
          <div
            className="bg-dark text-light p-3 rounded-3 font-monospace small"
            style={{ maxHeight: 220, overflowY: 'auto' }}
          >
            {logs.length === 0 ? (
              <div className="text-muted">Awaiting trading activity...</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="mb-1">
                  <span className="text-secondary">[{log.timeString}]</span>{' '}
                  <span
                    className={
                      log.level === 'SUCCESS'
                        ? 'text-success'
                        : log.level === 'ALERT'
                        ? 'text-warning'
                        : log.level === 'ERROR'
                        ? 'text-danger'
                        : 'text-info'
                    }
                  >
                    [{log.category}]
                  </span>{' '}
                  <span>{formatMsg(log.message)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── LIVE MODE CONFIRMATION MODAL ── */}
      {showLiveConfirmModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 shadow border-danger border-2">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fw-bold">⚠️ Switch to LIVE TRADING?</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowLiveConfirmModal(false)} />
              </div>
              <div className="modal-body p-4">
                <p className="fw-semibold text-danger">
                  You are about to enable LIVE Order Execution with your connected Groww account.
                </p>
                <ul className="small text-muted mb-3">
                  <li>Orders placed in this mode will execute with real funds on the National Stock Exchange.</li>
                  <li>Ensure your Groww credentials and margins are actively maintained.</li>
                  <li>Automated risk limits (Max loss, SL, R:R) will remain enforced.</li>
                </ul>
                <div className="alert alert-warning small mb-0">
                  Are you sure you want to activate Live Mode?
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={() => setShowLiveConfirmModal(false)}>
                  Cancel (Stay in Paper Mode)
                </button>
                <button type="button" className="btn btn-danger fw-bold" onClick={confirmLiveMode}>
                  Yes, Activate LIVE Trading
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart & Anatomy Modal */}
      {showChartModal && selectedStock && (
        <StockDetailModal
          stock={selectedStock}
          onClose={() => setShowChartModal(false)}
        />
      )}
    </div>
  );
}

