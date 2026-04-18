export default function HeaderSection({ search, onSearch, hideBlocked, onToggleBlocked }) {
  return (
    <div className="cm-header">
      <div>
        <h2 className="cm-title">Customer Management</h2>
        <p className="cm-subtitle">Manage and track your loyalty members</p>
      </div>
      <div className="cm-header-actions">
        <div className="cm-search-wrap">
          <svg className="cm-search-icon" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="cm-search"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <button
          className={`cm-btn cm-btn-ghost ${hideBlocked ? 'cm-btn-ghost--active' : ''}`}
          onClick={onToggleBlocked}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
          Hide Blocked
        </button>
        <button className="cm-btn cm-btn-ghost">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Import
        </button>
        <button className="cm-btn cm-btn-ghost">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export
        </button>
      </div>
    </div>
  );
}
