import { useState, useMemo } from 'react';
import InputField from './InputField';
import TextArea from './TextArea';
import Button from './Button';


const EMPTY = {
  title: '',
  description: '',
  points: '',
  maxRedemptions: '',
  status: 'Active',
  applyToAll: false,
  stores: [],
};

function getStoreId(store) {
  return store.business_id ?? store.id;
}

function getStoreName(store) {
  return store.business_name ?? store.name ?? 'Unnamed';
}

function getStoreAddress(store) {
  return store.fullAddress ?? store.full_address ?? store.address ?? '';
}

function getAssignedStoreIds(initialData, activeStores) {
  const activeIds = new Set(activeStores.map((store) => String(getStoreId(store))));
  const byName = new Map(activeStores.map((store) => [getStoreName(store).toLowerCase(), getStoreId(store)]));
  const assignments = initialData?.business_ids ?? initialData?.businessIds ?? initialData?.stores ?? initialData?.store_names ?? initialData?.business_names;

  if (assignments === 'ALL' || initialData?.applyToAll) return activeStores.map(getStoreId);
  if (!Array.isArray(assignments)) return [];

  return assignments
    .map((item) => {
      if (typeof item === 'object' && item !== null) return item.business_id ?? item.id;
      const itemKey = String(item);
      return activeIds.has(itemKey) ? item : byName.get(itemKey.toLowerCase());
    })
    .filter((id) => id !== undefined && activeIds.has(String(id)));
}

function getInitialForm(isEditMode, initialData, activeStores) {
  if (!isEditMode || !initialData) return EMPTY;

  const selectedStores = getAssignedStoreIds(initialData, activeStores);

  return {
    ...EMPTY,
    title: initialData.reward_name ?? '',
    description: initialData.reward_description ?? '',
    points: String(initialData.points_cost ?? ''),
    maxRedemptions: initialData.max_redemptions_per_customer ?? '',
    status: (initialData.is_active ?? initialData.isHot ?? true) ? 'Active' : 'Inactive',
    applyToAll: activeStores.length > 0 && selectedStores.length === activeStores.length,
    stores: selectedStores,
  };
}

export default function RewardFormModal({ isEditMode, initialData, activeStores = [], onSubmit, onClose, submitting = false }) {
  const [form, setForm] = useState(() => getInitialForm(isEditMode, initialData, activeStores));
  const [touched, setTouched] = useState({});
  const [activeTab, setActiveTab] = useState('details');
  const [storeSearch, setStoreSearch] = useState('');

  const errors = {
    title: !form.title.trim() ? 'Reward name is required.' : null,
    points: !form.points || Number(form.points) <= 0 ? 'Points must be greater than 0.' : null,
  };
  const isValid = !errors.title && !errors.points;
  const storeValid = form.applyToAll || form.stores.length > 0;
  const allStoresSelected = activeStores.length > 0 && (form.applyToAll || form.stores.length === activeStores.length);

  const filteredStores = useMemo(() => {
    const query = storeSearch.trim().toLowerCase();
    if (!query) return activeStores;

    return activeStores.filter((store) => {
      const searchable = [
        getStoreName(store),
        store.address,
        getStoreAddress(store),
        store.city,
        store.state,
      ].filter(Boolean).join(' ').toLowerCase();

      return searchable.includes(query);
    });
  }, [activeStores, storeSearch]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleBlur(e) {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  }

  function handleApplyAllChange(e) {
    const checked = e.target.checked;
    setForm((prev) => ({ ...prev, applyToAll: checked, stores: checked ? activeStores.map(getStoreId) : [] }));
  }

  function handleStoreChange(storeId) {
    setForm((prev) => ({
      ...prev,
      applyToAll: false,
      stores: prev.stores.some((id) => String(id) === String(storeId))
        ? prev.stores.filter((id) => String(id) !== String(storeId))
        : [...prev.stores, storeId],
    }));
  }

  function handleClearStores() {
    setForm((prev) => ({ ...prev, applyToAll: false, stores: [] }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setTouched({ title: true, points: true });
    if (!isValid) return;

    const businessIds = allStoresSelected ? activeStores.map(getStoreId) : form.stores;

    onSubmit({
      id:                           initialData?.id,
      reward_name:                  form.title.trim(),
      reward_description:           form.description.trim(),
      points_cost:                  Number(form.points),
      max_redemptions_per_customer: form.maxRedemptions ? Number(form.maxRedemptions) : null,
      clients_merchant_id:          20001,
      business_ids:                 businessIds,
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
                      {form.stores.length} selected of {activeStores.length}
                    </div>
                  </div>
                  <button type="button" className="mf-clear-btn" onClick={handleClearStores}>
                    Clear all
                  </button>
                </div>

                <label className="rw-checkbox-row rw-checkbox-master mf-all-stores-row">
                  <input type="checkbox" className="rw-checkbox" checked={allStoresSelected} onChange={handleApplyAllChange} disabled={!activeStores.length} />
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
                    const storeId = getStoreId(store);
                    const selected = form.stores.some((id) => String(id) === String(storeId));

                    return (
                      <label key={storeId} className={`mf-store-item${selected ? ' mf-store-item--selected' : ''}`}>
                        <input
                          type="checkbox"
                          className="rw-checkbox"
                          checked={selected}
                          onChange={() => handleStoreChange(storeId)}
                        />
                        <span className="mf-store-copy">
                          <span className="mf-store-name">{getStoreName(store)}</span>
                          <span className="mf-store-address">{getStoreAddress(store)}</span>
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
