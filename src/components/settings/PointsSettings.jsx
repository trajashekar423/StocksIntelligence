import { useState } from 'react';
import ToggleSwitch from './ToggleSwitch';

export default function PointsSettings() {
  const [cfg, setCfg] = useState({
    currency: 'Points',
    perPurchase: 1,
    welcomeBonus: 100,
    birthdayBonus: 50,
    expiry: 365,
    enabled: true,
  });
  const currencyOptions = ['Points', 'Stars', 'Custom'];

  return (
    <div className="st-sections">
      <div className="st-rewards-grid">
        <div className="st-card">
          <div className="st-card-header">Points configuration</div>
          <div className="st-card-body">
            <div className="st-field">
              <label className="st-label">Points currency</label>
              <div className="st-pill-group">
                {currencyOptions.map(option => (
                  <button
                    key={option}
                    type="button"
                    className={`st-pill ${cfg.currency === option ? 'st-pill--active' : ''}`}
                    onClick={() => setCfg(p => ({ ...p, currency: option }))}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div className="st-field">
              <label className="st-label">Points per $1 spent</label>
              <input className="st-input" type="number" min={0} value={cfg.perPurchase} onChange={e => setCfg(p => ({ ...p, perPurchase: e.target.value }))} />
            </div>
            <div className="st-info-box">
              A $50 purchase earns {Number(cfg.perPurchase || 0) * 50} {cfg.currency}
            </div>
          </div>
        </div>

        <div className="st-card">
          <div className="st-card-header">Bonus points</div>
          <div className="st-card-body">
            <div className="st-field">
              <label className="st-label">Welcome bonus</label>
              <input className="st-input" type="number" min={0} value={cfg.welcomeBonus} onChange={e => setCfg(p => ({ ...p, welcomeBonus: e.target.value }))} />
              <span className="st-hint">Awarded once when a customer joins.</span>
            </div>
            <div className="st-field">
              <label className="st-label">Birthday bonus</label>
              <input className="st-input" type="number" min={0} value={cfg.birthdayBonus} onChange={e => setCfg(p => ({ ...p, birthdayBonus: e.target.value }))} />
              <span className="st-hint">Awarded during the customer birthday period.</span>
            </div>
          </div>
        </div>

        <div className="st-card">
          <div className="st-card-header">Points expiration</div>
          <div className="st-card-body">
            <div className="st-toggle-row st-toggle-row--between">
              <span className="st-label">Enable points expiration</span>
              <ToggleSwitch checked={cfg.enabled} onChange={() => setCfg(p => ({ ...p, enabled: !p.enabled }))} />
            </div>
            <div className="st-field">
              <label className="st-label">Expiration days</label>
              <input className="st-input" type="number" min={0} value={cfg.expiry} onChange={e => setCfg(p => ({ ...p, expiry: e.target.value }))} />
            </div>
          </div>
        </div>
      </div>

      <div className="st-save-row">
        <button className="st-btn-secondary">Discard</button>
        <button className="rn-btn-primary">Save rewards config</button>
      </div>
    </div>
  );
}
