'use client';

export default function PointsSettings() {
  return (
    <div className="card border-0 shadow-sm p-4">
      <h6 className="fw-bold mb-3">Rewards & Points Configuration</h6>
      <p className="text-muted small">Configure point earning ratios, redemption thresholds, and expiration policies.</p>
      <div className="row g-3" style={{ maxWidth: 500 }}>
        <div className="col-12">
          <label className="form-label small fw-semibold">Points per ₹100 spent</label>
          <input type="number" className="form-control" defaultValue={10} />
        </div>
        <div className="col-12">
          <label className="form-label small fw-semibold">Minimum points to redeem</label>
          <input type="number" className="form-control" defaultValue={100} />
        </div>
      </div>
    </div>
  );
}

