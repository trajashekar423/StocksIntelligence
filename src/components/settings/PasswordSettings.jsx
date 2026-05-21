import { useState } from 'react';

export default function PasswordSettings() {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  function validate() {
    const e = {};
    if (!form.current) e.current = 'Required';
    if (form.next.length < 8) e.next = 'Minimum 8 characters';
    if (form.next !== form.confirm) e.confirm = 'Passwords do not match';
    return e;
  }

  function handleSubmit(ev) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length === 0) {
      setSuccess(true);
      setForm({ current: '', next: '', confirm: '' });
      setTimeout(() => setSuccess(false), 3000);
    }
  }

  const fields = [
    ['Current Password', 'current', 'Enter current password'],
    ['New Password', 'next', 'Min. 8 characters'],
    ['Confirm Password', 'confirm', 'Re-enter new password'],
  ];

  return (
    <div className="st-sections st-sections--flat">
      <div className="st-card st-account-card">
        <div className="st-card-header">Change password</div>
        <div className="st-card-body">
          {success && <div className="rn-success-alert" style={{ marginBottom: '1rem' }}>Password updated successfully.</div>}
          <form onSubmit={handleSubmit} noValidate>
            <div className="st-password-fields">
              {fields.map(([label, key, ph]) => (
                <div className="st-field" key={key}>
                  <label className="st-label">{label}</label>
                  <input
                    className={`st-input${errors[key] ? ' st-input--error' : ''}`}
                    type="password"
                    placeholder={ph}
                    value={form[key]}
                    onChange={e => { setForm(p => ({ ...p, [key]: e.target.value })); setErrors(p => ({ ...p, [key]: '' })); }}
                  />
                  {errors[key] && <span className="st-error">{errors[key]}</span>}
                </div>
              ))}
              <div className="st-save-row" style={{ marginTop: '0.5rem' }}>
                <button type="submit" className="rn-btn-primary">Update Password</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
