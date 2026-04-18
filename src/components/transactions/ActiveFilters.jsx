import { RiCloseLine } from 'react-icons/ri';

export default function ActiveFilters({ filters, onClearAll }) {
  if (!filters.length) return null;

  return (
    <div className="af-box">
      <div className="af-header">
        <span className="af-title">Active Filters</span>
        <button type="button" className="af-clear-all" onClick={onClearAll}>
          Clear All
        </button>
      </div>
      <div className="af-chips">
        {filters.map((f) => (
          <span key={f.key} className="af-chip">
            {f.label}
            <button
              type="button"
              className="af-chip-remove"
              onClick={() => onClearAll(f.key)}
              aria-label={`Remove ${f.label}`}
            >
              <RiCloseLine size={12} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
