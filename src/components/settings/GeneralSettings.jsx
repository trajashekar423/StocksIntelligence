import { useState } from 'react';

export default function GeneralSettings() {
  const [biz, setBiz] = useState({ name: '', email: '', phone: '', website: '' });
  const [personal, setPersonal] = useState({ firstName: '', lastName: '', phone: '' });

  return (
    <div className="st-sections st-sections--flat">
      <div className="st-card">
        <div className="st-card-header">Account info</div>
        <div className="st-card-body">
          <div className="st-account-card-head">
            <div className="st-avatar">
              {(personal.firstName || 'A').charAt(0)}
            </div>
            <div>
              <div className="st-account-name">
                {personal.firstName || personal.lastName ? `${personal.firstName} ${personal.lastName}`.trim() : 'Account owner'}
              </div>
              <div className="st-account-role">Store owner</div>
            </div>
          </div>

          <div className="st-field">
            <label className="st-label">Phone number</label>
            <input className="st-input" type="tel" placeholder="+1 (555) 000-0000" value={personal.phone} onChange={e => setPersonal(p => ({ ...p, phone: e.target.value }))} />
          </div>
          <div className="st-field">
            <label className="st-label">Email</label>
            <input className="st-input" type="email" placeholder="contact@acme.com" value={biz.email} onChange={e => setBiz(p => ({ ...p, email: e.target.value }))} />
          </div>

          <div className="st-save-row">
            <button className="rn-btn-primary">Save account info</button>
          </div>
        </div>
      </div>
    </div>
  );
}
