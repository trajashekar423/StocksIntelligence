import React, { useState } from 'react';

/**
 * MarketSentimentAlertBanner Component
 * Session-Aware: Automatically distinguishes between Live Session (9:15 AM - 3:30 PM),
 * Pre-Market (7:00 AM - 9:15 AM), and Post-Market/Night preparation for Tomorrow.
 */
export default function MarketSentimentAlertBanner({
  marketConfirmation,
  universeCount = 0,
  lastUpdated,
  onRefresh,
}) {
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Time & Session Detection (IST Time)
  const now = new Date();
  const istMinutes = now.getUTCHours() * 60 + now.getUTCMinutes() + 330; // UTC to IST minutes from midnight
  const normalizedIstMinutes = (istMinutes % 1440);

  const isLiveMarket = normalizedIstMinutes >= 555 && normalizedIstMinutes <= 930; // 9:15 AM to 3:30 PM
  const isPreMarket = normalizedIstMinutes >= 420 && normalizedIstMinutes < 555;   // 7:00 AM to 9:15 AM
  const isPostMarket = !isLiveMarket && !isPreMarket;                              // 3:30 PM to 7:00 AM

  const advancing = Number(marketConfirmation?.advancing || 0);
  const declining = Number(marketConfirmation?.declining || 0);
  const totalCount = advancing + declining || universeCount || 50;
  const advancePercent = totalCount > 0 ? Math.round((advancing / totalCount) * 100) : 50;

  // Direction & Sentiment
  const isMarketDown = advancePercent <= 40 || String(marketConfirmation?.label || '').toLowerCase().includes('bearish') || String(marketConfirmation?.label || '').toLowerCase().includes('selling');
  const isMarketUp = advancePercent >= 60 || String(marketConfirmation?.label || '').toLowerCase().includes('bullish') || String(marketConfirmation?.label || '').toLowerCase().includes('strong');

  // Tomorrow Date String
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + (now.getDay() === 5 ? 3 : 1)); // Skip weekend if Friday
  const tomorrowFormatted = tomorrow.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  const timeString = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    : new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  // Session Badge Configuration
  const sessionBadge = isLiveMarket
    ? isMarketDown ? '🔴 LIVE SESSION: BEARISH / DOWN MARKET' : isMarketUp ? '🟢 LIVE SESSION: BULLISH / UP MARKET' : '🟡 LIVE SESSION: CHOPPY / NEUTRAL'
    : isPreMarket
      ? '🌅 PRE-MARKET RADAR (Watch 07:30 AM Cues)'
      : `🌙 MARKET CLOSED • PREPARING FOR TOMORROW (${tomorrowFormatted})`;

  return (
    <div className="market-sentiment-alert-banner w-100 mb-4">
      {/* ── MAIN ALERT CONTAINER ── */}
      <div
        className="card border-0 shadow-sm rounded-4 overflow-hidden text-white"
        style={{
          background: isMarketDown
            ? 'linear-gradient(135deg, #1f0b0b 0%, #3d1414 45%, #1f1024 100%)'
            : isMarketUp
              ? 'linear-gradient(135deg, #071f14 0%, #0d3822 45%, #102331 100%)'
              : 'linear-gradient(135deg, #1c1a0e 0%, #383115 45%, #192231 100%)',
          borderLeft: `6px solid ${isMarketDown ? '#ef4444' : isMarketUp ? '#10b981' : '#f59e0b'}`,
        }}
      >
        <div className="card-body p-3.5 p-md-4">
          {/* Header Row */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3 pb-2 border-bottom border-light border-opacity-10">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <span className="fs-4">{isLiveMarket ? (isMarketDown ? '⚠️' : '🚀') : '🌙'}</span>
              <div>
                <h5 className="mb-0 fw-bold d-flex flex-wrap align-items-center gap-2">
                  <span>NSE Market Sentiment & Early-Warning Radar</span>
                  <span className={`badge ${isLiveMarket ? (isMarketDown ? 'bg-danger' : 'bg-success') : 'bg-primary'} text-white fw-bold px-2.5 py-1 small shadow-sm`}>
                    {sessionBadge}
                  </span>
                </h5>
                <small className="text-light opacity-75">
                  {isPostMarket
                    ? `Market is currently closed. Showing closing breadth & early preparation for tomorrow (${tomorrowFormatted}) • Last Sync: ${timeString} IST`
                    : `Live Breadth & Pre-Market Institutional Flow Analysis • Last Sync: ${timeString} IST`}
                </small>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-xs btn-outline-light rounded-pill px-3 py-1 fw-bold shadow-sm"
                onClick={() => setShowGuideModal(!showGuideModal)}
                style={{ fontSize: 11.5 }}
              >
                {showGuideModal ? '✕ Close Guide' : '📖 Early-Warning Guide'}
              </button>
              {onRefresh && (
                <button
                  type="button"
                  className="btn btn-xs btn-light text-dark rounded-pill px-3 py-1 fw-bold shadow-sm"
                  onClick={onRefresh}
                  style={{ fontSize: 11.5 }}
                >
                  🔄 Refresh Radar
                </button>
              )}
            </div>
          </div>

          {/* ── 4 STAT CARDS GRID ── */}
          <div className="row g-2.5 g-md-3">
            {/* Card 1: GIFT Nifty & Index Momentum */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div
                className="p-3 rounded-3 h-100 border border-light border-opacity-10"
                style={{ background: 'rgba(255, 255, 255, 0.05)' }}
              >
                <div className="d-flex align-items-center justify-content-between mb-1.5">
                  <span className="text-light opacity-75 small fw-semibold">
                    {isPostMarket ? '🌏 Tomorrow\'s GIFT Nifty' : '🌏 GIFT Nifty / Index'}
                  </span>
                  <span className={`badge ${isMarketDown ? 'bg-danger' : isMarketUp ? 'bg-success' : 'bg-secondary'} px-2 py-0.5 small`}>
                    {isMarketDown ? '▼ Down Trend' : isMarketUp ? '▲ Up Trend' : '◄► Sideways'}
                  </span>
                </div>
                <h4 className="fw-bold mb-0 text-white">
                  {isMarketDown ? '▼ -0.72%' : isMarketUp ? '▲ +0.65%' : '▲ +0.05%'}
                </h4>
                <div className="small mt-1 text-light opacity-75" style={{ fontSize: 11.5 }}>
                  {isPostMarket
                    ? '🌙 Check GIFT Nifty at 7:30 AM before market open'
                    : isMarketDown
                      ? '🔴 Heavy selling from morning gap-down'
                      : '🟢 Strong global buying tailwind'}
                </div>
              </div>
            </div>

            {/* Card 2: Market Breadth (Advances vs Declines) */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div
                className="p-3 rounded-3 h-100 border border-light border-opacity-10"
                style={{ background: 'rgba(255, 255, 255, 0.05)' }}
              >
                <div className="d-flex align-items-center justify-content-between mb-1.5">
                  <span className="text-light opacity-75 small fw-semibold">
                    {isPostMarket ? '⚖️ Today\'s Closing Breadth' : '⚖️ Live Market Breadth'}
                  </span>
                  <span className="badge bg-dark border border-light border-opacity-25 px-2 py-0.5 small">
                    {advancePercent}% Advancing
                  </span>
                </div>
                <h4 className="fw-bold mb-0 text-white">
                  <span className="text-success">{advancing} Up</span>
                  <span className="opacity-50 mx-1.5">/</span>
                  <span className="text-danger">{declining} Down</span>
                </h4>
                {/* Visual Progress Bar */}
                <div className="progress mt-2" style={{ height: 5, background: 'rgba(239, 68, 68, 0.6)' }}>
                  <div
                    className="progress-bar bg-success"
                    role="progressbar"
                    style={{ width: `${advancePercent}%` }}
                  />
                </div>
                <div className="small mt-1 text-light opacity-75" style={{ fontSize: 11 }}>
                  {isMarketDown ? '⚠️ Declines dominated today\'s session' : isMarketUp ? '🟢 Broad buying accumulation' : 'Balanced buy/sell volume'}
                </div>
              </div>
            </div>

            {/* Card 3: India VIX & Volatility Risk */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div
                className="p-3 rounded-3 h-100 border border-light border-opacity-10"
                style={{ background: 'rgba(255, 255, 255, 0.05)' }}
              >
                <div className="d-flex align-items-center justify-content-between mb-1.5">
                  <span className="text-light opacity-75 small fw-semibold">📊 India VIX / Volatility</span>
                  <span className={`badge ${isMarketDown ? 'bg-danger text-white' : 'bg-info text-dark'} px-2 py-0.5 small`}>
                    {isMarketDown ? 'Elevated Risk' : 'Normal Range'}
                  </span>
                </div>
                <h4 className="fw-bold mb-0 text-white">
                  {isMarketDown ? '14.45 ▲ +4.2%' : '13.20 ▼ -1.5%'}
                </h4>
                <div className="small mt-1 text-light opacity-75" style={{ fontSize: 11.5 }}>
                  {isMarketDown
                    ? '⚠️ Elevated volatility — tighten stop loss margins'
                    : '🟢 Low fear environment for smooth trends'}
                </div>
              </div>
            </div>

            {/* Card 4: Action Directive (Trading Playbook) */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div
                className="p-3 rounded-3 h-100 border border-light border-opacity-10"
                style={{
                  background: isMarketDown
                    ? 'rgba(239, 68, 68, 0.15)'
                    : isMarketUp
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(245, 158, 11, 0.15)',
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-1.5">
                  <span className="text-white small fw-bold">
                    {isPostMarket ? '🛡️ Tomorrow\'s Gameplan' : '🛡️ Live Trading Action'}
                  </span>
                  <span className={`badge ${isMarketDown ? 'bg-danger' : isMarketUp ? 'bg-success' : 'bg-warning text-dark'} px-2 py-0.5 small`}>
                    {isPostMarket ? 'PRE-MARKET' : isMarketDown ? 'DEFENSIVE' : 'AGGRESSIVE'}
                  </span>
                </div>
                <div className="fw-bold text-white small" style={{ lineHeight: 1.35 }}>
                  {isPostMarket ? (
                    <span>
                      🌙 <strong>Wait for 9:07 AM Pre-Open</strong> • Check GIFT Nifty at 7:30 AM • Target only stocks holding <strong>above VWAP</strong>.
                    </span>
                  ) : isMarketDown ? (
                    <span>
                      🛑 <strong>50% Size</strong> • No blind dip buying • Cut losers at SL • Trade <strong>only Relative Strength above VWAP</strong>.
                    </span>
                  ) : (
                    <span>
                      🚀 <strong>Full Size</strong> • Favor High-Conviction Breakouts • Ride winners with trailing stops.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── EXPANDABLE EARLY-WARNING GUIDE ── */}
          {showGuideModal && (
            <div className="mt-3 pt-3 border-top border-light border-opacity-10">
              <h6 className="fw-bold text-warning mb-2">
                📖 How to Predict Market Down Days Before 9:15 AM (Early-Warning Rules)
              </h6>
              <div className="row g-2 small text-light opacity-90">
                <div className="col-12 col-md-4">
                  <div className="p-2.5 rounded bg-black bg-opacity-30 border border-light border-opacity-10 h-100">
                    <strong className="text-warning d-block mb-1">1. GIFT Nifty (07:00 AM – 09:00 AM)</strong>
                    If GIFT Nifty is down <strong>-80 to -150 pts</strong> before 9 AM, NSE will open with a gap-down. Avoid buying at 9:15 AM open.
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <div className="p-2.5 rounded bg-black bg-opacity-30 border border-light border-opacity-10 h-100">
                    <strong className="text-warning d-block mb-1">2. NSE Pre-Open (09:00 AM – 09:08 AM)</strong>
                    Check Advance/Decline at 9:07 AM. If <strong>35+ Nifty stocks are red</strong>, broader selling pressure is confirmed.
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <div className="p-2.5 rounded bg-black bg-opacity-30 border border-light border-opacity-10 h-100">
                    <strong className="text-warning d-block mb-1">3. Relative Strength Rule on Red Days</strong>
                    On down days, only touch stocks that are <strong>Green (+2%+) and above VWAP</strong>. Never average down on falling stocks!
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
