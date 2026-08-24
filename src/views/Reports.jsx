'use client';

export default function Reports() {
  return (
    <div>
      <div className="pg-header">
        <h5 className="pg-title">Reports</h5>
        <p className="pg-sub">Monthly performance overview.</p>
      </div>
      <div className="pg-card">
        <div className="pg-card-header">
          <span className="pg-card-title">Analytics</span>
        </div>
        <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
          <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>Coming Soon</p>
          <p style={{ fontSize: '0.875rem' }}>This section is under construction.</p>
        </div>
      </div>
    </div>
  );
}
