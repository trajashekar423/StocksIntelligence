import { useEffect, useState } from 'react';
import StoreCard    from './StoreCard';
import { getStoreStatusCounts } from '../../services/settingsService';

const EMPTY_FORM = { name: '', city: '', address: '', phone: '', manager: '', status: 'ACTIVE' };

export default function StoresSettings({ stores = [], loading = false, error = '', statusFilter = 'ACTIVE' }) {
  const [localStores, setLocalStores] = useState(stores);
  const [modal, setModal]             = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [activeTab, setActiveTab]     = useState('details');
  const [managers, setManagers]       = useState([]);
  const [mgrModal, setMgrModal]       = useState(null);
  const [mgrForm, setMgrForm]         = useState({ name: '', email: '', password: '', deviceLogin: false, websiteAccess: false });

  const EMPTY_MGR = { name: '', email: '', password: '', deviceLogin: false, websiteAccess: false };

  function openAddManager()    { setMgrForm(EMPTY_MGR); setMgrModal({ mode: 'add' }); }
  function openEditManager(mgr) {
    setMgrForm({ name: mgr.name, email: mgr.email || '', password: '', deviceLogin: mgr.deviceLogin ?? false, websiteAccess: mgr.websiteAccess ?? (mgr.permissions?.includes('Portal') ?? false) });
    setMgrModal({ mode: 'edit', mgr });
  }
  function closeMgrModal() { setMgrModal(null); }

  function handleMgrSave() {
    if (!mgrForm.name.trim()) return;
    const permissions = [
      ...(mgrForm.deviceLogin   ? ['Tablets'] : []),
      ...(mgrForm.websiteAccess ? ['Portal']  : []),
    ];
    if (mgrModal.mode === 'add') {
      setManagers(p => [...p, { id: Date.now(), ...mgrForm, permissions }]);
    } else {
      setManagers(p => p.map(m => m.id === mgrModal.mgr.id ? { ...m, ...mgrForm, permissions } : m));
    }
    closeMgrModal();
  }

  useEffect(() => {
    setLocalStores(stores);
  }, [stores]);

  function openEdit(s) {
    setForm({ name: s.name, city: s.city, address: s.address, phone: s.phone, manager: s.manager, status: s.status });
    setModal({ mode: 'edit', id: s.id, store: s });
    setActiveTab('details');
    setManagers(s.managers || (s.manager ? [{ id: 1, name: s.manager, email: '', permissions: ['Portal'] }] : []));
  }
  function closeModal() { setModal(null); }

  function handleSave() {
    if (!form.name.trim()) return;
    if (modal.mode === 'add') {
      setLocalStores(p => [...p, { id: Date.now(), ...form, managerCount: form.manager ? 1 : 0, managerLogin: false }]);
    } else {
      setLocalStores(p => p.map(s => s.id === modal.id ? { ...s, ...form, managerCount: managers.length, managers } : s));
    }
    closeModal();
  }

  function handleDeleteManager(id) {
    setManagers(p => p.filter(m => m.id !== id));
  }

  function toggleStatus(id) {
    setLocalStores(p => p.map(s => s.id === id
      ? { ...s, status: s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }
      : s
    ));
  }

  function toggleLogin(id) {
    setLocalStores(p => p.map(s => s.id === id ? { ...s, managerLogin: !s.managerLogin } : s));
  }



  const storeCounts = getStoreStatusCounts(localStores);
  const activeStores = localStores.filter(s => s.status === 'ACTIVE');
  const inactiveStores = localStores.filter(s => s.status !== 'ACTIVE');
  const visibleStores = statusFilter === 'ACTIVE' ? activeStores : inactiveStores;

  return (
    <div className="st-sections">
      <div className="st-card">
        <div className="st-card-body">
          {error && <div className="st-error-alert">{error}</div>}

          {loading ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem 0' }}>Loading stores...</p>
          ) : visibleStores.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem 0' }}>No stores found</p>
          ) : (
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
          )}
        </div>
      </div>

      {modal && (
        <div className="st-modal-overlay" onClick={closeModal}>
          <div className="sm-modal" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="sm-header">
              <span className="sm-header-title">{modal.store?.name || 'Store'}</span>
              <button className="sm-close-btn" onClick={closeModal} aria-label="Close">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="sm-tabs">
              <button className={`sm-tab ${activeTab === 'details' ? 'sm-tab--active' : ''}`} onClick={() => setActiveTab('details')} type="button">Details</button>
              <button className={`sm-tab ${activeTab === 'managers' ? 'sm-tab--active' : ''}`} onClick={() => setActiveTab('managers')} type="button">Managers ({managers.length})</button>
            </div>

            {/* Body */}
            <div className="sm-body">
              {activeTab === 'details' && (
                <div className="sm-details">
                  {/* Store Name */}
                  <div className="sm-field">
                    <div className="sm-label-row">
                      <label className="sm-label">Store Name</label>
                      <span className="sm-admin-badge">
                        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        Admin only
                      </span>
                    </div>
                    <input className="sm-input" type="text" value={form.name} disabled readOnly />
                  </div>

                  {/* Address */}
                  <div className="sm-field">
                    <label className="sm-label">Address</label>
                    <input className="sm-input" type="text" placeholder="123 Main St" value={form.address}
                      onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
                  </div>

                  {/* City / State / ZIP */}
                  <div className="sm-row-3">
                    <div className="sm-field">
                      <label className="sm-label">City</label>
                      <input className="sm-input" type="text" placeholder="City" value={form.city}
                        onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
                    </div>
                    <div className="sm-field">
                      <label className="sm-label">State</label>
                      <input className="sm-input" type="text" placeholder="State" value={form.state || ''}
                        onChange={e => setForm(p => ({ ...p, state: e.target.value }))} />
                    </div>
                    <div className="sm-field">
                      <label className="sm-label">ZIP</label>
                      <input className="sm-input" type="text" placeholder="ZIP" value={form.zip || ''}
                        onChange={e => setForm(p => ({ ...p, zip: e.target.value }))} />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="sm-field">
                    <label className="sm-label">Phone</label>
                    <input className="sm-input" type="tel" placeholder="(555) 000-0000" value={form.phone}
                      onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                  </div>

                  {/* Admin notice */}
                  <div className="sm-notice">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    Store status (active/inactive) can only be changed by a RaNevra admin.
                  </div>
                </div>
              )}

              {activeTab === 'managers' && (
                <div className="sm-managers">
                  <div className="sm-managers-header">
                    <button className="sm-add-manager-btn" type="button" onClick={openAddManager}>
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Add manager
                    </button>
                  </div>

                  {managers.length === 0 ? (
                    <p className="sm-empty">No managers assigned to this store.</p>
                  ) : (
                    <div className="sm-manager-list">
                      {managers.map(mgr => (
                        <div className="sm-manager-card" key={mgr.id}>
                          <div className="sm-manager-left">
                            <div className="sm-manager-avatar">
                              {mgr.avatar
                                ? <img src={mgr.avatar} alt={mgr.name} />
                                : mgr.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="sm-manager-name">{mgr.name}</div>
                              {mgr.email && <div className="sm-manager-email">{mgr.email}</div>}
                            </div>
                          </div>
                          <div className="sm-manager-badges">
                            {(mgr.permissions || []).map(p => (
                              <span className="sm-perm-badge" key={p}>{p}</span>
                            ))}
                          </div>
                          <div className="sm-manager-actions">
                            <button className="sm-edit-btn" type="button" aria-label="Edit manager" onClick={() => openEditManager(mgr)}>
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button className="sm-delete-btn" type="button" aria-label="Delete manager" onClick={() => handleDeleteManager(mgr.id)}>
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sm-footer">
              <button className="sm-cancel-btn" onClick={closeModal} type="button">Cancel</button>
              <button className="sm-save-btn" onClick={handleSave} type="button">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                Save store
              </button>
            </div>

          </div>
        </div>
      )}
      {/* Add / Edit Manager modal */}
      {mgrModal && (
        <div className="st-modal-overlay" onClick={closeMgrModal}>
          <div className="smm-modal" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="smm-header">
              <span className="smm-title">{mgrModal.mode === 'add' ? 'Add manager' : 'Edit manager'}</span>
              <button className="sm-close-btn" onClick={closeMgrModal} aria-label="Close">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Body */}
            <div className="smm-body">

              {/* Section: Manager Info */}
              <div className="smm-section-label">Manager Info</div>
              <div className="smm-row-2">
                <div className="smm-field">
                  <label className="smm-label">Full Name</label>
                  <input className="smm-input" type="text" placeholder="Full name" value={mgrForm.name}
                    onChange={e => setMgrForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="smm-field">
                  <label className="smm-label">Email (Login)</label>
                  <input className="smm-input" type="email" placeholder="manager@store.com" value={mgrForm.email}
                    onChange={e => setMgrForm(p => ({ ...p, email: e.target.value }))} />
                </div>
              </div>
              <div className="smm-field">
                <label className="smm-label">Password</label>
                <input className="smm-input" type="password" placeholder="Set a password" value={mgrForm.password}
                  onChange={e => setMgrForm(p => ({ ...p, password: e.target.value }))} />
              </div>

              {/* Section: Access Control */}
              <div className="smm-section-label" style={{ marginTop: '0.5rem' }}>Access Control</div>
              <div className="smm-access-card">
                <div className="smm-access-row">
                  <div className="smm-access-text">
                    <span className="smm-access-name">Device Login (Tablets)</span>
                    <span className="smm-access-desc">Can sign into the in-store customer &amp; merchant tablets</span>
                  </div>
                  <button
                    type="button"
                    className={`smm-toggle ${mgrForm.deviceLogin ? 'smm-toggle--on' : ''}`}
                    onClick={() => setMgrForm(p => ({ ...p, deviceLogin: !p.deviceLogin }))}
                    aria-label="Toggle device login"
                  >
                    <span className="smm-toggle-thumb" />
                  </button>
                </div>
                <div className="smm-access-divider" />
                <div className="smm-access-row">
                  <div className="smm-access-text">
                    <span className="smm-access-name">Website Access (Portal)</span>
                    <span className="smm-access-desc">Can sign into the merchant portal website</span>
                  </div>
                  <button
                    type="button"
                    className={`smm-toggle ${mgrForm.websiteAccess ? 'smm-toggle--on' : ''}`}
                    onClick={() => setMgrForm(p => ({ ...p, websiteAccess: !p.websiteAccess }))}
                    aria-label="Toggle website access"
                  >
                    <span className="smm-toggle-thumb" />
                  </button>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="smm-footer">
              <button className="sm-cancel-btn" type="button" onClick={closeMgrModal}>Cancel</button>
              <button className="sm-save-btn" type="button" onClick={handleMgrSave}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                {mgrModal.mode === 'add' ? 'Add manager' : 'Save changes'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
