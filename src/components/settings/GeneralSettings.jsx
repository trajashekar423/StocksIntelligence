import { useState } from 'react';

export default function GeneralSettings() {
  const [biz, setBiz] = useState({ name: '', email: '', phone: '', website: '' });
  const [personal, setPersonal] = useState({ firstName: '', lastName: '', phone: '' });

  return (
    <div className="st-sections">
      <div className="st-card">
        <div className="st-card-header">Business Information</div>
        <div className="st-card-body">
          <div className="st-grid-2">
            {[
              ['Business Name', 'name', 'text', 'Acme Corp'],
              ['Contact Email', 'email', 'email', 'contact@acme.com'],
              ['Phone', 'phone', 'tel', '+1 (555) 000-0000'],
              ['Website', 'website', 'url', 'https://acme.com'],
            ].map(([label, key, type, ph]) => (
              <div className="st-field" key={key}>
                <label className="st-label">{label}</label>
                <input className="st-input" type={type} placeholder={ph} value={biz[key]} onChange={e => setBiz(p => ({ ...p, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="st-card">
        <div className="st-card-header">Personal Information</div>
        <div className="st-card-body">
          <div className="st-grid-2">
            {[
              ['First Name', 'firstName', 'text', 'John'],
              ['Last Name', 'lastName', 'text', 'Doe'],
              ['Phone Number', 'phone', 'tel', '+1 (555) 000-0000'],
            ].map(([label, key, type, ph]) => (
              <div className="st-field" key={key}>
                <label className="st-label">{label}</label>
                <input className="st-input" type={type} placeholder={ph} value={personal[key]} onChange={e => setPersonal(p => ({ ...p, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="st-save-row">
        <button className="rn-btn-primary">Save Changes</button>
      </div>
    </div>
  );
}
