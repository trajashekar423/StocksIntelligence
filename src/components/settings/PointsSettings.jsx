import { useState } from 'react';

export default function PointsSettings() {
  const [cfg, setCfg] = useState({ perPurchase: 10, minRedeem: 100, expiry: 365, enabled: true });

  return (
    <div className="st-sections">
      <div className="st-card">
        <div className="st-card-header">Points System</div>
        <div className="st-card-body">
          <div className="st-grid-2">
            {[
              ['Points per Purchase', 'perPurchase', 'Points earned per $1 spent'],
              ['Minimum Points to Redeem', 'minRedeem', 'Minimum balance required to redeem'],
              ['Expiry Duration (days)', 'expiry', 'Points expire after this many days'],
            ].map(([label, key, hint]) => (
              <div className="st-field" key={key}>
                <label className="st-label">{label}</label>
                <input className="st-input" type="number" min={0} value={cfg[key]} onChange={e => setCfg(p => ({ ...p, [key]: e.target.value }))} />
                <span className="st-hint">{hint}</span>
              </div>
            ))}

            <div className="st-field">
              <label className="st-label">Points System</label>
              <div className="st-toggle-row">
                <span className="st-hint" style={{ margin: 0 }}>{cfg.enabled ? 'Enabled' : 'Disabled'}</span>
                <button
                  className={`st-toggle ${cfg.enabled ? 'st-toggle--on' : ''}`}
                  onClick={() => setCfg(p => ({ ...p, enabled: !p.enabled }))}
                  aria-label="Toggle points system"
                >
                  <span className="st-toggle-thumb" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="st-save-row">
        <button className="rn-btn-primary">Save Changes</button>
      </div>
    </div>
  );
}
