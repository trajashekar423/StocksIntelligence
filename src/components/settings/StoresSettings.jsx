'use client';

export default function StoresSettings({ stores = [], loading, error, statusFilter }) {
  if (loading) return <div className="p-4 text-center text-muted">Loading stores...</div>;
  if (error) return <div className="alert alert-warning">{error}</div>;

  const filtered = stores.filter((s) => !statusFilter || s.status === statusFilter);

  return (
    <div className="row g-3">
      {filtered.length === 0 ? (
        <div className="col-12 text-muted p-4">No {statusFilter.toLowerCase()} stores found.</div>
      ) : (
        filtered.map((store) => (
          <div key={store.id} className="col-md-6">
            <div className="card border-0 shadow-sm p-3">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <h6 className="fw-bold mb-0">{store.name}</h6>
                <span className={`badge ${store.status === 'ACTIVE' ? 'text-bg-success' : 'text-bg-secondary'}`}>
                  {store.status}
                </span>
              </div>
              <p className="text-muted small mb-1">{store.address}</p>
              <p className="text-muted small mb-0">{store.phone} · {store.email}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

