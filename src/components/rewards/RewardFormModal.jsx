import { useState, useEffect } from 'react';

const STORE_OPTIONS = ['Downtown', 'Uptown', 'Airport'];

const EMPTY = {
  title: '',
  points: '',
  description: '',
  popularity: '',
  applyToAll: false,
  stores: [],
};

export default function RewardFormModal({ isEditMode, initialData, onSubmit, onClose }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (isEditMode && initialData) {
      setForm({
        ...EMPTY,
        ...initialData,
        applyToAll: initialData.stores === 'ALL',
        stores: initialData.stores === 'ALL' ? STORE_OPTIONS : (initialData.stores ?? []),
      });
    } else {
      setForm(EMPTY);
    }
  }, [isEditMode, initialData]);

  // ── Validation ───────────────────────────────────
  const storeValid = form.applyToAll || form.stores.length > 0;
  const isValid =
    form.title.trim() &&
    Number(form.points) > 0 &&
    Number(form.popularity) >= 0 &&
    Number(form.popularity) <= 100 &&
    storeValid;

  // ── Handlers ─────────────────────────────────────
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  // "Apply to all stores" master checkbox
  function handleApplyAllChange(e) {
    const checked = e.target.checked;
    setForm((prev) => ({
      ...prev,
      applyToAll: checked,
      stores: checked ? STORE_OPTIONS : [],
    }));
  }

  // Individual store checkbox
  function handleStoreChange(store) {
    setForm((prev) => {
      const alreadySelected = prev.stores.includes(store);
      return {
        ...prev,
        stores: alreadySelected
          ? prev.stores.filter((s) => s !== store)
          : [...prev.stores, store],
      };
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!isValid) return;

    // TODO: Replace POST API when backend is ready
    // TODO: Handle API success & error response
    // TODO: Add loading state for submit button
    const payload = {
      id: initialData?.id,
      title: form.title,
      description: form.description,
      points: Number(form.points),
      popularity: Number(form.popularity),
      redeemed: initialData?.redeemed ?? 0,
      // TODO: Add form validation error UI
      stores: form.applyToAll ? 'ALL' : form.stores,
    };

    onSubmit(payload);
  }

  return (
    <div className="rw-overlay" onClick={onClose}>
      <div className="rw-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="rw-modal-header">
          <span>{isEditMode ? 'Edit Reward' : 'Add New Reward'}</span>
          <button className="rw-modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form className="rw-modal-body" onSubmit={handleSubmit}>

          {/* Reward Name */}
          <div className="rw-field">
            <label className="rw-label">Reward Name <span className="rw-required">*</span></label>
            <input
              className="rw-input"
              name="title"
              placeholder="e.g. Free Coffee"
              value={form.title}
              onChange={handleChange}
            />
          </div>

          {/* Points + Popularity */}
          <div className="rw-field-row">
            <div className="rw-field">
              <label className="rw-label">Points Required <span className="rw-required">*</span></label>
              <input
                className="rw-input"
                name="points"
                type="number"
                min="1"
                placeholder="e.g. 100"
                value={form.points}
                onChange={handleChange}
              />
            </div>
            <div className="rw-field">
              <label className="rw-label">Popularity (0–100)</label>
              <input
                className="rw-input"
                name="popularity"
                type="number"
                min="0"
                max="100"
                placeholder="e.g. 80"
                value={form.popularity}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Popularity preview */}
          {form.popularity !== '' && (
            <div className="rw-modal-preview">
              <div className="rw-progress-bar">
                <div
                  className="rw-progress-fill"
                  style={{ width: `${Math.min(100, Math.max(0, Number(form.popularity)))}%` }}
                />
              </div>
              <span className="rw-progress-label">{form.popularity}%</span>
            </div>
          )}

          {/* Description */}
          <div className="rw-field">
            <label className="rw-label">Description</label>
            <textarea
              className="rw-input rw-textarea"
              name="description"
              placeholder="e.g. Get a free coffee of any size"
              value={form.description}
              onChange={handleChange}
              rows={3}
            />
          </div>

          {/* Apply to Stores */}
          <div className="rw-field">
            <label className="rw-label">Apply to Stores <span className="rw-required">*</span></label>
            <div className="rw-stores-box">

              {/* Master: Apply to all */}
              <label className="rw-checkbox-row rw-checkbox-master">
                <input
                  type="checkbox"
                  className="rw-checkbox"
                  checked={form.applyToAll}
                  onChange={handleApplyAllChange}
                />
                <span className="rw-checkbox-label">Apply to all stores</span>
              </label>

              <div className="rw-stores-divider" />

              {/* Individual stores */}
              {STORE_OPTIONS.map((store) => (
                <label
                  key={store}
                  className={`rw-checkbox-row${form.applyToAll ? ' rw-checkbox-disabled' : ''}`}
                >
                  <input
                    type="checkbox"
                    className="rw-checkbox"
                    checked={form.stores.includes(store)}
                    onChange={() => handleStoreChange(store)}
                    disabled={form.applyToAll}
                  />
                  <span className="rw-checkbox-label">{store}</span>
                </label>
              ))}

            </div>
            {!storeValid && (
              <span className="rw-field-error">Select at least one store.</span>
            )}
          </div>

          {/* Footer */}
          <div className="rw-modal-footer">
            <button type="button" className="rw-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="rw-add-btn" disabled={!isValid}>
              {isEditMode ? 'Save Changes' : 'Add Reward'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
