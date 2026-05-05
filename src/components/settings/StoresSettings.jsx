import { useState } from 'react';
import { stores as MOCK } from '../../mock/storesMock';
import StoreCard    from './StoreCard';
import ToggleSwitch from './ToggleSwitch';

const EMPTY_FORM = { name: '', city: '', address: '', phone: '', manager: '', status: 'ACTIVE' };

export default function StoresSettings() {
  const [stores, setStores]           = useState(MOCK);
  const [modal, setModal]             = useState(null); // null | { mode, id? }
  const [form, setForm]               = useState(EMPTY_FORM);
  const [bannerToggle, setBannerToggle] = useState(true);

  function openAdd()    { setForm(EMPTY_FORM); setModal({ mode: 'add' }); }
  function openEdit(s)  { setForm({ name: s.name, city: s.city, address: s.address, phone: s.phone, manager: s.manager, status: s.status }); setModal({ mode: 'edit', id: s.id }); }
  function closeModal() { setModal(null); }

  function handleSave() {
    if (!form.name.trim()) return;
    if (modal.mode === 'add') {
      setStores(p => [...p, { id: Date.now(), ...form, managerLogin: false }]);
    } else {
      setStores(p => p.map(s => s.id === modal.id ? { ...s, ...form } : s));
    }
    closeModal();
  }

  function toggleStatus(id) {
    setStores(p => p.map(s => s.id === id
      ? { ...s, status: s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }
      : s
    ));
  }

  function toggleLogin(id) {
    setStores(p => p.map(s => s.id === id ? { ...s, managerLogin: !s.managerLogin } : s));
  }

  const field = (label, key, type = 'text', ph = '') => (
    <div className="st-field" key={key}>
      <label className="st-label">{label}</label>
      <input className="st-input" type={type} placeholder={ph} value={form[key]}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
    </div>
  );

  const visibleStores = stores.filter(s => bannerToggle ? s.status === 'ACTIVE' : s.status !== 'ACTIVE');

  return (
    <div className="st-sections">
      <div className="st-card">
        <div className="st-card-header">
          <div>
            <div className="st-section-title">Store locations</div>
            <div className="st-section-subtitle">Manage each location, its details, media and managers.</div>
          </div>
          <div className="st-store-tools">
            <div className="st-filter-toggle">
              <span className={`st-filter-dot ${bannerToggle ? 'st-filter-dot--active' : ''}`} />
              <span>{bannerToggle ? 'Active' : 'Inactive'}</span>
              <ToggleSwitch checked={bannerToggle} onChange={setBannerToggle} />
            </div>
            <button className="rn-btn-primary st-add-store-btn" onClick={openAdd}>
              + Add Store
            </button>
          </div>
        </div>

        <div className="st-card-body">
          {visibleStores.length === 0
            ? <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem 0' }}>No stores yet.</p>
            : (
              <div className="scard-grid">
                {visibleStores.map(s => (
                  <StoreCard
                    key={s.id}
                    store={s}
                    onEdit={openEdit}
                    onToggleStatus={toggleStatus}
                    onToggleLogin={toggleLogin}
                  />
                ))}
              </div>
            )
          }
        </div>
      </div>

      {modal && (
        <div className="st-modal-overlay" onClick={closeModal}>
          <div className="st-modal" onClick={e => e.stopPropagation()}>
            <div className="st-modal-header">
              <span>{modal.mode === 'add' ? 'Add Store' : 'Edit Store'}</span>
              <button className="st-modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="st-modal-body">
              {field('Store Name',   'name',    'text', 'e.g. Downtown')}
              {field('City',         'city',    'text', 'e.g. Cityville')}
              {field('Address',      'address', 'text', '123 Main St')}
              {field('Phone',        'phone',   'tel',  '(555) 000-0000')}
              {field('Manager Name', 'manager', 'text', 'Full name')}
              <div className="st-field">
                <label className="st-label">Status</label>
                <select className="st-input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="PENDING">Pending Approval</option>
                </select>
              </div>
            </div>
            <div className="st-modal-footer">
              <button className="cm-btn cm-btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="rn-btn-primary" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
