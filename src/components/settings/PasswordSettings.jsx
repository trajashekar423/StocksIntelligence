import { useEffect, useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { changePassword } from '../../services/settingsService';

const EMPTY_FORM = {
  old_password: '',
  new_password: '',
  confirm_password: '',
};

function extractErrorMessage(error) {
  const data = error?.response?.data;

  if (typeof data === 'string') return data;
  if (typeof data?.message === 'string') return data.message;
  if (typeof data?.detail === 'string') return data.detail;
  if (typeof data?.error === 'string') return data.error;
  if (Array.isArray(data?.non_field_errors)) return data.non_field_errors[0];

  return 'Unable to update password. Please try again.';
}

function extractFieldErrors(error) {
  const data = error?.response?.data;
  const fieldErrors = {};

  ['old_password', 'new_password', 'confirm_password'].forEach((key) => {
    const value = data?.[key] ?? data?.errors?.[key];
    if (Array.isArray(value)) fieldErrors[key] = value[0];
    else if (typeof value === 'string') fieldErrors[key] = value;
  });

  return fieldErrors;
}

export default function PasswordSettings() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState({});
  const [apiError, setApiError] = useState('');
  const [toast, setToast] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function validate() {
    const nextErrors = {};

    if (!form.old_password.trim()) nextErrors.old_password = 'Current password is required';
    if (!form.new_password.trim()) nextErrors.new_password = 'New password is required';
    if (!form.confirm_password.trim()) nextErrors.confirm_password = 'Confirm new password is required';
    if (
      form.new_password &&
      form.confirm_password &&
      form.new_password !== form.confirm_password
    ) {
      nextErrors.confirm_password = 'Passwords do not match';
    }

    return nextErrors;
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
    setApiError('');
  }

  function toggleVisibility(key) {
    setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    setApiError('');
    setToast('');

    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const response = await changePassword({
        old_password: form.old_password,
        new_password: form.new_password,
        confirm_password: form.confirm_password,
      });

      setForm(EMPTY_FORM);
      setShowPassword({});
      setToast(response?.message || 'Password changed successfully');
    } catch (error) {
      const backendFieldErrors = extractFieldErrors(error);
      setErrors(backendFieldErrors);
      setApiError(
        Object.keys(backendFieldErrors).length > 0 ? '' : extractErrorMessage(error)
      );
    } finally {
      setSubmitting(false);
    }
  }

  const fields = [
    ['Current Password', 'old_password', 'Enter current password'],
    ['New Password', 'new_password', 'Enter new password'],
    ['Confirm New Password', 'confirm_password', 'Re-enter new password'],
  ];

  return (
    <div className="st-sections st-sections--flat">
      <div className="st-card st-account-card">
        <div className="st-card-header">Change password</div>
        <div className="st-card-body">
          {apiError && <div className="st-error-alert st-password-alert">{apiError}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="st-password-fields">
              {fields.map(([label, key, ph]) => {
                const visible = Boolean(showPassword[key]);
                const inputId = `password-${key}`;

                return (
                  <div className="st-field" key={key}>
                    <label className="st-label" htmlFor={inputId}>{label}</label>
                    <div className="st-password-input-wrap">
                      <input
                        id={inputId}
                        className={`st-input st-password-input${errors[key] ? ' st-input--error' : ''}`}
                        type={visible ? 'text' : 'password'}
                        placeholder={ph}
                        value={form[key]}
                        autoComplete={key === 'old_password' ? 'current-password' : 'new-password'}
                        onChange={(e) => updateField(key, e.target.value)}
                      />
                      <button
                        type="button"
                        className="st-password-toggle"
                        aria-label={visible ? `Hide ${label}` : `Show ${label}`}
                        onClick={() => toggleVisibility(key)}
                      >
                        {visible ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
                      </button>
                    </div>
                    {errors[key] && <span className="st-error">{errors[key]}</span>}
                  </div>
                );
              })}

              <div className="st-save-row st-password-save-row">
                <button
                  type="submit"
                  className="st-password-submit"
                  disabled={submitting}
                >
                  {submitting && <span className="st-password-spinner" aria-hidden="true" />}
                  {submitting ? 'Updating...' : 'Update password'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {toast && <div className="rw-toast">{toast}</div>}
    </div>
  );
}
