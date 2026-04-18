import { useState } from 'react';
import GeneralSettings  from '../components/settings/GeneralSettings';
import BrandingSettings from '../components/settings/BrandingSettings';
import StoresSettings   from '../components/settings/StoresSettings';
import PointsSettings   from '../components/settings/PointsSettings';
import PasswordSettings from '../components/settings/PasswordSettings';

const TABS = [
  { key: 'general',  label: 'General' },
  { key: 'branding', label: 'Branding' },
  { key: 'stores',   label: 'Stores' },
  { key: 'points',   label: 'Points System' },
  { key: 'password', label: 'Password' },
];

const VIEWS = {
  general:  <GeneralSettings />,
  branding: <BrandingSettings />,
  stores:   <StoresSettings />,
  points:   <PointsSettings />,
  password: <PasswordSettings />,
};

export default function Settings() {
  const [active, setActive] = useState('general');

  return (
    <div>
      <div className="pg-header">
        <h5 className="pg-title">Settings</h5>
        <p className="pg-sub">Manage your business and loyalty program settings.</p>
      </div>

      <div className="st-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`st-tab ${active === t.key ? 'st-tab--active' : ''}`}
            onClick={() => setActive(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="st-tab-content">
        {VIEWS[active]}
      </div>
    </div>
  );
}
