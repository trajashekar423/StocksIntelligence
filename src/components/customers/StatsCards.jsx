'use client';

export default function StatsCards({ customers = [] }) {
  const total = customers.length;
  const active = customers.filter((c) => c.status !== 'blocked').length;
  const totalPoints = customers.reduce((sum, c) => sum + (Number(c.points) || 0), 0);

  return (
    <div className="row g-3 mb-4">
      <div className="col-sm-4">
        <div className="card border-0 shadow-sm p-3">
          <div className="text-muted small">Total Customers</div>
          <div className="fs-4 fw-bold">{total}</div>
        </div>
      </div>
      <div className="col-sm-4">
        <div className="card border-0 shadow-sm p-3">
          <div className="text-muted small">Active Customers</div>
          <div className="fs-4 fw-bold text-success">{active}</div>
        </div>
      </div>
      <div className="col-sm-4">
        <div className="card border-0 shadow-sm p-3">
          <div className="text-muted small">Total Points Issued</div>
          <div className="fs-4 fw-bold text-primary">{totalPoints.toLocaleString('en-IN')}</div>
        </div>
      </div>
    </div>
  );
}

