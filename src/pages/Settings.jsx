import { useState } from 'react';
import StoresSettings   from '../components/settings/StoresSettings';
import PointsSettings   from '../components/settings/PointsSettings';
import PasswordSettings from '../components/settings/PasswordSettings';
import GeneralSettings  from '../components/settings/GeneralSettings';
import BrandingSettings from '../components/settings/BrandingSettings';

const TABS = [
  { key: 'stores',   label: 'Stores' },
  { key: 'rewards',  label: 'Rewards config' },
  { key: 'account',  label: 'Account & security' },
];

const VIEWS = {
  stores:   <StoresSettings />,
  rewards:  <PointsSettings />,
  account: (
    <div className="st-account-layout">
      <div className="st-account-grid">
        <GeneralSettings />
        <PasswordSettings />
      </div>
      <BrandingSettings />
    </div>
  ),
};

export default function Settings() {
  const [active, setActive] = useState('stores');

  return (
    <div className="st-page">
      <div className="st-container">
        <div className="pg-header st-page-header">
          <h5 className="pg-title">Settings</h5>
        </div>

        <div className="st-tabs" aria-label="Settings sections">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`st-tab ${active === t.key ? 'st-tab--active' : ''}`}
              onClick={() => setActive(t.key)}
              type="button"
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="st-tab-content">
          {VIEWS[active]}
        </div>
      </div>
    </div>
  );
}
