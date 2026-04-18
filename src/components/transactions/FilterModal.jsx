import { useEffect } from 'react';
import { RiCloseLine } from 'react-icons/ri';
import FilterOptionCard from './FilterOptionCard';
import ActiveFilters from './ActiveFilters';
import { buildActiveFilters } from '../../hooks/useTransactionFilters';

const TYPE_OPTIONS = [
  { value: 'ALL',      title: 'All',      subtitle: 'Show every transaction'   },
  { value: 'EARNED',   title: 'Earned',   subtitle: 'Points added to account'  },
  { value: 'REDEEMED', title: 'Redeemed', subtitle: 'Points used for rewards'  },
];

const DATE_OPTIONS = [
  { value: 'ALL',     label: 'All Time'    },
  { value: 'TODAY',   label: 'Today'       },
  { value: '7_DAYS',  label: 'Last 7 Days' },
  { value: '30_DAYS', label: 'Last 30 Days'},
  { value: 'CUSTOM',  label: 'Custom Range'},
];

export default function FilterModal({ open, onClose, draft, set, reset, apply, cancel, clearOne }) {
  const activeChips = buildActiveFilters(draft);
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') cancel(onClose); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, cancel, onClose]);

  if (!open) return null;

  return (
    <div className="fm-overlay" onClick={() => cancel(onClose)}>
      <div className="fm-modal" onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="fm-header">
          <span className="fm-title">Filter Transactions</span>
          <button className="fm-close" onClick={() => cancel(onClose)}>
            <RiCloseLine size={20} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="fm-body">

          {/* Section 1 — Transaction Type */}
          <section className="fm-section">
            <p className="fm-section-label">Transaction Type</p>
            <div className="fm-type-grid">
              {TYPE_OPTIONS.map((opt) => (
                <FilterOptionCard
                  key={opt.value}
                  title={opt.title}
                  subtitle={opt.subtitle}
                  selected={draft.type === opt.value}
                  onClick={() => set('type', opt.value)}
                />
              ))}
            </div>
          </section>

          {/* Section 2 — Date Range */}
          <section className="fm-section">
            <p className="fm-section-label">Date Range</p>
            <div className="fm-date-grid">
              {DATE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`fm-date-btn ${draft.dateRange === opt.value ? 'fm-date-btn--selected' : ''}`}
                  onClick={() => set('dateRange', opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {draft.dateRange === 'CUSTOM' && (
              <div className="fm-custom-dates">
                <div className="fm-date-field">
                  <label className="fm-label">Start Date</label>
                  <input
                    type="date"
                    className="fm-input"
                    value={draft.startDate}
                    max={draft.endDate || undefined}
                    onChange={(e) => set('startDate', e.target.value)}
                  />
                </div>
                <div className="fm-date-field">
                  <label className="fm-label">End Date</label>
                  <input
                    type="date"
                    className="fm-input"
                    value={draft.endDate}
                    min={draft.startDate || undefined}
                    onChange={(e) => set('endDate', e.target.value)}
                  />
                </div>
              </div>
            )}
          </section>

          {/* Section 3 — Points Range */}
          <section className="fm-section">
            <p className="fm-section-label">Points Range</p>
            <div className="fm-points-row">
              <div className="fm-date-field">
                <label className="fm-label">Min Points</label>
                <input
                  type="number"
                  className="fm-input"
                  min={0}
                  value={draft.minPoints}
                  onChange={(e) => set('minPoints', e.target.value)}
                />
              </div>
              <div className="fm-points-sep">—</div>
              <div className="fm-date-field">
                <label className="fm-label">Max Points</label>
                <input
                  type="number"
                  className="fm-input"
                  min={0}
                  value={draft.maxPoints}
                  onChange={(e) => set('maxPoints', e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Section 4 — Active Filters */}
          <section className="fm-section fm-section--last">
            <ActiveFilters filters={activeChips} onClearAll={clearOne} />
            {!activeChips.length && (
              <p className="af-empty">No filters applied yet.</p>
            )}
          </section>
        </div>

        {/* ── Footer ── */}
        <div className="fm-footer">
          <button type="button" className="fm-btn-reset" onClick={reset}>
            Reset Filters
          </button>
          <div className="fm-footer-right">
            <button type="button" className="fm-btn-cancel" onClick={() => cancel(onClose)}>
              Cancel
            </button>
            <button type="button" className="fm-btn-apply" onClick={() => apply(onClose)}>
              Apply Filters
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
