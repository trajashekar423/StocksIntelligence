import { useState, useEffect } from 'react';
import InputField from './InputField';
import TextArea from './TextArea';
import PreviewCard from './PreviewCard';
import Button from './Button';

const STORE_OPTIONS = ['Downtown', 'Uptown', 'Airport'];

const EMPTY = {
  title: '',
  description: '',
  points: '',
  maxRedemptions: '',
  applyToAll: false,
  stores: [],
};

export default function RewardFormModal({ isEditMode, initialData, onSubmit, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (isEditMode && initialData) {
      setForm({
        ...EMPTY,
        ...initialData,
        points: String(initialData.points ?? ''),
        applyToAll: initialData.stores === 'ALL',
        stores: initialData.stores === 'ALL' ? STORE_OPTIONS : (initialData.stores ?? []),
      });
    } else {
      setForm(EMPTY);
      setTouched({});
    }
  }, [isEditMode, initialData]);

  const errors = {
    title: !form.title.trim() ? 'Reward name is required.' : null,
    points: !form.points || Number(form.points) <= 0 ? 'Points must be greater than 0.' : null,
  };
  const isValid = !errors.title && !errors.points;
  const storeValid = form.applyToAll || form.stores.length > 0;

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleBlur(e) {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  }

  function handleApplyAllChange(e) {
    const checked = e.target.checked;
    setForm((prev) => ({ ...prev, applyToAll: checked, stores: checked ? STORE_OPTIONS : [] }));
  }

  function handleStoreChange(store) {
    setForm((prev) => ({
      ...prev,
      stores: prev.stores.includes(store)
        ? prev.stores.filter((s) => s !== store)
        : [...prev.stores, store],
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setTouched({ title: true, points: true });
    if (!isValid) return;

    onSubmit({
      id: initialData?.id,
      title: form.title.trim(),
      description: form.description.trim(),
      points: Number(form.points),
      maxRedemptions: form.maxRedemptions || null,
      popularity: initialData?.popularity ?? 0,
      redeemedCount: initialData?.redeemedCount ?? 0,
      isHot: initialData?.isHot ?? false,
      stores: form.applyToAll ? 'ALL' : form.stores,
    });
  }

  return (
    <div className="rw-overlay" onClick={onClose}>
      <div className="mf-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mf-header">
          <div className="mf-header-left">
            <div className="mf-header-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 12 20 22 4 22 4 12" />
                <rect x="2" y="7" width="20" height="5" />
                <line x1="12" y1="22" x2="12" y2="7" />
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
              </svg>
            </div>
            <div>
              <div className="mf-title">{isEditMode ? 'Edit Reward' : 'Add Reward'}</div>
              <div className="mf-subtitle">
                {isEditMode ? 'Update the details of this reward.' : 'Create a new reward for customers'}
              </div>
            </div>
          </div>
          <button className="mf-close" onClick={onClose} aria-label="Close">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mf-body">
            <div className="mf-section-block">
              <InputField
                label="Reward Name"
                required
                error={touched.title ? errors.title : null}
              >
                <input
                  className={`mf-input${touched.title && errors.title ? ' mf-input--error' : ''}`}
                  name="title"
                  placeholder="e.g. Free Coffee"
                  value={form.title}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </InputField>
            </div>

            <div className="mf-section-block">
              <TextArea
                label="Description"
                name="description"
                placeholder="e.g. Get a free coffee of any size"
                value={form.description}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="mf-section-block">
              <div className="mf-row">
                <InputField
                  label="Points Required"
                  required
                  suffix="pts"
                  error={touched.points ? errors.points : null}
                >
                  <input
                    className={`mf-input mf-input--suffix${touched.points && errors.points ? ' mf-input--error' : ''}`}
                    name="points"
                    type="number"
                    min="1"
                    placeholder="e.g. 100"
                    value={form.points}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </InputField>

                <InputField label="Max Redemptions">
                  <input
                    className="mf-input"
                    name="maxRedemptions"
                    placeholder="Unlimited"
                    value={form.maxRedemptions}
                    onChange={handleChange}
                  />
                </InputField>
              </div>
            </div>

            <div className="mf-section-block">
              <div className="mf-field">
                <label className="mf-label">
                  Apply to Stores <span className="mf-required">*</span>
                </label>
                <div className="rw-stores-box">
                  <label className="rw-checkbox-row rw-checkbox-master">
                    <input type="checkbox" className="rw-checkbox" checked={form.applyToAll} onChange={handleApplyAllChange} />
                    <span className="rw-checkbox-label">Apply to all stores</span>
                  </label>
                  <div className="rw-stores-divider" />
                  {STORE_OPTIONS.map((store) => (
                    <label key={store} className={`rw-checkbox-row${form.applyToAll ? ' rw-checkbox-disabled' : ''}`}>
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
                {!storeValid && <span className="mf-error">Select at least one store.</span>}
              </div>
            </div>

            <div className="mf-section-block">
              <div className="mf-preview-section">
                <div className="mf-preview-label">Customer Preview</div>
                <PreviewCard
                  title={form.title}
                  description={form.description}
                  points={form.points}
                />
              </div>
            </div>
          </div>

          <div className="mf-footer">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!isValid}>
              {isEditMode ? 'Save Changes' : 'Add Reward'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
