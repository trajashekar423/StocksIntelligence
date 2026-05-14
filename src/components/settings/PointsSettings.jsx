import { useState, useEffect, useCallback } from 'react';
import ToggleSwitch from './ToggleSwitch';
import { fetchLoyaltyProgram, updateLoyaltyProgram } from '../../services/settingsService';

const PRESET_CURRENCIES = ['Points', 'Stars', 'Custom'];

const EMPTY = {
  points_currency:        'Points',
  customCurrencyName:     '',
  points_earn_per_dollar: 1,
  welcome_bonus:          0,
  birthday_bonus:         0,
  point_expiration:       30,
  expirationEnabled:      true,
};

function apiToForm(data) {
  const isPreset = ['Points', 'Stars'].includes(data.points_currency);
  return {
    points_currency:        isPreset ? data.points_currency : 'Custom',
    customCurrencyName:     isPreset ? '' : (data.points_currency ?? ''),
    points_earn_per_dollar: Number(data.points_earn_per_dollar ?? 1),
    welcome_bonus:          Number(data.welcome_bonus ?? 0),
    birthday_bonus:         Number(data.birthday_bonus ?? 0),
    point_expiration:       Number(data.point_expiration ?? 30),
    expirationEnabled:      data.is_active ?? true,
  };
}

function validate(form) {
  const errors = {};
  const rate = Number(form.points_earn_per_dollar);
  if (isNaN(rate) || rate < 0)
    errors.points_earn_per_dollar = 'A valid number is required.';
  if (form.points_currency === 'Custom' && !form.customCurrencyName.trim())
    errors.customCurrencyName = 'Please enter a custom currency name.';
  if (form.expirationEnabled) {
    const exp = Number(form.point_expiration);
    if (isNaN(exp) || exp < 1) errors.point_expiration = 'Must be at least 1 day.';
    else if (exp > 365)        errors.point_expiration = 'Maximum is 365 days.';
  }
  return errors;
}

export default function PointsSettings() {
  const [form,       setForm]       = useState(EMPTY);
  const [original,   setOriginal]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [errors,     setErrors]     = useState({});
  const [apiError,   setApiError]   = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setApiError('');
    try {
      const data   = await fetchLoyaltyProgram();
      const mapped = apiToForm(data);
      setForm(mapped);
      setOriginal(mapped);
    } catch {
      setApiError('Failed to load rewards configuration.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function set(field, value) {
    setForm(p => ({ ...p, [field]: value }));
    setErrors(p => ({ ...p, [field]: undefined }));
    setSuccessMsg('');
  }

  function handleDiscard() {
    if (original) {
      setForm(original);
      setErrors({});
      setApiError('');
      setSuccessMsg('');
    }
  }

  async function handleSave() {
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    setApiError('');
    setSuccessMsg('');
    try {
      const body = {
        points_currency:        form.points_currency === 'Custom'
                                  ? form.customCurrencyName.trim()
                                  : form.points_currency,
        points_earn_per_dollar: Number(form.points_earn_per_dollar),
        welcome_bonus:          Number(form.welcome_bonus),
        birthday_bonus:         Number(form.birthday_bonus),
        point_expiration:       form.expirationEnabled ? Number(form.point_expiration) : 0,
        currency:               'USD',
      };
      await updateLoyaltyProgram(body);
      setSuccessMsg('Rewards configuration saved successfully.');
      setOriginal(form);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors && typeof data.errors === 'object') {
        const fieldErrors = {};
        Object.entries(data.errors).forEach(([key, val]) => {
          fieldErrors[key] = Array.isArray(val) ? val.join(' ') : val;
        });
        setErrors(fieldErrors);
      } else {
        setApiError(data?.message || data?.detail || 'Failed to save. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  }

  const currencyLabel = form.points_currency === 'Custom'
    ? (form.customCurrencyName.trim() || 'Points')
    : form.points_currency;

  const previewEarned = (Number(form.points_earn_per_dollar) || 0) * 50;

  if (loading) {
    return (
      <div className="st-sections">
        <div className="st-rewards-grid">
          {[1, 2, 3].map(i => (
            <div key={i} className="st-card">
              <div className="st-card-header">Loading…</div>
              <div className="st-card-body">
                <div className="ps-skeleton" />
                <div className="ps-skeleton ps-skeleton--short" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="st-sections">

      {apiError   && <div className="st-error-alert">{apiError}</div>}
      {successMsg && <div className="ps-success-alert">{successMsg}</div>}

      <div className="st-rewards-grid">

        {/* Card 1 — Points Configuration */}
        <div className="st-card">
          <div className="st-card-header">Points configuration</div>
          <div className="st-card-body">

            <div className="st-field">
              <label className="st-label">Points currency name</label>
              <div className="st-pill-group">
                {PRESET_CURRENCIES.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    className={`st-pill ${form.points_currency === opt ? 'st-pill--active' : ''}`}
                    onClick={() => set('points_currency', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {form.points_currency === 'Custom' && (
              <div className="st-field">
                <label className="st-label">Custom currency name</label>
                <input
                  className={`st-input${errors.customCurrencyName ? ' st-input--error' : ''}`}
                  type="text"
                  placeholder="e.g. Coins"
                  value={form.customCurrencyName}
                  onChange={e => set('customCurrencyName', e.target.value)}
                />
                {errors.customCurrencyName && (
                  <span className="st-error">{errors.customCurrencyName}</span>
                )}
              </div>
            )}

            <div className="st-field">
              <label className="st-label">Points per $1 spent</label>
              <input
                className={`st-input${errors.points_earn_per_dollar ? ' st-input--error' : ''}`}
                type="number"
                min={0}
                step="0.01"
                value={form.points_earn_per_dollar}
                onChange={e => set('points_earn_per_dollar', e.target.value)}
              />
              {errors.points_earn_per_dollar && (
                <span className="st-error">{errors.points_earn_per_dollar}</span>
              )}
            </div>

            <div className="st-info-box">
              A $50 purchase earns <strong>{previewEarned}</strong> {currencyLabel}
            </div>

          </div>
        </div>

        {/* Card 2 — Bonus Points */}
        <div className="st-card">
          <div className="st-card-header">Bonus points</div>
          <div className="st-card-body">

            <div className="st-field">
              <label className="st-label">Welcome bonus (new sign-ups)</label>
              <input
                className="st-input"
                type="number"
                min={0}
                value={form.welcome_bonus}
                onChange={e => set('welcome_bonus', e.target.value)}
              />
              <span className="st-hint">Given automatically when a customer registers.</span>
            </div>

            <div className="st-field">
              <label className="st-label">Birthday bonus</label>
              <input
                className="st-input"
                type="number"
                min={0}
                value={form.birthday_bonus}
                onChange={e => set('birthday_bonus', e.target.value)}
              />
              <span className="st-hint">Awarded on the customer's birthday month.</span>
            </div>

          </div>
        </div>

        {/* Card 3 — Points Expiration */}
        <div className="st-card">
          <div className="st-card-header">Points expiration</div>
          <div className="st-card-body">

            <div className="st-toggle-row st-toggle-row--between">
              <span className="st-label">Enable points expiration</span>
              <ToggleSwitch
                checked={form.expirationEnabled}
                onChange={val => set('expirationEnabled', val)}
              />
            </div>

            {form.expirationEnabled && (
              <div className="st-field">
                <label className="st-label">Expiration period (days)</label>
                <input
                  className={`st-input${errors.point_expiration ? ' st-input--error' : ''}`}
                  type="number"
                  min={1}
                  max={365}
                  value={form.point_expiration}
                  onChange={e => set('point_expiration', e.target.value)}
                />
                {errors.point_expiration
                  ? <span className="st-error">{errors.point_expiration}</span>
                  : <span className="st-hint">Points expire {form.point_expiration || 0} days after they were earned.</span>
                }
              </div>
            )}

          </div>
        </div>

      </div>

      <div className="st-save-row">
        <button className="st-btn-secondary" onClick={handleDiscard} disabled={saving}>
          Discard
        </button>
        <button className="rn-btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save rewards config'}
        </button>
      </div>

    </div>
  );
}
