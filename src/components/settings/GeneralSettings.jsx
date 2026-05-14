import { getUser } from '../../utils/authStorage';

export default function GeneralSettings() {
  const user = getUser();
  const client = user?.client ?? {};

  return (
    <div className="st-sections st-sections--flat">
      <div className="st-card">
        <div className="st-card-header">Account info</div>
        <div className="st-card-body">
          <div className="st-account-card-head">
            <div className="st-avatar">
              {user?.profile_image
                ? <img src={user.profile_image} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                : (user?.first_name || 'A').charAt(0)}
            </div>
            <div>
              <div className="st-account-name">{user?.display_name || user?.name || 'Account owner'}</div>
              <div className="st-account-role">{user?.role ?? 'Store owner'}</div>
            </div>
          </div>

          <div className="st-field">
            <label className="st-label">Full name</label>
            <input className="st-input" type="text" readOnly value={user?.name ?? ''} />
          </div>
          <div className="st-field">
            <label className="st-label">Email</label>
            <input className="st-input" type="email" readOnly value={user?.email_address ?? user?.email ?? ''} />
          </div>
          <div className="st-field">
            <label className="st-label">Phone number</label>
            <input className="st-input" type="tel" readOnly value={user?.mobile_number ?? ''} />
          </div>
          <div className="st-field">
            <label className="st-label">Merchant name</label>
            <input className="st-input" type="text" readOnly value={client?.merchant_name ?? ''} />
          </div>
          {client?.brand_logo && (
            <div className="st-field">
              <label className="st-label">Brand logo</label>
              <img src={client.brand_logo} alt="Brand logo" style={{ height: 48, borderRadius: 6, marginTop: 4 }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
