'use client';

import React from 'react';
import { NAVIGATION_CATEGORIES } from './StockSidebarNav';

export default function StockTopToolbar({
  activeTab,
  isCollapsed,
  onToggleCollapse,
  onOpenMobile,
  live,
  onToggleLive,
  intervalMs,
  onChangeInterval,
  capital,
  onChangeCapital,
  topStatus,
  mostStatus,
  lastUpdated,
  getNSEDateTime,
}) {
  // Find current tab details
  let activeDetails = { label: activeTab, icon: '📌', sublabel: '' };
  for (const cat of NAVIGATION_CATEGORIES) {
    const item = cat.items.find((i) => i.key === activeTab);
    if (item) {
      activeDetails = item;
      break;
    }
  }

  return (
    <div
      className="stock-top-toolbar card border-0 shadow-sm rounded-4 px-3 py-2.5 mb-3 bg-white"
      style={{ border: '1px solid #e2e8f0' }}
    >
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2.5">
        {/* ── LEFT: TOGGLE & ACTIVE SCREEN TITLE ── */}
        <div className="d-flex align-items-center gap-2">
          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            className="btn btn-sm btn-dark rounded-3 px-2.5 py-1.5 d-lg-none shadow-sm"
            onClick={onOpenMobile}
            title="Open Menu"
          >
            ☰
          </button>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary rounded-3 px-2.5 py-1 d-none d-lg-flex align-items-center gap-1.5 shadow-sm"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar to Icon Rail'}
          >
            <span>{isCollapsed ? '▶' : '◀'}</span>
            <span className="small fw-semibold">{isCollapsed ? 'Sidebar' : 'Collapse'}</span>
          </button>

          {/* Active Tab Identifier Pill */}
          <div className="d-flex align-items-center gap-2 px-3 py-1 bg-light rounded-pill border">
            <span className="fs-6">{activeDetails.icon}</span>
            <strong className="text-dark small text-nowrap">{activeDetails.label}</strong>
            {activeDetails.badge && (
              <span className={`badge bg-${activeDetails.badgeColor || 'secondary'} ${activeDetails.badgeColor === 'warning' ? 'text-dark' : 'text-white'} rounded-pill px-2 py-0.5`} style={{ fontSize: '9px' }}>
                {activeDetails.badge}
              </span>
            )}
          </div>
        </div>

        {/* ── RIGHT: LIVE CONTROLS & STATUS ── */}
        <div className="d-flex flex-wrap align-items-center gap-2 ms-auto">
          {/* Live Play/Pause Toggle */}
          <button
            type="button"
            className={`btn btn-sm ${live ? 'btn-danger' : 'btn-success'} rounded-pill px-3 py-1 fw-bold shadow-sm d-flex align-items-center gap-1.5`}
            onClick={onToggleLive}
          >
            <span>{live ? '⏸️' : '▶️'}</span>
            <span>{live ? 'Pause Live' : 'Resume Live'}</span>
          </button>

          {/* Polling Interval */}
          <label className="small text-muted d-flex align-items-center gap-1.5 mb-0 bg-light rounded-pill px-2.5 py-1 border">
            <span>Interval</span>
            <select
              className="form-select form-select-sm border-0 bg-transparent fw-bold py-0 ps-1 pe-3"
              style={{ width: 68, fontSize: '12px', cursor: 'pointer' }}
              value={String(intervalMs)}
              onChange={(e) => onChangeInterval(Number(e.target.value))}
            >
              <option value="5000">5s</option>
              <option value="10000">10s</option>
              <option value="30000">30s</option>
              <option value="60000">60s</option>
            </select>
          </label>

          {/* Intraday Capital Budget */}
          <label className="small text-muted d-flex align-items-center gap-1.5 mb-0 bg-light rounded-pill px-2.5 py-1 border">
            <span>Capital</span>
            <span className="fw-bold text-dark">₹</span>
            <input
              type="number"
              className="form-control form-control-sm border-0 bg-transparent fw-bold p-0 text-dark"
              style={{ width: 85, fontSize: '12px' }}
              min="0"
              value={capital}
              onChange={(e) => onChangeCapital(Number(e.target.value))}
            />
          </label>

          {/* Live Feed Status Chips */}
          <div className="d-none d-sm-flex align-items-center gap-2 px-2.5 py-1 bg-light rounded-pill border small">
            <span className="text-muted" style={{ fontSize: '11px' }}>Feed:</span>
            <span className={`badge ${topStatus ? 'bg-success' : 'bg-secondary'} rounded-pill`} style={{ fontSize: '10px' }}>
              Gainers {topStatus ? 'LIVE' : 'OFF'}
            </span>
            <span className={`badge ${mostStatus ? 'bg-success' : 'bg-secondary'} rounded-pill`} style={{ fontSize: '10px' }}>
              Volume {mostStatus ? 'LIVE' : 'OFF'}
            </span>
          </div>

          {/* Last Update Time */}
          {lastUpdated && getNSEDateTime && (
            <div className="text-muted small d-none d-md-block" style={{ fontSize: '11px' }}>
              🕒 {getNSEDateTime(lastUpdated).shortTime} IST
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

