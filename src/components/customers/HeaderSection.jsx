'use client';

export default function HeaderSection({ search, onSearch, hideBlocked, onToggleBlocked }) {
  return (
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
      <div>
        <h5 className="pg-title mb-1">Customers</h5>
        <p className="pg-sub mb-0">Manage customer loyalty points and activity.</p>
      </div>
      <div className="d-flex align-items-center gap-2">
        <input
          type="search"
          className="form-control form-control-sm"
          placeholder="Search customer..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          style={{ maxWidth: 220 }}
        />
        <button
          type="button"
          className={`btn btn-sm ${hideBlocked ? 'btn-secondary' : 'btn-outline-secondary'}`}
          onClick={onToggleBlocked}
        >
          {hideBlocked ? 'Showing active only' : 'Hide blocked'}
        </button>
      </div>
    </div>
  );
}

