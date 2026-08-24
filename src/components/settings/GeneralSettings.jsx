'use client';

export default function GeneralSettings() {
  return (
    <div className="card border-0 shadow-sm p-4">
      <h6 className="fw-bold mb-3">General Profile</h6>
      <div className="mb-3">
        <label className="form-label small fw-semibold">Business Name</label>
        <input type="text" className="form-control" defaultValue="RaNevra Business" />
      </div>
      <div className="mb-3">
        <label className="form-label small fw-semibold">Support Email</label>
        <input type="email" className="form-control" defaultValue="support@ranevra.com" />
      </div>
    </div>
  );
}

