'use client';

export default function CustomerTable({ customers = [] }) {
  if (!customers.length) {
    return (
      <div className="card border-0 shadow-sm p-4 text-center text-muted">
        No customers found.
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm">
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Points</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c, i) => (
              <tr key={c.id || i}>
                <td className="fw-semibold">{c.name || '—'}</td>
                <td>{c.email || '—'}</td>
                <td>{c.phone || c.phone_number || '—'}</td>
                <td><span className="badge text-bg-primary">{c.points ?? 0}</span></td>
                <td>
                  <span className={`badge ${c.status === 'blocked' ? 'text-bg-danger' : 'text-bg-success'}`}>
                    {c.status || 'Active'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

