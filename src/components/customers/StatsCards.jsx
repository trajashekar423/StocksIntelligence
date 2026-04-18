const STATS = [
  {
    label: 'Total Customers',
    value: (customers) => customers.length,
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.12)',
  },
  {
    label: 'Average Points',
    value: (customers) =>
      customers.length ? Math.round(customers.reduce((s, c) => s + c.points, 0) / customers.length) : 0,
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
  },
  {
    label: 'Top Tier Members',
    value: (customers) => customers.filter((c) => c.tier === 'VIP').length,
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.12)',
  },
  {
    label: 'Blocked Customers',
    value: (customers) => customers.filter((c) => c.status === 'blocked').length,
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      </svg>
    ),
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
  },
];

export default function StatsCards({ customers }) {
  return (
    <div className="cm-stats-grid">
      {STATS.map(({ label, value, icon, color, bg }) => (
        <div className="cm-stat-card" key={label}>
          <div className="cm-stat-icon" style={{ color, background: bg }}>{icon}</div>
          <div>
            <p className="cm-stat-label">{label}</p>
            <p className="cm-stat-value">{value(customers)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
