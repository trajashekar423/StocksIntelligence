'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import StockDetailModal from './StockDetailModal.jsx';

const STORAGE_WALLET_KEY = 'practice_stock_market_wallet_v1';
const STORAGE_POSITIONS_KEY = 'practice_stock_market_positions_v1';
const STORAGE_HISTORY_KEY = 'practice_stock_market_history_v1';

const INITIAL_CAPITAL = 100000; // ₹1,00,000 default dummy budget

const QUICK_STOCK_PICKS = [
  { symbol: 'MEESHO', name: 'Meesho Limited', desc: '8 Cr Share Discount Block Deal' },
  { symbol: 'GOCLCORP', name: 'GOCL Corporation', desc: '+10% Intraday Breakout' },
  { symbol: 'IFCI', name: 'IFCI Limited', desc: 'High Volume Intraday Active' },
  { symbol: 'CLEANMAX', name: 'CleanMax Enviro Energy', desc: '₹199 Cr Session 1 Block' },
  { symbol: 'KRT', name: 'KRT Limited', desc: '₹31 Cr Session 2 Block Deal' },
  { symbol: 'RELIANCE', name: 'Reliance Industries', desc: 'Nifty 50 Blue Chip' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', desc: 'Banking Major' },
];

export default function PracticeStockMarket() {
  // Wallet & Dummy Funds State
  const [wallet, setWallet] = useState({
    balance: INITIAL_CAPITAL,
    initialCapital: INITIAL_CAPITAL,
  });

  // Active Positions & History
  const [openPositions, setOpenPositions] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);

  // Selected Stock for Practice Analysis & Order Placement
  const [selectedSymbol, setSelectedSymbol] = useState('MEESHO');
  const [searchSymbolInput, setSearchSymbolInput] = useState('');
  const [quoteData, setQuoteData] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);

  // Order Placement Inputs
  const [orderQty, setOrderQty] = useState(100);
  const [customSlPct, setCustomSlPct] = useState(1.5); // default 1.5% Stop Loss
  const [customTgtPct, setCustomTgtPct] = useState(2.5); // default 2.5% Target 1
  const [orderFeedback, setOrderFeedback] = useState(null);

  // Modals & Sound
  const [chartModalStock, setChartModalStock] = useState(null);
  const [showLearningGuide, setShowLearningGuide] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Audio Synthesizer for Practice Notifications
  const playSound = useCallback((type) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const now = ctx.currentTime;

      if (type === 'WIN' || type === 'PROFIT') {
        // High pitch pleasant rising chime (C5 -> E5 -> G5 -> C6)
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.12, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.28);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.28);
        });
      } else if (type === 'STOP_LOSS') {
        // Controlled warning beep (440Hz -> 330Hz)
        [440, 329.63].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);
          gain.gain.setValueAtTime(0.1, now + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 0.25);
        });
      }
    } catch {
      // ignore
    }
  }, [soundEnabled]);

  // 1. Load LocalStorage on mount
  useEffect(() => {
    try {
      const savedWallet = localStorage.getItem(STORAGE_WALLET_KEY);
      if (savedWallet) setWallet(JSON.parse(savedWallet));

      const savedPositions = localStorage.getItem(STORAGE_POSITIONS_KEY);
      if (savedPositions) setOpenPositions(JSON.parse(savedPositions));

      const savedHistory = localStorage.getItem(STORAGE_HISTORY_KEY);
      if (savedHistory) setTradeHistory(JSON.parse(savedHistory));
    } catch {
      // ignore
    }
  }, []);

  // 2. Save Wallet
  const updateWallet = (newWallet) => {
    setWallet(newWallet);
    try {
      localStorage.setItem(STORAGE_WALLET_KEY, JSON.stringify(newWallet));
    } catch {
      // ignore
    }
  };

  // 3. Save Positions
  const updatePositions = (newPositions) => {
    setOpenPositions(newPositions);
    try {
      localStorage.setItem(STORAGE_POSITIONS_KEY, JSON.stringify(newPositions));
    } catch {
      // ignore
    }
  };

  // 4. Save History
  const updateHistory = (newHistory) => {
    setTradeHistory(newHistory);
    try {
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(newHistory));
    } catch {
      // ignore
    }
  };

  // Preset Balance Reset
  const handleSetCapital = (amount) => {
    const updated = {
      balance: amount,
      initialCapital: amount,
    };
    updateWallet(updated);
    setOrderFeedback(`💰 Dummy Funds Reset to ₹${amount.toLocaleString('en-IN')}`);
    setTimeout(() => setOrderFeedback(null), 3000);
  };

  // Reset Everything
  const handleResetAll = () => {
    if (window.confirm('Reset all practice positions, wallet balance, and trade history?')) {
      const freshWallet = { balance: INITIAL_CAPITAL, initialCapital: INITIAL_CAPITAL };
      updateWallet(freshWallet);
      updatePositions([]);
      updateHistory([]);
      setOrderFeedback('🔄 Simulator completely reset with ₹1,00,000 dummy funds!');
      setTimeout(() => setOrderFeedback(null), 3500);
    }
  };

  // 5. Fetch Live Quote for Selected Symbol
  const fetchLiveQuote = useCallback(async (sym) => {
    if (!sym) return;
    setQuoteLoading(true);
    setQuoteError(null);
    try {
      const res = await fetch(`/api/quote-equity?symbol=${encodeURIComponent(sym)}`);
      if (res.ok) {
        const json = await res.json();
        const priceInfo = json?.priceInfo || {};
        const ltp = Number(priceInfo.lastPrice || 0);
        if (ltp > 0) {
          setQuoteData({
            symbol: sym,
            companyName: json?.info?.companyName || `${sym} Limited`,
            price: ltp,
            previousClose: Number(priceInfo.previousClose || ltp),
            change: Number(priceInfo.change || 0),
            pChange: Number(priceInfo.pChange || 0),
            vwap: Number(priceInfo.vwap || ltp),
            high: Number(priceInfo.intraDayHighLow?.max || ltp),
            low: Number(priceInfo.intraDayHighLow?.min || ltp),
            lastUpdated: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
          });
        } else {
          setQuoteError(`No price data received for ${sym}`);
        }
      } else {
        setQuoteError(`Failed to fetch live quote for ${sym} (HTTP ${res.status})`);
      }
    } catch (err) {
      setQuoteError(err.message || 'Network error');
    } finally {
      setQuoteLoading(false);
    }
  }, []);

  // Poll live quote for selected symbol
  useEffect(() => {
    fetchLiveQuote(selectedSymbol);
    const timer = setInterval(() => fetchLiveQuote(selectedSymbol), 10000);
    return () => clearInterval(timer);
  }, [selectedSymbol, fetchLiveQuote]);

  // 6. Live Tick Polling for ALL Open Positions (Every 10 seconds)
  useEffect(() => {
    if (openPositions.length === 0) return;

    let isMounted = true;
    const pollPositions = async () => {
      const updatedList = await Promise.all(
        openPositions.map(async (pos) => {
          try {
            const res = await fetch(`/api/quote-equity?symbol=${pos.symbol}`);
            if (!res.ok) return pos;
            const data = await res.json();
            const currentPrice = Number(data?.priceInfo?.lastPrice || pos.currentPrice);
            const vwap = Number(data?.priceInfo?.vwap || pos.vwap || currentPrice);
            const pnl = Number(((currentPrice - pos.entryPrice) * pos.qty).toFixed(2));
            const pnlPct = Number((((currentPrice - pos.entryPrice) / pos.entryPrice) * 100).toFixed(2));

            let highestPrice = Math.max(pos.highestPrice || pos.entryPrice, currentPrice);
            let trailingStop = pos.trailingStop || pos.stopLoss;

            // Never-Red Rule 1: If price touched Target 1 (+2%), Move SL to Cost (Entry Price)!
            if (highestPrice >= pos.target1 && trailingStop < pos.entryPrice) {
              trailingStop = pos.entryPrice;
            }

            // Never-Red Rule 2: Monotonic Trailing SL as price climbs higher (+1.0% trail)
            if (pnlPct >= 3.0) {
              const trailTarget = Number((currentPrice * 0.985).toFixed(2)); // trail 1.5% below peak
              if (trailTarget > trailingStop) trailingStop = trailTarget;
            }

            // AUTO-EXIT CHECK: STOP LOSS TRIGGERED
            if (currentPrice <= trailingStop) {
              // Simulated Stop Loss Hit
              playSound('STOP_LOSS');
              const closedTrade = {
                id: pos.id,
                symbol: pos.symbol,
                companyName: pos.companyName,
                qty: pos.qty,
                entryPrice: pos.entryPrice,
                exitPrice: trailingStop,
                pnl: Number(((trailingStop - pos.entryPrice) * pos.qty).toFixed(2)),
                pnlPct: Number((((trailingStop - pos.entryPrice) / pos.entryPrice) * 100).toFixed(2)),
                exitReason: trailingStop >= pos.entryPrice ? '🛡️ Breakeven SL Protected (Never-Red)' : '🛑 Stop Loss Hit (Capital Defended)',
                lesson: trailingStop >= pos.entryPrice 
                  ? 'Excellent execution! You moved Stop Loss to Cost and avoided turning a winning trade into a loss.' 
                  : 'Great discipline! Taking a small controlled loss preserved your trading capital to fight another day.',
                entryTime: pos.entryTime,
                exitTime: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
              };

              // Return capital back to wallet
              const returnedCash = (pos.qty * pos.entryPrice) + closedTrade.pnl;
              setWallet((prev) => {
                const nextWallet = { ...prev, balance: Number((prev.balance + returnedCash).toFixed(2)) };
                localStorage.setItem(STORAGE_WALLET_KEY, JSON.stringify(nextWallet));
                return nextWallet;
              });

              setTradeHistory((prev) => {
                const nextHist = [closedTrade, ...prev];
                localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(nextHist));
                return nextHist;
              });

              setOrderFeedback(`🛑 ${pos.symbol} Stop Loss Triggered at ₹${trailingStop.toFixed(2)} (P&L: ₹${closedTrade.pnl})`);
              setTimeout(() => setOrderFeedback(null), 4000);
              return null; // remove from open
            }

            // AUTO-EXIT CHECK: TARGET 2 HIT (+5.0% RUNNER)
            if (pos.target2 && currentPrice >= pos.target2) {
              playSound('WIN');
              const closedTrade = {
                id: pos.id,
                symbol: pos.symbol,
                companyName: pos.companyName,
                qty: pos.qty,
                entryPrice: pos.entryPrice,
                exitPrice: pos.target2,
                pnl: Number(((pos.target2 - pos.entryPrice) * pos.qty).toFixed(2)),
                pnlPct: Number((((pos.target2 - pos.entryPrice) / pos.entryPrice) * 100).toFixed(2)),
                exitReason: '🎯 Target 2 (+5.0%) Runner Hit!',
                lesson: 'Masterclass trade! You let your runner position capture the full institutional expansion wave.',
                entryTime: pos.entryTime,
                exitTime: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
              };

              const returnedCash = (pos.qty * pos.entryPrice) + closedTrade.pnl;
              setWallet((prev) => {
                const nextWallet = { ...prev, balance: Number((prev.balance + returnedCash).toFixed(2)) };
                localStorage.setItem(STORAGE_WALLET_KEY, JSON.stringify(nextWallet));
                return nextWallet;
              });

              setTradeHistory((prev) => {
                const nextHist = [closedTrade, ...prev];
                localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(nextHist));
                return nextHist;
              });

              setOrderFeedback(`🎉 ${pos.symbol} Target 2 Hit (+₹${closedTrade.pnl})! Full Profit Banked!`);
              setTimeout(() => setOrderFeedback(null), 4000);
              return null;
            }

            return {
              ...pos,
              currentPrice,
              vwap,
              highestPrice,
              trailingStop,
              pnl,
              pnlPct,
            };
          } catch {
            return pos;
          }
        })
      );

      if (isMounted) {
        const remaining = updatedList.filter(Boolean);
        setOpenPositions(remaining);
        localStorage.setItem(STORAGE_POSITIONS_KEY, JSON.stringify(remaining));
      }
    };

    const interval = setInterval(pollPositions, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [openPositions, playSound]);

  // 7. Educational Entry Checklist Logic (When to Enter vs When to Avoid)
  const entryAnalysis = useMemo(() => {
    if (!quoteData) return null;
    const price = quoteData.price;
    const vwap = quoteData.vwap;
    const pChange = quoteData.pChange;
    const low = quoteData.low;

    const isAboveVwap = price >= vwap;
    const isGreen = pChange > 0;
    const isHoldingLow = price > (low * 1.01);

    let score = 50;
    if (isAboveVwap) score += 30;
    else score -= 30;

    if (isGreen) score += 20;
    else score -= 20;

    let status = 'CAUTION';
    let badgeClass = 'bg-warning text-dark';
    let title = '⚠️ CAUTION — WAIT FOR CONFIRMATION';
    let guidance = 'Price is fluttering or below VWAP. Wait for a clean 5-minute candle close above VWAP!';

    if (score >= 80) {
      status = 'SAFE_ENTRY';
      badgeClass = 'bg-success text-white';
      title = '🟢 SAFE ENTRY CONFIRMED (Institutional Floor Active)';
      guidance = `Price (₹${price.toFixed(2)}) is defending VWAP (₹${vwap.toFixed(2)}) in the green (+${pChange.toFixed(2)}%). Safe to enter with Stop Loss below VWAP!`;
    } else if (score <= 40) {
      status = 'DUMP_TRAP';
      badgeClass = 'bg-danger text-white';
      title = '🔴 TRAP ZONE — DO NOT BUY (Supply Overhang)';
      guidance = `Price (₹${price.toFixed(2)}) is trapped BELOW VWAP (₹${vwap.toFixed(2)}). Trapped sellers are dumping on rallies. Buying here is catching a falling knife!`;
    }

    // Calculated SL and Target
    const calculatedSl = Number((price * (1 - (customSlPct / 100))).toFixed(2));
    const calculatedTgt1 = Number((price * (1 + (customTgtPct / 100))).toFixed(2));
    const calculatedTgt2 = Number((price * 1.05).toFixed(2));

    const marginRequired = Number((price * orderQty).toFixed(2));
    const maxRiskRupees = Number(((price - calculatedSl) * orderQty).toFixed(2));
    const expectedGainRupees = Number(((calculatedTgt1 - price) * orderQty).toFixed(2));
    const riskRewardRatio = maxRiskRupees > 0 ? (expectedGainRupees / maxRiskRupees).toFixed(1) : '2.0';

    return {
      status,
      score,
      badgeClass,
      title,
      guidance,
      isAboveVwap,
      isGreen,
      isHoldingLow,
      calculatedSl,
      calculatedTgt1,
      calculatedTgt2,
      marginRequired,
      maxRiskRupees,
      expectedGainRupees,
      riskRewardRatio,
    };
  }, [quoteData, customSlPct, customTgtPct, orderQty]);

  // 8. Place Virtual Practice Buy Order
  const handlePlaceVirtualOrder = () => {
    if (!quoteData || !entryAnalysis) return;

    if (entryAnalysis.marginRequired > wallet.balance) {
      alert(`Insufficient virtual balance! Required: ₹${entryAnalysis.marginRequired.toLocaleString('en-IN')}, Available: ₹${wallet.balance.toLocaleString('en-IN')}. Reduce quantity or reset balance.`);
      return;
    }

    const newPosition = {
      id: `PRACTICE-${Date.now()}-${quoteData.symbol}`,
      symbol: quoteData.symbol,
      companyName: quoteData.companyName,
      qty: orderQty,
      initialQty: orderQty,
      entryPrice: quoteData.price,
      currentPrice: quoteData.price,
      vwap: quoteData.vwap,
      stopLoss: entryAnalysis.calculatedSl,
      trailingStop: entryAnalysis.calculatedSl,
      target1: entryAnalysis.calculatedTgt1,
      target2: entryAnalysis.calculatedTgt2,
      highestPrice: quoteData.price,
      pnl: 0,
      pnlPct: 0,
      entryTime: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
      halfBooked: false,
    };

    // Deduct margin from wallet
    const nextWallet = {
      ...wallet,
      balance: Number((wallet.balance - entryAnalysis.marginRequired).toFixed(2)),
    };
    updateWallet(nextWallet);

    const nextPositions = [newPosition, ...openPositions];
    updatePositions(nextPositions);

    playSound('PROFIT');
    setOrderFeedback(`🎉 Virtual Buy Placed: ${orderQty} shares of ${quoteData.symbol} @ ₹${quoteData.price.toFixed(2)} (SL: ₹${entryAnalysis.calculatedSl}, T1: ₹${entryAnalysis.calculatedTgt1})`);
    setTimeout(() => setOrderFeedback(null), 4500);
  };

  // 9. Manual Partial Profit Booking (Take 50% Profit & Move SL to Cost)
  const handleTakePartialProfit = (posId) => {
    const pos = openPositions.find((p) => p.id === posId);
    if (!pos || pos.halfBooked || pos.qty < 2) return;

    const sellQty = Math.floor(pos.qty / 2);
    const remainQty = pos.qty - sellQty;
    const lockedPnl = Number(((pos.currentPrice - pos.entryPrice) * sellQty).toFixed(2));
    const lockedPnlPct = Number((((pos.currentPrice - pos.entryPrice) / pos.entryPrice) * 100).toFixed(2));

    // Release margin + locked profit to wallet
    const returnedCash = (sellQty * pos.entryPrice) + lockedPnl;
    const nextWallet = {
      ...wallet,
      balance: Number((wallet.balance + returnedCash).toFixed(2)),
    };
    updateWallet(nextWallet);

    // Update remaining position with SL moved to COST (Never-Red rule!)
    const updatedPositions = openPositions.map((p) => {
      if (p.id === posId) {
        return {
          ...p,
          qty: remainQty,
          stopLoss: p.entryPrice, // SL to cost!
          trailingStop: Math.max(p.trailingStop, p.entryPrice),
          halfBooked: true,
        };
      }
      return p;
    });
    updatePositions(updatedPositions);

    // Record partial booking in history
    const partialRecord = {
      id: `${pos.id}-PARTIAL`,
      symbol: pos.symbol,
      companyName: pos.companyName,
      qty: sellQty,
      entryPrice: pos.entryPrice,
      exitPrice: pos.currentPrice,
      pnl: lockedPnl,
      pnlPct: lockedPnlPct,
      exitReason: '🎯 50% Profit Booked at Target 1 (SL Moved to Cost)',
      lesson: 'Golden Never-Red execution! You locked cash in the bank and made the remaining 50% shares 100% risk-free.',
      entryTime: pos.entryTime,
      exitTime: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
    };
    updateHistory([partialRecord, ...tradeHistory]);

    playSound('WIN');
    setOrderFeedback(`🎯 Locked +₹${lockedPnl} (+${lockedPnlPct}%) on ${sellQty} shares of ${pos.symbol}! Stop Loss moved to Cost (₹${pos.entryPrice}). You cannot lose on this trade!`);
    setTimeout(() => setOrderFeedback(null), 5000);
  };

  // 10. Manual Close Full Position
  const handleManualClosePosition = (posId) => {
    const pos = openPositions.find((p) => p.id === posId);
    if (!pos) return;

    const returnedCash = (pos.qty * pos.entryPrice) + pos.pnl;
    const nextWallet = {
      ...wallet,
      balance: Number((wallet.balance + returnedCash).toFixed(2)),
    };
    updateWallet(nextWallet);

    const closedRecord = {
      id: pos.id,
      symbol: pos.symbol,
      companyName: pos.companyName,
      qty: pos.qty,
      entryPrice: pos.entryPrice,
      exitPrice: pos.currentPrice,
      pnl: pos.pnl,
      pnlPct: pos.pnlPct,
      exitReason: pos.pnl >= 0 ? '🟢 Manual Profit Exit' : '🛑 Manual Loss Cut',
      lesson: pos.pnl >= 0 ? 'Profits banked cleanly.' : 'Disciplined capital preservation. Cutting small losses protects your wallet.',
      entryTime: pos.entryTime,
      exitTime: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
    };
    updateHistory([closedRecord, ...tradeHistory]);

    const remaining = openPositions.filter((p) => p.id !== posId);
    updatePositions(remaining);

    if (pos.pnl > 0) playSound('WIN');
    setOrderFeedback(`Closed ${pos.symbol} @ ₹${pos.currentPrice.toFixed(2)} (P&L: ₹${pos.pnl > 0 ? '+' : ''}${pos.pnl})`);
    setTimeout(() => setOrderFeedback(null), 4000);
  };

  // Portfolio Aggregates
  const totalInvestedMargin = openPositions.reduce((acc, p) => acc + (p.qty * p.entryPrice), 0);
  const totalUnrealizedPnl = openPositions.reduce((acc, p) => acc + (p.pnl || 0), 0);
  const totalNetWorth = Number((wallet.balance + totalInvestedMargin + totalUnrealizedPnl).toFixed(2));
  const overallReturnPct = Number((((totalNetWorth - wallet.initialCapital) / wallet.initialCapital) * 100).toFixed(2));

  // Trade History Stats
  const winTrades = tradeHistory.filter((t) => t.pnl > 0);
  const winRatePct = tradeHistory.length > 0 ? Number(((winTrades.length / tradeHistory.length) * 100).toFixed(1)) : 0;
  const totalRealizedPnl = tradeHistory.reduce((acc, t) => acc + t.pnl, 0);

  return (
    <div className="practice-stock-market w-100 mb-5">
      {/* ── 1. HEADER BANNER ── */}
      <div
        className="card border-0 shadow-sm rounded-4 overflow-hidden text-white mb-4 p-3 p-md-4"
        style={{ background: 'linear-gradient(135deg, #091a13 0%, #113624 50%, #1c5237 100%)' }}
      >
        <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-3 mb-3">
          <div>
            <div className="d-flex flex-wrap align-items-center gap-2">
              <span className="fs-3">🎓</span>
              <h4 className="mb-0 fw-bold fs-5 fs-md-4">
                Practice Stock Market • Zero-Risk Real-Time Trading Simulator
              </h4>
              <span className="badge bg-warning text-dark fw-bold px-2.5 py-1 small shadow-sm">
                100% REAL LIVE NSE DATA • DUMMY MONEY
              </span>
            </div>
            <p className="text-light opacity-80 small mb-0 mt-1">
              Practice exact institutional entry timing, profit booking (+2.5% Target 1), and loss defense (Never-Red Stop Loss) with zero risk to your real wallet!
            </p>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2 w-100 w-lg-auto">
            <button
              type="button"
              className="btn btn-sm btn-outline-info text-white rounded-pill px-3 py-1.5 fw-bold shadow-sm"
              onClick={() => setShowLearningGuide(!showLearningGuide)}
            >
              {showLearningGuide ? '✕ Hide Rules' : '🧠 Learning Rules'}
            </button>
            <button
              type="button"
              className={`btn btn-sm ${soundEnabled ? 'btn-outline-warning text-white' : 'btn-outline-secondary text-muted'} rounded-pill px-3 py-1.5 fw-bold shadow-sm`}
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF'}
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger text-light rounded-pill px-3 py-1.5 fw-bold shadow-sm"
              onClick={handleResetAll}
            >
              🔄 Reset Simulator
            </button>
          </div>
        </div>

        {/* ── WALLET & STATS CARDS ── */}
        <div className="row g-2.5 g-md-3 mt-1">
          <div className="col-6 col-md-3">
            <div className="p-3 rounded-3 border border-light border-opacity-10 h-100" style={{ background: 'rgba(255, 255, 255, 0.06)' }}>
              <span className="text-light opacity-75 small d-block" style={{ fontSize: 11 }}>AVAILABLE DUMMY CASH</span>
              <h4 className="fw-bold text-white mb-0 mt-1">₹{wallet.balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h4>
              <small className="text-light opacity-60" style={{ fontSize: 10.5 }}>Zero Real Money at Risk</small>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="p-3 rounded-3 border border-light border-opacity-10 h-100" style={{ background: 'rgba(255, 255, 255, 0.06)' }}>
              <span className="text-light opacity-75 small d-block" style={{ fontSize: 11 }}>INVESTED MARGIN</span>
              <h4 className="fw-bold text-info mb-0 mt-1">₹{totalInvestedMargin.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h4>
              <small className="text-light opacity-60" style={{ fontSize: 10.5 }}>Across {openPositions.length} Active Positions</small>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="p-3 rounded-3 border border-light border-opacity-10 h-100" style={{ background: 'rgba(255, 255, 255, 0.06)' }}>
              <span className="text-light opacity-75 small d-block" style={{ fontSize: 11 }}>UNREALIZED LIVE P&L</span>
              <h4 className={`fw-bold mb-0 mt-1 ${totalUnrealizedPnl >= 0 ? 'text-success' : 'text-danger'}`}>
                {totalUnrealizedPnl >= 0 ? '+₹' : '-₹'}{Math.abs(totalUnrealizedPnl).toFixed(2)}
              </h4>
              <small className={totalUnrealizedPnl >= 0 ? 'text-success' : 'text-danger'} style={{ fontSize: 10.5 }}>
                {totalInvestedMargin > 0 ? ((totalUnrealizedPnl / totalInvestedMargin) * 100).toFixed(2) : '0.00'}% Active Return
              </small>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="p-3 rounded-3 border border-light border-opacity-10 h-100" style={{ background: 'rgba(255, 255, 255, 0.06)' }}>
              <span className="text-light opacity-75 small d-block" style={{ fontSize: 11 }}>TOTAL VIRTUAL NET WORTH</span>
              <h4 className={`fw-bold mb-0 mt-1 ${overallReturnPct >= 0 ? 'text-warning' : 'text-danger'}`}>
                ₹{totalNetWorth.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </h4>
              <small className={overallReturnPct >= 0 ? 'text-success' : 'text-danger'} style={{ fontSize: 10.5 }}>
                {overallReturnPct >= 0 ? '▲ +' : '▼ '}{overallReturnPct}% Overall ROI
              </small>
            </div>
          </div>
        </div>

        {/* Budget Preset Quick Switch Strip */}
        <div className="d-flex flex-wrap align-items-center gap-2 mt-3 pt-3 border-top border-light border-opacity-10 small">
          <span className="text-light opacity-75">Quick Budget Presets:</span>
          <button type="button" className="btn btn-xs btn-outline-light rounded-pill px-2.5 py-1" onClick={() => handleSetCapital(25000)}>
            ₹25,000
          </button>
          <button type="button" className="btn btn-xs btn-outline-light rounded-pill px-2.5 py-1" onClick={() => handleSetCapital(50000)}>
            ₹50,000
          </button>
          <button type="button" className="btn btn-xs btn-outline-warning text-warning rounded-pill px-2.5 py-1 fw-bold" onClick={() => handleSetCapital(100000)}>
            ₹1,00,000 (Recommended)
          </button>
          <button type="button" className="btn btn-xs btn-outline-light rounded-pill px-2.5 py-1" onClick={() => handleSetCapital(500000)}>
            ₹5,00,000
          </button>
          <span className="ms-auto text-light opacity-75">
            Win Rate: <strong className="text-success">{winRatePct}%</strong> ({winTrades.length}/{tradeHistory.length} trades) • Realized P&L: <strong className={totalRealizedPnl >= 0 ? 'text-success' : 'text-danger'}>₹{totalRealizedPnl.toFixed(2)}</strong>
          </span>
        </div>
      </div>

      {/* ── 2. THE 3 GOLDEN LEARNING CARDS (Collapsible) ── */}
      {showLearningGuide && (
        <div className="card border-0 shadow-sm rounded-4 p-3 mb-4" style={{ background: '#0b1622', border: '1px solid #1a324b' }}>
          <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom border-secondary border-opacity-30">
            <span className="fs-4">🛡️</span>
            <h5 className="text-warning fw-bold mb-0 fs-6">
              The 3 Golden Rules: When to Enter, How to Get Profits, How to Save From Loss
            </h5>
          </div>

          <div className="row g-3 small">
            {/* Card 1: When to Enter */}
            <div className="col-12 col-md-4">
              <div className="p-3 rounded-3 h-100 border border-success border-opacity-50" style={{ background: '#092015' }}>
                <strong className="text-success d-block fs-6 mb-2">🟢 1. When to Enter (Safe Timing):</strong>
                <ul className="text-white ps-3 mb-0" style={{ lineHeight: '1.6' }}>
                  <li><strong>Above VWAP Only</strong>: Never buy when price is below VWAP. VWAP is the institutional cost line.</li>
                  <li><strong>Wait for 5-Min Candle Close</strong>: A 10-second spike above VWAP is often a trap (like Meesho at 12:45 PM). Wait for the candle to CLOSE above VWAP!</li>
                  <li><strong>Avoid 09:15–09:45 AM</strong>: Let the morning dump settle. Best entries happen between 10:15 AM and 11:30 AM!</li>
                </ul>
              </div>
            </div>

            {/* Card 2: How to Get Profits */}
            <div className="col-12 col-md-4">
              <div className="p-3 rounded-3 h-100 border border-warning border-opacity-50" style={{ background: '#251b0a' }}>
                <strong className="text-warning d-block fs-6 mb-2">🎯 2. How to Get Profits (Never Give Back):</strong>
                <ul className="text-white ps-3 mb-0" style={{ lineHeight: '1.6' }}>
                  <li><strong>Target 1 (+2.0% to +2.5%)</strong>: Intraday moves rarely go straight to 10%. Book 50% cash at Target 1!</li>
                  <li><strong>Lock Profit Habit</strong>: When you take 50% off the table, you mathematically eliminate the fear of giving back gains.</li>
                  <li><strong>Trail the Remaining 50%</strong>: Let the second half run towards Target 2 (+5.0%) with zero stress!</li>
                </ul>
              </div>
            </div>

            {/* Card 3: How to Save From Loss */}
            <div className="col-12 col-md-4">
              <div className="p-3 rounded-3 h-100 border border-info border-opacity-50" style={{ background: '#0b1d2e' }}>
                <strong className="text-info d-block fs-6 mb-2">🛑 3. How to Save From Loss (The Shield):</strong>
                <ul className="text-white ps-3 mb-0" style={{ lineHeight: '1.6' }}>
                  <li><strong>Hard Stop Loss (-1.5%)</strong>: Set SL the moment you enter. Never risk more than 1.5% to 2% of position.</li>
                  <li><strong>Never-Red Rule (Breakeven)</strong>: The moment your trade is up +1.5%, slide Stop Loss to your Entry Buy Price. You can NEVER lose money!</li>
                  <li><strong>Never Average Down</strong>: If a stock dumps, do not buy more shares. Cut it cleanly and move to the next setup.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST NOTIFICATION ── */}
      {orderFeedback && (
        <div className="alert alert-success border-0 shadow-sm rounded-3 py-2 px-3 mb-3 d-flex align-items-center justify-content-between">
          <span className="fw-bold">{orderFeedback}</span>
          <button type="button" className="btn-close btn-sm" onClick={() => setOrderFeedback(null)} />
        </div>
      )}

      {/* ── 3. INTERACTIVE STOCK PICKER & LIVE ENTRY ANALYZER ── */}
      <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 mb-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-3">
          <div>
            <h5 className="fw-bold mb-1 text-dark">
              🔍 Live Stock Practice Analyzer & Order Sizing
            </h5>
            <p className="text-muted small mb-0">
              Select any live NSE stock to inspect its real-time VWAP defense, safe entry score, and calculated profit targets.
            </p>
          </div>

          {/* Search Any NSE Symbol */}
          <form
            className="d-flex align-items-center gap-2 w-100 w-md-auto"
            onSubmit={(e) => {
              e.preventDefault();
              if (searchSymbolInput.trim()) {
                const sym = searchSymbolInput.trim().toUpperCase();
                setSelectedSymbol(sym);
                fetchLiveQuote(sym);
                setSearchSymbolInput('');
              }
            }}
          >
            <input
              type="text"
              className="form-control form-control-sm rounded-pill px-3 shadow-sm"
              placeholder="Search any NSE symbol (e.g. INFY)..."
              value={searchSymbolInput}
              onChange={(e) => setSearchSymbolInput(e.target.value)}
              style={{ maxWidth: 260 }}
            />
            <button type="submit" className="btn btn-sm btn-primary rounded-pill px-3 fw-bold">
              Analyze
            </button>
          </form>
        </div>

        {/* Quick Stock Chips */}
        <div className="d-flex flex-wrap gap-2 mb-3">
          <span className="text-muted small align-self-center">Today's Hot Picks:</span>
          {QUICK_STOCK_PICKS.map((stock) => (
            <button
              key={stock.symbol}
              type="button"
              className={`btn btn-xs rounded-pill px-3 py-1 fw-bold shadow-sm ${selectedSymbol === stock.symbol ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => {
                setSelectedSymbol(stock.symbol);
                fetchLiveQuote(stock.symbol);
              }}
            >
              {stock.symbol}
            </button>
          ))}
        </div>

        {/* Live Quote & Entry Inspection Box */}
        {quoteLoading && !quoteData ? (
          <div className="text-center py-4 text-muted">
            <span className="spinner-border spinner-border-sm me-2" />
            Loading real-time NSE data for {selectedSymbol}...
          </div>
        ) : quoteError ? (
          <div className="alert alert-warning small py-2">{quoteError}</div>
        ) : quoteData && entryAnalysis ? (
          <div className="bg-white rounded-3 p-3 p-md-4 border border-light-subtle shadow-sm">
            <div className="row g-3 align-items-center">
              {/* Stock Price & VWAP Metrics */}
              <div className="col-12 col-md-5">
                <div className="d-flex align-items-center gap-2">
                  <h4 className="fw-bold mb-0 text-dark">{quoteData.symbol}</h4>
                  <span className="text-muted small">({quoteData.companyName})</span>
                </div>
                <div className="d-flex align-items-baseline gap-2 mt-1">
                  <h3 className="fw-bold text-dark mb-0">₹{quoteData.price.toFixed(2)}</h3>
                  <span className={`fw-bold ${quoteData.pChange >= 0 ? 'text-success' : 'text-danger'}`}>
                    {quoteData.pChange >= 0 ? '▲ +' : '▼ '}{quoteData.pChange.toFixed(2)}%
                  </span>
                  <span className="badge bg-light text-dark border small ms-1">
                    Live VWAP: <strong>₹{quoteData.vwap.toFixed(2)}</strong>
                  </span>
                </div>
                <div className="small text-muted mt-1">
                  Day Range: ₹{quoteData.low.toFixed(2)} — ₹{quoteData.high.toFixed(2)} • Updated: {quoteData.lastUpdated}
                </div>
              </div>

              {/* Traffic Light Entry Guidance Card */}
              <div className="col-12 col-md-7">
                <div className={`p-3 rounded-3 ${entryAnalysis.status === 'SAFE_ENTRY' ? 'border border-success bg-success bg-opacity-10' : entryAnalysis.status === 'DUMP_TRAP' ? 'border border-danger bg-danger bg-opacity-10' : 'border border-warning bg-warning bg-opacity-10'}`}>
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <strong className="fs-6 d-flex align-items-center gap-2">
                      <span className={`badge ${entryAnalysis.badgeClass} rounded-pill px-2.5 py-1`}>
                        {entryAnalysis.status === 'SAFE_ENTRY' ? '🟢 SAFE ENTRY' : entryAnalysis.status === 'DUMP_TRAP' ? '🔴 DUMP TRAP' : '🟡 WATCHING'}
                      </span>
                      <span>{entryAnalysis.title}</span>
                    </strong>
                    <span className="badge bg-dark text-white">Score: {entryAnalysis.score}/100</span>
                  </div>
                  <p className="small mb-0 text-dark" style={{ lineHeight: '1.5' }}>
                    {entryAnalysis.guidance}
                  </p>
                </div>
              </div>
            </div>

            {/* Sizing & Order Placement Bar */}
            <hr className="my-3 text-muted opacity-25" />
            <div className="row g-3 align-items-center">
              <div className="col-12 col-lg-7">
                <div className="row g-2">
                  <div className="col-4">
                    <label className="form-label small text-muted mb-1">Virtual Quantity</label>
                    <input
                      type="number"
                      className="form-control form-control-sm fw-bold text-center"
                      value={orderQty}
                      min="1"
                      onChange={(e) => setOrderQty(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </div>
                  <div className="col-4">
                    <label className="form-label small text-muted mb-1">Stop Loss (-{customSlPct}%)</label>
                    <div className="form-control form-control-sm bg-light text-danger fw-bold text-center">
                      ₹{entryAnalysis.calculatedSl}
                    </div>
                  </div>
                  <div className="col-4">
                    <label className="form-label small text-muted mb-1">Target 1 (+{customTgtPct}%)</label>
                    <div className="form-control form-control-sm bg-light text-success fw-bold text-center">
                      ₹{entryAnalysis.calculatedTgt1}
                    </div>
                  </div>
                </div>

                {/* Sizing helpers */}
                <div className="d-flex gap-2 mt-2">
                  <span className="text-muted small">Quick Sizing:</span>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline-secondary rounded-pill px-2"
                    onClick={() => setOrderQty(Math.max(1, Math.floor(10000 / quoteData.price)))}
                  >
                    ₹10,000 (10% Budget)
                  </button>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline-secondary rounded-pill px-2"
                    onClick={() => setOrderQty(Math.max(1, Math.floor(25000 / quoteData.price)))}
                  >
                    ₹25,000 (25% Budget)
                  </button>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline-secondary rounded-pill px-2"
                    onClick={() => setOrderQty(Math.max(1, Math.floor(50000 / quoteData.price)))}
                  >
                    ₹50,000 (50% Budget)
                  </button>
                </div>
              </div>

              {/* Order Execution Actions */}
              <div className="col-12 col-lg-5 text-lg-end">
                <div className="small text-muted mb-2">
                  Margin: <strong>₹{entryAnalysis.marginRequired.toLocaleString('en-IN')}</strong> • Max Risk: <strong className="text-danger">-₹{entryAnalysis.maxRiskRupees}</strong> • Reward: <strong className="text-success">+₹{entryAnalysis.expectedGainRupees}</strong> (R:R {entryAnalysis.riskRewardRatio})
                </div>
                <div className="d-flex justify-content-lg-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-bold"
                    onClick={() => setChartModalStock(quoteData)}
                  >
                    📈 View Chart
                  </button>
                  <button
                    type="button"
                    className="btn btn-success btn-sm rounded-pill px-4 fw-bold shadow-sm"
                    onClick={handlePlaceVirtualOrder}
                  >
                    🟢 Buy {orderQty} Shares (Virtual)
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* ── 4. ACTIVE VIRTUAL POSITIONS (Real-Time Live NSE Monitoring) ── */}
      <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 mb-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h5 className="fw-bold mb-0 text-dark">
              💼 Active Practice Positions ({openPositions.length})
            </h5>
            <small className="text-muted">
              Auto-syncing tick-by-tick from live NSE exchange feed • Never-Red Trailing SL & Targets active
            </small>
          </div>
          <span className="badge bg-success bg-opacity-15 text-success fw-bold px-3 py-1.5 rounded-pill">
            🟢 LIVE TICK POLLING (10s)
          </span>
        </div>

        {openPositions.length === 0 ? (
          <div className="text-center py-5 bg-light rounded-3">
            <span className="fs-1 d-block mb-2">🎯</span>
            <strong className="text-dark d-block">No Active Practice Trades</strong>
            <small className="text-muted d-block mt-1">
              Select a stock above (like MEESHO, GOCLCORP, or IFCI) and click <strong>"Buy (Virtual)"</strong> to start practicing!
            </small>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light small">
                <tr>
                  <th>Stock Symbol</th>
                  <th>Qty</th>
                  <th>Buy Price</th>
                  <th>Live NSE Price</th>
                  <th>Unrealized P&L</th>
                  <th>Trailing Stop</th>
                  <th>Target 1 (+2.5%)</th>
                  <th>Capital Defense Status</th>
                  <th className="text-end">Practice Actions</th>
                </tr>
              </thead>
              <tbody>
                {openPositions.map((pos) => {
                  const isGreen = (pos.pnl || 0) >= 0;
                  const isHoldingVwap = (pos.currentPrice || 0) >= (pos.vwap || 0);

                  return (
                    <tr key={pos.id}>
                      <td>
                        <strong className="text-dark d-block">{pos.symbol}</strong>
                        <small className="text-muted" style={{ fontSize: 11 }}>{pos.entryTime}</small>
                      </td>
                      <td>
                        <span className="badge bg-secondary fw-bold">{pos.qty} shares</span>
                        {pos.halfBooked && (
                          <span className="badge bg-warning text-dark d-block mt-0.5" style={{ fontSize: 9 }}>
                            50% Booked
                          </span>
                        )}
                      </td>
                      <td>₹{Number(pos.entryPrice).toFixed(2)}</td>
                      <td>
                        <strong className="text-dark">₹{Number(pos.currentPrice).toFixed(2)}</strong>
                      </td>
                      <td>
                        <span className={`badge ${isGreen ? 'bg-success' : 'bg-danger'} fw-bold px-2.5 py-1 fs-6`}>
                          {isGreen ? '+₹' : '-₹'}{Math.abs(pos.pnl).toFixed(2)} ({pos.pnlPct}%)
                        </span>
                      </td>
                      <td>
                        <span className="text-danger fw-bold">₹{Number(pos.trailingStop).toFixed(2)}</span>
                        {pos.trailingStop >= pos.entryPrice && (
                          <span className="badge bg-success bg-opacity-20 text-success d-block small" style={{ fontSize: 9.5 }}>
                            ✓ Cost Protected
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="text-success fw-bold">₹{Number(pos.target1).toFixed(2)}</span>
                      </td>
                      <td>
                        {isHoldingVwap ? (
                          <span className="badge bg-success bg-opacity-10 text-success small">
                            ✓ Above VWAP
                          </span>
                        ) : (
                          <span className="badge bg-warning text-dark small">
                            ⚠️ Below VWAP
                          </span>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="d-flex align-items-center justify-content-end gap-1.5">
                          {/* 50% Profit Button */}
                          {!pos.halfBooked && pos.qty >= 2 && (
                            <button
                              type="button"
                              className="btn btn-xs btn-outline-success fw-bold rounded-pill px-2.5 py-1"
                              onClick={() => handleTakePartialProfit(pos.id)}
                              title="Book 50% Profit & Slide Stop Loss to Entry Cost!"
                            >
                              🎯 Book 50%
                            </button>
                          )}
                          {/* Close Position */}
                          <button
                            type="button"
                            className="btn btn-xs btn-outline-danger fw-bold rounded-pill px-2.5 py-1"
                            onClick={() => handleManualClosePosition(pos.id)}
                          >
                            🛑 Exit
                          </button>
                          {/* View Chart */}
                          <button
                            type="button"
                            className="btn btn-xs btn-outline-secondary rounded-pill px-2 py-1"
                            onClick={() => setChartModalStock(pos)}
                          >
                            📈
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

      {/* ── 5. COMPLETED LEARNING TRADES & PRACTICE LOG ── */}
      <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h5 className="fw-bold mb-0 text-dark">
              📜 Practice Journal & Lessons Learned ({tradeHistory.length})
            </h5>
            <small className="text-muted">
              Review every trade outcome to learn institutional discipline and build winning trading habits.
            </small>
          </div>
          {tradeHistory.length > 0 && (
            <button
              type="button"
              className="btn btn-xs btn-outline-secondary rounded-pill px-3 py-1"
              onClick={() => {
                if (window.confirm('Clear trade history?')) updateHistory([]);
              }}
            >
              Clear Log
            </button>
          )}
        </div>

        {tradeHistory.length === 0 ? (
          <div className="text-center py-4 bg-light rounded-3 text-muted small">
            No completed practice trades yet. When you book profits or hit stop losses, each trade will be logged here with its educational lesson!
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light">
                <tr>
                  <th>Stock</th>
                  <th>Quantity</th>
                  <th>Buy ➔ Exit</th>
                  <th>Realized P&L</th>
                  <th>Exit Reason</th>
                  <th>Educational Lesson</th>
                  <th>Exit Time</th>
                </tr>
              </thead>
              <tbody>
                {tradeHistory.map((trade, idx) => {
                  const isWin = trade.pnl > 0;
                  return (
                    <tr key={`${trade.id}-${idx}`}>
                      <td>
                        <strong className="text-dark">{trade.symbol}</strong>
                      </td>
                      <td>{trade.qty}</td>
                      <td>
                        ₹{Number(trade.entryPrice).toFixed(2)} ➔ <strong>₹{Number(trade.exitPrice).toFixed(2)}</strong>
                      </td>
                      <td>
                        <span className={`badge ${isWin ? 'bg-success' : 'bg-danger'} fw-bold px-2 py-1`}>
                          {isWin ? '+₹' : '-₹'}{Math.abs(trade.pnl).toFixed(2)} ({trade.pnlPct}%)
                        </span>
                      </td>
                      <td>
                        <span className="fw-semibold text-dark">{trade.exitReason}</span>
                      </td>
                      <td style={{ maxWidth: 320 }}>
                        <span className="text-muted">{trade.lesson}</span>
                      </td>
                      <td className="text-muted">{trade.exitTime}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 6. CANDLESTICK CHART MODAL ── */}
      {chartModalStock && (
        <StockDetailModal
          stock={{
            symbol: chartModalStock.symbol,
            companyName: chartModalStock.companyName,
            price: chartModalStock.price || chartModalStock.currentPrice,
            ltp: chartModalStock.price || chartModalStock.currentPrice,
            vwap: chartModalStock.vwap,
            changePercent: chartModalStock.pChange || chartModalStock.pnlPct,
            previousClose: chartModalStock.previousClose || chartModalStock.entryPrice,
          }}
          onClose={() => setChartModalStock(null)}
        />
      )}
    </div>
  );
}
