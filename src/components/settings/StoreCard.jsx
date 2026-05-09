import StatusChip  from './StatusChip';

export default function StoreCard({ store, onEdit, onToggleStatus, onToggleLogin }) {
  void onToggleStatus;
  void onToggleLogin;
  const managerCount = Number(store.managerCount ?? (store.manager ? 1 : 0));
  const isInactive = store.status === 'INACTIVE' || store.status === 'PENDING' || store.is_active === false;

  return (
    <div className={`scard ${isInactive ? 'inactive-store-card' : ''}`}>
      <div className="scard-top">
        <div className="scard-title-wrap">
          <span className="scard-name">{store.name}</span>
          <span className="scard-city">{store.city}</span>
        </div>
        <StatusChip status={store.status} />
      </div>

      <div className="scard-details">
        {[
          [addressIcon(), store.address],
          [phoneIcon(),   store.phone],
          [personIcon(),  `${managerCount} ${managerCount === 1 ? 'manager' : 'managers'}`],
        ].map(([icon, val], i) => (
          <div className="scard-detail-row" key={i}>
            <span className="scard-detail-icon">{icon}</span>
            <span className="scard-detail-val">{val}</span>
          </div>
        ))}
      </div>

      <div className="scard-actions">
        <span className={`scard-login-badge ${store.managerLogin && !isInactive ? '' : 'scard-login-badge--off'}`}>
          {store.managerLogin && !isInactive ? 'Login Active' : 'Login Inactive'}
        </span>
        <button
          className="scard-btn scard-btn--manage"
          onClick={() => onEdit(store)}
          disabled={isInactive}
        >
          Manage
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
