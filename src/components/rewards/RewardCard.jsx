function getStores(reward) {
  const stores = reward.stores ?? reward.store_names ?? reward.business_names;
  if (stores === 'ALL' || reward.applyToAll) return ['All stores'];
  if (Array.isArray(stores)) return stores;
  if (typeof stores === 'string' && stores.trim()) return stores.split(',').map((store) => store.trim());
  return ['All stores'];
}

function GiftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function StorePills({ stores }) {
  const visibleStores = stores.slice(0, 3);
  const hiddenCount = Math.max(stores.length - visibleStores.length, 0);

  return (
    <div className="rw-store-pills">
      {visibleStores.map((store) => (
        <span key={store} className={`rw-store-pill${store === 'All stores' ? ' rw-store-pill--all' : ''}`}>
          {store}
        </span>
      ))}
      {hiddenCount > 0 && <span className="rw-store-pill rw-store-pill--more">+{hiddenCount}</span>}
    </div>
  );
}

export default function RewardCard({ reward, onEdit, onDelete }) {
  const rewardId = reward.id ?? reward.reward_id ?? reward.catalog_id;
  const rewardName = reward.reward_name ?? reward.title ?? 'Untitled reward';
  const description = reward.reward_description ?? reward.description ?? '';
  const pointsCost = reward.points_cost ?? reward.points ?? 0;
  const redeemedCount = reward.redeemed_count ?? reward.redeemedCount ?? 0;
  const isActive = reward.is_active ?? reward.isHot ?? false;

  return (
    <article className={`rw-card${isActive ? '' : ' rw-card--inactive'}`}>
      <div className="rw-card-top">
        <div className="rw-icon-box">
          <GiftIcon />
        </div>
        <span className={`rw-switch${isActive ? ' rw-switch--on' : ''}`} aria-label={isActive ? 'Active' : 'Inactive'}>
          <span />
        </span>
      </div>

      <div className="rw-card-copy">
        <h6 className="rw-title">{rewardName}</h6>
        <p className="rw-desc">{description}</p>
      </div>

      <div className="rw-card-meta">
        <span className="rw-points"><span aria-hidden="true">★</span>{pointsCost} pts</span>
        <span className="rw-redeemed">{redeemedCount} redeemed</span>
      </div>

      <div className="rw-card-divider" />

      <div className="rw-card-stores">
        <span className="rw-store-label">AT:</span>
        <StorePills stores={getStores(reward)} />
      </div>

      <div className="rw-card-footer">
        <button className="rw-card-edit" onClick={() => onEdit(reward)}>
          Edit
        </button>
        <button className="rw-card-delete" onClick={() => onDelete(rewardId)} title="Delete" aria-label="Delete reward">
          <TrashIcon />
        </button>
      </div>
    </article>
  );
}
