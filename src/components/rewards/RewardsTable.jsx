function getRewardKey(reward, index) {
  return reward.id ?? reward.reward_id ?? reward.rewardId ?? `${reward.reward_name ?? 'reward'}-${index}`;
}

function getRewardId(reward) {
  return reward.id ?? reward.reward_id ?? reward.catalog_id;
}

function getRewardName(reward) {
  return reward.reward_name ?? reward.title ?? 'Untitled reward';
}

function getDescription(reward) {
  return reward.reward_description ?? reward.description ?? '';
}

function getPoints(reward) {
  return reward.points_cost ?? reward.points ?? 0;
}

function getRedeemed(reward) {
  return reward.redeemed_count ?? reward.redeemedCount ?? 0;
}

function getStores(reward) {
  const stores = reward.stores ?? reward.store_names ?? reward.business_names;
  if (stores === 'ALL' || reward.applyToAll) return ['All stores'];
  if (Array.isArray(stores)) return stores;
  if (typeof stores === 'string' && stores.trim()) return stores.split(',').map((store) => store.trim());
  return ['All stores'];
}

function isRewardActive(reward) {
  return reward.is_active ?? reward.isHot ?? false;
}

function GiftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function StorePills({ stores }) {
  const visibleStores = stores.slice(0, 2);
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

export default function RewardsTable({ rewards, onEdit, onDelete }) {
  if (!rewards.length) {
    return <div className="rw-empty">No rewards found.</div>;
  }

  return (
    <div className="rw-table-card">
      <div className="rw-table-scroll">
        <table className="rw-table">
          <thead>
            <tr>
              <th>Reward</th>
              <th>Description</th>
              <th>Stores</th>
              <th>Points</th>
              <th>Redeemed</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rewards.map((reward, index) => {
              const rewardId = getRewardId(reward);
              const isActive = isRewardActive(reward);

              return (
                <tr key={getRewardKey(reward, index)}>
                  <td>
                    <div className="rw-reward-cell">
                      <div className="rw-icon-box">
                        <GiftIcon />
                      </div>
                      <div>
                        <div className="rw-title">{getRewardName(reward)}</div>
                        <div className="rw-id">#{rewardId ?? 'new'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="rw-table-desc">{getDescription(reward)}</td>
                  <td><StorePills stores={getStores(reward)} /></td>
                  <td>
                    <span className="rw-points"><span aria-hidden="true">★</span>{getPoints(reward)} pts</span>
                  </td>
                  <td className="rw-redeemed">{getRedeemed(reward)} times</td>
                  <td>
                    <span className={`rw-switch${isActive ? ' rw-switch--on' : ''}`} aria-label={isActive ? 'Active' : 'Inactive'}>
                      <span />
                    </span>
                  </td>
                  <td>
                    <div className="rw-actions">
                      <button className="rw-action-btn rw-action-edit" onClick={() => onEdit(reward)} title="Edit">
                        <EditIcon />
                        <span>Edit</span>
                      </button>
                      <button className="rw-action-btn rw-action-delete" onClick={() => onDelete(rewardId)} title="Delete">
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
