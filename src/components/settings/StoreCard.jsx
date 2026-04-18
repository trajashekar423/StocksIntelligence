import StatusChip  from './StatusChip';
import ToggleSwitch from './ToggleSwitch';

export default function StoreCard({ store, onEdit, onToggleStatus, onToggleLogin }) {
  const isActive = store.status === 'ACTIVE';

  return (
    <div className="scard">
      {/* Top */}
      <div className="scard-top">
        <div className="scard-icon">
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <div className="scard-title-wrap">
          <span className="scard-name">{store.name}</span>
          <span className="scard-city">{store.city}</span>
        </div>
        <StatusChip status={store.status} />
      </div>

      {/* Details */}
      <div className="scard-details">
        {[
          [addressIcon(), store.address],
          [phoneIcon(),   store.phone],
          [personIcon(),  store.manager],
        ].map(([icon, val], i) => (
          <div className="scard-detail-row" key={i}>
            <span className="scard-detail-icon">{icon}</span>
            <span className="scard-detail-val">{val}</span>
          </div>
        ))}
        {store.managerLogin && (
          <span className="scard-login-badge">Login Active</span>
        )}
      </div>

      <div className="scard-divider" />

      {/* Manager Login */}
      <div className="scard-login-row">
        <span className="scard-login-label">Manager Login</span>
        <div className="scard-login-controls">
          <ToggleSwitch checked={store.managerLogin} onChange={() => onToggleLogin(store.id)} />
          <button className="scard-manage-link" onClick={() => onEdit(store)}>Manage Access</button>
        </div>
      </div>

      <div className="scard-divider" />

      {/* Actions */}
      <div className="scard-actions">
        <button className="scard-btn scard-btn--edit" onClick={() => onEdit(store)}>Edit</button>
        <button
          className={`scard-btn ${isActive ? 'scard-btn--deactivate' : 'scard-btn--activate'}`}
          onClick={() => onToggleStatus(store.id)}
        >
          {isActive ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </div>
  );
}

function addressIcon() {
  return (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function phoneIcon() {
  return (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.09 4.18 2 2 0 0 1 5.07 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L9.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function personIcon() {
  return (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
