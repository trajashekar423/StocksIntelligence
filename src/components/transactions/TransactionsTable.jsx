'use client';

export default function TransactionsTable({ transactions = [] }) {
  if (!transactions.length) {
    return (
      <div className="p-4 text-center text-muted">
        No transactions found.
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th>Date</th>
            <th>Customer</th>
            <th>Type</th>
            <th>Description</th>
            <th>Points</th>
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t, index) => (
            <tr key={t.id || index}>
              <td>
                <div>{t.date || '—'}</div>
                <small className="text-muted">{t.time || ''}</small>
              </td>
              <td>
                <div className="fw-semibold">{t.customerName || t.customer || '—'}</div>
                <small className="text-muted">{t.phone || ''}</small>
              </td>
              <td>
                <span className={`badge ${t.type === 'EARNED' ? 'text-bg-success' : 'text-bg-warning'}`}>
                  {t.type || '—'}
                </span>
              </td>
              <td>{t.description || '—'}</td>
              <td className="fw-bold">
                <span className={t.points >= 0 ? 'text-success' : 'text-danger'}>
                  {t.points >= 0 ? `+${t.points}` : t.points}
                </span>
              </td>
              <td>{t.location || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

