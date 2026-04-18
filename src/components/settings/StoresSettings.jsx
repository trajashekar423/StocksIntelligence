import { useState } from 'react';
import { stores as MOCK } from '../../mock/storesMock';
import InfoBanner   from './InfoBanner';
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

  return (
    <div className="st-sections">
      <InfoBanner
        title="Manager Login & Permissions"
        description="Each store can have a dedicated manager login. Managers can access the POS system, view transactions, and manage customer loyalty points for their assigned store. Enable or disable manager access per store using the toggle on each store card."
        toggle={<ToggleSwitch checked={bannerToggle} onChange={setBannerToggle} />}
      />

      <div className="st-card">
        <div className="st-card-header">
          <div>
            <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>Store Locations</div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.15rem' }}>Manage your store locations and their status</div>
          </div>
          <button className="rn-btn-primary" style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }} onClick={openAdd}>
            + Add Store
          </button>
        </div>

        <div className="st-card-body">
          {stores.length === 0
            ? <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem 0' }}>No stores yet.</p>
            : (
              <div className="scard-grid">
                {stores.map(s => (
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
