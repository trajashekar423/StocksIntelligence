import { useMemo, useState } from 'react';
import { buildMomentumScanner, MOVEMENT_ZONES, getMovementLevels } from './momentumScanner';

/* ─── HELPERS ────────────────────────────────────────────── */

function fmt(value) {
  const n = Number(value);
  return Number.isFinite(n) && n ? `₹${n.toFixed(2)}` : 'N/A';
}

function fmtPct(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 'N/A';
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

function fmtVol(value) {
  const n = Number(value);
  if (!n) return 'N/A';
  if (n >= 10000000) return `${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000)   return `${(n / 100000).toFixed(2)}L`;
  return n.toLocaleString('en-IN');
}

function ScoreBadge({ score }) {
  const cls =
    score >= 90 ? 'text-bg-success' :
    score >= 80 ? 'text-bg-primary' :
    score >= 70 ? 'text-bg-warning text-dark' :
    score >= 60 ? 'text-bg-secondary' :
    'text-bg-danger';
  return <span className={`badge ${cls}`}>{score}/100</span>;
}

/* ─── MOVEMENT PROGRESS BAR ──────────────────────────────── */

function MovementBar({ open, price }) {
  if (!open || !price) return null;
  const pct = ((price - open) / open) * 100;
  const levels = getMovementLevels(open);
  const barPct = Math.min(Math.max(pct, 0), 50);
  const barWidth = `${(barPct / 50) * 100}%`;

  const barColor =
    pct >= 30 ? '#dc2626' :
    pct >= 10 ? '#f97316' :
    pct >= 5  ? '#eab308' :
    '#16a34a';

  return (
    <div className="ms-bar">
      <div className="ms-bar-header">
        <span className="small text-muted">Open {fmt(open)}</span>
        <span className="small fw-bold">{fmtPct(pct)} from open</span>
      </div>
      <div className="ms-bar-track">
        <div className="ms-bar-fill" style={{ width: barWidth, background: barColor }} />
      </div>
      <div className="ms-bar-levels">
        {levels.map((l) => (
          <div key={l.pct} className={`ms-bar-level ${price >= l.price ? 'ms-bar-level--reached' : ''}`}>
            <span>{l.label}</span>
            <span className="text-muted">{fmt(l.price)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── FAVORABLE SETUP CARD ───────────────────────────────── */

function FavorableCard({ row }) {
  if (!row.buyConfirmed) return null;
  return (
    <div className="ms-favorable-card">
      <div className="ms-favorable-title">🟢 FAVORABLE INTRADAY SETUP</div>
      <div className="d-flex justify-content-between align-items-start gap-3 mt-2">
        <div>
          <div className="fw-bold fs-5">{row.symbol}</div>
          <div className="small opacity-75">{row.companyName}</div>
        </div>
        <div className="text-end">
          <div className="fw-bold fs-4">{row.momentumScore}/100</div>
          <div className="small opacity-75">Momentum Score</div>
        </div>
      </div>
      <div className="ms-favorable-grid mt-3">
        <div><span>From Open</span><strong>{fmtPct(row.pctFromOpen)}</strong></div>
        <div><span>Entry</span><strong>{fmt(row.price)}</strong></div>
        <div><span>Stop Loss</span><strong>{fmt(row.sl)}</strong></div>
        <div><span>Target 1</span><strong>{fmt(row.t1)}</strong></div>
        <div><span>Target 2</span><strong>{fmt(row.t2)}</strong></div>
        <div><span>Risk/Reward</span><strong>1:{row.rr}</strong></div>
      </div>
      <div className="mt-3 small">
        {row.buyConditions.map(([, label]) => (
          <span key={label} className="ms-reason-pill">✓ {label}</span>
        ))}
      </div>
      <div className="small opacity-60 mt-2">
        Educational decision-support only. Favorable setup means multiple rules aligned — not a guaranteed or risk-free trade.
      </div>
    </div>
  );
}

/* ─── EARLY MOMENTUM CARD ────────────────────────────────── */

function EarlyMomentumCard({ row }) {
  if (!row.earlyMomentum) return null;
  const levels = getMovementLevels(row.open);
  return (
    <div className="ms-early-card">
      <div className="ms-early-title">🔮 EARLY MOMENTUM — {row.symbol}</div>
      <div className="row g-2 mt-1 small">
        <div className="col-6"><span className="text-muted">Open</span> <strong>{fmt(row.open)}</strong></div>
        <div className="col-6"><span className="text-muted">Current</span> <strong>{fmt(row.price)}</strong></div>
        <div className="col-6"><span className="text-muted">From Open</span> <strong className="text-success">{fmtPct(row.pctFromOpen)}</strong></div>
        <div className="col-6"><span className="text-muted">RVOL</span> <strong>{row.rvol.toFixed(2)}x</strong></div>
        <div className="col-6"><span className="text-muted">VWAP</span> <strong>{fmt(row.vwap)}</strong></div>
        <div className="col-6"><span className="text-muted">Industry</span> <strong>{row.indScore}/100</strong></div>
        <div className="col-12"><span className="text-muted">Resistance</span> <strong>{fmt(row.resistance)}</strong></div>
      </div>
      <div className="mt-2 small fw-semibold">
        {row.orbStatus === 'BUY' ? '🚀 ORB BREAKOUT CONFIRMED' : '🚀 EARLY BREAKOUT WATCH'}
      </div>
      <div className="mt-2 small text-muted">Next monitoring levels:</div>
      <div className="d-flex flex-wrap gap-1 mt-1">
        {levels.filter((l) => l.pct >= Math.ceil(row.pctFromOpen)).slice(0, 5).map((l) => (
          <span key={l.pct} className="badge text-bg-secondary">{l.label} {fmt(l.price)}</span>
        ))}
      </div>
      <div className="mt-2 small opacity-60">Potential large-move candidate. Not a guaranteed target.</div>
    </div>
  );
}

/* ─── CHASE WARNING ──────────────────────────────────────── */

function ChaseWarning({ warning }) {
  if (!warning) return null;
  const text =
    warning === 'DO_NOT_CHASE'
      ? '🟠 DO NOT CHASE — Stock has already made a large move from the opening price. Wait for a controlled pullback or fresh breakout confirmation.'
      : warning === 'EXTREME_CAUTION'
      ? '🚨 EXTREME CAUTION — Very high volatility. Check liquidity, volume, circuit limits and momentum exhaustion before acting.'
      : '🚨 EXTREME VOLATILITY — HIGH RISK. Extremely unusual movement. Do not encourage chasing.';
  return (
    <div className="alert alert-warning small py-2 mb-2">{text}</div>
  );
}

/* ─── SCORE BREAKDOWN ────────────────────────────────────── */

function ScoreBreakdown({ scores }) {
  const items = [
    ['Gap',        scores.sGap,      10],
    ['RVOL',       scores.sRvol,     15],
    ['VWAP',       scores.sVwap,     10],
    ['EMA',        scores.sEma,      10],
    ['Breakout',   scores.sBreakout, 15],
    ['Candle',     scores.sCandle,   10],
    ['RSI',        scores.sRsi,       5],
    ['ADX',        scores.sAdx,       5],
    ['Industry',   scores.sInd,      10],
    ['Market',     scores.sMkt,       5],
  ];
  return (
    <div className="ms-score-breakdown">
      {items.map(([label, val, max]) => (
        <div key={label} className="ms-score-row">
          <span className="ms-score-label">{label}</span>
          <div className="ms-score-track">
            <div className="ms-score-fill" style={{ width: `${(val / max) * 100}%` }} />
          </div>
          <span className="ms-score-val">{val}/{max}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── STOCK DETAIL PANEL ─────────────────────────────────── */

function StockDetail({ row, onClose }) {
  if (!row) return null;
  return (
    <div className="ms-detail-panel">
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div>
          <h5 className="mb-0">{row.symbol}</h5>
          <div className="small text-muted">{row.companyName} · {row.industry}</div>
        </div>
        <button type="button" className="btn-close" onClick={onClose} />
      </div>

      <ChaseWarning warning={row.chaseWarning} />
      <FavorableCard row={row} />
      <EarlyMomentumCard row={row} />

      <div className="row g-2 small mt-2">
        <div className="col-6 col-md-3"><span className="text-muted">Price</span><br /><strong>{fmt(row.price)}</strong></div>
        <div className="col-6 col-md-3"><span className="text-muted">Open</span><br /><strong>{fmt(row.open)}</strong></div>
        <div className="col-6 col-md-3"><span className="text-muted">From Open</span><br /><strong className={row.pctFromOpen >= 0 ? 'text-success' : 'text-danger'}>{fmtPct(row.pctFromOpen)}</strong></div>
        <div className="col-6 col-md-3"><span className="text-muted">RVOL</span><br /><strong>{row.rvol.toFixed(2)}x</strong></div>
        <div className="col-6 col-md-3"><span className="text-muted">VWAP</span><br /><strong>{fmt(row.vwap)}</strong></div>
        <div className="col-6 col-md-3"><span className="text-muted">RSI</span><br /><strong>{row.rsi ? row.rsi.toFixed(1) : 'N/A'}</strong></div>
        <div className="col-6 col-md-3"><span className="text-muted">ADX</span><br /><strong>{row.adx ? row.adx.toFixed(1) : 'N/A'}</strong></div>
        <div className="col-6 col-md-3"><span className="text-muted">Pattern</span><br /><strong>{row.pattern || 'None'}</strong></div>
        <div className="col-6 col-md-3"><span className="text-muted">ORB</span><br /><strong>{row.orbStatus ? `${row.orbStatus} SIGNAL` : 'No signal'}</strong></div>
        <div className="col-6 col-md-3"><span className="text-muted">Stop Loss</span><br /><strong>{fmt(row.sl)}</strong></div>
        <div className="col-6 col-md-3"><span className="text-muted">Target 1</span><br /><strong>{fmt(row.t1)}</strong></div>
        <div className="col-6 col-md-3"><span className="text-muted">R/R</span><br /><strong>1:{row.rr}</strong></div>
      </div>

      <div className="mt-3">
        <div className="small fw-semibold mb-2">Momentum Score Breakdown</div>
        <ScoreBreakdown scores={row.scores} />
      </div>

      <MovementBar open={row.open} price={row.price} />

      {row.buyConditions.length > 0 && (
        <div className="mt-3">
          <div className="small fw-semibold mb-1">Buy Conditions Met ({row.buyConditions.length}/8)</div>
          <div className="d-flex flex-wrap gap-1">
            {row.buyConditions.map(([, label]) => (
              <span key={label} className="badge text-bg-success">{label}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── INDUSTRY PANEL ─────────────────────────────────────── */

function IndustryPanel({ rows, onSelectIndustry, selectedIndustry }) {
  const industries = useMemo(() => {
    const map = new Map();
    rows.forEach((row) => {
      if (!map.has(row.industry)) map.set(row.industry, { score: row.indScore, stocks: [] });
      map.get(row.industry).stocks.push(row);
    });
    return [...map.entries()]
      .map(([name, { score, stocks }]) => ({ name, score, stocks: stocks.sort((a, b) => b.momentumScore - a.momentumScore).slice(0, 5) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [rows]);

  return (
    <div className="ms-industry-panel">
      <h6 className="mb-3">🏭 Best Industries for Intraday</h6>
      {industries.map((ind, i) => {
        const emoji = ind.score >= 75 ? '🟢' : ind.score >= 55 ? '🟡' : '🔴';
        return (
          <div key={ind.name} className={`ms-industry-row ${selectedIndustry === ind.name ? 'ms-industry-row--active' : ''}`}>
            <button
              type="button"
              className="ms-industry-btn"
              onClick={() => onSelectIndustry(selectedIndustry === ind.name ? '' : ind.name)}
            >
              <span>{i + 1}. {emoji} {ind.name}</span>
              <strong>{ind.score}/100</strong>
            </button>
            {selectedIndustry === ind.name && (
              <div className="ms-industry-stocks">
                {ind.stocks.map((s) => (
                  <div key={s.symbol} className="ms-industry-stock">
                    <span className="fw-semibold">{s.symbol}</span>
                    <span className="text-muted small">{fmtPct(s.pctFromOpen)}</span>
                    <ScoreBadge score={s.momentumScore} />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── MAIN TABLE ─────────────────────────────────────────── */

function MomentumTable({ rows, onSelect }) {
  if (!rows.length) {
    return <div className="alert alert-warning small">No stocks match this filter right now.</div>;
  }
  return (
    <div className="table-responsive">
      <table className="table table-sm table-hover align-middle mb-0">
        <thead>
          <tr>
            <th>#</th>
            <th>Stock</th>
            <th className="text-end">From Open</th>
            <th className="text-end">RVOL</th>
            <th className="text-end">VWAP</th>
            <th className="text-end">Industry</th>
            <th className="text-end">Score</th>
            <th>Signal</th>
            <th>ORB</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.symbol}
              role="button"
              onClick={() => onSelect(row)}
              className={row.buyConfirmed ? 'table-success' : row.earlyMomentum ? 'table-primary' : ''}
            >
              <td className="text-muted">{i + 1}</td>
              <td>
                <strong>{row.symbol}</strong>
                {row.earlyMomentum && <span className="badge text-bg-info ms-1 small">🔮 Early</span>}
                {row.chaseWarning && <span className="badge text-bg-warning ms-1 small">⚠️ Chase</span>}
                <div className="text-muted small">{row.industry}</div>
              </td>
              <td className={`text-end fw-bold ${row.pctFromOpen >= 0 ? 'text-success' : 'text-danger'}`}>
                {fmtPct(row.pctFromOpen)}
              </td>
              <td className="text-end">{row.rvol.toFixed(2)}x</td>
              <td className="text-end">
                <span className={row.vwap && row.price > row.vwap ? 'text-success' : 'text-danger'}>
                  {row.vwap && row.price > row.vwap ? '▲ Above' : '▼ Below'}
                </span>
              </td>
              <td className="text-end">{row.indScore}/100</td>
              <td className="text-end"><ScoreBadge score={row.momentumScore} /></td>
              <td><span className="small">{row.signalLabel}</span></td>
              <td>
                {row.orbStatus === 'BUY'  && <span className="badge text-bg-success">ORB BUY</span>}
                {row.orbStatus === 'SELL' && <span className="badge text-bg-danger">ORB SELL</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── MAIN COMPONENT ─────────────────────────────────────── */

export default function MomentumScanner({ scannerRows = [], marketScore = 50, industryScoreMap = new Map(), lastUpdated }) {
  const [activeZone, setActiveZone]         = useState('potential');
  const [selectedRow, setSelectedRow]       = useState(null);
  const [selectedIndustry, setSelectedIndustry] = useState('');

  const allRows = useMemo(
    () => buildMomentumScanner(scannerRows, [], marketScore, industryScoreMap),
    [scannerRows, marketScore, industryScoreMap]
  );

  const filteredRows = useMemo(() => {
    let rows = allRows;
    if (selectedIndustry) rows = rows.filter((r) => r.industry === selectedIndustry);

    if (activeZone === 'potential') {
      return rows.filter((r) => r.pctFromOpen >= 0 && r.pctFromOpen <= 5 && r.momentumScore >= 60)
        .sort((a, b) => b.momentumScore - a.momentumScore);
    }
    const zone = MOVEMENT_ZONES.find((z) => z.key === activeZone);
    if (!zone) return rows;
    return rows.filter((r) => r.pctFromOpen >= zone.min && r.pctFromOpen < zone.max);
  }, [allRows, activeZone, selectedIndustry]);

  const potentialMovers = useMemo(
    () => allRows.filter((r) => r.earlyMomentum && r.momentumScore >= 70).slice(0, 5),
    [allRows]
  );

  const topRow = filteredRows[0] || null;

  return (
    <div className="ms-page">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
        <div>
          <h4 className="mb-1">🚀 1–50% Intraday Momentum Scanner</h4>
          <p className="text-muted small mb-0">
            Identifies NSE stocks with strong technical, volume, market and industry conditions for a potential large intraday move from the day's opening price.
          </p>
        </div>
        <div className="text-end small text-muted">
          {lastUpdated ? `Updated: ${lastUpdated.toLocaleTimeString()}` : 'Awaiting data'}
        </div>
      </div>

      <div className="alert alert-secondary border-0 small py-2 mb-3">
        This scanner identifies <strong>developing momentum from 1% onward</strong>. Movement categories (1%, 10%, 50%) are monitoring levels — not guaranteed targets. Always use stop loss and risk/reward.
      </div>

      {/* Summary cards */}
      <div className="row g-2 mb-3">
        <div className="col-6 col-lg-3">
          <div className="ms-summary-card">
            <span>🔮 Potential Movers</span>
            <strong>{allRows.filter((r) => r.earlyMomentum).length}</strong>
            <small>1–5% with strong setup</small>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="ms-summary-card ms-summary-card--green">
            <span>🟢 Buy Confirmed</span>
            <strong>{allRows.filter((r) => r.buyConfirmed).length}</strong>
            <small>5+ conditions aligned</small>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="ms-summary-card ms-summary-card--orange">
            <span>🔥 High Momentum</span>
            <strong>{allRows.filter((r) => r.pctFromOpen >= 5).length}</strong>
            <small>5%+ from open</small>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="ms-summary-card ms-summary-card--red">
            <span>⚠️ Chase Warning</span>
            <strong>{allRows.filter((r) => r.chaseWarning).length}</strong>
            <small>Extended stocks</small>
          </div>
        </div>
      </div>

      {/* Zone tabs */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        {MOVEMENT_ZONES.map((zone) => (
          <button
            key={zone.key}
            type="button"
            className={`btn btn-sm ${activeZone === zone.key ? 'btn-dark' : 'btn-outline-dark'}`}
            onClick={() => setActiveZone(zone.key)}
          >
            {zone.label}
          </button>
        ))}
      </div>

      <div className="row g-3">
        {/* Left: table + detail */}
        <div className="col-12 col-xl-8">
          {/* Potential movers highlight */}
          {activeZone === 'potential' && potentialMovers.length > 0 && (
            <div className="ms-potential-strip mb-3">
              <div className="small fw-semibold mb-2">🔮 Top Early Momentum Candidates</div>
              <div className="d-flex flex-wrap gap-2">
                {potentialMovers.map((row) => (
                  <button
                    key={row.symbol}
                    type="button"
                    className="ms-potential-chip"
                    onClick={() => setSelectedRow(row)}
                  >
                    <strong>{row.symbol}</strong>
                    <span className="text-success">{fmtPct(row.pctFromOpen)}</span>
                    <span className="text-muted">{row.momentumScore}/100</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chase warning for top row */}
          {topRow?.chaseWarning && <ChaseWarning warning={topRow.chaseWarning} />}

          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body p-2">
              <MomentumTable rows={filteredRows} onSelect={setSelectedRow} />
            </div>
          </div>

          {selectedRow && (
            <div className="card border-0 shadow-sm mb-3">
              <div className="card-body">
                <StockDetail row={selectedRow} onClose={() => setSelectedRow(null)} />
              </div>
            </div>
          )}
        </div>

        {/* Right: industry panel */}
        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body">
              <IndustryPanel
                rows={allRows}
                selectedIndustry={selectedIndustry}
                onSelectIndustry={setSelectedIndustry}
              />
              {selectedIndustry && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary mt-2"
                  onClick={() => setSelectedIndustry('')}
                >
                  Clear filter
                </button>
              )}
            </div>
          </div>

          {/* Ranking legend */}
          <div className="card border-0 shadow-sm">
            <div className="card-body small">
              <div className="fw-semibold mb-2">Ranking Priority</div>
              <ol className="mb-0 ps-3 text-muted">
                <li>Momentum Score</li>
                <li>Relative Volume</li>
                <li>Industry Strength</li>
                <li>Price vs VWAP</li>
                <li>Breakout Strength</li>
                <li>EMA Structure</li>
                <li>Risk/Reward</li>
                <li>Market Confirmation</li>
              </ol>
              <div className="mt-2 text-muted">
                Early momentum (1–5% from open) is ranked above already-extended stocks.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
