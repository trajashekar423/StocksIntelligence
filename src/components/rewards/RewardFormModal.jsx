import { useState, useMemo } from 'react';
import InputField from './InputField';
import TextArea from './TextArea';
import Button from './Button';


const STORE_OPTIONS = ['Downtown', 'Uptown', 'Airport'];
const STORE_DETAILS = {
  Downtown: '123 Main Street, Downtown',
  Uptown: '48 Market Avenue, Uptown',
  Airport: 'Terminal 2, Airport Road',
};

const EMPTY = {
  title: '',
  description: '',
  points: '',
  maxRedemptions: '',
  status: 'Active',
  applyToAll: false,
  stores: [],
};

function getInitialForm(isEditMode, initialData) {
  if (!isEditMode || !initialData) return EMPTY;

  return {
    ...EMPTY,
    title: initialData.reward_name ?? '',
    description: initialData.reward_description ?? '',
    points: String(initialData.points_cost ?? ''),
    maxRedemptions: initialData.max_redemptions_per_customer ?? '',
    status: (initialData.is_active ?? initialData.isHot ?? true) ? 'Active' : 'Inactive',
    applyToAll: false,
    stores: [],
  };
}

export default function RewardFormModal({ isEditMode, initialData, onSubmit, onClose, submitting = false }) {
  const [form, setForm] = useState(() => getInitialForm(isEditMode, initialData));
  const [touched, setTouched] = useState({});
  const [activeTab, setActiveTab] = useState('details');
  const [storeSearch, setStoreSearch] = useState('');

  const errors = {
    title: !form.title.trim() ? 'Reward name is required.' : null,
    points: !form.points || Number(form.points) <= 0 ? 'Points must be greater than 0.' : null,
  };
  const isValid = !errors.title && !errors.points;
  const storeValid = form.applyToAll || form.stores.length > 0;
  const allStoresSelected = form.applyToAll || form.stores.length === STORE_OPTIONS.length;

  const filteredStores = useMemo(() => {
    const query = storeSearch.trim().toLowerCase();
    if (!query) return STORE_OPTIONS;

    return STORE_OPTIONS.filter((store) => {
      const address = STORE_DETAILS[store] ?? '';
      return store.toLowerCase().includes(query) || address.toLowerCase().includes(query);
    });
  }, [storeSearch]);

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
      applyToAll: false,
      stores: prev.stores.includes(store)
        ? prev.stores.filter((s) => s !== store)
        : [...prev.stores, store],
    }));
  }

  function handleClearStores() {
    setForm((prev) => ({ ...prev, applyToAll: false, stores: [] }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setTouched({ title: true, points: true });
    if (!isValid) return;

    onSubmit({
      id:                           initialData?.id,
      reward_name:                  form.title.trim(),
      reward_description:           form.description.trim(),
      points_cost:                  Number(form.points),
      max_redemptions_per_customer: form.maxRedemptions ? Number(form.maxRedemptions) : null,
      clients_merchant_id:          20001,
      business_ids:                 [201],
      program_id:                   1,
    });
  }

  return (
    <div className="rw-overlay" onClick={onClose}>
      <div className="mf-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mf-header">
          <div className="mf-title">New reward</div>
          <button className="mf-close" onClick={onClose} aria-label="Close">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mf-tabs" role="tablist" aria-label="Reward sections">
            <button
              type="button"
              className={`mf-tab${activeTab === 'details' ? ' mf-tab--active' : ''}`}
              onClick={() => setActiveTab('details')}
              role="tab"
              aria-selected={activeTab === 'details'}
            >
              Details
            </button>
            <button
              type="button"
              className={`mf-tab${activeTab === 'stores' ? ' mf-tab--active' : ''}`}
              onClick={() => setActiveTab('stores')}
              role="tab"
              aria-selected={activeTab === 'stores'}
            >
              Stores
              {allStoresSelected && <span className="mf-tab-badge">All</span>}
            </button>
          </div>

          <div className="mf-body">
            {activeTab === 'details' && (
              <div className="mf-tab-panel">
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

                  <InputField label="Status">
                    <select className="mf-input mf-select" name="status" value={form.status} onChange={handleChange}>
                      <option>Active</option>
                      <option>Inactive</option>
                    </select>
                  </InputField>
                </div>

                <TextArea
                  label="Description"
                  name="description"
                  placeholder="Short description for customers"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                />

              </div>
            )}

            {activeTab === 'stores' && (
              <div className="mf-tab-panel">
                <div className="mf-stores-head">
                  <div>
                    <div className="mf-section-heading">Available at stores</div>
                    <div className="mf-selection-count">
                      {form.stores.length} selected of {STORE_OPTIONS.length}
                    </div>
                  </div>
                  <button type="button" className="mf-clear-btn" onClick={handleClearStores}>
                    Clear all
                  </button>
                </div>

                <label className="rw-checkbox-row rw-checkbox-master mf-all-stores-row">
                  <input type="checkbox" className="rw-checkbox" checked={allStoresSelected} onChange={handleApplyAllChange} />
                  <span className="rw-checkbox-label">Apply to all stores</span>
                </label>

                <input
                  className="mf-input mf-search-input"
                  placeholder="Search stores by name or address"
                  value={storeSearch}
                  onChange={(e) => setStoreSearch(e.target.value)}
                />

                <div className="mf-store-list">
                  {filteredStores.map((store) => {
                    const selected = form.stores.includes(store);

                    return (
                      <label key={store} className={`mf-store-item${selected ? ' mf-store-item--selected' : ''}`}>
                        <input
                          type="checkbox"
                          className="rw-checkbox"
                          checked={selected}
                          onChange={() => handleStoreChange(store)}
                        />
                        <span className="mf-store-copy">
                          <span className="mf-store-name">{store}</span>
                          <span className="mf-store-address">{STORE_DETAILS[store]}</span>
                        </span>
                      </label>
                    );
                  })}

                  {filteredStores.length === 0 && (
                    <div className="mf-store-empty">No stores match your search.</div>
                  )}
                </div>

                {!storeValid && <span className="mf-error">Select at least one store.</span>}
              </div>
            )}
          </div>

          <div className="mf-footer">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!isValid || submitting}>
              {submitting ? 'Saving...' : 'Save reward'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
