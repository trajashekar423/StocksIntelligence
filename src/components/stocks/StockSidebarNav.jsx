'use client';

import React, { useState, useEffect, useMemo } from 'react';

export const NAVIGATION_CATEGORIES = [
  {
    id: 'practice',
    title: 'PRACTICE & DEFENSE',
    items: [
      {
        key: 'practice-trading',
        label: 'Practice Stock Market',
        sublabel: 'Zero-Risk Dummy Funds',
        icon: '🎓',
        badge: 'DUMMY MONEY',
        badgeColor: 'warning',
      },
      {
        key: 'risk-monitor',
        label: 'Position Risk Monitor',
        sublabel: 'Never-Red Exit Alerts',
        icon: '🛡️',
        badge: 'SHIELD',
        badgeColor: 'danger',
      },
    ],
  },
  {
    id: 'institutional',
    title: 'INSTITUTIONAL RADARS',
    items: [
      {
        key: 'block-deals',
        label: 'Block Deals Watch',
        sublabel: '08:45 AM & 02:05 PM Deals',
        icon: '🏢',
        badge: 'LIVE NSE',
        badgeColor: 'success',
      },
      {
        key: 'bigshot-radar',
        label: 'BigShot Radar',
        sublabel: '5x Volume & Mega Blocks',
        icon: '⭐',
        badge: '5x VOL',
        badgeColor: 'warning',
      },
      {
        key: 'watchfornextday',
        label: 'Watch For Next Day',
        sublabel: '3:00 PM Pre-Close Momentum',
        icon: '🔮',
        badge: 'SWING',
        badgeColor: 'info',
      },
    ],
  },
  {
    id: 'scanners',
    title: 'MARKET SCANNERS',
    items: [
      {
        key: 'scanner',
        label: 'Live Scanner',
        sublabel: '100-Point Intraday Engine',
        icon: '📈',
      },
      {
        key: 'entry-ready',
        label: 'Entry Ready',
        sublabel: 'Holding Above VWAP',
        icon: '⚡',
        badge: 'READY',
        badgeColor: 'success',
      },
      {
        key: 'breakouts',
        label: 'Breakouts',
        sublabel: 'Day-High Volume Breakouts',
        icon: '🚀',
      },
      {
        key: 'nifty50',
        label: 'NIFTY50 Scanner',
        sublabel: 'Official 50 Blue Chips',
        icon: '🇮🇳',
      },
      {
        key: 'momentum',
        label: 'Momentum Scanner',
        sublabel: 'RSI & Volume Flow',
        icon: '🚀',
      },
      {
        key: 'top',
        label: 'Top Gainers',
        sublabel: 'Highest Daily Turnover',
        icon: '🏆',
      },
      {
        key: 'tomorrow',
        label: 'Tomorrow Intraday',
        sublabel: 'Next-Day Candidate Ranks',
        icon: '🌅',
      },
      {
        key: 'fno',
        label: 'F&O Options Engine',
        sublabel: 'Derivatives & PCR Radar',
        icon: '📊',
      },
    ],
  },
  {
    id: 'tools',
    title: 'PORTFOLIO & TOOLS',
    items: [
      {
        key: 'trading',
        label: 'Groww Intraday Trading',
        sublabel: 'Live Execution & Charts',
        icon: '⚡',
        badge: 'GROWW',
        badgeColor: 'success',
      },
      {
        key: 'mystocks',
        label: 'My Portfolio',
        sublabel: 'Personal Watchlist Tracking',
        icon: '💼',
      },
      {
        key: 'favorites',
        label: 'Favorites',
        sublabel: 'Pinned Stocks',
        icon: '⭐',
      },
      {
        key: 'dashboard',
        label: 'Market Dashboard',
        sublabel: 'High-Level Overview',
        icon: '🧭',
      },
      {
        key: 'candlestick-guide',
        label: 'Candlestick Guide',
        sublabel: 'Pattern Anatomy Reference',
        icon: '🕯️',
      },
    ],
  },
];

export default function StockSidebarNav({
  activeTab,
  onChange,
  isCollapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter items by search if user is looking for a specific scanner
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return NAVIGATION_CATEGORIES;
    const term = searchTerm.toLowerCase();
    return NAVIGATION_CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.label.toLowerCase().includes(term) ||
          item.sublabel.toLowerCase().includes(term) ||
          item.key.toLowerCase().includes(term)
      ),
    })).filter((cat) => cat.items.length > 0);
  }, [searchTerm]);

  const activeItem = useMemo(() => {
    for (const cat of NAVIGATION_CATEGORIES) {
      const found = cat.items.find((i) => i.key === activeTab);
      if (found) return found;
    }
    return { label: activeTab, icon: '📌' };
  }, [activeTab]);

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
          style={{ zIndex: 1040, backdropFilter: 'blur(3px)' }}
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`stock-sidebar d-flex flex-column bg-dark text-white border-end border-secondary border-opacity-25 transition-all ${
          mobileOpen ? 'd-flex' : 'd-none d-lg-flex'
        }`}
        style={{
          width: isCollapsed ? '76px' : '280px',
          minWidth: isCollapsed ? '76px' : '280px',
          height: '100vh',
          position: 'sticky',
          top: 0,
          zIndex: 1045,
          overflowY: 'auto',
          overflowX: 'hidden',
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          background: 'linear-gradient(180deg, #09121a 0%, #0d1b26 100%)',
        }}
      >
        {/* ── 1. SIDEBAR BRAND / HEADER ── */}
        <div className="p-3 border-bottom border-secondary border-opacity-25 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2 overflow-hidden">
            <span className="fs-4 flex-shrink-0">⚡</span>
            {!isCollapsed && (
              <div className="text-truncate">
                <strong className="d-block text-white fw-bold" style={{ fontSize: '0.95rem', letterSpacing: '-0.3px' }}>
                  NSE INTELLIGENCE
                </strong>
                <small className="text-info d-block" style={{ fontSize: '10px' }}>
                  Intraday Terminal
                </small>
              </div>
            )}
          </div>

          <div className="d-flex align-items-center gap-1">
            {/* Desktop Collapse Toggle */}
            <button
              type="button"
              className="btn btn-xs btn-outline-secondary text-light rounded-circle p-1 d-none d-lg-flex align-items-center justify-content-center"
              style={{ width: 28, height: 28 }}
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse to Compact Rail'}
            >
              <span style={{ fontSize: 12 }}>{isCollapsed ? '▶' : '◀'}</span>
            </button>

            {/* Mobile Close Button */}
            <button
              type="button"
              className="btn-close btn-close-white btn-sm d-lg-none"
              onClick={onCloseMobile}
            />
          </div>
        </div>

        {/* ── 2. QUICK SEARCH (Only when expanded) ── */}
        {!isCollapsed && (
          <div className="px-3 pt-3 pb-2">
            <div className="position-relative">
              <input
                type="text"
                className="form-control form-control-sm bg-dark text-white border-secondary border-opacity-50 rounded-pill px-3"
                placeholder="Filter 18 tools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ fontSize: '12px' }}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="btn btn-link btn-sm text-light p-0 position-absolute end-0 top-50 translate-middle-y me-2 text-decoration-none"
                  onClick={() => setSearchTerm('')}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── 3. NAVIGATION CATEGORIES & ITEMS ── */}
        <div className="flex-grow-1 px-2 py-2 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          {filteredCategories.map((category) => (
            <div key={category.id} className="mb-3">
              {/* Category Header */}
              {!isCollapsed ? (
                <div
                  className="px-2.5 py-1 text-uppercase text-secondary fw-bold d-flex align-items-center justify-content-between"
                  style={{ fontSize: '9.5px', letterSpacing: '0.8px' }}
                >
                  <span>{category.title}</span>
                  <span className="badge bg-secondary bg-opacity-25 text-light" style={{ fontSize: '9px' }}>
                    {category.items.length}
                  </span>
                </div>
              ) : (
                <div className="border-top border-secondary border-opacity-20 my-2" />
              )}

              {/* Items List */}
              <div className="d-flex flex-column gap-1">
                {category.items.map((item) => {
                  const isActive = activeTab === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        onChange(item.key);
                        if (mobileOpen && onCloseMobile) onCloseMobile();
                      }}
                      className={`btn w-100 text-start d-flex align-items-center rounded-3 px-2.5 py-2 transition-all position-relative ${
                        isActive
                          ? 'bg-primary text-white shadow-sm'
                          : 'btn-outline-dark text-light border-0'
                      }`}
                      style={{
                        background: isActive ? '#1d4ed8' : 'transparent',
                        color: isActive ? '#ffffff' : '#cbd5e1',
                        borderLeft: isActive ? '4px solid #60a5fa' : '4px solid transparent',
                      }}
                      title={`${item.label} — ${item.sublabel}`}
                    >
                      {/* Icon */}
                      <span
                        className="fs-5 flex-shrink-0 d-flex align-items-center justify-content-center"
                        style={{ width: isCollapsed ? '100%' : 26 }}
                      >
                        {item.icon}
                      </span>

                      {/* Text & Badge (When Expanded) */}
                      {!isCollapsed && (
                        <div className="ms-2 flex-grow-1 overflow-hidden">
                          <div className="d-flex align-items-center justify-content-between gap-1">
                            <span
                              className="fw-bold text-truncate"
                              style={{
                                fontSize: '12.5px',
                                color: isActive ? '#ffffff' : '#f1f5f9',
                              }}
                            >
                              {item.label}
                            </span>
                            {item.badge && (
                              <span
                                className={`badge bg-${item.badgeColor || 'secondary'} ${
                                  item.badgeColor === 'warning' ? 'text-dark' : 'text-white'
                                } flex-shrink-0`}
                                style={{ fontSize: '8.5px', padding: '2px 5px' }}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <span
                            className="d-block text-truncate"
                            style={{
                              fontSize: '10.5px',
                              color: isActive ? '#bfdbfe' : '#94a3b8',
                            }}
                          >
                            {item.sublabel}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ── 4. SIDEBAR FOOTER (Active view preview) ── */}
        <div className="p-2.5 border-top border-secondary border-opacity-25 bg-black bg-opacity-30">
          {!isCollapsed ? (
            <div className="d-flex align-items-center justify-content-between text-muted" style={{ fontSize: '11px' }}>
              <div className="d-flex align-items-center gap-1.5 overflow-hidden">
                <span className="badge bg-success rounded-circle p-1" style={{ width: 8, height: 8 }} />
                <span className="text-truncate">NSE Live Active</span>
              </div>
              <span className="text-info fw-semibold">18 Tools Ready</span>
            </div>
          ) : (
            <div className="text-center">
              <span className="badge bg-success rounded-circle p-1" style={{ width: 8, height: 8 }} title="NSE Live Active" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

