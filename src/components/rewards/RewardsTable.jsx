'use client';

export default function RewardsTable({ rewards = [], activeStores = [], onEdit, onDelete, onToggle }) {
  if (!rewards.length) {
    return (
      <div className="card border-0 shadow-sm p-4 text-center text-muted">
        No rewards found in catalog. Click &ldquo;New reward&rdquo; to add one.
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm">
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>Reward Title</th>
              <th>Points Required</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rewards.map((r) => {
              const id = r.id ?? r.reward_id ?? r.catalog_id;
              const isActive = r.is_active ?? r.isHot ?? false;
              return (
                <tr key={id}>
                  <td className="fw-semibold">{r.title || r.name || '—'}</td>
                  <td><span className="badge text-bg-warning">{r.points_required ?? r.points ?? 0} pts</span></td>
                  <td>
                    <button
                      type="button"
                      className={`btn btn-sm ${isActive ? 'btn-success' : 'btn-outline-secondary'}`}
                      onClick={() => onToggle?.(r)}
                    >
                      {isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="text-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary me-2"
                      onClick={() => onEdit?.(r)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => onDelete?.(id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

